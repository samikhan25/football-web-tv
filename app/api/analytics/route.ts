import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

type AnalyticsPayload = {
  channel_id?: string | null;
  video_id?: string | null;
  livestream_id?: string | null;
  event_type?: string;
  session_type?: string;
};

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as AnalyticsPayload;

    const {
      channel_id = null,
      video_id = null,
      livestream_id = null,
      event_type,
      session_type,
    } = body;

    if (
      !event_type ||
      !session_type ||
      (!video_id && !livestream_id)
    ) {
      return NextResponse.json(
        {
          error: "Invalid analytics data.",
        },
        { status: 400 },
      );
    }

    if (
      event_type !== "video_view" &&
      event_type !== "live_view"
    ) {
      return NextResponse.json(
        {
          error: "Unsupported analytics event.",
        },
        { status: 400 },
      );
    }

    if (
      session_type !== "tv" &&
      session_type !== "live"
    ) {
      return NextResponse.json(
        {
          error: "Unsupported session type.",
        },
        { status: 400 },
      );
    }

    const supabase =
      await createSupabaseServerClient();

    const { error } = await supabase
      .from("analytics")
      .insert({
        channel_id,
        video_id,
        livestream_id,
        event_type,
        session_type,
      });

    if (error) {
      console.error(
        "Analytics insert error:",
        error,
      );

      return NextResponse.json(
        {
          error: "Failed to save analytics event.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Analytics API error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Invalid request.",
      },
      { status: 400 },
    );
  }
}