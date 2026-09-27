"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function updateVideo(
  videoId: string,
  formData: FormData
) {
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
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const videoUrl = String(formData.get("video_url") || "").trim();
  const thumbnailUrl = String(
    formData.get("thumbnail_url") || ""
  ).trim();

  const durationValue = String(
    formData.get("duration_seconds") || ""
  ).trim();

  const isActive = formData.get("is_active") === "on";

  // Required fields
  if (!title || !videoUrl) {
    redirect(
      `/admin/videos/${videoId}?error=${encodeURIComponent(
        "Title and video URL are required"
      )}`
    );
  }

  // Validate video URL
  try {
    new URL(videoUrl);
  } catch {
    redirect(
      `/admin/videos/${videoId}?error=${encodeURIComponent(
        "Please enter a valid video URL"
      )}`
    );
  }

  // Validate thumbnail URL
  if (thumbnailUrl) {
    try {
      new URL(thumbnailUrl);
    } catch {
      redirect(
        `/admin/videos/${videoId}?error=${encodeURIComponent(
          "Please enter a valid thumbnail URL"
        )}`
      );
    }
  }

  // Convert duration
  let durationSeconds: number | null = null;

  if (durationValue) {
    const parsedDuration = Number(durationValue);

    if (!Number.isInteger(parsedDuration) || parsedDuration < 0) {
      redirect(
        `/admin/videos/${videoId}?error=${encodeURIComponent(
          "Duration must be a valid number"
        )}`
      );
    }

    durationSeconds = parsedDuration;
  }

  // Update video
  const { error } = await supabase
    .from("videos")
    .update({
      title,
      description: description || null,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl || null,
      duration_seconds: durationSeconds,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", videoId);

  if (error) {
    redirect(
      `/admin/videos/${videoId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  // Success
  redirect("/admin/videos");
}