import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/");
  }

  if (profile.role !== "admin") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col">
          <div className="border-b border-slate-800 px-6 py-5">
            <p className="text-lg font-bold text-white">
              Football Web TV
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Admin Panel
            </p>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            <a href="/admin">
              <SidebarItem
                icon="⌂"
                label="Dashboard"
                active
              />
            </a>

            <a href="/admin/videos">
              <SidebarItem
                icon="▶"
                label="Video Library"
              />
            </a>

            <a href="/admin/playlists">
              <SidebarItem
                icon="☷"
                label="Playlists"
              />
            </a>

            <a href="/admin/schedule">
              <SidebarItem
                icon="◷"
                label="Schedule"
              />
            </a>

            <a href="/admin/livestreams">
              <SidebarItem
                icon="●"
                label="Live Streams"
              />
            </a>

            <a href="/admin/channels">
              <SidebarItem
                icon="▦"
                label="Channels"
              />
            </a>

            <SidebarItem
              icon="↗"
              label="Analytics"
            />

            <SidebarItem
              icon="⚙"
              label="Settings"
            />
          </nav>

          <div className="border-t border-slate-800 p-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
              <p className="truncate text-sm font-semibold text-white">
                {profile.full_name || "Admin"}
              </p>

              <p className="mt-1 truncate text-xs text-slate-500">
                {user.email}
              </p>

              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-blue-400">
                {profile.role}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          {/* Top Bar */}
          <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">
                  Content Management
                </p>

                <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                  Admin Dashboard
                </h1>
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-white">
                  {profile.full_name || "Admin"}
                </p>

                <p className="text-xs text-slate-500">
                  {user.email}
                </p>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
            {/* Welcome */}
            <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
              <p className="text-sm font-medium text-blue-400">
                Welcome back
              </p>

              <h2 className="mt-1 text-2xl font-bold text-white">
                {profile.full_name || "Admin"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Manage your football TV content, livestreams,
                playlists, schedules, and channels from one place.
              </p>
            </section>

            {/* Admin Account Information */}
            <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
                    ⚙
                  </div>

                  <div>
                    <h2 className="font-bold text-white">
                      Admin Account
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Your current administrator account information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                {/* Full Name */}
                <AccountInfoItem
                  label="Full Name"
                  value={profile.full_name || "Not set"}
                />

                {/* Email */}
                <AccountInfoItem
                  label="Email Address"
                  value={user.email || "Not available"}
                />

                {/* Role */}
                <AccountInfoItem
                  label="Account Role"
                  value={profile.role}
                  valueClassName="uppercase text-blue-400"
                />

                {/* Account Status */}
                <AccountInfoItem
                  label="Account Status"
                  value="Active"
                  valueClassName="text-emerald-400"
                />
              </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Videos"
                value="0"
                icon="▶"
              />

              <StatCard
                label="Live Streams"
                value="0"
                icon="●"
              />

              <StatCard
                label="Scheduled Items"
                value="0"
                icon="◷"
              />

              <StatCard
                label="Total Views"
                value="0"
                icon="↗"
              />
            </section>

            {/* Quick Actions */}
            <section className="mt-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white">
                  Quick Actions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Quickly access common content management tasks.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <QuickAction
                  href="/admin/videos/new"
                  icon="▶"
                  title="Add Video"
                  description="Add a new video to your library."
                />

                <QuickAction
                  href="/admin/playlists/new"
                  icon="☷"
                  title="Create Playlist"
                  description="Create and organize a playlist."
                />

                <QuickAction
                  href="/admin/schedule/new"
                  icon="◷"
                  title="Add Schedule"
                  description="Schedule content for a channel."
                />

                <QuickAction
                  href="/admin/livestreams/new"
                  icon="●"
                  title="Add Livestream"
                  description="Add a live game or stream."
                />
              </div>
            </section>

            {/* Management Cards */}
            <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Recent Content */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
                <div className="border-b border-slate-800 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-white">
                        Recent Content
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Latest videos and content.
                      </p>
                    </div>

                    <a
                      href="/admin/videos"
                      className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
                    >
                      View All
                    </a>
                  </div>
                </div>

                <div className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl">
                    ▶
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-300">
                    No recent content
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Your latest videos will appear here.
                  </p>
                </div>
              </div>

              {/* Live Streams */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70">
                <div className="border-b border-slate-800 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-white">
                        Live Streams
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Current and upcoming live games.
                      </p>
                    </div>

                    <a
                      href="/admin/livestreams"
                      className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
                    >
                      View All
                    </a>
                  </div>
                </div>

                <div className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-xl">
                    ●
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-300">
                    No active livestreams
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Active livestreams will appear here.
                  </p>
                </div>
              </div>
            </section>

            {/* Management */}
            <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="font-bold text-white">
                  Management
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Manage the main TV platform resources.
                </p>
              </div>

              <div className="grid grid-cols-1 divide-y divide-slate-800 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
                <ManagementLink
                  href="/admin/videos"
                  icon="▶"
                  title="Video Library"
                  description="Manage videos and metadata."
                />

                <ManagementLink
                  href="/admin/playlists"
                  icon="☷"
                  title="Playlists"
                  description="Organize videos into playlists."
                />

                <ManagementLink
                  href="/admin/schedule"
                  icon="◷"
                  title="Schedule"
                  description="Manage scheduled content."
                />

                <ManagementLink
                  href="/admin/livestreams"
                  icon="●"
                  title="Live Streams"
                  description="Manage live games and streams."
                />

                <ManagementLink
                  href="/admin/channels"
                  icon="▦"
                  title="Channels"
                  description="Manage TV channels."
                />
              </div>
            </section>
          </div>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur lg:hidden">
            <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
              <MobileNavItem
                href="/admin"
                icon="⌂"
                label="Home"
              />

              <MobileNavItem
                href="/admin/videos"
                icon="▶"
                label="Videos"
              />

              <MobileNavItem
                href="/admin/playlists"
                icon="☷"
                label="Playlists"
              />

              <MobileNavItem
                href="/admin/livestreams"
                icon="●"
                label="Live"
              />

              <MobileNavItem
                href="/admin/channels"
                icon="▦"
                label="Channels"
              />
            </div>
          </nav>
        </div>
      </div>
    </main>
  );
}

function AccountInfoItem({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 truncate text-sm font-semibold ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-blue-600/10 text-blue-400"
          : "text-slate-400 hover:bg-slate-900 hover:text-white"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center text-sm">
        {icon}
      </span>

      <span>{label}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>

        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-sm text-slate-300">
          {icon}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700 hover:bg-slate-900"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-lg text-blue-400 transition group-hover:bg-blue-600/20">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-white">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-5 text-slate-500">
        {description}
      </p>
    </a>
  );
}

function ManagementLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 p-5 transition hover:bg-slate-800/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm text-slate-300">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <span className="ml-auto text-slate-600">
        →
      </span>
    </a>
  );
}

function MobileNavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center rounded-lg px-2 py-2 text-[10px] font-medium text-slate-500 transition hover:bg-slate-900 hover:text-white"
    >
      <span className="text-sm">
        {icon}
      </span>

      <span className="mt-1">
        {label}
      </span>
    </a>
  );
}