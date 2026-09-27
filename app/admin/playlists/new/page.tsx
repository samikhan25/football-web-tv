import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createPlaylist } from "./actions";
import Link from "next/link";
export default async function NewPlaylistPage() {
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

  // Get channels
  const { data: channels, error: channelsError } = await supabase
    .from("channels")
    .select("id, name")
    .order("name", { ascending: true });

  if (channelsError) {
    redirect("/admin/playlists");
  }

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <Link
  href="/admin/playlists"
  className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
>
  ← Back to Playlists
</Link>

          <p className="mt-5 text-sm font-medium text-blue-400">
            Content Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Create Playlist
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Create a playlist for your academy TV channel.
          </p>
        </div>

        {/* Form */}
        <form
          action={createPlaylist}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7"
        >
          <div className="space-y-6">

            {/* Playlist Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Playlist Name <span className="text-red-400">*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Academy TV Main Playlist"
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
                placeholder="Short description about this playlist..."
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            {/* Channel */}
            <div>
              <label
                htmlFor="channel_id"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Channel <span className="text-red-400">*</span>
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

                {channels?.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Active */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-200">
                    Active playlist
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Active playlists can be used by the TV playback system.
                  </span>
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
              <Link
  href="/admin/playlists"
  className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
>
  Cancel
</Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Create Playlist
              </button>
            </div>

          </div>
        </form>
      </div>
    </main>
  );
}