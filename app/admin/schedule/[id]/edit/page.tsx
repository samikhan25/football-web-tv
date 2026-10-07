import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { updateSchedule } from "./actions";

type EditSchedulePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function formatDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default async function EditSchedulePage({
  params,
  searchParams,
}: EditSchedulePageProps) {
  const { id } = await params;
  const query = await searchParams;

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

  const [{ data: schedule, error: scheduleError }, { data: channels }, { data: playlists }] =
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
        .from("playlists")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

  if (scheduleError || !schedule) {
    notFound();
  }

  return (
    <main className="max-w-3xl space-y-6 p-6">
      <div>
        <Link
          href="/admin/schedule"
          className="text-sm text-gray-400 hover:text-white"
        >
          ← Back to Schedule
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-white">
          Edit Schedule
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Update the playlist, channel, timing, or active status.
        </p>
      </div>

      {query.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {query.error}
        </div>
      )}

      <form
        action={updateSchedule.bind(null, id)}
        className="space-y-6 rounded-xl border border-white/10 bg-white/[0.03] p-6"
      >
        <div>
          <label
            htmlFor="playlist_id"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Playlist
          </label>

          <select
            id="playlist_id"
            name="playlist_id"
            required
            defaultValue={schedule.playlist_id ?? ""}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
          >
            <option value="" disabled>
              Select playlist
            </option>

            {(playlists ?? []).map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="channel_id"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Channel
          </label>

          <select
            id="channel_id"
            name="channel_id"
            required
            defaultValue={schedule.channel_id}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
          >
            <option value="" disabled>
              Select channel
            </option>

            {(channels ?? []).map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Description
          </label>

          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={schedule.description ?? ""}
            placeholder="Optional schedule description"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-white/30"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="start_time"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Start Time
            </label>

            <input
              id="start_time"
              name="start_time"
              type="datetime-local"
              required
              defaultValue={formatDateTimeLocal(schedule.start_time)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label
              htmlFor="end_time"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              End Time
            </label>

            <input
              id="end_time"
              name="end_time"
              type="datetime-local"
              defaultValue={formatDateTimeLocal(schedule.end_time)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
            />
          </div>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={schedule.is_active}
            className="h-4 w-4 rounded border-white/20 bg-black/30"
          />

          <span className="text-sm text-gray-300">
            Active schedule
          </span>
        </label>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-5">
          <Link
            href="/admin/schedule"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200"
          >
            Save Changes
          </button>
        </div>
      </form>
    </main>
  );
}