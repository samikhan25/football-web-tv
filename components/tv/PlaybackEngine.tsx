"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

export type PlaybackVideo = {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
};

export type TVLiveStream = {
  id: string;
  title: string;
  stream_url: string;
  thumbnail_url: string | null;
  is_live: boolean;
  channel_name: string | null;
};

export type TVScheduleItem = {
  id: string;
  start_time: string;
  end_time: string;
  playlist_name: string;
};

type PlaybackEngineProps = {
  videos: PlaybackVideo[];
  liveStreams: TVLiveStream[];
  schedule: TVScheduleItem[];
  playlistName?: string;
  embedMode?: boolean;
};

const NEXT_VIDEO_DELAY = 800;
const STALL_RECOVERY_DELAY = 4000;
const ERROR_RECOVERY_DELAY = 5000;

function clearTimer(timerRef: MutableRefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function formatScheduleTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PlaybackEngine({
  videos,
  liveStreams,
  schedule,
  playlistName = "Dragao FC TV",
  embedMode = false,
}: PlaybackEngineProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const hlsRef = useRef<{
    destroy: () => void;
    loadSource: (source: string) => void;
    attachMedia: (media: HTMLMediaElement) => void;
  } | null>(null);

  const errorTimerRef = useRef<number | null>(null);
  const stallTimerRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);

  const trackedVideoIdRef = useRef<string | null>(null);
  const trackedLiveStreamIdRef = useRef<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLiveStream, setSelectedLiveStream] =
    useState<TVLiveStream | null>(null);

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isStalled, setIsStalled] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const currentVideo = videos[currentIndex] ?? null;

  const currentTitle = isLiveMode
    ? selectedLiveStream?.title ?? "Live Game"
    : currentVideo?.title ?? playlistName;

  const progressValue =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  const trackVideoView = useCallback(async (videoId: string) => {
    if (trackedVideoIdRef.current === videoId) {
      return;
    }

    trackedVideoIdRef.current = videoId;

    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_id: videoId,
          event_type: "video_view",
          session_type: "tv",
        }),
      });
    } catch {}
  }, []);

  const trackLiveView = useCallback(async (livestreamId: string) => {
    if (trackedLiveStreamIdRef.current === livestreamId) {
      return;
    }

    trackedLiveStreamIdRef.current = livestreamId;

    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          livestream_id: livestreamId,
          event_type: "live_view",
          session_type: "live",
        }),
      });
    } catch {}
  }, []);

  const clearAllTimers = useCallback(() => {
    clearTimer(errorTimerRef);
    clearTimer(stallTimerRef);
    clearTimer(nextTimerRef);
  }, []);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}

      hlsRef.current = null;
    }
  }, []);

  const resetPlaybackState = useCallback(() => {
    clearAllTimers();

    setIsLoading(true);
    setIsStalled(false);
    setHasError(false);
    setAutoplayBlocked(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [clearAllTimers]);

  const moveToNextVideo = useCallback(() => {
    if (videos.length === 0) {
      return;
    }

    setCurrentIndex((previousIndex) => {
      if (videos.length <= 1) {
        return 0;
      }

      return (previousIndex + 1) % videos.length;
    });
  }, [videos.length]);

  const recoverPlayback = useCallback(async () => {
    const currentElement = videoRef.current;

    if (!currentElement) {
      return;
    }

    if (isLiveMode) {
      if (
        !currentElement.paused &&
        currentElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        clearTimer(stallTimerRef);

        setIsLoading(false);
        setIsStalled(false);
        setHasError(false);
        setIsPlaying(true);

        return;
      }

      try {
        await currentElement.play();

        clearTimer(stallTimerRef);
        clearTimer(errorTimerRef);

        setIsLoading(false);
        setIsStalled(false);
        setHasError(false);
        setAutoplayBlocked(false);
        setIsPlaying(true);
      } catch {}

      return;
    }

    try {
      await currentElement.play();

      clearTimer(stallTimerRef);
      clearTimer(errorTimerRef);

      setIsLoading(false);
      setIsStalled(false);
      setHasError(false);
      setAutoplayBlocked(false);
      setIsPlaying(true);
    } catch {
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
    }
  }, [isLiveMode]);

  const selectLiveStream = useCallback(
    (stream: TVLiveStream) => {
      clearAllTimers();
      destroyHls();

      setSelectedLiveStream(stream);
      setIsLiveMode(true);
      setIsLoading(true);
      setIsStalled(false);
      setHasError(false);
      setAutoplayBlocked(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    },
    [clearAllTimers, destroyHls],
  );

  const returnToTV = useCallback(() => {
    clearAllTimers();
    destroyHls();

    setSelectedLiveStream(null);
    setIsLiveMode(false);
    setIsLoading(true);
    setIsStalled(false);
    setHasError(false);
    setAutoplayBlocked(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [clearAllTimers, destroyHls]);

  // --------------------------------------------------
  // Source / HLS setup
  // --------------------------------------------------

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    destroyHls();

    clearTimer(errorTimerRef);
    clearTimer(stallTimerRef);

    setIsLoading(true);
    setIsStalled(false);
    setHasError(false);
    setAutoplayBlocked(false);
    setIsPlaying(false);

    const source = isLiveMode
      ? selectedLiveStream?.stream_url
      : currentVideo?.video_url;

    if (!source) {
      return;
    }

    let cancelled = false;

    const setupSource = async () => {
      try {
        videoElement.pause();
        videoElement.removeAttribute("src");
        videoElement.load();

        if (isLiveMode && source.includes(".m3u8")) {
          if (
            videoElement.canPlayType(
              "application/vnd.apple.mpegurl",
            )
          ) {
            videoElement.src = source;
          } else {
            const HlsModule = await import("hls.js");
            const Hls = HlsModule.default;

            if (cancelled) {
              return;
            }

            if (!Hls.isSupported()) {
              setIsLoading(false);
              setHasError(true);
              return;
            }

            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 30,
              maxBufferLength: 20,
              maxMaxBufferLength: 30,
              liveSyncDurationCount: 3,
              liveMaxLatencyDurationCount: 6,
            });

            hlsRef.current = hls;

            hls.attachMedia(videoElement);

            hls.on(
              Hls.Events.MEDIA_ATTACHED,
              () => {
                if (cancelled) {
                  return;
                }

                hls.loadSource(source);
              },
            );

            hls.on(
              Hls.Events.MANIFEST_PARSED,
              () => {
                if (cancelled) {
                  return;
                }

                setIsLoading(true);

                void videoElement
                  .play()
                  .then(() => {
                    if (cancelled) {
                      return;
                    }

                    clearTimer(errorTimerRef);
                    clearTimer(stallTimerRef);

                    setIsLoading(false);
                    setIsStalled(false);
                    setHasError(false);
                    setAutoplayBlocked(false);
                    setIsPlaying(true);
                  })
                  .catch(() => {
                    if (cancelled) {
                      return;
                    }

                    setIsLoading(false);
                    setAutoplayBlocked(true);
                    setIsPlaying(false);
                  });
              },
            );

            hls.on(Hls.Events.ERROR, (_event, data) => {
              if (cancelled || !data.fatal) {
                return;
              }

              if (
                data.type ===
                Hls.ErrorTypes.NETWORK_ERROR
              ) {
                try {
                  hls.startLoad();
                } catch {}

                return;
              }

              if (
                data.type ===
                Hls.ErrorTypes.MEDIA_ERROR
              ) {
                try {
                  hls.recoverMediaError();
                } catch {}

                return;
              }

              clearTimer(errorTimerRef);

              errorTimerRef.current =
                window.setTimeout(() => {
                  if (cancelled) {
                    return;
                  }

                  setIsLoading(false);
                  setIsStalled(false);
                  setHasError(true);
                  setIsPlaying(false);
                }, ERROR_RECOVERY_DELAY);
            });

            return;
          }
        } else {
          videoElement.src = source;
        }

        videoElement.load();

        try {
          await videoElement.play();

          if (cancelled) {
            return;
          }

          clearTimer(errorTimerRef);
          clearTimer(stallTimerRef);

          setIsLoading(false);
          setIsStalled(false);
          setHasError(false);
          setAutoplayBlocked(false);
          setIsPlaying(true);
        } catch {
          if (cancelled) {
            return;
          }

          setIsLoading(false);
          setAutoplayBlocked(true);
          setIsPlaying(false);
        }
      } catch {
        if (cancelled) {
          return;
        }

        setIsLoading(false);
        setHasError(true);
        setIsPlaying(false);
      }
    };

    void setupSource();

    return () => {
      cancelled = true;

      clearTimer(errorTimerRef);
      clearTimer(stallTimerRef);
      destroyHls();

      try {
        videoElement.pause();
      } catch {}
    };
  }, [
    currentVideo?.id,
    currentVideo?.video_url,
    destroyHls,
    isLiveMode,
    selectedLiveStream?.id,
    selectedLiveStream?.stream_url,
  ]);

  useEffect(() => {
    return () => {
      clearAllTimers();
      destroyHls();
    };
  }, [clearAllTimers, destroyHls]);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    videoElement.volume = volume;
    videoElement.muted = isMuted;
  }, [isMuted, volume]);

  // --------------------------------------------------
  // Empty state
  // --------------------------------------------------

  if (!currentVideo && !isLiveMode) {
    return (
      <main className="min-h-screen bg-[#05070d] text-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/10" />

            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-lg font-black">
                TV
              </div>

              <h1 className="mt-5 text-2xl font-bold">
                {playlistName}
              </h1>

              <p className="mt-2 text-sm text-white/50">
                No videos are currently available.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={
        embedMode
          ? "min-h-screen w-full bg-[#05070d] text-white"
          : "min-h-screen bg-[#05070d] text-white"
      }
    >
      <div
        className={
          embedMode
            ? "w-full"
            : "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        }
      >
        {/* ==================================================
            PREMIUM TV HEADER
        ================================================== */}

        <header
          className={
            embedMode
              ? "relative overflow-hidden border-b border-white/10 bg-[#080b13] px-4 py-4 sm:px-6"
              : "relative mb-5 overflow-hidden rounded-3xl border border-white/10 bg-[#080b13] px-5 py-5"
          }
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/[0.08] via-transparent to-blue-600/[0.08]" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-sm font-black shadow-lg shadow-red-950/40">
                TV
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />

                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
                    {isLiveMode ? "Live Broadcast" : "24/7 TV"}
                  </p>
                </div>

                <h1 className="mt-0.5 truncate text-lg font-black tracking-tight sm:text-xl">
                  {playlistName}
                </h1>
              </div>
            </div>

            {isLiveMode && (
              <button
                type="button"
                onClick={returnToTV}
                className="shrink-0 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
              >
                ← 24/7 TV
              </button>
            )}
          </div>
        </header>

        {/* ==================================================
            MAIN PLAYER
        ================================================== */}

        <section
          className={
            embedMode
              ? "overflow-hidden bg-black"
              : "overflow-hidden rounded-3xl border border-white/10 bg-[#080b13] shadow-2xl"
          }
        >
          <div className="relative aspect-video w-full bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              playsInline
              preload="auto"
              poster={
                isLiveMode
                  ? selectedLiveStream?.thumbnail_url ??
                    undefined
                  : currentVideo?.thumbnail_url ??
                    undefined
              }
              onLoadedMetadata={(event) => {
                const media = event.currentTarget;

                if (!isLiveMode) {
                  setDuration(
                    Number.isFinite(media.duration)
                      ? media.duration
                      : 0,
                  );
                }
              }}
              onDurationChange={(event) => {
                const media = event.currentTarget;

                if (!isLiveMode) {
                  setDuration(
                    Number.isFinite(media.duration)
                      ? media.duration
                      : 0,
                  );
                }
              }}
              onTimeUpdate={(event) => {
                const media = event.currentTarget;

                if (isLiveMode) {
                  if (
                    !media.paused &&
                    media.readyState >=
                      HTMLMediaElement.HAVE_CURRENT_DATA
                  ) {
                    clearTimer(stallTimerRef);

                    setIsLoading(false);
                    setIsStalled(false);
                    setHasError(false);
                    setIsPlaying(true);
                  }

                  return;
                }

                setCurrentTime(media.currentTime);
              }}
              onPlay={() => {
                setIsPlaying(true);
                setAutoplayBlocked(false);

                if (!isLiveMode && currentVideo) {
                  void trackVideoView(currentVideo.id);
                }

                if (isLiveMode && selectedLiveStream) {
                  void trackLiveView(
                    selectedLiveStream.id,
                  );
                }
              }}
              onPause={() => {
                if (!isLiveMode) {
                  setIsPlaying(false);
                }
              }}
              onPlaying={() => {
                clearTimer(errorTimerRef);
                clearTimer(stallTimerRef);

                setIsLoading(false);
                setIsStalled(false);
                setHasError(false);
                setAutoplayBlocked(false);
                setIsPlaying(true);

                if (!isLiveMode && currentVideo) {
                  void trackVideoView(currentVideo.id);
                }

                if (isLiveMode && selectedLiveStream) {
                  void trackLiveView(
                    selectedLiveStream.id,
                  );
                }
              }}
              onCanPlay={() => {
                if (isLiveMode) {
                  clearTimer(stallTimerRef);

                  setIsLoading(false);
                  setIsStalled(false);
                }
              }}
              onWaiting={() => {
                if (!isLiveMode) {
                  setIsLoading(true);
                  setIsStalled(true);

                  clearTimer(stallTimerRef);

                  stallTimerRef.current =
                    window.setTimeout(() => {
                      void recoverPlayback();
                    }, STALL_RECOVERY_DELAY);
                }
              }}
              onStalled={() => {
                if (!isLiveMode) {
                  setIsLoading(true);
                  setIsStalled(true);

                  clearTimer(stallTimerRef);

                  stallTimerRef.current =
                    window.setTimeout(() => {
                      void recoverPlayback();
                    }, STALL_RECOVERY_DELAY);
                }
              }}
              onEnded={() => {
                if (isLiveMode) {
                  return;
                }

                clearAllTimers();

                setIsLoading(true);
                setIsStalled(false);
                setHasError(false);

                nextTimerRef.current =
                  window.setTimeout(() => {
                    moveToNextVideo();
                  }, NEXT_VIDEO_DELAY);
              }}
              onError={() => {
                clearTimer(stallTimerRef);
                clearTimer(errorTimerRef);

                if (isLiveMode) {
                  setIsLoading(false);
                  setIsStalled(false);
                  setHasError(true);
                  setIsPlaying(false);

                  return;
                }

                setIsLoading(true);
                setIsStalled(false);
                setHasError(false);

                errorTimerRef.current =
                  window.setTimeout(() => {
                    const currentElement =
                      videoRef.current;

                    if (!currentElement) {
                      return;
                    }

                    if (
                      currentElement.readyState >=
                      HTMLMediaElement.HAVE_CURRENT_DATA
                    ) {
                      return;
                    }

                    setIsLoading(false);
                    setHasError(true);
                    setIsPlaying(false);
                  }, ERROR_RECOVERY_DELAY);
              }}
              controls={false}
            />

            {/* LIVE BADGE */}

            {isLiveMode && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-red-300/20 bg-red-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-red-950/40">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Live
              </div>
            )}

            {/* PLAYER LOADING */}

            {isLoading &&
              !hasError &&
              !autoplayBlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
                  <div className="rounded-2xl border border-white/10 bg-black/70 px-6 py-5 text-center shadow-2xl backdrop-blur-xl">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

                    <p className="text-sm font-semibold text-white">
                      {isStalled
                        ? "Buffering..."
                        : isLiveMode
                          ? "Connecting to live stream..."
                          : "Loading TV..."}
                    </p>

                    <p className="mt-1 text-[11px] text-white/40">
                      {playlistName}
                    </p>
                  </div>
                </div>
              )}

            {/* AUTOPLAY BLOCKED */}

            {autoplayBlocked && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-sm">
                <div className="rounded-3xl border border-white/10 bg-black/80 px-7 py-6 text-center shadow-2xl">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-black">
                    ▶
                  </div>

                  <p className="mt-4 text-base font-bold">
                    Ready to watch
                  </p>

                  <p className="mt-1 text-xs text-white/45">
                    Tap play to start the broadcast.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      const media = videoRef.current;

                      if (!media) {
                        return;
                      }

                      void media
                        .play()
                        .then(() => {
                          setAutoplayBlocked(false);
                          setIsLoading(false);
                          setIsPlaying(true);
                        })
                        .catch(() => {
                          setAutoplayBlocked(true);
                        });
                    }}
                    className="mt-5 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90"
                  >
                    Start Watching
                  </button>
                </div>
              </div>
            )}

            {/* ERROR */}

            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-sm">
                <div className="max-w-sm px-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-xl font-bold text-red-400">
                    !
                  </div>

                  <h2 className="mt-4 text-lg font-bold">
                    {isLiveMode
                      ? "Live stream unavailable"
                      : "Video unavailable"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/50">
                    {isLiveMode
                      ? "The live stream could not be played right now."
                      : "This video could not be played."}
                  </p>

                  {isLiveMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedLiveStream) {
                          return;
                        }

                        selectLiveStream(
                          selectedLiveStream,
                        );
                      }}
                      className="mt-5 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90"
                    >
                      Retry Live Stream
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        resetPlaybackState();

                        const media =
                          videoRef.current;

                        if (!media) {
                          return;
                        }

                        media.load();

                        void media
                          .play()
                          .then(() => {
                            setIsLoading(false);
                            setHasError(false);
                            setIsPlaying(true);
                          })
                          .catch(() => {
                            setIsLoading(false);
                            setHasError(true);
                          });
                      }}
                      className="mt-5 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ==================================================
              PLAYER CONTROLS
          ================================================== */}

          <div className="border-t border-white/10 bg-[#090c14] px-4 py-4 sm:px-5">
            {!isLiveMode && (
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={Math.min(
                    currentTime,
                    duration || currentTime,
                  )}
                  disabled={!duration}
                  onChange={(event) => {
                    const value = Number(
                      event.target.value,
                    );

                    setCurrentTime(value);

                    const media = videoRef.current;

                    if (media) {
                      media.currentTime = value;
                    }
                  }}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
                  style={{
                    background: `linear-gradient(to right, #ef4444 ${progressValue}%, rgba(255,255,255,0.12) ${progressValue}%)`,
                  }}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {/* PLAY */}

              <button
                type="button"
                aria-label={
                  isPlaying ? "Pause" : "Play"
                }
                onClick={() => {
                  const media = videoRef.current;

                  if (!media) {
                    return;
                  }

                  if (media.paused) {
                    void media
                      .play()
                      .then(() => {
                        setIsPlaying(true);
                        setAutoplayBlocked(false);
                        setIsLoading(false);
                      })
                      .catch(() => {
                        setAutoplayBlocked(true);
                      });
                  } else {
                    media.pause();
                    setIsPlaying(false);
                  }
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-black text-black shadow-lg transition hover:scale-105 hover:bg-white/90"
              >
                {isPlaying ? "❚❚" : "▶"}
              </button>

              {/* TIME */}

              {!isLiveMode && (
                <span className="min-w-[105px] text-xs font-medium tabular-nums text-white/50">
                  {formatTime(currentTime)} /{" "}
                  {formatTime(duration)}
                </span>
              )}

              {/* LIVE STATUS */}

              {isLiveMode && (
                <div className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />

                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                    Live Now
                  </span>
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                {/* MUTE */}

                <button
                  type="button"
                  aria-label={
                    isMuted ? "Unmute" : "Mute"
                  }
                  onClick={() => {
                    const media = videoRef.current;

                    if (media) {
                      media.muted = !media.muted;
                    }

                    setIsMuted(
                      (previous) => !previous,
                    );
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm transition hover:bg-white/[0.09]"
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>

                {/* VOLUME */}

                <input
                  aria-label="Volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(event) => {
                    const nextVolume = Number(
                      event.target.value,
                    );

                    setVolume(nextVolume);

                    if (nextVolume > 0) {
                      setIsMuted(false);
                    }

                    const media = videoRef.current;

                    if (media) {
                      media.volume = nextVolume;
                      media.muted =
                        nextVolume === 0;
                    }
                  }}
                  className="hidden h-1.5 w-20 cursor-pointer appearance-none rounded-full sm:block"
                />

                {/* FULLSCREEN */}

                <button
                  type="button"
                  aria-label="Fullscreen"
                  onClick={() => {
                    const media = videoRef.current;

                    if (!media) {
                      return;
                    }

                    if (media.requestFullscreen) {
                      void media.requestFullscreen();
                    }
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-base transition hover:bg-white/[0.09]"
                >
                  ⛶
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            NOW PLAYING
        ================================================== */}

        <section className="border-b border-white/10 bg-[#070a11] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
                  {isLiveMode
                    ? "Live Now"
                    : "Now Playing"}
                </span>

                {isLiveMode && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                )}
              </div>

              <h2 className="mt-1 truncate text-lg font-bold sm:text-xl">
                {currentTitle}
              </h2>

              <p className="mt-1 text-xs text-white/35">
                {playlistName}
              </p>
            </div>

            {!isLiveMode && videos.length > 0 && (
              <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/45">
                {currentIndex + 1} /{" "}
                {videos.length}
              </div>
            )}
          </div>
        </section>

        {/* ==================================================
            LIVE GAMES
        ================================================== */}

        {liveStreams.length > 0 && (
          <section className="bg-[#05070d] px-4 py-6 sm:px-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />

                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-400">
                    Live Games
                  </p>
                </div>

                <h2 className="mt-1 text-xl font-black tracking-tight">
                  Watch Live
                </h2>
              </div>

              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                {Math.min(
                  liveStreams.length,
                  3,
                )}{" "}
                Live
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveStreams
                .slice(0, 3)
                .map((stream) => {
                  const isSelected =
                    selectedLiveStream?.id ===
                      stream.id &&
                    isLiveMode;

                  return (
                    <button
                      key={stream.id}
                      type="button"
                      onClick={() =>
                        selectLiveStream(stream)
                      }
                      className={`group overflow-hidden rounded-2xl border text-left shadow-xl transition ${
                        isSelected
                          ? "border-red-500/60 bg-red-500/[0.08] shadow-red-950/30"
                          : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="relative aspect-video overflow-hidden bg-[#0b0f18]">
                        {stream.thumbnail_url ? (
                          <img
                            src={stream.thumbnail_url}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#151b29] to-black">
                            <span className="text-4xl">
                              ⚽
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

                        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-red-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-lg">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          Live
                        </div>

                        {isSelected && (
                          <div className="absolute bottom-3 right-3 rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                            Playing
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="truncate font-bold">
                          {stream.title}
                        </h3>

                        {stream.channel_name && (
                          <p className="mt-1 truncate text-xs text-white/40">
                            {stream.channel_name}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-red-400">
                          <span>Watch stream</span>
                          <span>→</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        {/* ==================================================
            UP NEXT
        ================================================== */}

        {!isLiveMode && videos.length > 1 && (
          <section className="border-t border-white/10 bg-[#070a11] px-4 py-6 sm:px-6">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                Up Next
              </p>

              <h2 className="mt-1 text-xl font-black">
                Coming Up
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {videos
                .map((video, index) => ({
                  video,
                  index,
                }))
                .filter(
                  ({ index }) =>
                    index !== currentIndex,
                )
                .slice(0, 3)
                .map(({ video, index }) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => {
                      clearAllTimers();
                      setCurrentIndex(index);
                    }}
                    className="group flex overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] text-left transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <div className="relative h-24 w-36 shrink-0 overflow-hidden bg-[#0b0f18]">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl">
                          ⚽
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
                    </div>

                    <div className="min-w-0 flex-1 p-3">
                      <p className="truncate text-sm font-bold">
                        {video.title}
                      </p>

                      {video.duration_seconds !==
                        null && (
                        <p className="mt-1 text-[11px] text-white/35">
                          {formatTime(
                            video.duration_seconds,
                          )}
                        </p>
                      )}

                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-red-400 opacity-70 transition group-hover:opacity-100">
                        Play next →
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        )}

        {/* ==================================================
            SCHEDULE
        ================================================== */}

        {schedule.length > 0 && (
          <section className="border-t border-white/10 bg-[#05070d] px-4 py-6 pb-10 sm:px-6">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                Schedule
              </p>

              <h2 className="mt-1 text-xl font-black">
                Upcoming Programs
              </h2>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              {schedule.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
                    index !== schedule.length - 1
                      ? "border-b border-white/10"
                      : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-xs font-bold text-white/50">
                      {String(index + 1).padStart(
                        2,
                        "0",
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {item.playlist_name}
                      </p>

                      <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                        Scheduled program
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/50">
                    {formatScheduleTime(
                      item.start_time,
                    )}{" "}
                    –{" "}
                    {formatScheduleTime(
                      item.end_time,
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================================================
            FOOTER BRANDING
        ================================================== */}

        <footer className="border-t border-white/10 bg-[#05070d] px-4 py-5 text-center sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/20">
            {playlistName} • 24/7 Football TV
          </p>
        </footer>
      </div>
    </main>
  );
}