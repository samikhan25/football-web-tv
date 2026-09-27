"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    redirect("/");
  }

  return supabase;
}

export async function addVideoToPlaylist(
  playlistId: string,
  videoId: string
) {
  const supabase = await checkAdmin();

  // Check whether video is already in playlist
  const { data: existingItem } = await supabase
    .from("playlist_items")
    .select("id")
    .eq("playlist_id", playlistId)
    .eq("video_id", videoId)
    .maybeSingle();

  if (existingItem) {
    redirect(
      `/admin/playlists/${playlistId}?error=${encodeURIComponent(
        "This video is already in the playlist"
      )}`
    );
  }

  // Get current highest position
  const { data: lastItem } = await supabase
    .from("playlist_items")
    .select("position")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = lastItem
    ? Number(lastItem.position) + 1
    : 1;

  const { error } = await supabase
    .from("playlist_items")
    .insert({
      playlist_id: playlistId,
      video_id: videoId,
      position: nextPosition,
    });

  if (error) {
    redirect(
      `/admin/playlists/${playlistId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/admin/playlists/${playlistId}`);
}


export async function removeVideoFromPlaylist(
  playlistId: string,
  playlistItemId: string
) {
  const supabase = await checkAdmin();

  const { error } = await supabase
    .from("playlist_items")
    .delete()
    .eq("id", playlistItemId)
    .eq("playlist_id", playlistId);

  if (error) {
    redirect(
      `/admin/playlists/${playlistId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/admin/playlists/${playlistId}`);
}


export async function moveVideo(
  playlistId: string,
  itemId: string,
  direction: "up" | "down"
) {
  const supabase = await checkAdmin();

  const { data: items, error: itemsError } = await supabase
    .from("playlist_items")
    .select("id, position")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });

  if (itemsError || !items) {
    redirect(
      `/admin/playlists/${playlistId}?error=${encodeURIComponent(
        itemsError?.message || "Could not load playlist items"
      )}`
    );
  }

  const currentIndex = items.findIndex(
    (item) => item.id === itemId
  );

  if (currentIndex === -1) {
    redirect(`/admin/playlists/${playlistId}`);
  }

  const targetIndex =
    direction === "up"
      ? currentIndex - 1
      : currentIndex + 1;

  if (
    targetIndex < 0 ||
    targetIndex >= items.length
  ) {
    redirect(`/admin/playlists/${playlistId}`);
  }

  const currentItem = items[currentIndex];
  const targetItem = items[targetIndex];

  const currentPosition = currentItem.position;
  const targetPosition = targetItem.position;

  const { error: firstUpdateError } = await supabase
    .from("playlist_items")
    .update({
      position: -1,
    })
    .eq("id", currentItem.id);

  if (firstUpdateError) {
    redirect(
      `/admin/playlists/${playlistId}?error=${encodeURIComponent(
        firstUpdateError.message
      )}`
    );
  }

  const { error: secondUpdateError } = await supabase
    .from("playlist_items")
    .update({
      position: currentPosition,
    })
    .eq("id", targetItem.id);

  if (secondUpdateError) {
    redirect(
      `/admin/playlists/${playlistId}?error=${encodeURIComponent(
        secondUpdateError.message
      )}`
    );
  }

  const { error: thirdUpdateError } = await supabase
    .from("playlist_items")
    .update({
      position: targetPosition,
    })
    .eq("id", currentItem.id);

  if (thirdUpdateError) {
    redirect(
      `/admin/playlists/${playlistId}?error=${encodeURIComponent(
        thirdUpdateError.message
      )}`
    );
  }

  redirect(`/admin/playlists/${playlistId}`);
}