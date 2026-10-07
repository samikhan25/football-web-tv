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
  embedMode?: boolean;
};

const NEXT_VIDEO_DELAY = 800;
const STALL_RECOVERY_DELAY = 4000;
const ERROR_RECOVERY_DELAY = 5000;

function clearTimer(
  timerRef: MutableRefObject<number | null>,
) {
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
  const trackedLiveStreamIdRef =
    useRef<string | null>(null);

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
  const [autoplayBlocked, setAutoplayBlocked] =
    useState(false);

  const currentVideo = videos[currentIndex] ?? null;

  const trackVideoView = useCallback(
    async (videoId: string) => {
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
      } catch {
        // Analytics failure must never interrupt playback.
      }
    },
    [],
  );

  const trackLiveView = useCallback(
    async (livestreamId: string) => {
      if (
        trackedLiveStreamIdRef.current === livestreamId
      ) {
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
      } catch {
        // Analytics failure must never interrupt playback.
      }
    },
    [],
  );

  const clearAllTimers = useCallback(() => {
    clearTimer(errorTimerRef);
    clearTimer(stallTimerRef);
    clearTimer(nextTimerRef);
  }, []);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {
        // Ignore HLS cleanup errors.
      }

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
        currentElement.readyState >=
          HTMLMediaElement.HAVE_CURRENT_DATA
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
      } catch {
        // Allow HLS to recover naturally.
      }

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

        if (
          isLiveMode &&
          source.includes(".m3u8")
        ) {
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

            hls.on(
              Hls.Events.ERROR,
              (_event, data) => {
                if (cancelled) {
                  return;
                }

                if (!data.fatal) {
                  return;
                }

                if (
                  data.type ===
                  Hls.ErrorTypes.NETWORK_ERROR
                ) {
                  try {
                    hls.startLoad();
                  } catch {
                    // Ignore recovery errors.
                  }

                  return;
                }

                if (
                  data.type ===
                  Hls.ErrorTypes.MEDIA_ERROR
                ) {
                  try {
                    hls.recoverMediaError();
                  } catch {
                    // Ignore recovery errors.
                  }

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
              },
            );

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
      } catch {
        // Ignore cleanup errors.
      }
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

  if (!currentVideo && !isLiveMode) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">
              Football TV
            </h1>

            <p className="mt-2 text-sm text-white/60">
              No videos are currently available.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const currentTitle = isLiveMode
    ? selectedLiveStream?.title ?? "Live Game"
    : currentVideo?.title ?? "Football TV";

  const progressValue =
    duration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (currentTime / duration) * 100,
          ),
        )
      : 0;

  return (
    <main
      className={
        embedMode
          ? "min-h-0 w-full bg-black text-white"
          : "min-h-screen bg-black text-white"
      }
    >
      <div
        className={
          embedMode
            ? "w-full"
            : "mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8"
        }
      >
        {!embedMode && (
          <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-red-500" />

                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Football TV
                </h1>
              </div>

              <p className="mt-1 text-sm text-white/50">
                24/7 Football Academy TV
              </p>
            </div>

            {isLiveMode && (
              <button
                type="button"
                onClick={returnToTV}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Back to 24/7 TV
              </button>
            )}
          </header>
        )}

        <section
          className={
            embedMode
              ? "w-full overflow-hidden bg-black"
              : "overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
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

                if (
                  isLiveMode &&
                  selectedLiveStream
                ) {
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

                if (
                  isLiveMode &&
                  selectedLiveStream
                ) {
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

            {isLoading &&
              !hasError &&
              !autoplayBlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                  <div className="rounded-xl bg-black/70 px-5 py-4 text-center backdrop-blur-sm">
                    <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-white/25 border-t-white" />

                    <p className="text-sm font-medium text-white">
                      {isStalled
                        ? "Buffering..."
                        : isLiveMode
                          ? "Connecting to live stream..."
                          : "Loading TV..."}
                    </p>
                  </div>
                </div>
              )}

            {autoplayBlocked && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <div className="rounded-2xl bg-black/80 px-6 py-5 text-center backdrop-blur-sm">
                  <p className="text-sm text-white/70">
                    Playback is ready.
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
                    className="mt-4 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                  >
                    Play
                  </button>
                </div>
              </div>
            )}

            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="max-w-sm px-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                    !
                  </div>

                  <h2 className="mt-4 text-lg font-semibold">
                    {isLiveMode
                      ? "Live stream unavailable"
                      : "Video unavailable"}
                  </h2>

                  <p className="mt-2 text-sm text-white/55">
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
                      className="mt-5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                    >
                      Retry Live Stream
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        resetPlaybackState();

                        const media = videoRef.current;

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
                      className="mt-5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}

            {isLiveMode && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-lg">
                <span className="h-2 w-2 rounded-full bg-white" />
                Live
              </div>
            )}
          </div>

          <div className="border-t border-white/10 bg-zinc-950 px-4 py-3">
            {!isLiveMode && (
              <div className="mb-3">
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
                  className="w-full"
                  style={{
                    background: `linear-gradient(to right, white ${progressValue}%, rgba(255,255,255,0.15) ${progressValue}%)`,
                  }}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
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
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90"
              >
                {isPlaying ? "❚❚" : "▶"}
              </button>

              {!isLiveMode && (
                <span className="min-w-[100px] text-xs tabular-nums text-white/60">
                  {formatTime(currentTime)} /{" "}
                  {formatTime(duration)}
                </span>
              )}

              <div className="ml-auto flex items-center gap-2">
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-sm text-white transition hover:bg-white/10"
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>

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
                      media.muted = nextVolume === 0;
                    }
                  }}
                  className="w-20"
                />

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
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-sm text-white transition hover:bg-white/10"
                >
                  ⛶
                </button>
              </div>
            </div>
          </div>
        </section>

        {embedMode && isLiveMode && (
          <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-zinc-950 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                Live Now
              </p>

              <p className="mt-1 truncate text-sm font-medium text-white">
                {currentTitle}
              </p>
            </div>

            <button
              type="button"
              onClick={returnToTV}
              className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              Back to 24/7 TV
            </button>
          </div>
        )}

        {liveStreams.length > 0 && (
          <section
            className={
              embedMode
                ? "bg-black px-4 py-5 sm:px-6"
                : "mt-6"
            }
          >
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Live Games
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Watch Live
                </h2>
              </div>

              <span className="text-xs text-white/40">
                {Math.min(
                  liveStreams.length,
                  3,
                )}{" "}
                live
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
                      className={`group overflow-hidden rounded-2xl border text-left transition ${
                        isSelected
                          ? "border-red-500/70 bg-red-500/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="relative aspect-video bg-zinc-900">
                        {stream.thumbnail_url ? (
                          <img
                            src={stream.thumbnail_url}
                            alt=""
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
                            <span className="text-3xl">
                              ⚽
                            </span>
                          </div>
                        )}

                        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          Live
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold">
                          {stream.title}
                        </h3>

                        <p className="mt-1 text-xs text-white/45">
                          {stream.channel_name}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        {!embedMode && (
          <>
            <section className="mt-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  {isLiveMode
                    ? "Live Now"
                    : "Now Playing"}
                </p>

                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <h2 className="text-xl font-semibold">
                    {currentTitle}
                  </h2>

                  {!isLiveMode &&
                    videos.length > 0 && (
                      <p className="text-sm text-white/40">
                        {currentIndex + 1} /{" "}
                        {videos.length}
                      </p>
                    )}
                </div>
              </div>
            </section>

            {!isLiveMode &&
              videos.length > 1 && (
                <section className="mt-6">
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      Up Next
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
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
                      .map(
                        ({ video, index }) => (
                          <button
                            key={video.id}
                            type="button"
                            onClick={() => {
                              clearAllTimers();
                              setCurrentIndex(index);
                            }}
                            className="flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] text-left transition hover:border-white/20 hover:bg-white/[0.06]"
                          >
                            <div className="h-20 w-32 shrink-0 bg-zinc-900">
                              {video.thumbnail_url ? (
                                <img
                                  src={
                                    video.thumbnail_url
                                  }
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xl">
                                  ⚽
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 p-3">
                              <p className="truncate text-sm font-medium">
                                {video.title}
                              </p>

                              {video.duration_seconds !==
                                null && (
                                <p className="mt-1 text-xs text-white/40">
                                  {formatTime(
                                    video.duration_seconds,
                                  )}
                                </p>
                              )}
                            </div>
                          </button>
                        ),
                      )}
                  </div>
                </section>
              )}

            {schedule.length > 0 && (
              <section className="mt-6 pb-8">
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                    Schedule
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Upcoming
                  </h2>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  {schedule.map(
                    (item, index) => (
                      <div
                        key={item.id}
                        className={`flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                          index !==
                          schedule.length - 1
                            ? "border-b border-white/10"
                            : ""
                        }`}
                      >
                        <div>
                          <p className="font-medium">
                            {item.playlist_name}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            Scheduled program
                          </p>
                        </div>

                        <div className="text-sm text-white/60">
                          {formatScheduleTime(
                            item.start_time,
                          )}{" "}
                          –{" "}
                          {formatScheduleTime(
                            item.end_time,
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}