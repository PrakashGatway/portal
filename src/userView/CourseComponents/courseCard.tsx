import React from "react";
import { Clock3, Play } from "lucide-react";
import { ImageBaseUrl } from "../../axiosInstance";

interface NextLiveClassCardProps {
  session: any;
  onContinue?: (session: any) => void;
}

const NextLiveClassCard: React.FC<NextLiveClassCardProps> = ({
  session,
  onContinue,
}) => {
  if (!session) return null;

  console.log("NextLiveClassCard session:", session);

  const formatDate = (date?: string) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatTime = (date?: string) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const thumbnail = session?.thumbnailPic
    ? `${ImageBaseUrl}/${session.thumbnailPic}`
    : session?.thumbnailPic
      ? `${ImageBaseUrl}/${session.thumbnailPic}`
      : "https://dpcpa.com/app/uploads/2015/01/thumbnail-default.jpg";

  return (
    <div
      className="
        w-full
        max-w-full
        rounded-[17px]
        border
        border-[#FF805C]
        bg-white
        px-[18px]
        pt-[17px]
        pb-[18px]
      "
    >
      {/* NEXT UP */}
      <p
        className="
          mb-[9px]
          text-[12px]
          font-medium
          uppercase
          tracking-[0.2px]
          text-[#777777]
        "
      >
        NEXT UP
      </p>

      {/* Content */}
      <div className="flex items-center gap-[12px]">
        {/* Thumbnail */}
        <div className="relative h-[60px] w-[100px] flex-shrink-0 overflow-hidden rounded-[7px]">
          <img
            src={thumbnail}
            alt={session?.title || "Live Class"}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://dpcpa.com/app/uploads/2015/01/thumbnail-default.jpg";
            }}
          />
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <h3
            className="
              line-clamp-2
              text-[14px]
              font-semibold
              leading-[17px]
              text-[#111111]
            "
          >
            {session?.title || "Live Class"}
          </h3>

          <div className="mt-[5px] flex items-center gap-[4px] whitespace-nowrap">
            <span className="text-[10px] font-medium text-[#F04F23]">
              {session.type}
            </span>

            <span className="text-[10px] text-[#999999]">•</span>

            {session?.duration && (
              <>
                <span className="flex items-center gap-[2px] text-[10px] text-[#777777]">
                  <Clock3 size={9} />
                  {session.duration}
                </span>

                <span className="text-[10px] text-[#999999]">•</span>
              </>
            )}

            <span className="text-[10px] text-[#777777]">
              {formatDate(session?.scheduledStart)}
            </span>
          </div>

          {/* Time */}
          {session?.scheduledStart && (
            <p className="mt-[1px] text-[10px] text-[#777777]">
              {formatTime(session.scheduledStart)}
            </p>
          )}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => onContinue?.(session)}
        className="
          mt-[14px]
          flex
          h-[30px]
          w-full
          items-center
          justify-center
          gap-[4px]
          rounded-[9px]
          bg-[#FF7047]
          text-[12px]
          font-medium
          text-white
          transition-all
          duration-200
          hover:bg-[#F45D32]
          active:scale-[0.98]
        "
      >
        Continue Learning -
      </button>
    </div>
  );
};

export default NextLiveClassCard;