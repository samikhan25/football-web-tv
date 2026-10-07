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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const { count: totalViews } = await supabase
    .from("analytics")
    .select("*", {
      count: "exact",
      head: true,
    });

  const { count: videoViews } = await supabase
    .from("analytics")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("event_type", "video_view");

  const { count: liveViews } = await supabase
    .from("analytics")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("event_type", "live_view");

  const { data: recentActivity } = await supabase
    .from("analytics")
    .select(
      "id, event_type, session_type, video_id, livestream_id",
    )
    .order("id", {
      ascending: false,
    })
    .limit(10);

  return (
    <main className="min-h-screen space-y-8 bg-gray-50 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Basic viewing and livestream activity.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Total Views */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Views
          </p>

          <p className="mt-3 text-4xl font-bold text-gray-900">
            {totalViews ?? 0}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            All viewing activity
          </p>
        </div>

        {/* Video Views */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Video Views
          </p>

          <p className="mt-3 text-4xl font-bold text-gray-900">
            {videoViews ?? 0}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Recorded TV videos
          </p>
        </div>

        {/* Live Views */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Live Views
          </p>

          <p className="mt-3 text-4xl font-bold text-gray-900">
            {liveViews ?? 0}
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Livestream activity
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Recent Activity
        </h2>

        <div className="mt-5 space-y-3">
          {!recentActivity ||
          recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">
              No recent activity.
            </p>
          ) : (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {activity.event_type === "video_view"
                      ? "Video View"
                      : "Live View"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {activity.session_type === "tv"
                      ? "Recorded TV"
                      : "Live Stream"}
                  </p>
                </div>

                <span className="text-xs font-medium text-gray-400">
                  #{activity.id}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}