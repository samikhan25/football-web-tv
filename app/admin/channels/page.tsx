import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Channel } from "@/types/database";
import { deleteChannel } from "./[id]/edit/actions";
export default async function ChannelsPage() {
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

  const { data: channels, error: channelsError } = await supabase
    .from("channels")
    .select(
      "id, name, slug, description, is_active, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  const channelList = (channels ?? []) as Channel[];

  const activeCount = channelList.filter(
    (channel) => channel.is_active
  ).length;

  const inactiveCount = channelList.length - activeCount;

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
              Channels
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              View and manage your TV platform channels.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/admin"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 sm:w-auto"
            >
              ← Dashboard
            </Link>

            <Link
              href="/admin/channels/new"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
            >
              + Add Channel
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Channels"
            value={channelList.length}
          />

          <StatCard
            label="Active Channels"
            value={activeCount}
            valueClass="text-emerald-400"
          />

          <StatCard
            label="Inactive Channels"
            value={inactiveCount}
            valueClass="text-slate-400"
          />
        </div>

        {/* Database Error */}
        {channelsError && (
          <div className="mb-6 rounded-2xl border border-red-900/60 bg-red-950/40 p-4">
            <p className="text-sm font-semibold text-red-400">
              Unable to load channels
            </p>

            <p className="mt-1 break-words text-sm text-red-300/80">
              {channelsError.message}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!channelsError && channelList.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
              📺
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              No channels found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Your channels will appear here once they have been
              created in the database.
            </p>

            <Link
              href="/admin/channels/new"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              + Add Channel
            </Link>
          </div>
        )}

        {/* Desktop Table */}
        {!channelsError && channelList.length > 0 && (
          <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="border-b border-slate-800 bg-slate-950/60">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Channel
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Slug
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Description
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
                  {channelList.map((channel) => (
                    <tr
                      key={channel.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-lg">
                            📺
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-white">
                              {channel.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              ID: {channel.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <span className="rounded-lg bg-slate-800 px-2.5 py-1.5 font-mono text-xs text-slate-300">
                          {channel.slug}
                        </span>
                      </td>

                      <td className="max-w-xs px-5 py-5 text-sm text-slate-400">
                        <p className="line-clamp-2">
                          {channel.description || "No description"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <ChannelStatus
                          isActive={channel.is_active}
                        />
                      </td>

                      <td className="px-5 py-5 text-sm text-slate-400">
                        {formatDate(channel.created_at)}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex justify-end">
                          <Link
                            href={`/admin/channels/${channel.id}/edit`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                          >
                            Edit
                          </Link>
                          <form action={deleteChannel.bind(null, channel.id)}>
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

        {/* Mobile Cards */}
        {!channelsError && channelList.length > 0 && (
          <div className="space-y-4 md:hidden">
            {channelList.map((channel) => (
              <article
                key={channel.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-xl">
                    📺
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="break-words font-semibold text-white">
                      {channel.name}
                    </h2>

                    <p className="mt-1 break-all font-mono text-xs text-slate-400">
                      {channel.slug}
                    </p>
                  </div>

                  <ChannelStatus
                    isActive={channel.is_active}
                  />
                </div>

                <div className="mt-4 border-t border-slate-800 pt-3">
                  <p className="text-xs font-medium text-slate-500">
                    Description
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-slate-300">
                    {channel.description || "No description"}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">
                    Created: {formatDate(channel.created_at)}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
  <Link
    href={`/admin/channels/${channel.id}/edit`}
    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
  >
    Edit Channel
  </Link>

  <form action={deleteChannel.bind(null, channel.id)}>
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-xl border border-red-900/70 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-950/40 hover:text-red-300"
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

function StatCard({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function ChannelStatus({
  isActive,
}: {
  isActive: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-slate-700/60 text-slate-400"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-400" : "bg-slate-500"
        }`}
      />

      {isActive ? "Active" : "Inactive"}
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