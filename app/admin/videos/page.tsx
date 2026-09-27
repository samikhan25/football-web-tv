import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import type { Video } from "@/types/database";
import VideoDeleteButton from "@/app/admin/video-delete/button";

export default async function VideosPage() {
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
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  // Get videos
  const { data: videos, error: videosError } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  const videoList = (videos ?? []) as Video[];

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-400">
              Content Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Video Library
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage your academy videos and video content.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Top controls */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">Total Videos</p>

            <p className="mt-1 text-2xl font-bold">
              {videoList.length}
            </p>
          </div>

          <Link
            href="/admin/videos/new"
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
          >
            + Add Video
          </Link>
        </div>

        {/* Error */}
        {videosError && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load videos
            </p>

            <p className="mt-1 text-sm text-red-300/80">
              {videosError.message}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!videosError && videoList.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
              🎬
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              No videos yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Your video library is currently empty. Add your first academy
              video to get started.
            </p>
          </div>
        )}

        {/* Desktop / Tablet table */}
        {videoList.length > 0 && (
          <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Video
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Duration
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Created
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {videoList.map((video) => (
                    <tr
                      key={video.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800">
                            {video.thumbnail_url ? (
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">🎬</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {video.title}
                            </p>

                            <p className="mt-1 max-w-md truncate text-sm text-slate-400">
                              {video.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5 text-sm text-slate-300">
                        {formatDuration(video.duration_seconds)}
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge isActive={video.is_active} />
                      </td>

                      <td className="px-5 py-5 text-sm text-slate-400">
                        {formatDate(video.created_at)}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/videos/${video.id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                          >
                            Edit
                          </Link>

                          <VideoDeleteButton videoId={video.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile cards */}
        {videoList.length > 0 && (
          <div className="space-y-4 md:hidden">
            {videoList.map((video) => (
              <article
                key={video.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
              >
                <div className="aspect-video w-full bg-slate-800">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      🎬
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold leading-6 text-white">
                      {video.title}
                    </h2>

                    <StatusBadge isActive={video.is_active} />
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {video.description || "No description"}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-950/60 p-3">
                      <p className="text-xs text-slate-500">
                        Duration
                      </p>

                      <p className="mt-1 font-medium text-slate-200">
                        {formatDuration(video.duration_seconds)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950/60 p-3">
                      <p className="text-xs text-slate-500">
                        Created
                      </p>

                      <p className="mt-1 font-medium text-slate-200">
                        {formatDate(video.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/admin/videos/${video.id}`}
                      className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-center text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                    >
                      Edit
                    </Link>

                    <VideoDeleteButton videoId={video.id} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-slate-700/60 text-slate-400"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-400" : "bg-slate-500"
        }`}
      />

      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function formatDuration(seconds: number | null) {
  if (seconds === null || seconds === undefined) {
    return "—";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}