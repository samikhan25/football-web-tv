import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createLivestream } from "./actions";

export default async function NewLivestreamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;

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

  const { data: channels } = await supabase
    .from("channels")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/admin/livestreams"
          className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          ← Back to Livestreams
        </Link>

        <div className="mb-6 mt-4">
          <p className="text-sm font-medium text-blue-400">
            Content Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Add Livestream
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Add a live game or livestream to your TV platform.
          </p>
        </div>

        {query.error && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to create livestream
            </p>

            <p className="mt-1 text-sm text-red-300/80">
              {query.error}
            </p>
          </div>
        )}

        <form
          action={createLivestream}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7"
        >
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Livestream Title *
              </label>

              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g. U16 Championship Final"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
              />
            </div>

            {/* Stream URL */}
            <div>
              <label
                htmlFor="stream_url"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Stream URL *
              </label>

              <input
                id="stream_url"
                name="stream_url"
                type="url"
                required
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
              />

              <p className="mt-2 text-xs text-slate-500">
                Enter the URL of your live stream source.
              </p>
            </div>

            {/* Thumbnail */}
            <div>
              <label
                htmlFor="thumbnail_url"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                Thumbnail URL
              </label>

              <input
                id="thumbnail_url"
                name="thumbnail_url"
                type="url"
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
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
            </div>

            {/* Live Status */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="is_live"
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-200">
                    Set as Live
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Enable this only when the livestream is currently
                    running. Maximum 3 livestreams can be live at once.
                  </span>
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/admin/livestreams"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Create Livestream
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}