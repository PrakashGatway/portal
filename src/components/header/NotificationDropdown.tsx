"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { X } from "lucide-react";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  const { toggleSound, user } = useAuth() as any;

  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markNotificationAsRead,
    removeNotification,
  } = useTheme();

  const navigate = useNavigate();

  const buttonRef = useRef<HTMLButtonElement>(null);

  const [dropdownCoords, setDropdownCoords] = useState({
    top: 0,
    right: 0,
  });

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleClick = () => {
    if (!isOpen && buttonRef.current) {
      const rect =
        buttonRef.current.getBoundingClientRect();

      setDropdownCoords({
        top: rect.bottom + 12,
        right: Math.max(
          12,
          window.innerWidth - rect.right
        ),
      });
    }

    toggleDropdown();
    setNotifying(false);
  };

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       buttonRef.current &&
  //       !buttonRef.current.contains(
  //         event.target as Node
  //       )
  //     ) {
  //       setIsOpen(false);
  //     }
  //   };

  //   const handleScroll = () => {
  //     setIsOpen(false);
  //   };

  //   if (isOpen) {
  //     document.addEventListener(
  //       "mousedown",
  //       handleClickOutside
  //     );

  //     window.addEventListener(
  //       "scroll",
  //       handleScroll,
  //       true
  //     );
  //   }

  //   return () => {
  //     document.removeEventListener(
  //       "mousedown",
  //       handleClickOutside
  //     );

  //     window.removeEventListener(
  //       "scroll",
  //       handleScroll,
  //       true
  //     );
  //   };
  // }, [isOpen]);

  const handleNotificationClick = async (
    notificationId: string
  ) => {
    await markNotificationAsRead(notificationId);
  };

  const handleRemoveNotification = async (
    notificationId: string
  ) => {
    removeNotification(notificationId);
    await markNotificationAsRead(notificationId);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate("/notifications");
  };

  
    useEffect(() => {
    const handleFcmEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("pokpokpokpokpokdata",customEvent.detail); // Extract the payload
      refreshNotifications();
    };

    // Add listener
    window.addEventListener('fcm-message', handleFcmEvent);

    // Cleanup listener when leaving the page
    return () => window.removeEventListener('fcm-message', handleFcmEvent);
  }, []);

  return (
    <div className="relative" id="notification">
      <button
        ref={buttonRef}
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-200 hover:border-[#FF6A3D]/30 hover:bg-[#FFF7F3] hover:text-[#FF6A3D] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <svg
          className="fill-current"
          width="19"
          height="19"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#FF6A3D] px-1 text-[10px] font-bold text-white dark:border-gray-900">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            className="fixed z-[2147483647]"
            style={{
              top: dropdownCoords.top,
              right: dropdownCoords.right,
              width: "380px",
              maxWidth: "calc(100vw - 24px)",
            }}
          >
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="flex w-full flex-col overflow-auto rounded-2xl border border-gray-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-base font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h5>

                    {notifications.length > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFF1EC] px-1.5 text-[10px] font-bold text-[#FF764B] dark:bg-[#FF764B]/10">
                        {notifications.length}
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs text-gray-400">
                    Stay updated with your latest activity
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleDropdown}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-[#FFF1EC] hover:text-[#FF764B] dark:hover:bg-[#FF764B]/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {notifications.length > 0 && (
                <div className="border-b border-gray-200 bg-gray-50 px-5 py-2.5 dark:border-gray-800 dark:bg-gray-800/40">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Today
                  </span>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center px-5 py-12">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-[#FF764B]" />

                  <p className="mt-3 text-xs text-gray-400">
                    Loading notifications...
                  </p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.filter(ele => !ele.isRead).map(
                    (item, index) => {
                      const notificationId =
                        item._id || item.id;

                      const isUnread =
                        item.isRead === false;

                      return (
                        <div
                          key={
                            notificationId ||
                            index
                          }
                          onClick={() => {
                            if (
                              notificationId &&
                              isUnread
                            ) {
                              handleNotificationClick(
                                notificationId
                              );
                            }
                          }}
                          className={`group relative flex cursor-pointer gap-3 border-b border-gray-100 px-5 py-4 transition-all duration-200 dark:border-gray-800 ${
                            isUnread
                              ? "bg-[#FFF8F5] dark:bg-[#FF764B]/5"
                              : "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/60"
                          }`}
                        >
                          {isUnread && (
                            <span className="absolute left-3 top-[22px] h-2 w-2 rounded-full bg-[#FF764B] shadow-[0_0_0_3px_rgba(255,118,75,0.10)]" />
                          )}

                          <div className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 group-hover:border-[#FFD9CC] group-hover:text-[#FF764B] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:border-[#FF764B]/30 dark:group-hover:text-[#FF764B]">
                            {index % 3 === 0 ? (
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                              </svg>
                            ) : index % 3 ===
                              1 ? (
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="9"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 7v10M9 10h4a2 2 0 010 4H9"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="9"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 7v5l3 2"
                                />
                              </svg>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3 pr-5">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF764B]" />

                                <p
                                  className={`truncate text-sm text-gray-900 dark:text-white ${
                                    isUnread
                                      ? "font-semibold"
                                      : "font-medium"
                                  }`}
                                >
                                  {item.title}
                                </p>

                                {item.priority?.toLowerCase() ===
                                  "high" && (
                                  <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                                    Critical
                                  </span>
                                )}
                              </div>

                              {item.createdAt && (
                                <span className="shrink-0 whitespace-nowrap text-[10px] text-gray-400">
                                  {new Date(
                                    item.createdAt
                                  ).toLocaleString(
                                    "en-IN",
                                    {
                                      hour: "numeric",
                                      minute:
                                        "2-digit",
                                      hour12:
                                        true,
                                    }
                                  )}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 line-clamp-2 text-xs leading-[1.55] text-gray-600 dark:text-gray-400">
                              {item.message}
                            </p>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();

                                if (
                                  notificationId
                                ) {
                                  handleRemoveNotification(
                                    notificationId
                                  );
                                }
                              }}
                              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-[#FFF1EC] hover:text-[#FF764B] dark:hover:bg-[#FF764B]/10"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-5 py-12">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#FFD9CC] bg-[#FFF1EC] text-[#FF764B] dark:border-[#FF764B]/20 dark:bg-[#FF764B]/10">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>

                  <h6 className="mt-3 text-sm font-semibold text-gray-800 dark:text-white">
                    No notifications
                  </h6>

                  <p className="mt-1 text-center text-xs text-gray-400">
                    You're all caught up!
                  </p>
                </div>
              )}

              {notifications.length > 0 && (
                <div className="border-t border-gray-200 bg-white px-5 py-3 dark:border-gray-800 dark:bg-gray-900">
                  <button
                    type="button"
                    className="w-full text-left text-sm font-semibold text-gray-900 transition-colors duration-200 hover:text-[#FF764B] dark:text-white dark:hover:text-[#FF764B]"
                    onClick={handleViewAll}
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </Dropdown>
          </div>,
          document.body
        )}
    </div>
  );
}