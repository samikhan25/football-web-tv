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

export async function updateLivestream(
  livestreamId: string,
  formData: FormData
) {
  const supabase = await checkAdmin();

  const title = String(formData.get("title") || "").trim();
  const streamUrl = String(formData.get("stream_url") || "").trim();
  const thumbnailUrl = String(formData.get("thumbnail_url") || "").trim();
  const channelId = String(formData.get("channel_id") || "").trim();
  const isLive = formData.get("is_live") === "on";

  if (!title || !streamUrl || !channelId) {
    redirect(
      `/admin/livestreams/${livestreamId}/edit?error=Title%2C%20stream%20URL%2C%20and%20channel%20are%20required`
    );
  }

  try {
    new URL(streamUrl);
  } catch {
    redirect(
      `/admin/livestreams/${livestreamId}/edit?error=Please%20enter%20a%20valid%20stream%20URL`
    );
  }

  if (thumbnailUrl) {
    try {
      new URL(thumbnailUrl);
    } catch {
      redirect(
        `/admin/livestreams/${livestreamId}/edit?error=Please%20enter%20a%20valid%20thumbnail%20URL`
      );
    }
  }

  // Get current livestream state
  const { data: currentLivestream, error: currentError } = await supabase
    .from("livestreams")
    .select("id, is_live, started_at")
    .eq("id", livestreamId)
    .single();

  if (currentError || !currentLivestream) {
    redirect("/admin/livestreams");
  }

  // If changing from not-live to live, enforce maximum 3 live streams.
  if (isLive && !currentLivestream.is_live) {
    const { count, error: liveCountError } = await supabase
      .from("livestreams")
      .select("id", { count: "exact", head: true })
      .eq("is_live", true)
      .neq("id", livestreamId);

    if (liveCountError) {
      redirect(
        `/admin/livestreams/${livestreamId}/edit?error=${encodeURIComponent(
          liveCountError.message
        )}`
      );
    }

    if ((count ?? 0) >= 3) {
      redirect(
        `/admin/livestreams/${livestreamId}/edit?error=Maximum%203%20livestreams%20can%20be%20live%20at%20the%20same%20time`
      );
    }
  }

  let startedAt = currentLivestream.started_at;
  let endedAt: string | null = null;

  if (isLive && !currentLivestream.is_live) {
    startedAt = new Date().toISOString();
  }

  if (!isLive && currentLivestream.is_live) {
    endedAt = new Date().toISOString();
  }

  if (!isLive && !currentLivestream.is_live) {
    endedAt = null;
  }

  const { error } = await supabase
    .from("livestreams")
    .update({
      title,
      stream_url: streamUrl,
      thumbnail_url: thumbnailUrl || null,
      channel_id: channelId,
      is_live: isLive,
      started_at: isLive ? startedAt : null,
      ended_at: endedAt,
    })
    .eq("id", livestreamId);

  if (error) {
    redirect(
      `/admin/livestreams/${livestreamId}/edit?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/admin/livestreams");
}

export async function deleteLivestream(livestreamId: string) {
  const supabase = await checkAdmin();

  const { error } = await supabase
    .from("livestreams")
    .delete()
    .eq("id", livestreamId);

  if (error) {
    redirect(
      `/admin/livestreams?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/admin/livestreams");
}