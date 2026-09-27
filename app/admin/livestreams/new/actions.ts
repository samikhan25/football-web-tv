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

export async function createLivestream(formData: FormData) {
  const supabase = await checkAdmin();

  const title = String(formData.get("title") || "").trim();
  const streamUrl = String(formData.get("stream_url") || "").trim();
  const thumbnailUrl = String(formData.get("thumbnail_url") || "").trim();
  const channelId = String(formData.get("channel_id") || "").trim();
  const isLive = formData.get("is_live") === "on";

  if (!title || !streamUrl || !channelId) {
    redirect(
      "/admin/livestreams/new?error=Title%2C%20stream%20URL%2C%20and%20channel%20are%20required"
    );
  }

  try {
    new URL(streamUrl);
  } catch {
    redirect(
      "/admin/livestreams/new?error=Please%20enter%20a%20valid%20stream%20URL"
    );
  }

  if (thumbnailUrl) {
    try {
      new URL(thumbnailUrl);
    } catch {
      redirect(
        "/admin/livestreams/new?error=Please%20enter%20a%20valid%20thumbnail%20URL"
      );
    }
  }

  if (isLive) {
    const { count, error: liveCountError } = await supabase
      .from("livestreams")
      .select("id", { count: "exact", head: true })
      .eq("is_live", true);

    if (liveCountError) {
      redirect(
        `/admin/livestreams/new?error=${encodeURIComponent(
          liveCountError.message
        )}`
      );
    }

    if ((count ?? 0) >= 3) {
      redirect(
        "/admin/livestreams/new?error=Maximum%203%20livestreams%20can%20be%20live%20at%20the%20same%20time"
      );
    }
  }

  const { error } = await supabase.from("livestreams").insert({
    title,
    stream_url: streamUrl,
    thumbnail_url: thumbnailUrl || null,
    channel_id: channelId,
    is_live: isLive,
    started_at: isLive ? new Date().toISOString() : null,
    ended_at: null,
  });

  if (error) {
    redirect(
      `/admin/livestreams/new?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/admin/livestreams");
}