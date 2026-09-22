import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { UseBanner } from "../context/BannerContext";
import { useLocation } from "react-router";
import { ImageBaseUrl } from "../axiosInstance";
import { ChevronLeft, ChevronRight } from "lucide-react";



export function LeftSlider() {
  const [index, setIndex] = useState(0);

  // 1 = next, -1 = previous
  const [direction, setDirection] = useState<1 | -1>(1);

  const { banner } = UseBanner();
  const { pathname } = useLocation();

  const cleanPath = pathname.replace(/\/+$/, "") || "/";

  const filterBanner = banner?.find((item) => {
    const dbKey = item.key?.replace(/\/+$/, "") || "/";
    return dbKey === cleanPath;
  });

  const slides =
    filterBanner?.Banners?.length > 0
      ? filterBanner.Banners.map((item) => ({
          image: `${ImageBaseUrl}/${item.Banner.file}`,
          alt: item.Banner.alt || "Banner",
        }))
      : [];

  // -------------------------
  // NEXT
  // -------------------------
  const goToNext = () => {
    if (slides.length <= 1) return;

    setDirection(1);

    setIndex((prev) => {
      if (prev >= slides.length - 1) {
        return 0;
      }

      return prev + 1;
    });
  };

  // -------------------------
  // PREVIOUS
  // -------------------------
  const goToPrevious = () => {
    if (slides.length <= 1) return;

    setDirection(-1);

    setIndex((prev) => {
      if (prev <= 0) {
        return slides.length - 1;
      }

      return prev - 1;
    });
  };

  // Reset when route changes
  useEffect(() => {
    setIndex(0);
    setDirection(1);
  }, [cleanPath]);

  // Make sure index is valid
  useEffect(() => {
    if (slides.length > 0 && index >= slides.length) {
      setIndex(0);
    }
  }, [slides.length, index]);

  // -------------------------
  // AUTOPLAY
  // -------------------------
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setDirection(1);

      setIndex((prev) => {
        if (prev >= slides.length - 1) {
          return 0;
        }

        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  // -------------------------
  // SLIDE VARIANTS
  // -------------------------
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),

    center: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },

     exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    }),
  };

  return (
    <div className="relative col-span-2 h-full w-full overflow-hidden rounded-3xl bg-gradient-to-b from-[#686868]/0 via-[#686868]/50 to-[#686868] p-[1.5px] lg:col-span-2">
      <div className="relative h-full w-full overflow-hidden rounded-3xl">

        {/* SLIDER */}
        <AnimatePresence
          mode="popLayout"
          initial={false}
          custom={direction}
        >
          <motion.div
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="pointer-events-none h-full w-full"
          >
            <div className="h-[90px] w-full sm:h-[140px] md:h-[150px] lg:h-[240px]">
              <img
                src={slides[index]?.image}
                alt={slides[index]?.alt}
                className="h-full w-full rounded-2xl object-cover"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* NAVIGATION */}
        {slides.length > 1 && (
          <>
            {/* PREVIOUS */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToPrevious();
              }}
              className="
                pointer-events-auto
                absolute left-3 top-1/2 z-50
                flex h-9 w-9
                -translate-y-1/2
                items-center justify-center
                rounded-full
                bg-white/20
                text-white
                backdrop-blur-sm
                transition-all duration-200
                hover:scale-110
                hover:bg-black/70
                active:scale-95
              "
              aria-label="Previous banner"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* NEXT */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToNext();
              }}
              className="
                pointer-events-auto
                absolute right-3 top-1/2 z-50
                flex h-9 w-9
                -translate-y-1/2
                items-center justify-center
                rounded-full
                bg-white/20
                text-white
                backdrop-blur-sm
                transition-all duration-200
                hover:scale-110
                hover:bg-black/70
                active:scale-95
              "
              aria-label="Next banner"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
export function RightOffer({ content }) {
    return (
        <div  className="p-[1.5px] rounded-3xl hidden lg:block h-full relative overflow-hidden w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868]">
            <div  className="flex rounded-3xl items-center h-full w-full justify-between overflow-hidden p-6 bg-gradient-to-r from-[#EBEBEB] via-[#ffffff] to-[#EBEBEB]">
                {!content ? <>
                    <div className="space-y-2 text-[#838383]">
                        <p className="text-xl font-medium">
                            Buy Mock Test Series and  get Flat <span className="font-semibold text-orange-500">50% OFF</span> On Every Test Series
                        </p>
                        {/* <button className="mt-2 inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
          Buy Test
        </button> */}
                    </div>

                    {/* Right Icon */}
                    <div className="flex h-10 w-90 items-center justify-center rounded-full">
                        <img src="https://images.emojiterra.com/google/noto-emoji/unicode-16.0/color/1024px/1f6d2.png" alt="" />
                    </div></> : ""}

            </div>
        </div >

    )
}
