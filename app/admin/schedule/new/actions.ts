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

export async function createSchedule(formData: FormData) {
  const supabase = await checkAdmin();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const channelId = String(formData.get("channel_id") || "").trim();
  const videoId = String(formData.get("video_id") || "").trim();
  const startTime = String(formData.get("start_time") || "").trim();
  const endTime = String(formData.get("end_time") || "").trim();

  if (!title || !channelId || !startTime) {
    redirect(
      "/admin/schedule/new?error=Title%2C%20channel%2C%20and%20start%20time%20are%20required"
    );
  }

  if (endTime && new Date(endTime) <= new Date(startTime)) {
    redirect(
      "/admin/schedule/new?error=End%20time%20must%20be%20after%20start%20time"
    );
  }

  const { error } = await supabase.from("schedules").insert({
    title,
    description: description || null,
    channel_id: channelId,
    video_id: videoId || null,
    start_time: new Date(startTime).toISOString(),
    end_time: endTime ? new Date(endTime).toISOString() : null,
  });

  if (error) {
    redirect(
      `/admin/schedule/new?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/admin/schedule");
}