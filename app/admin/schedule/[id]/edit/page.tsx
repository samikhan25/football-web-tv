import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { updateSchedule } from "./actions";

function formatDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  const pad = (number: number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export default async function EditSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  const [{ data: schedule }, { data: channels }, { data: videos }] =
    await Promise.all([
      supabase
        .from("schedules")
        .select("*")
        .eq("id", id)
        .single(),

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

  if (!schedule) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/admin/schedule"
          className="text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          ← Back to Schedule
        </Link>

        <div className="mt-4 mb-6">
          <p className="text-sm font-medium text-blue-400">
            Content Management
          </p>

          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Edit Schedule
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Update this scheduled program.
          </p>
        </div>

        {query.error && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to update schedule
            </p>

            <p className="mt-1 text-sm text-red-300/80">
              {query.error}
            </p>
          </div>
        )}

        <form
          action={updateSchedule.bind(null, schedule.id)}
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
                defaultValue={schedule.title}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
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
                defaultValue={schedule.channel_id}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              >
                {(channels ?? []).map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
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
                defaultValue={schedule.video_id ?? ""}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="">No specific video</option>

                {(videos ?? []).map((video) => (
                  <option key={video.id} value={video.id}>
                    {video.title}
                  </option>
                ))}
              </select>
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
                defaultValue={schedule.description ?? ""}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
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
                  defaultValue={formatDateTimeLocal(schedule.start_time)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
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
                  defaultValue={formatDateTimeLocal(schedule.end_time)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/admin/schedule"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
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