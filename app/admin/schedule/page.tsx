import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { deleteSchedule } from "./actions";

interface ScheduleItem {
  id: string;
  channel_id: string;
  playlist_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  channels: {
    id: string;
    name: string;
  }[] | null;
  playlists: {
    id: string;
    name: string;
  }[] | null;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminSchedulePage() {
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

  const { data: schedules, error } = await supabase
    .from("schedules")
    .select(`
      id,
      channel_id,
      playlist_id,
      title,
      description,
      start_time,
      end_time,
      is_active,
      created_at,
      updated_at,
      channels (
        id,
        name
      ),
      playlists (
        id,
        name
      )
    `)
    .order("start_time", { ascending: true });

  if (error) {
    return (
      <main className="p-6">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          Failed to load schedules: {error.message}
        </div>
      </main>
    );
  }

  const scheduleList = (schedules ?? []) as ScheduleItem[];

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Schedule</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage playlists and their broadcast times.
          </p>
        </div>

        <Link
          href="/admin/schedule/new"
          className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-200"
        >
          Add Schedule
        </Link>
      </div>

      {scheduleList.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h2 className="text-lg font-medium text-white">
            No schedules yet
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Create your first schedule to start organizing the TV playlist.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">
                    Playlist
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">
                    Channel
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">
                    Start
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">
                    End
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {scheduleList.map((schedule) => {
                  const playlist = schedule.playlists?.[0];
                  const channel = schedule.channels?.[0];

                  return (
                    <tr key={schedule.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">
                          {playlist?.name || schedule.title || "Untitled"}
                        </div>

                        {schedule.description && (
                          <div className="mt-1 max-w-xs truncate text-xs text-gray-500">
                            {schedule.description}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-gray-300">
                        {channel?.name || "—"}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                        {formatDateTime(schedule.start_time)}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                        {formatDateTime(schedule.end_time)}
                      </td>

                      <td className="px-4 py-4">
                        {schedule.is_active ? (
                          <span className="inline-flex rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-400">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/schedule/${schedule.id}/edit`}
                            className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white"
                          >
                            Edit
                          </Link>

                          <form action={deleteSchedule.bind(null, schedule.id)}>
                            <button
                              type="submit"
                              className="rounded-md border border-red-500/20 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}