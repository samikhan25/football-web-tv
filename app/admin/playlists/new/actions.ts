"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function createPlaylist(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  // Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  // Get form values
  const name = String(formData.get("name") || "").trim();
  const description = String(
    formData.get("description") || ""
  ).trim();

  const channelId = String(
    formData.get("channel_id") || ""
  ).trim();

  const isActive = formData.get("is_active") === "on";

  // Required fields
  if (!name || !channelId) {
    redirect(
      "/admin/playlists/new?error=Playlist%20name%20and%20channel%20are%20required"
    );
  }

  // Create playlist
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

  // Success
  redirect("/admin/playlists");
}