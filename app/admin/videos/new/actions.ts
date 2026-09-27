"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function createVideo(formData: FormData) {
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
  const thumbnailUrl = String(formData.get("thumbnail_url") || "").trim();
  const durationValue = String(
    formData.get("duration_seconds") || ""
  ).trim();

  const isActive = formData.get("is_active") === "on";

  // Required fields
  if (!title || !videoUrl) {
    redirect(
      "/admin/videos/new?error=Title%20and%20video%20URL%20are%20required"
    );
  }

  // Validate video URL
  try {
    new URL(videoUrl);
  } catch {
    redirect(
      "/admin/videos/new?error=Please%20enter%20a%20valid%20video%20URL"
    );
  }

  // Validate thumbnail URL
  if (thumbnailUrl) {
    try {
      new URL(thumbnailUrl);
    } catch {
      redirect(
        "/admin/videos/new?error=Please%20enter%20a%20valid%20thumbnail%20URL"
      );
    }
  }

  // Convert duration
  let durationSeconds: number | null = null;

  if (durationValue) {
    const parsedDuration = Number(durationValue);

    if (!Number.isInteger(parsedDuration) || parsedDuration < 0) {
      redirect(
        "/admin/videos/new?error=Duration%20must%20be%20a%20valid%20number"
      );
    }

    durationSeconds = parsedDuration;
  }

  // Insert video
  const { error } = await supabase.from("videos").insert({
    title,
    description: description || null,
    video_url: videoUrl,
    thumbnail_url: thumbnailUrl || null,
    duration_seconds: durationSeconds,
    is_active: isActive,
  });

  if (error) {
    redirect(
      `/admin/videos/new?error=${encodeURIComponent(error.message)}`
    );
  }

  // Success
  redirect("/admin/videos");
}