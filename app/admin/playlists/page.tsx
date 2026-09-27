import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function PlaylistsPage() {
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

  // Get playlists
  const { data: playlists, error: playlistsError } = await supabase
    .from("playlists")
    .select(
      `
        id,
        name,
        description,
        is_active,
        created_at,
        channel_id,
        channels (
          id,
          name
        )
      `
    )
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
              ← Back to Dashboard
            </Link>

            <p className="mt-5 text-sm font-medium text-blue-400">
              Content Management
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Playlists
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage the playlists used by your academy TV channel.
            </p>
          </div>

          <Link
            href="/admin/playlists/new"
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
          >
            + Create Playlist
          </Link>
        </div>

        {/* Error */}
        {playlistsError && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Could not load playlists
            </p>

            <p className="mt-1 break-words text-sm text-red-300/80">
              {playlistsError.message}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!playlists || playlists.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl">
              ☷
            </div>

            <h2 className="mt-4 text-lg font-semibold text-white">
              No playlists yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Create your first playlist to organize videos for the academy TV
              channel.
            </p>

            <Link
              href="/admin/playlists/new"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Create Playlist
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="border-b border-slate-800 bg-slate-950/50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Playlist
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Channel
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Created
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {playlists.map((playlist) => {
                      const channel = Array.isArray(playlist.channels)
                        ? playlist.channels[0]
                        : playlist.channels;

                      return (
                        <tr
                          key={playlist.id}
                          className="transition hover:bg-slate-800/30"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-semibold text-slate-100">
                                {playlist.name}
                              </p>

                              {playlist.description && (
                                <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                                  {playlist.description}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-300">
                            {channel?.name || "No channel"}
                          </td>

                          <td className="px-5 py-4">
                            {playlist.is_active ? (
                              <span className="inline-flex rounded-full border border-emerald-800 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-400">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400">
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-400">
                            {new Date(
                              playlist.created_at
                            ).toLocaleDateString()}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/admin/playlists/${playlist.id}`}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {playlists.map((playlist) => {
                const channel = Array.isArray(playlist.channels)
                  ? playlist.channels[0]
                  : playlist.channels;

                return (
                  <div
                    key={playlist.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-white">
                          {playlist.name}
                        </h2>

                        {playlist.description && (
                          <p className="mt-1 text-sm text-slate-500">
                            {playlist.description}
                          </p>
                        )}
                      </div>

                      {playlist.is_active ? (
                        <span className="shrink-0 rounded-full border border-emerald-800 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-400">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-600">
                          Channel
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {channel?.name || "No channel"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-600">
                          Created
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {new Date(
                            playlist.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}