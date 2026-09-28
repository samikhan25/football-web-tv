import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { updateChannel } from "./actions";

type EditChannelPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditChannelPage({
  params,
  searchParams,
}: EditChannelPageProps) {
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

  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("*")
    .eq("id", id)
    .single();

  if (channelError || !channel) {
    redirect("/admin/channels");
  }

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/channels"
            className="text-sm font-medium text-slate-400 transition hover:text-white"
          >
            ← Back to Channels
          </Link>

          <p className="mt-5 text-sm font-medium text-blue-400">
            Content Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Edit Channel
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Update channel information and status.
          </p>
        </div>

        {/* Error */}
        {query.error && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to update channel
            </p>

            <p className="mt-1 break-words text-sm text-red-300/80">
              {query.error}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          action={updateChannel.bind(null, channel.id)}
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6"
        >
          <div className="space-y-5">

            {/* Channel Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Channel Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={channel.name}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* Slug */}
            <div>
              <label
                htmlFor="slug"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Slug
              </label>

              <input
                id="slug"
                name="slug"
                type="text"
                required
                defaultValue={channel.slug}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-blue-500"
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Lowercase letters, numbers, and hyphens only.
              </p>
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
                defaultValue={channel.description || ""}
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {/* Active / Inactive */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={channel.is_active}
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600"
                />

                <span>
                  <span className="block text-sm font-semibold text-white">
                    Active Channel
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Turn this off to temporarily hide the channel
                    from public use.
                  </span>
                </span>
              </label>
            </div>

          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/channels"
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