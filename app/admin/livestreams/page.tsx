import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { deleteLivestream } from "./[id]/edit/actions";
import type { Livestream } from "@/types/database";

export default async function LivestreamsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  const { data: livestreams, error: livestreamsError } = await supabase
    .from("livestreams")
    .select(`
      *,
      channels (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  const livestreamList = (livestreams ?? []) as LivestreamItem[];

  const liveCount = livestreamList.filter(
    (stream) => stream.is_live
  ).length;

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
              Livestreams
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage live games and livestream content.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Stats / Controls */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-medium text-slate-400">
              Total Livestreams
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {livestreamList.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs font-medium text-slate-400">
              Currently Live
            </p>

            <p className="mt-2 text-3xl font-bold text-red-400">
              {liveCount}
            </p>
          </div>

          <div className="flex items-center justify-start rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:justify-end">
            <Link
              href="/admin/livestreams/new"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
            >
              + Add Livestream
            </Link>
          </div>
        </div>

        {/* Error */}
        {livestreamsError && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load livestreams
            </p>

            <p className="mt-1 text-sm text-red-300/80">
              {livestreamsError.message}
            </p>
          </div>
        )}

        {/* Empty */}
        {!livestreamsError && livestreamList.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
              📺
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              No livestreams yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Your livestream library is currently empty. Add your first
              livestream to get started.
            </p>

            <Link
              href="/admin/livestreams/new"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              + Add Livestream
            </Link>
          </div>
        )}

        {/* Desktop */}
        {livestreamList.length > 0 && (
          <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Livestream
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Channel
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
                  {livestreamList.map((stream) => (
                    <tr
                      key={stream.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      {/* Livestream */}
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800">
                            {stream.thumbnail_url ? (
                              <img
                                src={stream.thumbnail_url}
                                alt={stream.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl">📺</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {stream.title}
                            </p>

                            <p className="mt-1 max-w-md truncate text-sm text-slate-400">
                              {stream.stream_url}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="px-5 py-5 text-sm text-slate-300">
                        {stream.channels?.[0]?.name || "No channel"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-5">
                        <LiveStatus isLive={stream.is_live} />
                      </td>

                      {/* Created */}
                      <td className="px-5 py-5 text-sm text-slate-400">
                        {formatDate(stream.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-5">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/livestreams/${stream.id}/edit`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                          >
                            Edit
                          </Link>

                          <form
                            action={deleteLivestream.bind(null, stream.id)}
                          >
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center rounded-lg border border-red-900/70 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-950/40 hover:text-red-300"
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
        {livestreamList.length > 0 && (
          <div className="space-y-4 md:hidden">
            {livestreamList.map((stream) => (
              <article
                key={stream.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
              >
                <div className="aspect-video w-full bg-slate-800">
                  {stream.thumbnail_url ? (
                    <img
                      src={stream.thumbnail_url}
                      alt={stream.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      📺
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold leading-6 text-white">
                      {stream.title}
                    </h2>

                    <LiveStatus isLive={stream.is_live} />
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    Channel:{" "}
                    {stream.channels?.[0]?.name || "No channel"}
                  </p>

                  <p className="mt-2 truncate text-xs text-slate-500">
                    {stream.stream_url}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href={`/admin/livestreams/${stream.id}/edit`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-4 py-2.5 text-center text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                    >
                      Edit
                    </Link>

                    <form
                      action={deleteLivestream.bind(null, stream.id)}
                    >
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-xl border border-red-900/70 px-4 py-2.5 text-center text-sm font-semibold text-red-400 transition hover:bg-red-950/40 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </form>
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

type LivestreamItem = Livestream & {
  channels:
    | {
        id: string;
        name: string;
      }[]
    | null;
};

function LiveStatus({ isLive }: { isLive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isLive
          ? "bg-red-500/10 text-red-400"
          : "bg-slate-700/60 text-slate-400"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isLive ? "bg-red-400" : "bg-slate-500"
        }`}
      />

      {isLive ? "LIVE" : "Offline"}
    </span>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}