"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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

export async function updatePlaylist(
  playlistId: string,
  formData: FormData
) {
  const supabase = await checkAdmin();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const channelId = String(formData.get("channel_id") || "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name || !channelId) {
    redirect(
      `/admin/playlists/${playlistId}/edit?error=${encodeURIComponent(
        "Playlist name and channel are required"
      )}`
    );
  }

  const { error } = await supabase
    .from("playlists")
    .update({
      name,
      description: description || null,
      channel_id: channelId,
      is_active: isActive,
    })
    .eq("id", playlistId);

  if (error) {
    redirect(
      `/admin/playlists/${playlistId}/edit?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/admin/playlists/${playlistId}`);
}

export async function deletePlaylist(playlistId: string) {
  const supabase = await checkAdmin();

  // Remove videos from the playlist first.
  const { error: itemsError } = await supabase
    .from("playlist_items")
    .delete()
    .eq("playlist_id", playlistId);

  if (itemsError) {
    redirect(
      `/admin/playlists/${playlistId}?error=${encodeURIComponent(
        itemsError.message
      )}`
    );
  }

  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", playlistId);

  if (error) {
    redirect(
      `/admin/playlists/${playlistId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/admin/playlists");
}