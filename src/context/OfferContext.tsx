"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import api from "../axiosInstance";
import { useAuth } from "./UserContext";

const OfferContext = createContext(null);

export function OfferProvider({ children }) {
  const { user } = useAuth();

  const [showOffer, setShowOffer] = useState(false);
  const [offer, setOffer] = useState(null);

  const firstTimerRef = useRef(null);
  const repeatTimerRef = useRef(null);

  // --------------------------------
  // Fetch Offer
  // --------------------------------
  useEffect(() => {
    // Only normal users can see offers
    if (user?.role !== "user") {
      setOffer(null);
      setShowOffer(false);
      return;
    }

    const fetchOffer = async () => {
      try {
        const res = await api.get("/notification/all");

        if (!res?.data?.success) return;

        const notifications = res?.data?.data || [];
        const userCategoryName = user?.category?.name?.trim()?.toLowerCase();

        if (!userCategoryName) {
          console.log("User category not found");
          return;
        }

        // Find matching active global offer
        const activeOffer = notifications.find((item) => {
          const notificationCategoryName = item?.Category?.name
            ?.trim()
            ?.toLowerCase();

          return (
            item?.isGlobal === true &&
            item?.isActive === true &&
            notificationCategoryName === userCategoryName
          );
        });

        if (activeOffer) {
          setOffer(activeOffer);
        } else {
          setOffer(null);
        }
      } catch (error) {
        console.error("Failed to fetch offer:", error);
      }
    };

    fetchOffer();
  }, [user?.role, user?.category?.name]);

  useEffect(() => {
    if (firstTimerRef.current) {
      clearTimeout(firstTimerRef.current);
    }

    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current);
    }

    if (user?.role !== "user" || !offer) {
      setShowOffer(false);
      return;
    }

    firstTimerRef.current = setTimeout(() => {
      setShowOffer(true);

      // Second offer 30 seconds after first offer
      repeatTimerRef.current = setTimeout(() => {
        setShowOffer(true);
      }, 30000);
    }, 15000);

    return () => {
      if (firstTimerRef.current) {
        clearTimeout(firstTimerRef.current);
      }

      if (repeatTimerRef.current) {
        clearTimeout(repeatTimerRef.current);
      }
    };
  }, [offer, user?.role]);

  // --------------------------------
  // Close
  // --------------------------------
  const closeOffer = () => {
    setShowOffer(false);
  };

  return (
    <OfferContext.Provider
      value={{
        offer,
        showOffer,
        setShowOffer,
        closeOffer,
      }}
    >
      {children}

      {/* Global Offer Popup */}
      {user?.role === "user" && showOffer && offer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-[700px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Close */}
            <button
              onClick={closeOffer}
              className="
                absolute right-3 top-3 z-20
                flex h-8 w-8 items-center justify-center
                rounded-full bg-black/50 text-white
                backdrop-blur-sm
                transition hover:bg-black/70
              "
            >
              <X size={18} />
            </button>

            {offer?.image && (
              <img
                src={offer.image}
                alt={offer?.name || "Special Offer"}
                className="
                  block h-auto w-full
                  max-h-[80vh]
                  object-contain
                "
              />
            )}
          </div>
        </div>
      )}
    </OfferContext.Provider>
  );
}

export function useOffer() {
  const context = useContext(OfferContext);

  if (!context) {
    throw new Error("useOffer must be used inside OfferProvider");
  }

  return context;
}
