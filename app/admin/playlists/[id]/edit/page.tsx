import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { updatePlaylist } from "./actions";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditPlaylistPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { error: errorMessage } = await searchParams;

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

  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select(`
      id,
      name,
      description,
      channel_id,
      is_active
    `)
    .eq("id", id)
    .single();

  if (playlistError || !playlist) {
    redirect("/admin/playlists");
  }

  const { data: channels, error: channelsError } = await supabase
    .from("channels")
    .select("id, name")
    .order("name", { ascending: true });

  if (channelsError) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <p className="text-red-400">
          Could not load channels: {channelsError.message}
        </p>
      </main>
    );
  }

  const updateAction = updatePlaylist.bind(null, playlist.id);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/admin/playlists/${playlist.id}`}
          className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          ← Back to Playlist
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium text-blue-400">
            Playlist Management
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Edit Playlist
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Update playlist information and channel settings.
          </p>
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <form
          action={updateAction}
          className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl sm:p-8"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Playlist Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                defaultValue={playlist.name}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

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
                defaultValue={playlist.description || ""}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="channel_id"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Channel
              </label>

              <select
                id="channel_id"
                name="channel_id"
                defaultValue={playlist.channel_id}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="" disabled>
                  Select channel
                </option>

                {(channels || []).map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={playlist.is_active}
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600"
              />

              <span>
                <span className="block text-sm font-semibold text-white">
                  Active Playlist
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  Allow this playlist to be used by the TV channel.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
            <Link
              href={`/admin/playlists/${playlist.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
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
        </form>
      </div>
    </main>
  );
}