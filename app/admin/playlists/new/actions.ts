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

export async function createPlaylist(formData: FormData) {
  const supabase = await checkAdmin();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const channelId = String(formData.get("channel_id") || "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name || !channelId) {
    redirect(
      "/admin/playlists/new?error=Playlist%20name%20and%20channel%20are%20required"
    );
  }

  // Prevent duplicate playlist names on the same channel.
  const { data: existingPlaylist, error: existingError } =
    await supabase
      .from("playlists")
      .select("id")
      .eq("channel_id", channelId)
      .ilike("name", name)
      .maybeSingle();

  if (existingError) {
    redirect(
      `/admin/playlists/new?error=${encodeURIComponent(
        existingError.message
      )}`
    );
  }

  if (existingPlaylist) {
    redirect(
      "/admin/playlists/new?error=A%20playlist%20with%20this%20name%20already%20exists%20for%20this%20channel"
    );
  }

  const { error } = await supabase
    .from("playlists")
    .insert({
      name,
      description: description || null,
      channel_id: channelId,
      is_active: isActive,
    });

  if (error) {
    redirect(
      `/admin/playlists/new?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/admin/playlists");
}