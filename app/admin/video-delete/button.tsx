"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface VideoDeleteButtonProps {
  videoId: string;
}

export default function VideoDeleteButton({
  videoId,
}: VideoDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this video?",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", videoId);

    if (error) {
      window.alert(`Failed to delete video: ${error.message}`);
      setIsDeleting(false);
      return;
    }

    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-lg border border-red-900/60 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}