import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { deleteSchedule } from "./[id]/edit/actions";
interface ScheduleItem {
  id: string;
  channel_id: string;
  video_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  created_at: string;
  updated_at: string;
  channels:
  | {
      id: string;
      name: string;
    }[]
  | null;

videos:
  | {
      id: string;
      title: string;
    }[]
  | null;
}

export default async function SchedulePage() {
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

  // Get schedules
  const { data: schedules, error: schedulesError } = await supabase
    .from("schedules")
    .select(`
      id,
      channel_id,
      video_id,
      title,
      description,
      start_time,
      end_time,
      created_at,
      updated_at,
      channels (
        id,
        name
      ),
      videos (
        id,
        title
      )
    `)
    .order("start_time", { ascending: true });

  const scheduleList = (schedules ?? []) as ScheduleItem[];

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
              Schedule
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage scheduled academy video content.
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
            <p className="text-sm text-slate-400">
              Scheduled Items
            </p>

            <p className="mt-1 text-2xl font-bold">
              {scheduleList.length}
            </p>
          </div>

          <Link
            href="/admin/schedule/new"
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
          >
            + Add Schedule
          </Link>
        </div>

        {/* Error */}
        {schedulesError && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load schedule
            </p>

            <p className="mt-1 text-sm text-red-300/80">
              {schedulesError.message}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!schedulesError && scheduleList.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
              ◷
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              No schedules yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Your schedule is currently empty. Add your first scheduled
              video to get started.
            </p>
          </div>
        )}

        {/* Desktop / Tablet */}
        {scheduleList.length > 0 && (
          <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Schedule
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Channel
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Video
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Start
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      End
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {scheduleList.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-5">
                        <p className="font-semibold text-white">
                          {item.title}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-sm text-slate-400">
                          {item.description || "No description"}
                        </p>
                      </td>

                      <td className="px-5 py-5 text-sm text-slate-300">
                       {item.channels?.[0]?.name || "No channel"}
                      </td>

                      <td className="px-5 py-5 text-sm text-slate-300">
                       {item.videos?.[0]?.title || "No video"}
                      </td>

                      <td className="px-5 py-5 text-sm text-slate-300">
                        {formatDateTime(item.start_time)}
                      </td>

                      <td className="px-5 py-5 text-sm text-slate-400">
                        {item.end_time
                          ? formatDateTime(item.end_time)
                          : "—"}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/schedule/${item.id}/edit`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                          >
                            Edit
                          </Link>
<form action={deleteSchedule.bind(null, item.id)}>
  <button
    type="submit"
    className="inline-flex items-center justify-center rounded-lg border border-red-900/70 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-950/40"
  >
    Delete
  </button>
</form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile */}
        {scheduleList.length > 0 && (
          <div className="space-y-4 md:hidden">
            {scheduleList.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold leading-6 text-white">
                      {item.title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      {item.description || "No description"}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                    Scheduled
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-500">
                      Channel
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                      {item.channels?.[0]?.name || "No channel"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-500">
                      Video
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                     {item.videos?.[0]?.title || "No video"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-500">
                      Start
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                      {formatDateTime(item.start_time)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/60 p-3">
                    <p className="text-xs text-slate-500">
                      End
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                      {item.end_time
                        ? formatDateTime(item.end_time)
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/admin/schedule/${item.id}/edit`}
                    className="block w-full rounded-xl border border-slate-700 px-4 py-2.5 text-center text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                  >
                    Edit
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}