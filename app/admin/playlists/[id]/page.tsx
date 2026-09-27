import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { deletePlaylist } from "./edit/actions";
import {
  addVideoToPlaylist,
  moveVideo,
  removeVideoFromPlaylist,
} from "./actions";

type PlaylistPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function PlaylistDetailsPage({
  params,
  searchParams,
}: PlaylistPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createSupabaseServerClient();

  // --------------------------------------------------
  // Check logged-in user
  // --------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // --------------------------------------------------
  // Check admin role
  // --------------------------------------------------
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  // --------------------------------------------------
  // Get playlist
  // --------------------------------------------------
  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select(
      `
        id,
        name,
        description,
        is_active,
        channel_id,
        channels (
          id,
          name
        )
      `,
    )
    .eq("id", id)
    .single();

  if (playlistError || !playlist) {
    redirect("/admin/playlists");
  }

  // --------------------------------------------------
  // Get playlist items
  // --------------------------------------------------
  const { data: playlistItems, error: itemsError } = await supabase
    .from("playlist_items")
    .select(
      `
        id,
        video_id,
        position,
        videos (
          id,
          title,
          thumbnail_url,
          duration_seconds,
          is_active
        )
      `,
    )
    .eq("playlist_id", id)
    .order("position", { ascending: true });

  // --------------------------------------------------
  // Get all active videos
  // --------------------------------------------------
  const { data: videos, error: videosError } = await supabase
    .from("videos")
    .select(
      "id, title, thumbnail_url, duration_seconds, is_active",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // --------------------------------------------------
  // Find videos already inside playlist
  // --------------------------------------------------
  const currentVideoIds = new Set(
    (playlistItems ?? []).map((item) => item.video_id),
  );

  // --------------------------------------------------
  // Videos available to add
  // --------------------------------------------------
  const availableVideos = (videos ?? []).filter(
    (video) => !currentVideoIds.has(video.id),
  );

  // --------------------------------------------------
  // Channel
  // --------------------------------------------------
  const channel = Array.isArray(playlist.channels)
    ? playlist.channels[0]
    : playlist.channels;

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="mb-8">
          <Link
            href="/admin/playlists"
            className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            ← Back to Playlists
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-400">
                Playlist Management
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {playlist.name}
              </h1>

              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>
                  Channel: {channel?.name || "No channel"}
                </span>

                <span>•</span>

                <span>
                  {playlistItems?.length ?? 0} videos
                </span>

                <span>•</span>

                <span>
                  {playlist.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/admin/playlists/${id}/edit`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Edit Playlist
              </Link>

              <form action={deletePlaylist.bind(null, id)}>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-red-900/70 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-950/40 hover:text-red-300 sm:w-auto"
                >
                  Delete Playlist
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ==================================================
            ACTION ERROR
        ================================================== */}
        {query.error && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Action failed
            </p>

            <p className="mt-1 break-words text-sm text-red-300/80">
              {query.error}
            </p>
          </div>
        )}

        {/* ==================================================
            PLAYLIST ITEMS ERROR
        ================================================== */}
        {itemsError && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Could not load playlist videos
            </p>

            <p className="mt-1 break-words text-sm text-red-300/80">
              {itemsError.message}
            </p>
          </div>
        )}

        {/* ==================================================
            VIDEOS ERROR
        ================================================== */}
        {videosError && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Could not load available videos
            </p>

            <p className="mt-1 break-words text-sm text-red-300/80">
              {videosError.message}
            </p>
          </div>
        )}

        {/* ==================================================
            MAIN GRID
        ================================================== */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ==================================================
              CURRENT PLAYLIST
          ================================================== */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Playlist
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Videos in Playlist
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Change the playback order or remove videos.
              </p>
            </div>

            {!playlistItems || playlistItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                <p className="text-sm font-medium text-slate-300">
                  No videos added yet
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Add videos from the available videos section.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {playlistItems.map((item, index) => {
                  const video = Array.isArray(item.videos)
                    ? item.videos[0]
                    : item.videos;

                  if (!video) {
                    return null;
                  }

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                    >
                      <div className="flex gap-3">
                        {/* Position */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-slate-300">
                          {index + 1}
                        </div>

                        {/* Thumbnail */}
                        <div className="relative hidden h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-800 sm:block">
                          {video.thumbnail_url ? (
                            <Image
  src={video.thumbnail_url}
  alt=""
  fill
  sizes="80px"
  unoptimized
  className="object-cover"
/>
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-600">
                              No image
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-100">
                            {video.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {video.duration_seconds
                              ? `${video.duration_seconds}s`
                              : "Duration not set"}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
                        {/* Move Up */}
                        <form
                          action={moveVideo.bind(
                            null,
                            id,
                            item.id,
                            "up",
                          )}
                        >
                          <button
                            type="submit"
                            disabled={index === 0}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ↑ Up
                          </button>
                        </form>

                        {/* Move Down */}
                        <form
                          action={moveVideo.bind(
                            null,
                            id,
                            item.id,
                            "down",
                          )}
                        >
                          <button
                            type="submit"
                            disabled={
                              index ===
                              playlistItems.length - 1
                            }
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ↓ Down
                          </button>
                        </form>

                        {/* Remove */}
                        <form
                          action={removeVideoFromPlaylist.bind(
                            null,
                            id,
                            item.id,
                          )}
                          className="ml-auto"
                        >
                          <button
                            type="submit"
                            className="rounded-lg border border-red-900/60 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-950/40"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ==================================================
              AVAILABLE VIDEOS
          ================================================== */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Video Library
              </p>

              <h2 className="mt-1 text-lg font-bold">
                Available Videos
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add existing videos to this playlist.
              </p>
            </div>

            {!availableVideos ||
            availableVideos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                <p className="text-sm font-medium text-slate-300">
                  No available videos
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  All active videos are already in this playlist.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableVideos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                  >
                    {/* Thumbnail */}
                    <div className="relative hidden h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-800 sm:block">
                      {video.thumbnail_url ? (
                        <Image
  src={video.thumbnail_url}
  alt=""
  fill
  sizes="64px"
  unoptimized
  className="object-cover"
/>
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-slate-600">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {video.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {video.duration_seconds
                          ? `${video.duration_seconds}s`
                          : "Duration not set"}
                      </p>
                    </div>

                    {/* Add */}
                    <form
                      action={addVideoToPlaylist.bind(
                        null,
                        id,
                        video.id,
                      )}
                    >
                      <button
                        type="submit"
                        className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                      >
                        + Add
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}