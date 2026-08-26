import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { UseBanner } from "../context/BannerContext";
import { useLocation } from "react-router";
import { ImageBaseUrl } from "../axiosInstance";



export function LeftSlider() {
  const [index, setIndex] = useState(0);
  const { banner } = UseBanner();
  const { pathname } = useLocation();

  // Normalize pathname to handle trailing slashes
  const cleanPath = pathname.replace(/\/+$/, '') || '/';

  // Find matching banner safely
  const filterBanner = banner?.find((item) => {
    const dbKey = item.key?.replace(/\/+$/, '') || '/';
    return dbKey === cleanPath;
  });

  // ✅ CORRECTED: Map over the Banners array (not a single Banner object)
  const slides = filterBanner?.Banners?.length > 0
    ? filterBanner.Banners.map((item) => ({
        image: `${ImageBaseUrl}/${item.Banner.file}`,
        alt: item.Banner.alt || 'Banner',
      }))
    : [];

  // Auto-play interval
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((p) => (p + 1) % slides.length);
    }, 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  // Reset index when route changes
  useEffect(() => {
    setIndex(0);
  }, [cleanPath]);

  // Don't render if no banners found
  if (!slides.length) return null;

  return (
    <div className="p-[1.5px] h-full lg:col-span-2 relative overflow-hidden col-span-2 w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/50 to-[#686868] rounded-2xl">
      <div className="w-full relative overflow-hidden h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="h-full flex items-center"
          >
            <div className="h-[90px] sm:h-[140px] md:h-[150px] lg:h-[240px] w-full">
              <img
                className="h-full w-full object-cover rounded-2xl"
                src={slides[index].image}
                alt={slides[index].alt}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function RightOffer({ content }) {
    return (
        <div  className="p-[1.5px] rounded-4xl hidden lg:block h-full relative overflow-hidden w-full bg-gradient-to-b from-[#686868]/0 via-[#686868]/60 to-[#686868]">
            <div  className="flex rounded-4xl items-center h-full w-full justify-between overflow-hidden p-6 bg-gradient-to-r from-[#EBEBEB] via-[#ffffff] to-[#EBEBEB]">
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
