
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function AnalyticsPage() {
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

  const { count: totalViews, error: totalError } = await supabase
    .from("analytics")
    .select("*", { count: "exact", head: true });

  const { count: videoViews, error: videoError } = await supabase
    .from("analytics")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "video_view");

  const { count: liveViews, error: liveError } = await supabase
    .from("analytics")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "live_view");

  const { data: recentActivity, error: activityError } = await supabase
    .from("analytics")
    .select("id, event_type, session_type, video_id, livestream_id")
    .order("id", { ascending: false })
    .limit(10);

  const stats = [
    {
      title: "Total Views",
      value: totalViews ?? 0,
      description: "All viewing activity",
      icon: "◉",
      accent: "border-l-blue-500",
      iconStyle: "bg-blue-500/10 text-blue-400",
    },
    {
      title: "Video Views",
      value: videoViews ?? 0,
      description: "Recorded TV videos",
      icon: "▶",
      accent: "border-l-violet-500",
      iconStyle: "bg-violet-500/10 text-violet-400",
    },
    {
      title: "Live Views",
      value: liveViews ?? 0,
      description: "Livestream activity",
      icon: "●",
      accent: "border-l-red-500",
      iconStyle: "bg-red-500/10 text-red-400",
    },
  ];

  const hasStatsError = totalError || videoError || liveError;

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-400">
              Performance Overview
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Analytics
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Monitor video views and livestream activity.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Statistics */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">
              Viewing Statistics
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Summary of recorded viewing events.
            </p>
          </div>

          {hasStatsError && (
            <div className="mb-4 rounded-2xl border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
              Some statistics could not be loaded.
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => (
              <article
                key={stat.title}
                className={`rounded-2xl border border-slate-800 border-l-4 ${stat.accent} bg-slate-900/70 p-5 shadow-sm transition hover:bg-slate-900 sm:p-6`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-400">
                      {stat.title}
                    </p>

                    <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${stat.iconStyle}`}
                  >
                    {stat.icon}
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-400">
                  {stat.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Latest recorded video and livestream events.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-300">
              {recentActivity?.length ?? 0} events
            </span>
          </div>

          {activityError ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              Recent activity could not be loaded.
            </div>
          ) : !recentActivity || recentActivity.length === 0 ? (
            <div className="px-5 py-14 text-center sm:px-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
                ◷
              </div>

              <h3 className="mt-4 text-base font-semibold text-white">
                No recent activity
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                Viewing events will appear here when visitors watch
                recorded videos or livestreams.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentActivity.map((activity) => {
                const isVideo = activity.event_type === "video_view";

                return (
                  <article
                    key={activity.id}
                    className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-800/30 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isVideo
                            ? "bg-violet-500/10 text-violet-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {isVideo ? "▶" : "●"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {isVideo ? "Video View" : "Live View"}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {activity.session_type === "tv"
                            ? "Recorded TV"
                            : "Live Stream"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${
                          isVideo
                            ? "bg-violet-500/10 text-violet-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {isVideo ? "Video" : "Live"}
                      </span>

                      <span className="rounded-lg border border-slate-700 bg-slate-950/50 px-2.5 py-1.5 text-xs text-slate-400">
                        #{activity.id}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-800 px-5 py-3 sm:px-6">
            <p className="text-xs text-slate-500">
              Showing the latest 10 recorded events.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
