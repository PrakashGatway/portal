import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Maximize, Minimize, Pause, Play, RotateCcw, Settings, SkipForward, Volume2, VolumeX } from "lucide-react"

// Minimal typings to avoid adding a new dependency
declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve()

    const existing = document.getElementById("youtube-iframe-api")
    if (existing) {
      // Wait until it's ready
      const check = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(check)
          resolve()
        }
      }, 50)
      return
    }

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    tag.id = "youtube-iframe-api"
    document.body.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => resolve()
  })
}

const qualityOrder: Record<string, number> = {
  tiny: 1,      // 144p
  small: 2,     // 240p
  medium: 3,    // 360p
  large: 4,     // 480p
  hd720: 5,     // 720p
  hd1080: 6,    // 1080p
  highres: 7,   // max
  default: 0,   // fallback
  auto: 0       // for live
};

interface VideoPlayerProps {
  videoId: string
  title?: string
}

const CustomButton = ({
  children,
  onClick,
  className = "",
  disabled = false,
  "aria-label": ariaLabel,
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  "aria-label"?: string
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    {...props}
  >
    {children}
  </button>
)

const CustomSlider = ({
  value,
  max = 100,
  step = 1,
  onValueChange,
  className = "",
  "aria-label": ariaLabel,
}: {
  value: number[]
  max?: number
  step?: number
  onValueChange: (value: number[]) => void
  className?: string
  "aria-label"?: string
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([Number(e.target.value)])
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="range"
        min="0"
        max={max}
        step={step}
        value={value[0] || 0}
        onChange={handleChange}
        aria-label={ariaLabel}
        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider-thumb"
      />
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .ytp-chrome-top{
          display: none!important;
        }
        .ytp-pause-overlay-container{
          display:none!important;
        }
        .ytp-watermark{
          display: none!important;
        }
      `}</style>
    </div>
  )
}

const CustomDropdown = ({
  trigger,
  children,
  align = "end",
}: {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "end"
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={`absolute bottom-full mb-2 min-w-[160px] sm:min-w-[200px] bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 shadow-xl rounded-xl z-50 ${align === "end" ? "right-0" : "left-0"
            }`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

const CustomDropdownItem = ({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) => (
  <div
    onClick={onClick}
    className="px-3 py-2 sm:px-4 sm:py-3 text-white hover:bg-white/10 cursor-pointer transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl text-sm sm:text-base"
  >
    {children}
  </div>
)

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId = "hGgvvnyd388" }) => {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [availableRates, setAvailableRates] = useState<number[]>([1])
  const [availableQualities, setAvailableQualities] = useState<string[]>(["default"])
  const [selectedQuality, setSelectedQuality] = useState<string>("default")
  const [showControls, setShowControls] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isLiveStream, setIsLiveStream] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>()

  const isLive = useMemo(() => duration === 0, [duration])
  const playedPercent = useMemo(() => (duration > 0 ? (currentTime / duration) * 100 : 0), [currentTime, duration])

  useEffect(() => {
    let destroyed = false

    async function init() {
      await loadYouTubeAPI()
      if (destroyed) return

      if (!playerContainerRef.current) return;

      const shadow1 = playerContainerRef.current.attachShadow({ mode: "open" });
      const div1 = document.createElement("div");
      div1.style.width = "100%";
      div1.style.height = "100%";
      shadow1.appendChild(div1);

      // Second layer
      const shadow2 = div1.attachShadow({ mode: "open" });
      const div2 = document.createElement("div");
      div2.style.width = "100%";
      div2.style.height = "100%";
      shadow2.appendChild(div2);

      // Third layer (where YouTube player goes)
      const shadow3 = div2.attachShadow({ mode: "open" });
      const wrapper = document.createElement("div");
      wrapper.style.width = "100%";
      wrapper.style.height = "100%";
      shadow3.appendChild(wrapper);


      playerRef.current = new window.YT.Player(wrapper, {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 0,
          cc_load_policy: 0,
          iv_load_policy: 3,
          disablekb: 1,
          showinfo: 0,
          autohide: 1,
          wmode: "transparent",
          origin: window.location.origin,
          // Additional parameters to remove YouTube branding and suggestions
          color: "white",
          theme: "dark",
          annotations: 0,
          endscreen: 0,
          branding: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            setIsReady(true)
            try {
              const vol = playerRef.current.getVolume?.() ?? 100
              setVolume((vol as number) / 100)
              setMuted(!!playerRef.current.isMuted?.())

              const d = playerRef.current.getDuration?.() ?? 0
              setDuration(d)

              setIsLiveStream(d === 0);

              const rates = playerRef.current.getAvailablePlaybackRates?.() ?? [1]
              setAvailableRates(rates)

              setTimeout(() => {
                const qs = playerRef.current?.getAvailableQualityLevels?.() ?? [];
                setAvailableQualities(qs.length ? qs : ["default"]);
              }, 2000);
              // Set initial quality
              const currentQ = playerRef.current.getPlaybackQuality?.() ?? "default"
              setSelectedQuality(currentQ)
            } catch (e) {
              console.error("Error getting player info:", e)
            }

            // Poll progress
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = setInterval(() => {
              try {
                const d = playerRef.current.getDuration?.() ?? 0
                setDuration(d)
                const t = playerRef.current.getCurrentTime?.() ?? 0
                setCurrentTime(t)
              } catch { }
            }, 250)
          },
          onStateChange: (e: any) => {
            const qs = playerRef.current?.getAvailableQualityLevels?.() ?? [];
            setAvailableQualities(qs.length ? qs : ["default"]);
            setPlaying(e?.data === 1)
          },
          onPlaybackRateChange: () => {
            try {
              const r = playerRef.current.getPlaybackRate?.() ?? 1
              setPlaybackRate(r)
            } catch { }
          },
          onPlaybackQualityChange: () => {
            try {
              const q = playerRef.current.getPlaybackQuality?.() ?? "default"
              setSelectedQuality(q)
              console.log("Quality changed to:", q)
            } catch { }
          },
          onError: (e: any) => {
            console.error("YouTube Player error", e)
          },
        },
      })
    }

    init()

    return () => {
      destroyed = true
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      try {
        playerRef.current?.destroy?.()
      } catch { }
    }
  }, [videoId])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const hideControlsSoon = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 2500)
  }

  useEffect(() => {
    hideControlsSoon()
    return () => controlsTimeoutRef.current && clearTimeout(controlsTimeoutRef.current)
  }, [playing])

  // Controls handlers
  const handlePlayPause = () => {
    try {
      if (!playerRef.current) return
      if (playing) {
        playerRef.current.pauseVideo?.()
      } else {
        playerRef.current.playVideo?.()
      }
    } catch (e) {
      console.error("Error toggling play/pause:", e)
    }
  }

  const handleSeek = (value: number[]) => {
    if (!playerRef.current || duration <= 0) return
    const pct = value[0] / 100
    const seconds = pct * duration
    try {
      playerRef.current.seekTo?.(seconds, true)
    } catch (e) {
      console.error("Error seeking:", e)
    }
  }

  const handleSkip = (seconds: number) => {
    if (!playerRef.current || duration <= 0) return
    try {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      playerRef.current.seekTo?.(newTime, true)
    } catch (e) {
      console.error("Error skipping:", e)
    }
  }

  const handleVolume = (value: number[]) => {
    const vol = value[0] / 100
    setVolume(vol)
    try {
      playerRef.current?.setVolume?.(Math.round(vol * 100))
      if (vol === 0) {
        playerRef.current?.mute?.()
        setMuted(true)
      } else {
        playerRef.current?.unMute?.()
        setMuted(false)
      }
    } catch (e) {
      console.error("Error setting volume:", e)
    }
  }

  const handleMute = () => {
    try {
      if (!playerRef.current) return
      if (muted) {
        playerRef.current.unMute?.()
        setMuted(false)
      } else {
        playerRef.current.mute?.()
        setMuted(true)
      }
    } catch (e) {
      console.error("Error toggling mute:", e)
    }
  }

  const handleRate = (rate: number) => {
    try {
      playerRef.current?.setPlaybackRate?.(rate)
      setPlaybackRate(rate)
      console.log("Playback rate set to:", rate)
    } catch (e) {
      console.error("Error setting playback rate:", e)
    }
  }

  const handleQuality = (q: string) => {
    try {
      // 🚀 Try to lock quality range first
      playerRef.current?.setPlaybackQualityRange?.(q, q);
      playerRef.current?.setPlaybackQuality?.(q);

      setSelectedQuality(q);

      // 🔄 Re-check after a short delay and re-apply if YouTube downgraded
      setTimeout(() => {
        try {
          const actualQuality = playerRef.current?.getPlaybackQuality?.();
          if (actualQuality && actualQuality !== q) {
            // force it again
            playerRef.current?.setPlaybackQualityRange?.(q, q);
            playerRef.current?.setPlaybackQuality?.(q);
            setSelectedQuality(actualQuality); // update UI with what YouTube really applied
          }
        } catch (error) {
          console.error("Error verifying quality:", error);
        }
      }, 1000);
    } catch (e) {
      console.error("Error setting quality:", e);
    }
  };


  const handleFullscreen = async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setFullscreen(true)
      } else {
        await document.exitFullscreen()
        setFullscreen(false)
      }
    } catch (e) {
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  // Responsive design helpers
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;

  return (
    <div
      ref={containerRef}
      className={`relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700/20 ${fullscreen ? "fixed inset-0 z-50 rounded-none" : "w-full"
        }`}
      onMouseMove={() => {
        setShowControls(true)
        hideControlsSoon()
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .ytp-chrome-top{
          display: none!important;
        }
        .ytp-pause-overlay-container{
          display:none!important;
        }
        .ytp-watermark{
          display: none!important;
        }
      `}</style>

      {/* {title && !fullscreen && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm p-4 sm:p-6 border-b border-gray-700/30">
          <h1 className="text-lg sm:text-xl font-bold text-white truncate tracking-tight">{title}</h1>
        </div>
      )} */}

      <div className="relative aspect-video bg-black">
        <div ref={playerContainerRef} className="absolute inset-0 w-full h-full" style={{ background: "black" }} />

        {/* Add this overlay for when video is paused/not playing */}
        {(!playing || !isReady) && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)"
            }}
          />
        )}

        <div
          className={`absolute inset-0 transition-all duration-500 ease-out ${showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          style={{
            background: showControls
              ? "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.3) 60%, transparent 100%)"
              : "transparent",
          }}
        >
          {isLive && (
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs sm:text-sm font-bold tracking-wide flex items-center space-x-1 sm:space-x-2 shadow-lg backdrop-blur-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          )}

          {!playing && isReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <CustomButton
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 border-2 border-white/20 shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                onClick={handlePlayPause}
                aria-label="Play video"
              >
                <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-0.5 sm:ml-1" fill="white" />
              </CustomButton>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 space-y-3 sm:space-y-4">
            {(
              <div className="space-y-1 sm:space-y-2">
                <div className="relative">
                  <CustomSlider
                    value={[playedPercent]}
                    max={100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="w-full cursor-pointer"
                    aria-label="Seek"
                  />
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-white/90 font-medium">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <CustomButton
                  className="hover:bg-white/20 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200 hover:scale-105"
                  onClick={handlePlayPause}
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <Pause className="w-5 h-5 sm:w-6 sm:h-6" fill="white" />
                  ) : (
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" fill="white" />
                  )}
                </CustomButton>

                {!isMobile && (
                  <>
                    <CustomButton
                      className="hover:bg-white/20 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full disabled:opacity-50 transition-all duration-200 hover:scale-105"
                      onClick={() => handleSkip(-10)}
                      disabled={isLive}
                      aria-label="Back 10 seconds"
                    >
                      <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                    </CustomButton>

                    <CustomButton
                      className="hover:bg-white/20 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full disabled:opacity-50 transition-all duration-200 hover:scale-105"
                      onClick={() => handleSkip(10)}
                      disabled={isLive}
                      aria-label="Forward 10 seconds"
                    >
                      <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />
                    </CustomButton>
                  </>
                )}

                <div className="flex items-center space-x-2 sm:space-x-3 group">
                  <CustomButton
                    className="hover:bg-white/20 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-200 hover:scale-105"
                    onClick={handleMute}
                    aria-label={muted ? "Unmute" : "Mute"}
                  >
                    {muted || volume === 0 ? <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                  </CustomButton>
                  {!isMobile && (
                    <div className="w-0 group-hover:w-16 sm:group-hover:w-24 transition-all duration-300 overflow-hidden">
                      <CustomSlider
                        value={[muted ? 0 : volume * 100]}
                        max={100}
                        step={1}
                        onValueChange={handleVolume}
                        className="cursor-pointer"
                        aria-label="Volume"
                      />
                    </div>
                  )}
                </div>

                {isReady && isLiveStream && (
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isLiveStream ? 'bg-red-500 animate-pulse' : 'bg-green-500'} shadow-lg`}
                      title={isLiveStream ? "🔴 Live Stream" : "🟢 On-Demand Playback"}
                    />
                    <CustomButton
                      className="hover:bg-white/20 text-white text-[10px] sm:text-xs font-medium px-2 py-1 sm:px-3 sm:py-1 rounded-md transition-all duration-200 hover:scale-105 bg-red-500/20 border border-red-500/30"
                      onClick={() => {
                        try {
                          const d = playerRef.current?.getDuration?.() ?? 0
                          playerRef.current?.seekTo?.(d + 60, true)
                        } catch (e) {
                          console.error("Error seeking to live position:", e)
                        }
                      }}
                      aria-label="Jump to live"
                    >
                      Go Live
                    </CustomButton>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3">
                {!isMobile && (
                  <CustomDropdown
                    trigger={
                      <CustomButton
                        className="hover:bg-white/20 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-105 bg-gray-800/90 backdrop-blur-sm border border-white/20"
                        aria-label="Playback speed"
                      >
                        {playbackRate}x
                      </CustomButton>
                    }
                  >
                    {(availableRates?.length ? availableRates : [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]).map((rate) => (
                      <CustomDropdownItem key={rate} onClick={() => handleRate(rate)}>
                        <span className="flex items-center justify-between w-full">
                          {rate}x {rate === playbackRate && <span className="text-blue-400">✓</span>}
                        </span>
                      </CustomDropdownItem>
                    ))}
                  </CustomDropdown>
                )}

                {!isTablet && (
                  <CustomDropdown
                    trigger={
                      <CustomButton
                        className="hover:bg-white/20 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-200 hover:scale-105 bg-gray-800/90 backdrop-blur-sm border border-white/20"
                        aria-label="Quality settings"
                      >
                        <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                      </CustomButton>
                    }
                  >
                    <div className="px-3 py-2 sm:px-4 sm:py-3 text-sm font-semibold text-white border-b border-gray-700/30">
                      Video Quality
                    </div>
                    {(availableQualities?.length ? availableQualities : ["default"])
                      .filter((q) => q && q.trim() !== "" && q in qualityOrder)
                      .sort((a, b) => (qualityOrder[b] ?? 0) - (qualityOrder[a] ?? 0))
                      .map((q) => (
                        <CustomDropdownItem key={q} onClick={() => handleQuality(q)}>
                          <span className="flex items-center justify-between w-full">
                            <span className="font-medium">
                              {q === "tiny" && "144p"}
                              {q === "small" && "240p"}
                              {q === "medium" && "360p"}
                              {q === "large" && "480p"}
                              {q === "hd720" && "720p"}
                              {q === "hd1080" && "1080p"}
                              {q === "highres" && "Best"}
                              {q === "default" && "Auto"}
                              {q === "auto" && "Auto"}
                            </span>
                            {q === selectedQuality && (
                              <span className="text-blue-400 font-bold">✓</span>
                            )}
                          </span>
                        </CustomDropdownItem>
                      ))}
                  </CustomDropdown>
                )}

                <CustomButton
                  className="hover:bg-white/20 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-200 hover:scale-105"
                  onClick={handleFullscreen}
                  aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {fullscreen ? <Minimize className="w-3 h-3 sm:w-4 sm:h-4" /> : <Maximize className="w-3 h-3 sm:w-4 sm:h-4" />}
                </CustomButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}