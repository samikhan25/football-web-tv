import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { updateLivestream } from "./actions";

function formatDateTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 16);
}

export default async function EditLivestreamPage({
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

  const { data: livestream, error: livestreamError } = await supabase
    .from("livestreams")
    .select(
      `
        id,
        title,
        stream_url,
        thumbnail_url,
        channel_id,
        is_live,
        started_at,
        ended_at
      `
    )
    .eq("id", id)
    .single();

  if (livestreamError || !livestream) {
    notFound();
  }

  const { data: channels } = await supabase
    .from("channels")
    .select("id, name")
    .order("name", { ascending: true });

  const updateAction = updateLivestream.bind(null, livestream.id);

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
            Edit Livestream
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Update livestream information and live status.
          </p>
        </div>

        {query.error && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to update livestream
            </p>

            <p className="mt-1 text-sm text-red-300/80">
              {query.error}
            </p>
          </div>
        )}

        <form
          action={updateAction}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7"
        >
          <div className="space-y-6">
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
                defaultValue={livestream.title}
                placeholder="e.g. U16 Championship Final"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
              />
            </div>

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
                defaultValue={livestream.stream_url}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
              />
            </div>

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
                defaultValue={livestream.thumbnail_url ?? ""}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-blue-500"
              />
            </div>

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
                defaultValue={livestream.channel_id}
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

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="is_live"
                  defaultChecked={livestream.is_live}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-200">
                    Set as Live
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Maximum 3 livestreams can be live at the same time.
                  </span>
                </span>
              </label>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Status
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {livestream.is_live ? (
                  <span className="font-semibold text-emerald-400">
                    ● Currently Live
                  </span>
                ) : (
                  <span className="font-semibold text-slate-400">
                    ● Offline
                  </span>
                )}
              </p>

              {livestream.started_at && (
                <p className="mt-1 text-xs text-slate-500">
                  Started:{" "}
                  {new Date(livestream.started_at).toLocaleString()}
                </p>
              )}
            </div>

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
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}