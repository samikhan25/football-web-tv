"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function updateAdminProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  const fullName = String(formData.get("full_name") || "").trim();

  if (!fullName) {
    redirect(
      "/admin/profile?error=Full%20name%20is%20required"
    );
  }

  if (fullName.length > 100) {
    redirect(
      "/admin/profile?error=Full%20name%20must%20be%20100%20characters%20or%20less"
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    redirect(
      `/admin/profile?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/admin/profile?success=Profile%20updated%20successfully");
}