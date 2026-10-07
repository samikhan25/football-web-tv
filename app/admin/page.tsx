import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Link from "next/link";

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
              Dragao FC TV
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Admin Panel
            </p>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">

            <Link href="/admin">
              <SidebarItem
                icon="⌂"
                label="Dashboard"
                active
              />
            </Link>

            <Link href="/admin/videos">
              <SidebarItem
                icon="▶"
                label="Video Library"
              />
            </Link>

            <Link href="/admin/playlists">
              <SidebarItem
                icon="☷"
                label="Playlists"
              />
            </Link>

            <Link href="/admin/schedule">
              <SidebarItem
                icon="◷"
                label="Schedule"
              />
            </Link>

            <Link href="/admin/livestreams">
              <SidebarItem
                icon="●"
                label="Live Streams"
              />
            </Link>

            <Link href="/admin/channels">
              <SidebarItem
                icon="▦"
                label="Channels"
              />
            </Link>

            <Link href="/admin/analytics">
              <SidebarItem
                icon="↗"
                label="Analytics"
              />
            </Link>

          </nav>

          <div className="border-t border-slate-800 p-4">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full rounded-lg border border-red-900/50 px-3 py-2.5 text-center text-xs font-semibold text-red-400 transition hover:bg-red-950/40 hover:text-red-300"
              >
                Logout
              </button>
            </form>
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

            {/* Content Overview */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* Recent Content */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70">

                <div className="border-b border-slate-800 px-5 py-4">
                  <div className="flex items-center justify-between gap-4">

                    <div>
                      <h2 className="font-bold text-white">
                        Recent Content
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Your latest uploaded videos.
                      </p>
                    </div>

                    <Link
                      href="/admin/videos"
                      className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
                    >
                      View All
                    </Link>

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

                    <Link
                      href="/admin/livestreams"
                      className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
                    >
                      View All
                    </Link>

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
    <Link
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
    </Link>
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
    <Link
      href={href}
      className="flex flex-col items-center justify-center rounded-lg px-2 py-2 text-[10px] font-medium text-slate-500 transition hover:bg-slate-900 hover:text-white"
    >
      <span className="text-sm">
        {icon}
      </span>

      <span className="mt-1">
        {label}
      </span>
    </Link>
  );
}