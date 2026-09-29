import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { updateAdminProfile } from "./actions";

type ProfilePageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function AdminProfilePage({
  searchParams,
}: ProfilePageProps) {
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

  if (error || !profile || profile.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Admin Profile
          </h1>

          <p className="mt-2 text-slate-400">
            Update your profile information.
          </p>
        </div>

        {params.success && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {params.success}
          </div>
        )}

        {params.error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {params.error}
          </div>
        )}

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Profile Information
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              You can update your full name. Email and role cannot be
              changed here.
            </p>
          </div>

          <form action={updateAdminProfile} className="space-y-6">
            <div>
              <label
                htmlFor="full_name"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Full Name
              </label>

              <input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={profile.full_name ?? ""}
                maxLength={100}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
               value={user.email ?? ""}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-500"
              />

              <p className="mt-2 text-xs text-slate-500">
                Email cannot be changed from this page.
              </p>
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Role
              </label>

              <input
                id="role"
                type="text"
                value={profile.role}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3 capitalize text-slate-500"
              />

              <p className="mt-2 text-xs text-slate-500">
                Your role is controlled by the system for security.
              </p>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}