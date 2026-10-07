import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSchedule } from "./actions";

type SearchParams = {
  error?: string;
};

type NewSchedulePageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function NewSchedulePage({
  searchParams,
}: NewSchedulePageProps) {
  const params = await searchParams;

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

  const [{ data: channels }, { data: playlists }] = await Promise.all([
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
          Add Schedule
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Assign a playlist to a channel and define its broadcast time.
        </p>
      </div>

      {params.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {params.error}
        </div>
      )}

      <form
        action={createSchedule}
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
            defaultValue=""
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
            defaultValue=""
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
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
            />
          </div>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked
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
            Create Schedule
          </button>
        </div>
      </form>
    </main>
  );
}