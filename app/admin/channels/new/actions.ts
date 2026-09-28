"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function checkAdmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    redirect("/");
  }

  return supabase;
}

export async function createChannel(formData: FormData) {
  const supabase = await checkAdmin();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase();
  const description = String(
    formData.get("description") || ""
  ).trim();

  const isActive = formData.get("is_active") === "on";

  if (!name || !slug) {
    redirect(
      "/admin/channels/new?error=Channel%20name%20and%20slug%20are%20required"
    );
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    redirect(
      "/admin/channels/new?error=Slug%20can%20only%20contain%20lowercase%20letters%2C%20numbers%2C%20and%20hyphens"
    );
  }

  const { data: existingChannel, error: existingError } =
    await supabase
      .from("channels")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

  if (existingError) {
    redirect(
      `/admin/channels/new?error=${encodeURIComponent(
        existingError.message
      )}`
    );
  }

  if (existingChannel) {
    redirect(
      "/admin/channels/new?error=A%20channel%20with%20this%20slug%20already%20exists"
    );
  }

  const { error } = await supabase.from("channels").insert({
    name,
    slug,
    description: description || null,
    is_active: isActive,
  });

  if (error) {
    redirect(
      `/admin/channels/new?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/admin/channels");
}