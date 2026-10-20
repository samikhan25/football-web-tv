import PlaybackEngine, {
  type PlaybackVideo,
  type TVLiveStream,
  type TVScheduleItem,
} from "@/components/tv/PlaybackEngine";

import { createSupabaseServerClient } from "@/lib/supabase-server";

type PlaylistVideo = {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  is_active: boolean;
};

type PlaylistItemRow = {
  id: string;
  position: number;
  videos: PlaylistVideo | PlaylistVideo[] | null;
};

type LiveStreamRow = {
  id: string;
  title: string;
  stream_url: string;
  thumbnail_url: string | null;
  is_live: boolean;
  channel_id: string | null;
};

type ChannelRow = {
  id: string;
  name: string;
};

type ScheduleRow = {
  id: string;
  start_time: string;
  end_time: string;
  playlists: { name: string } | { name: string }[] | null;
};

export default async function EmbedTVPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: playlist,
    error: playlistError,
  } = await supabase
    .from("playlists")
    .select("id, name")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (playlistError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] px-6 text-white">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/10" />

          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] shadow-xl">
              <span className="text-xl">TV</span>
            </div>

            <h1 className="mt-6 text-xl font-bold">
              TV playback unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              The active playlist could not be loaded.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!playlist) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] px-6 text-white">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/10" />

          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-lg font-black">
              TV
            </div>

            <h1 className="mt-6 text-xl font-bold">
              No active playlist
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Please activate a playlist from the admin panel.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Playlist videos
  // --------------------------------------------------

  const {
    data: playlistItems,
    error: playlistItemsError,
  } = await supabase
    .from("playlist_items")
    .select(`
      id,
      position,
      videos (
        id,
        title,
        video_url,
        thumbnail_url,
        duration_seconds,
        is_active
      )
    `)
    .eq("playlist_id", playlist.id)
    .order("position", { ascending: true });

  if (playlistItemsError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] px-6 text-white">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/10" />

          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
              TV
            </div>

            <h1 className="mt-6 text-xl font-bold">
              TV playback unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              The playlist videos could not be loaded.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const typedPlaylistItems =
    (playlistItems ?? []) as PlaylistItemRow[];

  const videos: PlaybackVideo[] = typedPlaylistItems
    .map((item) => {
      const rawVideo = item.videos;

      const video = Array.isArray(rawVideo)
        ? rawVideo[0]
        : rawVideo;

      if (!video || !video.is_active) {
        return null;
      }

      return {
        position: item.position,
        video,
      };
    })
    .filter(
      (
        item,
      ): item is {
        position: number;
        video: PlaylistVideo;
      } => item !== null,
    )
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      id: item.video.id,
      title: item.video.title,
      video_url: item.video.video_url,
      thumbnail_url: item.video.thumbnail_url,
      duration_seconds: item.video.duration_seconds,
    }));

  // --------------------------------------------------
  // Live streams
  // --------------------------------------------------

  const { data: liveStreamRows } = await supabase
    .from("livestreams")
    .select(`
      id,
      title,
      stream_url,
      thumbnail_url,
      is_live,
      channel_id
    `)
    .eq("is_live", true)
    .order("started_at", { ascending: false })
    .limit(3);

  const rawLiveStreams =
    (liveStreamRows ?? []) as LiveStreamRow[];

  const channelIds = rawLiveStreams
    .map((stream) => stream.channel_id)
    .filter((id): id is string => Boolean(id));

  let channels: ChannelRow[] = [];

  if (channelIds.length > 0) {
    const { data: channelRows } = await supabase
      .from("channels")
      .select("id, name")
      .in("id", channelIds);

    channels = (channelRows ?? []) as ChannelRow[];
  }

  const liveStreams: TVLiveStream[] =
    rawLiveStreams.map((stream) => {
      const channel = channels.find(
        (item) => item.id === stream.channel_id,
      );

      return {
        id: stream.id,
        title: stream.title,
        stream_url: stream.stream_url,
        thumbnail_url: stream.thumbnail_url,
        is_live: stream.is_live,
        channel_name: channel?.name ?? null,
      };
    });

  // --------------------------------------------------
  // Upcoming schedule
  // --------------------------------------------------

  const now = new Date().toISOString();

  const { data: scheduleRows } = await supabase
    .from("schedules")
    .select(`
      id,
      start_time,
      end_time,
      playlists (
        name
      )
    `)
    .eq("is_active", true)
    .gte("end_time", now)
    .order("start_time", { ascending: true })
    .limit(6);

  const typedScheduleRows =
    (scheduleRows ?? []) as ScheduleRow[];

  const schedule: TVScheduleItem[] =
    typedScheduleRows.map((item) => {
      const rawPlaylist = item.playlists;

      const schedulePlaylist = Array.isArray(rawPlaylist)
        ? rawPlaylist[0]
        : rawPlaylist;

      return {
        id: item.id,
        start_time: item.start_time,
        end_time: item.end_time,
        playlist_name:
          schedulePlaylist?.name ?? "Football TV Program",
      };
    });

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#05070d] text-white">
      <PlaybackEngine
        videos={videos}
        liveStreams={liveStreams}
        schedule={schedule}
        playlistName={playlist.name}
        embedMode
      />
    </main>
  );
}