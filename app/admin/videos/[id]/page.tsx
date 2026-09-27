import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { updateVideo } from "./actions";

type EditVideoPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditVideoPage({
  params,
  searchParams,
}: EditVideoPageProps) {
  const { id } = await params;
  const paramsData = await searchParams;

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

  // Get video
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select(
      "id, title, description, video_url, thumbnail_url, duration_seconds, is_active"
    )
    .eq("id", id)
    .single();

  if (videoError || !video) {
    redirect("/admin/videos");
  }

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/videos"
            className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            ← Back to Video Library
          </Link>

          <p className="mt-5 text-sm font-medium text-blue-400">
            Content Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Edit Video
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Update the details of this academy TV video.
          </p>
        </div>

        {/* Error */}
        {paramsData.error && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Could not update video
            </p>

            <p className="mt-1 break-words text-sm text-red-300/80">
              {paramsData.error}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          action={updateVideo.bind(null, video.id)}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7"
        >
          <div className="space-y-6">

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Video Title <span className="text-red-400">*</span>
              </label>

              <input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={video.title}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={video.description || ""}
                placeholder="Short description about this video..."
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            {/* Video URL */}
            <div>
              <label
                htmlFor="video_url"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Video URL <span className="text-red-400">*</span>
              </label>

              <input
                id="video_url"
                name="video_url"
                type="url"
                required
                defaultValue={video.video_url}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />

              <p className="mt-2 text-xs text-slate-500">
                Enter the URL of the video source.
              </p>
            </div>

            {/* Thumbnail URL */}
            <div>
              <label
                htmlFor="thumbnail_url"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Thumbnail URL
              </label>

              <input
                id="thumbnail_url"
                name="thumbnail_url"
                type="url"
                defaultValue={video.thumbnail_url || ""}
                placeholder="https://example.com/thumbnail.jpg"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            {/* Duration */}
            <div>
              <label
                htmlFor="duration_seconds"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Duration (seconds)
              </label>

              <input
                id="duration_seconds"
                name="duration_seconds"
                type="number"
                min="0"
                step="1"
                defaultValue={video.duration_seconds ?? ""}
                placeholder="300"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />

              <p className="mt-2 text-xs text-slate-500">
                Example: 300 seconds = 5 minutes.
              </p>
            </div>

            {/* Active */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={video.is_active}
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-200">
                    Active video
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Active videos can be shown to customers and used by the TV
                    playback system.
                  </span>
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/admin/videos"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Save Changes
              </button>
            </div>

          </div>
        </form>
      </div>
    </main>
  );
}