import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in
  if (!user) {
    redirect("/login");
  }

  // Get current user's profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // Profile missing or database error
  if (error || !profile) {
    redirect("/");
  }

  // Only admin can access
  if (profile.role !== "admin") {
    redirect("/");
  }

  const adminName = profile.full_name || "Admin";
  const adminEmail = user.email || "";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        {/* =========================
            SIDEBAR
        ========================== */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 lg:flex lg:flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center border-b border-slate-800 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                TV
              </div>

              <div>
                <h1 className="text-sm font-bold tracking-wide text-white">
                  Football TV
                </h1>
                <p className="text-xs text-slate-400">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Management
            </p>

            <div className="space-y-1">
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white"
              >
                <span>▣</span>
                Dashboard
              </Link>

              <Link href="/admin/videos">
  <SidebarItem icon="▶" label="Video Library" />
</Link>

<Link href="/admin/playlists">
  <SidebarItem icon="☷" label="Playlists" />
</Link>
              <SidebarItem icon="◷" label="Schedule" />
              <SidebarItem icon="●" label="Live Streams" />
              <SidebarItem icon="▤" label="Channels" />
            </div>

            <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              System
            </p>

            <div className="space-y-1">
              <SidebarItem icon="▥" label="Analytics" />
              <SidebarItem icon="⚙" label="Settings" />
              <SidebarItem icon="⌘" label="Embed Code" />
            </div>
          </nav>

          {/* Admin profile */}
          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">
                {adminName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {adminName}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {adminEmail}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* =========================
            MAIN CONTENT
        ========================== */}
        <section className="min-w-0 flex-1">
          {/* Header */}
          <header className="flex min-h-20 items-center justify-between border-b border-slate-800 bg-slate-950 px-5 sm:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
                Administration
              </p>

              <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-white">{adminName}</p>
                <p className="text-xs capitalize text-slate-400">
                  {profile.role}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold">
                {adminName.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-5 sm:p-8">
            {/* Welcome */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white">
                Welcome back, {adminName}
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Manage your football academy Web TV from one place.
              </p>
            </div>

            {/* =========================
                STAT CARDS
            ========================== */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Videos"
                value="0"
                description="Video library"
                icon="▶"
              />

              <StatCard
                title="Live Streams"
                value="0"
                description="Currently active"
                icon="●"
              />

              <StatCard
                title="Scheduled Items"
                value="0"
                description="Upcoming content"
                icon="◷"
              />

              <StatCard
                title="Total Views"
                value="0"
                description="All time"
                icon="◉"
              />
            </div>

            {/* =========================
                MAIN GRID
            ========================== */}
            <div className="mt-8 grid gap-6 xl:grid-cols-3">
              {/* Recent content */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 xl:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-white">
                      Recent Content
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Recently added videos and content
                    </p>
                  </div>

                  <button
                    type="button"
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
                  >
                    View All
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-6 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-lg text-slate-400">
                      ▶
                    </div>

                    <h4 className="font-medium text-slate-200">
                      No videos yet
                    </h4>

                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                      Your recently added videos will appear here once you
                      start adding content to the TV platform.
                    </p>

                    <button
                      type="button"
                      className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                    >
                      Add Your First Video
                    </button>
                  </div>
                </div>
              </div>

              {/* Live status */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900">
                <div className="border-b border-slate-800 px-5 py-4">
                  <h3 className="font-semibold text-white">
                    Live Streams
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Current livestream activity
                  </p>
                </div>

                <div className="p-5">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                      <span className="text-sm text-slate-500">●</span>
                    </div>

                    <p className="mt-3 text-sm font-medium text-slate-300">
                      No live streams
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Up to 3 simultaneous games can be managed here.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================
                QUICK ACTIONS
            ========================== */}
            <div className="mt-8">
              <div className="mb-4">
                <h3 className="font-semibold text-white">Quick Actions</h3>

                <p className="mt-1 text-xs text-slate-500">
                  Common content management actions
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <QuickAction
                  icon="▶"
                  title="Add Video"
                  description="Add a new video to your library"
                />

                <QuickAction
                  icon="☷"
                  title="Create Playlist"
                  description="Organize videos into a playlist"
                />

                <QuickAction
                  icon="◷"
                  title="Create Schedule"
                  description="Schedule TV programming"
                />

                <QuickAction
                  icon="●"
                  title="Add Live Stream"
                  description="Add a football game stream"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-900/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          <MobileNavItem active label="Home" icon="▣" />
          <MobileNavItem label="Videos" icon="▶" />
          <MobileNavItem label="Live" icon="●" />
          <MobileNavItem label="More" icon="☰" />
        </div>
      </div>
    </main>
  );
}

/* =========================
   REUSABLE UI COMPONENTS
========================= */

function SidebarItem({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div className="flex cursor-default items-center justify-between rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200">
      <div className="flex items-center gap-3">
        <span className="w-4 text-center text-xs">{icon}</span>
        <span>{label}</span>
      </div>

      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] uppercase text-slate-500">
        Soon
      </span>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-sm text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-blue-500/40 hover:bg-slate-800"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-sm text-blue-400 transition group-hover:bg-blue-500/20">
        {icon}
      </div>

      <h4 className="mt-4 text-sm font-semibold text-white">{title}</h4>

      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </button>
  );
}

function MobileNavItem({
  label,
  icon,
  active = false,
}: {
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium ${
        active
          ? "bg-blue-600 text-white"
          : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
      }`}
    >
      <span className="text-xs">{icon}</span>
      {label}
    </button>
  );
}