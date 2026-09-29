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

export async function updateChannel(
  channelId: string,
  formData: FormData
) {
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
      `/admin/channels/${channelId}/edit?error=Channel%20name%20and%20slug%20are%20required`
    );
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    redirect(
      `/admin/channels/${channelId}/edit?error=Slug%20can%20only%20contain%20lowercase%20letters%2C%20numbers%2C%20and%20hyphens`
    );
  }

  const { data: existingChannel, error: existingError } =
    await supabase
      .from("channels")
      .select("id")
      .eq("slug", slug)
      .neq("id", channelId)
      .maybeSingle();

  if (existingError) {
    redirect(
      `/admin/channels/${channelId}/edit?error=${encodeURIComponent(
        existingError.message
      )}`
    );
  }

  if (existingChannel) {
    redirect(
      `/admin/channels/${channelId}/edit?error=A%20channel%20with%20this%20slug%20already%20exists`
    );
  }

  const { error } = await supabase
    .from("channels")
    .update({
      name,
      slug,
      description: description || null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", channelId);

  if (error) {
    redirect(
      `/admin/channels/${channelId}/edit?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect("/admin/channels");
}export async function deleteChannel(channelId: string) {
  const supabase = await checkAdmin();

  const { error } = await supabase
    .from("channels")
    .delete()
    .eq("id", channelId);

  if (error) {
    redirect(
      `/admin/channels?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/admin/channels");
}