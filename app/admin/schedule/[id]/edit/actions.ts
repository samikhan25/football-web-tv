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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return supabase;
}

export async function updateSchedule(
  scheduleId: string,
  formData: FormData
) {
  const supabase = await checkAdmin();

  const playlistId = String(formData.get("playlist_id") || "").trim();
  const channelId = String(formData.get("channel_id") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startTime = String(formData.get("start_time") || "").trim();
  const endTime = String(formData.get("end_time") || "").trim();
  const isActive = formData.get("is_active") === "true";

  if (!playlistId || !channelId || !startTime) {
    redirect(
      `/admin/schedule/${scheduleId}/edit?error=Playlist%2C%20channel%20and%20start%20time%20are%20required.`
    );
  }

  const startDate = new Date(startTime);

  if (Number.isNaN(startDate.getTime())) {
    redirect(
      `/admin/schedule/${scheduleId}/edit?error=Invalid%20start%20time.`
    );
  }

  let endDate: Date | null = null;

  if (endTime) {
    endDate = new Date(endTime);

    if (
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      redirect(
        `/admin/schedule/${scheduleId}/edit?error=End%20time%20must%20be%20later%20than%20start%20time.`
      );
    }
  }

  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("id, name")
    .eq("id", playlistId)
    .single();

  if (playlistError || !playlist) {
    redirect(
      `/admin/schedule/${scheduleId}/edit?error=Selected%20playlist%20was%20not%20found.`
    );
  }

  const { error } = await supabase
    .from("schedules")
    .update({
      channel_id: channelId,
      playlist_id: playlistId,
      title: playlist.name,
      description: description || null,
      start_time: startDate.toISOString(),
      end_time: endDate ? endDate.toISOString() : null,
      is_active: isActive,
    })
    .eq("id", scheduleId);

  if (error) {
    redirect(
      `/admin/schedule/${scheduleId}/edit?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/admin/schedule");
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = await checkAdmin();

  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) {
    redirect(
      `/admin/schedule?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/admin/schedule");
}