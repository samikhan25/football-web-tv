import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSchedule } from "./actions";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  const [{ data: channels }, { data: videos }] = await Promise.all([
    supabase
      .from("channels")
      .select("id, name")
      .order("name", { ascending: true }),

    supabase
      .from("videos")
      .select("id, title")
      .eq("is_active", true)
      .order("title", { ascending: true }),
  ]);

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/schedule"
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            ← Back to Schedule
          </Link>

          <div className="mt-4">
            <p className="text-sm font-medium text-blue-400">
              Content Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Add Schedule
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Create a new scheduled program for your TV channel.
            </p>
          </div>
        </div>

        {/* Error */}
        {params.error && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to create schedule
            </p>

            <p className="mt-1 text-sm text-red-300/80">
              {params.error}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          action={createSchedule}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7"
        >
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Schedule Title *
              </label>

              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. Football Training Highlights"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            {/* Channel */}
            <div>
              <label
                htmlFor="channel_id"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Channel *
              </label>

              <select
                id="channel_id"
                name="channel_id"
                required
                defaultValue=""
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="" disabled>
                  Select a channel
                </option>

                {(channels ?? []).map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>

              {(!channels || channels.length === 0) && (
                <p className="mt-2 text-xs text-amber-400">
                  No channels available. Create a channel first.
                </p>
              )}
            </div>

            {/* Video */}
            <div>
              <label
                htmlFor="video_id"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Video
              </label>

              <select
                id="video_id"
                name="video_id"
                defaultValue=""
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="">No specific video</option>

                {(videos ?? []).map((video) => (
                  <option key={video.id} value={video.id}>
                    {video.title}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Select the video that should play during this schedule.
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Optional schedule description..."
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="start_time"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  Start Time *
                </label>

                <input
                  id="start_time"
                  name="start_time"
                  type="datetime-local"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="end_time"
                  className="mb-2 block text-sm font-semibold text-slate-200"
                >
                  End Time
                </label>

                <input
                  id="end_time"
                  name="end_time"
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Leave empty if the schedule has no fixed end time.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/admin/schedule"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}