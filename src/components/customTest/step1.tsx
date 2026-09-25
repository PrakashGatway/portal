import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, ListChecks, Hourglass } from "lucide-react";

export default function StepOneSATDetails({
  category,
  durationMinutes,
  setDurationMinutes,
}: any) {
  const [secondAngle, setSecondAngle] = useState(0);

  // Animate the second hand smoothly
  useEffect(() => {
    let frame;
    const tick = () => {
      setSecondAngle((prev) => (prev + 0.1) % 360);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const { hourDeg, minuteDeg } = useMemo(() => {
    const mins = Math.min(180, Math.max(15, durationMinutes));
    return {
      minuteDeg: (mins * 6) % 360,
      hourDeg: (mins * 0.5) % 360,
    };
  }, [durationMinutes]);

  const digitalTime = useMemo(() => {
    const h = Math.floor(durationMinutes / 60);
    const m = durationMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }, [durationMinutes]);

  const clockMarks = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const hour = i + 1;
      const angle = hour * 30;
      return { hour, angle };
    });
  }, []);

  return (
    <div className="">
      {/* SAT Exam Details Card */}
      <div className="grid gap-6 md:grid-cols-2 items-">
        <div className="">
          <div className="flex items-start gap-4">
            <div>
              <h3 className="text-xl font-medium text-slate-800 dark:text-white">
                {category.name}
              </h3>
              <div
                className="text-base text-black dark:text-slate-300 mt-1 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: category.description }}
              />
            </div>
          </div>
        </div>

        {/* Duration Section: Clock + Slider */}
        <div className="grid gap-2 md:grid-cols-1 items-center">
          {/* Clock */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="clock-face">
                {/* Ticks & Numbers */}
                {clockMarks.map(({ hour, angle }) => (
                  <div key={`tick-${hour}`}>
                    {/* Tick */}
                    <div
                      className="clock-tick"
                      style={{ transform: `rotate(${angle}deg)` }}
                    />
                    {/* Number */}
                    <div
                      className="clock-number"
                      style={{ transform: `rotate(${angle}deg)` }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          transform: `rotate(-${angle}deg)`,
                        }}
                      >
                        {hour}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Hands */}
                <div
                  className="hand hour-hand"
                  style={{ transform: `rotate(${hourDeg}deg)` }}
                />
                <div
                  className="hand minute-hand"
                  style={{ transform: `rotate(${minuteDeg}deg)` }}
                />
                <div
                  className="hand second-hand"
                  style={{ transform: `rotate(${secondAngle}deg)` }}
                />
                <div className="clock-center" />
              </div>
            </div>

            {/* Digital time & duration label */}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-2xl font-mono font-bold tracking-wider text-black dark:text-white">
                {digitalTime}
              </span>
              <span className="text-xs font-medium bg-orange-100 text-orange-700 px-3 py-1 rounded-full dark:bg-orange-500/20 dark:text-orange-300">
                <Hourglass size={11} className="inline mr-1" /> duration
              </span>
            </div>
          </div>

          {/* Slider card */}
          <div className="min-w-md mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div>
                <div className="text-xs font-medium text-black dark:text-slate-400">
                  Set Duration
                </div>
                <div className="text-lg font-bold text-slate-800 dark:text-white">
                  {durationMinutes} minutes
                </div>
              </div>
            </div>

            <input
              type="range"
              min={15}
              max={120}
              step={5}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-orange-500"
              style={{ accentColor: "#f97316" }}
            />

            {/* <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>15m</span>
            <span>60m</span>
            <span>120m</span>
          </div> */}
          </div>
        </div>
      </div>

      {/* Scoped CSS for clock — put this in your global styles or a styled-jsx block */}
      <style jsx>{`
        .clock-face {
          position: relative;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: #f8fafc;
          box-shadow:
            0 12px 30px -8px rgba(0, 0, 0, 0.15),
            inset 0 2px 6px rgba(255, 255, 255, 0.8),
            inset 0 -3px 8px rgba(0, 0, 0, 0.05);
          border: 6px solid #ffffff;
        }
        :global(.dark) .clock-face {
          background: #1e293b;
          border-color: #334155;
          box-shadow:
            0 12px 30px -8px rgba(0, 0, 0, 0.6),
            inset 0 2px 6px rgba(255, 255, 255, 0.1);
        }
        .clock-center {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 12px;
          height: 12px;
          background: #f97316;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.3);
          z-index: 5;
        }
        .hand {
          position: absolute;
          bottom: 50%;
          left: 50%;
          transform-origin: bottom center;
          border-radius: 999px;
          background: #1e293b;
        }
        :global(.dark) .hand {
          background: #e2e8f0;
        }
        .hour-hand {
          width: 6px;
          height: 40px;
          margin-left: -3px;
          background: #334155;
          z-index: 3;
        }
        :global(.dark) .hour-hand {
          background: #cbd5e1;
        }
        .minute-hand {
          width: 4px;
          height: 58px;
          margin-left: -2px;
          background: #475569;
          z-index: 2;
        }
        :global(.dark) .minute-hand {
          background: #94a3b8;
        }
        .second-hand {
          width: 2px;
          height: 68px;
          margin-left: -1px;
          background: #f97316;
          z-index: 1;
        }
        .clock-tick {
          position: absolute;
          width: 4px;
          height: 8px;
          background: #cbd5e1;
          border-radius: 2px;
          top: 5px;
          left: 49%;
          transform-origin: 50% 70px;
        }
        :global(.dark) .clock-tick {
          background: #475569;
        }
        .clock-number {
          position: absolute;
          font-size: 0px;
          font-weight: 600;
          color: #1e293b;
          width: 24px;
          text-align: center;
          top: 6px;
          left: 50%;
          transform-origin: 50% 74px;
        }
        :global(.dark) .clock-number {
          color: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
