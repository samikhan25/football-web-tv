export type UserRole = "admin" | "customer";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  channel_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  video_id: string;
  position: number;
  created_at: string;
}

export interface Schedule {
  id: string;
  channel_id: string;
  video_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface Livestream {
  id: string;
  channel_id: string;
  title: string;
  stream_url: string;
  thumbnail_url: string | null;
  is_live: boolean;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  channel_id: string | null;
  video_id: string | null;
  livestream_id: string | null;
  event_type: string;
  session_id: string | null;
  created_at: string;
}