// EventCalendar.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import api from "../axiosInstance";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Video,
  BookOpen,
  Award,
  MessageCircle,
  MoreVertical,
  X,
  Trash2,
  Edit2,
} from "lucide-react";
import { useAuth } from "../context/UserContext";
import { createPortal } from "react-dom";

const localizer = momentLocalizer(moment);

const EventCalendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState(new Date());
  const [eventEnd, setEventEnd] = useState(new Date());
  const [eventDescription, setEventDescription] = useState("");
  const [eventCategory, setEventCategory] = useState("session");
  const [eventInstructor, setEventInstructor] = useState("");

  const colorMap = {
    session: {
      bg: "#fff7ed",
      text: "#c2410c",
      border: "#f97316",
      gradient: "from-orange-400 to-orange-600",
      label: "Session",
      icon: Video,
    },
    liveClass: {
      bg: "#ffedd5",
      text: "#9a3412",
      border: "#ea580c",
      gradient: "from-orange-500 to-red-500",
      label: "Live Class",
      icon: BookOpen,
    },
    speaking: {
      bg: "#fef3c7",
      text: "#b45309",
      border: "#f59e0b",
      gradient: "from-amber-400 to-orange-500",
      label: "Speaking",
      icon: MessageCircle,
    },
    skills: {
      bg: "#ffedd5",
      text: "#c2410c",
      border: "#fb923c",
      gradient: "from-orange-400 to-amber-500",
      label: "Skills",
      icon: Award,
    },
    custom: {
      bg: "#fff7ed",
      text: "#9a3412",
      border: "#f97316",
      gradient: "from-orange-300 to-orange-500",
      label: "Custom",
      icon: CalendarIcon,
    },
  };

  useEffect(() => {
    const fetchEventsFromApi = async () => {
      try {
        setLoading(true);
        const response = await api.get("/content/schedule");
        if (response.data && response.data.data) {
          const mappedEvents = response.data.data.map((item) => {
            let category = "session";
            if (item.contentType?.toLowerCase().includes("liveclass"))
              category = "liveClass";
            else if (item.type?.toLowerCase().includes("speaking"))
              category = "speaking";
            else if (item.contentType?.toLowerCase().includes("skills"))
              category = "skills";
            const colors = colorMap[category] || colorMap.custom;
            return {
              id: item._id,
              title: item.title,
              start: new Date(item.scheduledStart),
              end: new Date(item.scheduledEnd),
              instructor: item.instructor,
              category,
              contentType: item.contentType,
              slug: item.slug,
              status: item.status,
              color: colors.bg,
              textColor: colors.text,
              borderColor: colors.border,
              gradient: colors.gradient,
              icon: colors.icon,
            };
          });
          setEvents(mappedEvents);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventsFromApi();
  }, []);

  // Navigation Logic
  const navigatePrev = () => {
    const newDate = moment(date).clone();
    if (view === Views.MONTH) newDate.subtract(1, "month");
    else if (view === Views.WEEK) newDate.subtract(1, "week");
    else if (view === Views.DAY) newDate.subtract(1, "day");
    setDate(newDate.toDate());
  };

  const navigateNext = () => {
    const newDate = moment(date).clone();
    if (view === Views.MONTH) newDate.add(1, "month");
    else if (view === Views.WEEK) newDate.add(1, "week");
    else if (view === Views.DAY) newDate.add(1, "day");
    setDate(newDate.toDate());
  };

  const navigateToday = () => setDate(new Date());

  const handleSelectSlot = useCallback(
    (slotInfo) => {
      if (user.role !== "admin") return;
      setSelectedSlot(slotInfo);
      setEditingEvent(null);
      setViewingEvent(null);
      setEventTitle("");
      setEventDescription("");
      setEventInstructor("");
      setEventCategory("session");
      setEventStart(slotInfo.start);
      setEventEnd(
        slotInfo.end || new Date(slotInfo.start.getTime() + 60 * 60 * 1000),
      );
      setShowEventModal(true);
    },
    [user.role],
  );

  const handleSelectEvent = useCallback(
    (event) => {
      // Find all events that happen on the same calendar day as the clicked event
      const eventDate = moment(event.start).format("YYYY-MM-DD");

      const allEventsOnSameDay = events
        .filter((e) => moment(e.start).format("YYYY-MM-DD") === eventDate)
        .sort((a, b) => a.start - b.start); // Sort by time

      // We attach this list to the viewingEvent object so the modal can access it
      // We keep the original 'event' as the primary one for header purposes if needed,
      // but we add a property 'siblings' or similar.

      setViewingEvent({
        ...event,
        siblings: allEventsOnSameDay, // Store the full list here
      });

      setEditingEvent(null);
      setShowEventModal(true);
    },
    [events],
  ); // Added 'events' to dependency array

  const handleEditEvent = (event) => {
    if (user.role !== "admin") return;
    setEditingEvent(event);
    setViewingEvent(null);
    setEventTitle(event.title);
    setEventStart(event.start);
    setEventEnd(event.end);
    setEventDescription(event.instructor?.name || "");
    setEventInstructor(event.instructor?.name || "");
    setEventCategory(event.category || "session");
    setShowEventModal(true);
  };

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) return alert("Please enter an event title");
    if (eventEnd <= eventStart)
      return alert("End time must be after start time");
    const colors = colorMap[eventCategory] || colorMap.custom;
    const eventData = {
      id: editingEvent ? editingEvent.id : Date.now(),
      title: eventTitle,
      start: eventStart,
      end: eventEnd,
      instructor: { name: eventInstructor },
      category: eventCategory,
      color: colors.bg,
      textColor: colors.text,
      borderColor: colors.border,
      gradient: colors.gradient,
    };
    if (editingEvent)
      setEvents(
        events.map((ev) => (ev.id === editingEvent.id ? eventData : ev)),
      );
    else setEvents([...events, eventData]);
    setShowEventModal(false);
    resetForm();
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm("Are you sure?")) {
      setEvents(events.filter((ev) => ev.id !== eventId));
      setShowEventModal(false);
    }
  };

  const resetForm = () => {
    setEventTitle("");
    setEventDescription("");
    setEventInstructor("");
    setEventCategory("session");
    setEditingEvent(null);
    setViewingEvent(null);
  };
  const handleViewChange = (newView) => setView(newView);
  const handleNavigate = (newDate) => setDate(newDate);

  // Styling Getters
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: "transparent",
      border: "none",
      borderRadius: "6px",
      padding: "2px 6px",
    },
  });

  const dayPropGetter = (calendarDate) => {
    const today = new Date();
    const isToday =
      calendarDate.getDate() === today.getDate() &&
      calendarDate.getMonth() === today.getMonth() &&
      calendarDate.getFullYear() === today.getFullYear();
    const isCurrentMonth = calendarDate.getMonth() === date.getMonth();

    const firstDayOfMonth = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth(),
      1,
    );
    const firstDayWeekday = firstDayOfMonth.getDay();
    const dateDay = calendarDate.getDate();
    const rowIndex = Math.floor((firstDayWeekday + dateDay - 1) / 7);

    const rowColors = [
      "#fdf3e7",
      "#FDEDD3",
      "#fde3c2",
      "#ffd5ad",
      "#fed9c9",
      "#fed9c9",
    ];
    const bgColor = isCurrentMonth
      ? rowColors[Math.min(rowIndex, 5)]
      : "#FEF7EF";

    return {
      className: `rbc-day-bg-custom ${isToday ? "rbc-today-custom" : ""}`,
      style: {
        backgroundColor: isToday ? "#fff" : bgColor,
        borderRadius: "16px",
        margin: "4px",
        border: isToday ? "2px solid #FB923C" : "1px solid transparent",
        opacity: isCurrentMonth ? 1 : 0.6,
      },
    };
  };


  const CustomMonthEvent = ({ event }) => {
  const sameDateEvents = event.sameDateEvents || [event];

  const [showPopup, setShowPopup] = useState(false);

  const [popupPosition, setPopupPosition] = useState({
    left: 0,
    top: 0,
  });

  const updatePopupPosition = (e) => {
    const popupWidth = window.innerWidth <= 767 ? 260 : 290;
    const popupHeight = window.innerWidth <= 767 ? 200 : 220;

    const offset = window.innerWidth <= 767 ? 12 : 20;

    let left = e.clientX + offset;
    let top = e.clientY + offset;

    /*
     * -----------------------------------------
     * RIGHT EDGE
     * -----------------------------------------
     */
    if (left + popupWidth > window.innerWidth - 10) {
      left = e.clientX - popupWidth - offset;
    }

    /*
     * If still outside left edge
     */
    if (left < 10) {
      left = 10;
    }

    /*
     * -----------------------------------------
     * BOTTOM EDGE
     * -----------------------------------------
     */
    if (top + popupHeight > window.innerHeight - 10) {
      top = e.clientY - popupHeight - offset;
    }

    /*
     * If popup would go above viewport,
     * keep it at minimum 10px.
     */
    if (top < 10) {
      top = 10;
    }

    setPopupPosition({
      left,
      top,
    });
  };

  return (
    <>
      {/* =========================================
          CALENDAR EVENT
      ========================================= */}
      <div
        className="relative w-full"
        onMouseEnter={(e) => {
          if (sameDateEvents.length > 1) {
            updatePopupPosition(e);
            setShowPopup(true);
          }
        }}
        onMouseMove={(e) => {
          if (sameDateEvents.length > 1) {
            updatePopupPosition(e);
          }
        }}
        onMouseLeave={() => {
          setShowPopup(false);
        }}
      >
        <div
          className="
            bg-white/90
            backdrop-blur-sm
            border border-orange-200
            text-orange-800
            text-[10px]
            font-bold
            px-2
            py-[3px]
            rounded-lg
            shadow-sm
            truncate
            
            w-full
            cursor-pointer
          "
        >
          {event.title}
        </div>
      </div>

      {/* =========================================
          HOVER CARD
      ========================================= */}
      {showPopup &&
        sameDateEvents.length > 1 &&
        createPortal(
          <div
            className="calendar-event-hover-popup"
            style={{
              position: "fixed",
              left: `${popupPosition.left}px`,
              top: `${popupPosition.top}px`,
              zIndex: 2147483647,
              pointerEvents: "none",
            }}
          >
            <div className="calendar-event-popup-date">
              {moment(event.start).format("MMMM DD, YYYY")}
            </div>

            <div className="calendar-event-popup-list">
              {sameDateEvents.map((item) => (
                <div
                  key={item.id}
                  className="calendar-event-popup-item"
                >
                  <div className="calendar-event-popup-title">
                    {item.title}
                  </div>

                  <div className="calendar-event-popup-time">
                    {moment(item.start).format("HH:mm")}
                    {" - "}
                    {moment(item.end).format("HH:mm")}
                  </div>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};


  // const CustomMonthEvent = ({ event }) => {
  //   const sameDateEvents = event.sameDateEvents || [event];

  //   const [showPopup, setShowPopup] = useState(false);

  //   const [popupPosition, setPopupPosition] = useState({
  //     left: 0,
  //     top: 0,
  //   });

  //   const updatePopupPosition = (e) => {
  //     const popupWidth = 290;
  //     const popupHeight = 220;
  //     const offset = 20;

  //     // Always start BELOW + RIGHT of cursor
  //     let left = e.clientX + offset;
  //     let top = e.clientY + offset;

  //     // Keep popup inside right edge
  //     if (left + popupWidth > window.innerWidth - 10) {
  //       left = window.innerWidth - popupWidth - 10;
  //     }

  //     // Keep popup inside left edge
  //     if (left < 10) {
  //       left = 10;
  //     }

  //     // IMPORTANT:
  //     // Keep popup BELOW cursor.
  //     // If there isn't enough room at the bottom,
  //     // place it at the lowest possible position,
  //     // but NEVER above the cursor.
  //     const maxTop = window.innerHeight - popupHeight - 10;

  //     if (top > maxTop) {
  //       top = Math.max(e.clientY + 5, maxTop);
  //     }

  //     // Safety
  //     if (top < 10) {
  //       top = 10;
  //     }

  //     setPopupPosition({
  //       left,
  //       top,
  //     });
  //   };

  //   return (
  //     <>
  //       {/* Calendar Event */}
  //       <div
  //         className="relative w-full"
  //         onMouseEnter={(e) => {
  //           if (sameDateEvents.length > 1) {
  //             updatePopupPosition(e);
  //             setShowPopup(true);
  //           }
  //         }}
  //         onMouseMove={(e) => {
  //           if (sameDateEvents.length > 1) {
  //             updatePopupPosition(e);
  //           }
  //         }}
  //         onMouseLeave={() => {
  //           setShowPopup(false);
  //         }}
  //       >
  //         <div
  //           className="
  //                       bg-white/90
  //                       backdrop-blur-sm
  //                       border border-orange-200
  //                       text-orange-800
  //                       text-[10px]
  //                       font-bold
  //                       px-2
  //                       py-[3px]
  //                       rounded-lg
  //                       shadow-sm
  //                       truncate
  //                       md:w-full
  //                       cursor-pointer
  //                   "
  //         >
  //           {event.title}
  //         </div>
  //       </div>

  //       {/* Hover Card */}
  //       {showPopup &&
  //         sameDateEvents.length > 1 &&
  //         createPortal(
  //           <div
  //             style={{
  //               position: "fixed",
  //               left: `${popupPosition.left}px`,
  //               top: `${popupPosition.top}px`,
  //               zIndex: 2147483647,
  //               pointerEvents: "none",
  //             }}
  //             className="
  //                           w-72
  //                           bg-white
  //                           rounded-xl
  //                           p-3
  //                           border
  //                           border-orange-200
  //                           shadow-2xl
  //                       "
  //           >
  //             <div className="text-xs font-bold text-orange-600 mb-2">
  //               {moment(event.start).format("MMMM DD, YYYY")}
  //             </div>

  //             <div className="space-y-2">
  //               {sameDateEvents.map((item) => (
  //                 <div
  //                   key={item.id}
  //                   className="
  //                                       p-2
  //                                       rounded-lg
  //                                       bg-orange-50
  //                                       hover:bg-orange-100
  //                                   "
  //                 >
  //                   <div className="text-xs font-semibold text-gray-800">
  //                     {item.title}
  //                   </div>

  //                   <div className="text-[10px] text-orange-500 mt-1">
  //                     {moment(item.start).format("HH:mm")}
  //                     {" - "}
  //                     {moment(item.end).format("HH:mm")}
  //                   </div>
  //                 </div>
  //               ))}
  //             </div>
  //           </div>,
  //           document.body,
  //         )}
  //     </>
  //   );
  // };

  const CustomEvent = ({ event }) => (
    <div className="w-full min-w-0 overflow-hidden">
      <div
        className="
                w-full
                min-w-0
                overflow-hidden
                text-ellipsis
                whitespace-nowrap
                text-[11px]
                font-semibold
                text-orange-800
                leading-tight
            "
      >
        {event.title}
      </div>
    </div>
  );

  const filteredEvents = useMemo(() => {
    if (view !== Views.MONTH) {
      return events;
    }

    const grouped = new Map();

    events.forEach((event) => {
      const dateKey = moment(event.start).format("YYYY-MM-DD");

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }

      grouped.get(dateKey).push(event);
    });

    return Array.from(grouped.values()).map((dateEvents) => {
      const sortedEvents = dateEvents.sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );

      const firstEvent = sortedEvents[0];

      return {
        ...firstEvent,

        // Keep ALL events belonging to this date
        sameDateEvents: sortedEvents,
      };
    });
  }, [events, view]);
  const todayEvents = useMemo(
    () =>
      events
        .filter((e) => moment(e.start).isSame(moment(), "day"))
        .sort((a, b) => a.start - b.start),
    [events],
  );
  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => moment(e.start).isAfter(moment()))
        .sort((a, b) => a.start - b.start)
        .slice(0, 5),
    [events],
  );
  const stats = useMemo(
    () => ({
      total: events.length,
      today: todayEvents.length,
      thisWeek: events.filter((e) => moment(e.start).isSame(moment(), "week"))
        .length,
    }),
    [events, todayEvents],
  );

  return (
    <div className="  p-4 md:p-6 flex flex-col gap-4 md:gap-6">
      {/* TOP BAR */}
      <div className="bg-white/80 backdrop-blur-md border border-orange-100 rounded-2xl px-4 md:px-6 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-orange-50 rounded-lg transition-colors lg:hidden"
          >
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center bg-orange-50 rounded-xl p-1">
            <button
              onClick={navigatePrev}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-orange-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-orange-600"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-lg md:text-2xl font-bold text-orange-600 truncate">
            {moment(date).format("MMMM YYYY")}
          </h2>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={navigateToday}
            className="px-3 md:px-5 py-2 text-xs md:text-sm font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 rounded-xl transition-colors"
          >
            Today
          </button>
          <div className="flex bg-orange-50 rounded-xl p-1 border border-orange-100 overflow-x-auto max-w-[200px] md:max-w-none scrollbar-hide">
            {["month", "week", "day", "agenda"].map((v) => (
              <button
                key={v}
                onClick={() => handleViewChange(v)}
                className={`px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all whitespace-nowrap ${view === v ? "bg-white text-orange-600 shadow-sm" : "text-orange-400 hover:text-orange-600"}`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-col xl:flex-row gap-4 md:gap-6 bg-white rounded-3xl p-2 md:p-4 overflow-visible h-[calc(100vh-100px)] md:h-[calc(100vh-140px)] relative">
        {/* MAIN CALENDAR AREA */}
        <main
          className={`flex-1   relative transition-all duration-300 ${sidebarOpen ? "lg:mr-0" : ""}`}
        >
          <style>{`
              /* --- GLOBAL & MONTH VIEW (UNCHANGED) --- */
              .rbc-calendar { height: 100%; font-family: inherit; display: flex; flex-direction: column; }
              .rbc-toolbar { display: none !important; }
              
              .rbc-month-view {
    border: none;
    border-radius: 24px;
    overflow: visible !important;
    flex: 1;
}
              .rbc-header { border: none; padding: 15px 0; color: #1F2937; font-weight: 700; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em; }
              .rbc-header:nth-child(1) { color: #EA580C; }
              .rbc-header:nth-child(7) { color: #EA580C; }
              .rbc-month-row { display: flex; flex-direction: column; flex: 1; }
              .rbc-row-content { flex: 1; z-index: 1; }
              .rbc-date-cell { padding: 8px 12px; text-align: left; }
              .rbc-date-cell > a { color: #1F2937; font-weight: 600; font-size: 0.9rem; }
              .rbc-day-bg + .rbc-day-bg { border-left: none; }
              .rbc-month-row + .rbc-month-row { border-top: none; }
     /* MONTH VIEW HOVER SUPPORT */

.rbc-month-view {
    border: none !important;
    border-radius: 24px;
    overflow: visible !important;
    flex: 1;
}

.rbc-month-row {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: visible !important;
}

.rbc-row {
    overflow: visible !important;
}

.rbc-row-content {
    flex: 1;
    z-index: 1;
    overflow: visible !important;
}

.rbc-row-segment {
    padding: 2px 4px;
    overflow: visible !important;
    position: relative;
}

.rbc-event {
    overflow: visible !important;
}

.rbc-event-content {
    overflow: visible !important;
}

.rbc-month-view .rbc-event {
    z-index: 100 !important;
}

.rbc-month-view .rbc-row-segment:hover {
    z-index: 9999 !important;
}

             /* --- WEEK/DAY VIEW FIXES --- */
.rbc-time-view {
  border: none !important; 
  border-radius: 24px; 
  
  display: flex; 
  flex-direction: column; 
  height: 100%; 
  background: transparent;
}

/* Hide the All-Day event row container */
.rbc-allday-cell {
  display: none !important;
}

/* Ensure the time grid takes up full height since all-day row is gone */
.rbc-time-content {
  flex: 1 !important;
  overflow: hidden!important
}

/* Fixed Header Height */
.rbc-time-header {
  flex-shrink: 0; 
  height: 70px !important; 
  padding: 10px 0;
  border-bottom: none !important; 
  background: transparent;
}

/* Hide the SECOND empty header row (All Day row) */
.rbc-time-header .rbc-row:last-child { 
  display: none !important; 
}

/* Style the FIRST header row */
.rbc-time-header .rbc-row:first-child {
  display: flex; 
  align-items: center; 
  height: 100%;
}
  /* ✅ Events in Week/Day View ONLY */
.rbc-time-view .rbc-event {
    overflow: hidden !important;
    white-space: normal !important;
    min-width: 0 !important;
}

.rbc-time-view .rbc-event-content {
    overflow: hidden !important;
    min-width: 0 !important;
    width: 100% !important;
}

/* Ensure event label is also visible */
.rbc-time-view .rbc-event-label {
    display: none !important;
}

define width 
date cut 

.rbc-time-header-content .rbc-header {
  padding: 0 4px !important; 
  border: none !important;
  text-transform: none; 
  font-size: 0.85rem; /* Fixed: removed invalid md: prefix */
  font-weight: 700; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  height: 100%;
}



/* Pill Styling for Headers */
.rbc-time-header-content .rbc-header > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100px;
  height: 36px;
  border-radius: 18px;
  background: #FED7AA; /* Orange-200 */
  color: #1F2937;
  white-space: nowrap;
}





/* Weekend Colors */
.rbc-time-header-content .rbc-header:nth-child(1) > span,
.rbc-time-header-content .rbc-header:nth-child(7) > span {
  color: #EA580C;
}

/* Today Highlight */
.rbc-time-header-content .rbc-header.rbc-today > span {
  background: white;
  border: 2px solid #FB923C;
  color: #EA580C;
}

/* Scrollable Content Area - CRITICAL FOR VISIBILITY */
.rbc-time-content {
  flex: 1;
  
  overflow: hidden !important
 
}

/* Time Column (Left Side) */
.rbc-time-gutter {
  background: transparent;
  border-right: 1px solid rgba(251, 146, 60, 0.1) !important;
}

.rbc-label {
  color: #9CA3AF;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0 8px;
}



/* Light orange background for Week/Day time slots */
.rbc-time-view .rbc-time-slot {
  border: none !important;
  background: #FFF7ED !important;
}

.rbc-day-slot.rbc-today .rbc-time-slot {
  background: white !important;
}

/* Hour Lines */
.rbc-timeslot-group {
  border-bottom: 1px solid rgba(251, 146, 60, 0.15) !important;
  border: none !important;
}

/* Events in Week View */
.rbc-event {
  border: none !important;
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: 600;
 
}

/* Custom Scrollbar */
.rbc-time-content::-webkit-scrollbar { width: 6px; }
.rbc-time-content::-webkit-scrollbar-track { background: transparent; }
.rbc-time-content::-webkit-scrollbar-thumb { background: #FDBA74; border-radius: 3px; }
              /* Pill Styling */
              .rbc-time-header-content .rbc-header > span {
                display: inline-flex; align-items: center; justify-content: center;
                width: 100%; max-width: 100px; height: 32px; md:height: 36px;
                border-radius: 16px; background: #FED7AA; color: #1F2937;
                white-space: nowrap; font-weight: 700;
              }
              
              /* Weekend Colors */
              .rbc-time-header-content .rbc-header:nth-child(1) > span,
              .rbc-time-header-content .rbc-header:nth-child(7) > span { color: #EA580C; }
              
              /* Today Highlight */
              .rbc-time-header-content .rbc-header.rbc-today > span {
                background: #fff; border: 2px solid #FB923C; color: #EA580C;
              }
              
              /* Scrollable Content */
              .rbc-time-content {
                flex: 1; overflow-y: auto !important; overflow-x: hidden;
                border-top: 1px solid rgba(251, 146, 60, 0.2) !important;
              }
              
              .rbc-time-gutter { background: transparent; border-right: 1px solid rgba(251, 146, 60, 0.1) !important; }
              .rbc-label { color: #9CA3AF; font-size: 0.7rem; md:font-size: 0.75rem; font-weight: 500; padding: 0 4px; md:padding: 0 8px; }
              
             
              
              .rbc-time-slot { border: none !important; background: #FED7AA !important; }
              
              .rbc-day-slot.rbc-today { background: white !important; overflow: hidden }
              .rbc-day-slot.rbc-today .rbc-time-slot { background: white !important; }

              /* Force overflow hidden on day slots within time content */
.rbc-time-content > .rbc-day-slot {
  overflow: hidden !important;
}
              
              .rbc-timeslot-group { border-bottom: 1px solid rgba(251, 146, 60, 0.15) !important; border: none !important; }
              
              .rbc-event { border: none !important; border-radius: 6px; padding: 2px 6px; font-size: 0.7rem; md:font-size: 0.75rem; font-weight: 600; }
              
              .rbc-time-content::-webkit-scrollbar { width: 6px; }
              .rbc-time-content::-webkit-scrollbar-track { background: transparent; }
              .rbc-time-content::-webkit-scrollbar-thumb { background: #FDBA74; border-radius: 3px; }
              
              /* Mobile Adjustments */
              @media (max-width: 768px) {
                .rbc-time-header { height: 50px !important; }
                .rbc-time-header-content .rbc-header > span { height: 28px; border-radius: 14px; font-size: 0.7rem; max-width: 60px; }
                .rbc-label { font-size: 0.65rem; }
              }
           `}</style>

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              style={{
                height: view === Views.MONTH ? "100%" : "709px",
                minHeight: view === Views.MONTH ? "100%" : "600px",
              }}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              dayPropGetter={dayPropGetter}
              view={view}
              onView={handleViewChange}
              date={date}
              onNavigate={handleNavigate}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              components={{
                toolbar: () => null,

                month: {
                  event: CustomMonthEvent,
                },

                week: {
                  event: CustomEvent,
                },

                day: {
                  event: CustomEvent,
                },

                agenda: {
                  event: CustomEvent,
                },
              }}
            />
          )}
        </main>

        {/* RIGHT SIDEBAR - Hidden on mobile unless toggled */}
        <aside
          className={`xl:w-80 w-full transition-all duration-300 overflow-hidden`}
        >
          <div className="flex flex-col gap-3">
            <div className="bg-orange-50 rounded-xl   h-full p-6 ">
              {/* Date Header */}
              <div className="mb-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-6">
                  <div>
                    <h1 className="text-xl font-bold text-[#ff5321] leading-none">
                      {moment(date).format("dddd")}
                    </h1>
                    <p className="text-sm text-[#ff5321] mt-2 font-medium">
                      {moment(date).format("MMMM DD, YYYY")}
                    </p>
                  </div>
                  <div className="text-7xl font-black text-[#ff5321] leading-none opacity-90 font-medium">
                    {moment(date).format("DD")}
                  </div>
                </div>

                {user.role === "admin" && (
                  <button
                    onClick={() =>
                      handleSelectSlot({
                        start: new Date(),
                        end: new Date(new Date().getTime() + 3600000),
                      })
                    }
                    className="w-full mb-6 px-4 py-3.5 bg-[#ff5321] text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-bold flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Plus className="h-5 w-5" />
                    Schedule Class
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-[#ff5321] rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20">
                    <div className="text-3xl font-bold">{stats.today}</div>
                    <div className="text-xs opacity-80 font-medium mt-1">
                      Today
                    </div>
                  </div>
                  <div className="bg-white border-2 border-orange-200 rounded-2xl p-4 shadow-sm">
                    <div className="text-3xl font-bold text-orange-600">
                      {stats.thisWeek}
                    </div>
                    <div className="text-xs text-gray-500 font-medium mt-1">
                      This Week
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lists */}
            <div className="flex-1 overflow-y-auto  scrollbar-hide">
              <div>
                {/* Container with fixed height on large screens */}
                <div className="bg-orange-100/50 rounded-xl p-3 mb-3 flex flex-col lg:h-55">
                  {/* Header - shrinks to fit content */}
                  <h3 className="font-bold text-orange-700 text-sm flex items-center gap-2 shrink-0">
                    <Clock className="h-4 w-4" /> Today's Schedule
                  </h3>

                  {todayEvents.length > 0 ? (
                    /* ✅ HAS CONTENT: Scrollable list */
                    <div className="space-y-3 mt-3 overflow-y-auto scrollbar-hide flex-1">
                      {todayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleSelectEvent(event)}
                          className="group p-3 rounded-xl bg-white border border-orange-100 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff5321] text-white flex-shrink-0 shadow-sm`}
                            >
                              {React.createElement(event.icon || Video, {
                                className: "h-5 w-5",
                              })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 text-sm truncate">
                                {event.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {moment(event.start).format("HH:mm")} -{" "}
                                {moment(event.end).format("HH:mm")}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* ✅ NO CONTENT: Full height, centered message */
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 mt-2">
                      <div className="bg-white p-4 rounded-full mb-3 shadow-sm">
                        <Clock className="h-8 w-8 text-orange-300" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">
                        No classes today
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Enjoy your free time!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="bg-orange-100/50 rounded-xl p-3 mb-3 overflow-y-auto lg:h-54">
                  <h3 className="font-bold text-orange-700 text-sm flex items-center gap-2">
                    <Award className="h-4 w-4" /> Upcoming
                  </h3>
                  <div>
                    {upcomingEvents.length > 0 ? (
                      /* ✅ HAS CONTENT: Scrollable list, natural height */
                      <div className="space-y-2 my-3 overflow-y-auto scrollbar-hide flex-1">
                        {upcomingEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => handleSelectEvent(event)}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-transparent hover:border-orange-200 hover:bg-orange-50 cursor-pointer transition-all"
                          >
                            <div className="text-center min-w-[45px] bg-orange-50 rounded-lg py-1.5 border border-orange-100">
                              <div className="text-[10px] font-bold text-orange-500 uppercase">
                                {moment(event.start).format("MMM")}
                              </div>
                              <div className="text-lg font-bold text-gray-800 leading-none">
                                {moment(event.start).format("DD")}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-800 truncate">
                                {event.title}
                              </div>
                              <div className="text-xs text-orange-500 font-medium">
                                {moment(event.start).format("HH:mm")}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* ✅ NO CONTENT: Full height, centered message */
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-6 mt-2">
                        <div className="bg-white p-4 rounded-full mb-3 shadow-sm">
                          <CalendarIcon className="h-8 w-8 text-orange-300" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                          No upcoming events
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Check back later for new schedules
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
      </div>

      {/* MODAL - Viewable by all, Editable/Createable by admin only */}
      {showEventModal && (viewingEvent || user.role === "admin") && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowEventModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-120 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#f6673c] text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold">
                {viewingEvent
                  ? "Event Details"
                  : editingEvent
                    ? "Edit Event"
                    : "Create New Event"}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            {/* Content */}
            <div className="p-6 space-y-6">
              {viewingEvent ? (
                /* ✅ VIEW MODE - ACCESSIBLE BY ALL ROLES */
                <div className="space-y-4">
                  {/* Header shows the total count if multiple events exist */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-2xl font-bold text-gray-900">
                      {viewingEvent.siblings && viewingEvent.siblings.length > 1
                        ? `${viewingEvent.siblings.length} Events on ${moment(viewingEvent.start).format("MMM DD")}`
                        : viewingEvent.title}
                    </h4>
                  </div>

                  {/* Map through ALL events for this day */}
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {(viewingEvent.siblings || [viewingEvent]).map(
                      (evt, index) => (
                        <div
                          key={evt.id || index}
                          className="p-4 bg-orange-50 rounded-xl border border-orange-100 relative group"
                        >
                          {/* Event Title & Time */}
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-gray-800 text-lg">
                              {evt.title}
                            </h5>
                            <span className="text-xs font-bold bg-white px-2 py-1 rounded-md text-orange-600 border border-orange-200 shadow-sm">
                              {moment(evt.start).format("HH:mm")} -{" "}
                              {moment(evt.end).format("HH:mm")}
                            </span>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-xs text-orange-600 font-bold uppercase mb-1">
                                Start
                              </div>
                              <div className="font-semibold text-gray-700">
                                {moment(evt.start).format("MMM DD, YYYY HH:mm")}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-orange-600 font-bold uppercase mb-1">
                                End
                              </div>
                              <div className="font-semibold text-gray-700">
                                {moment(evt.end).format("MMM DD, YYYY HH:mm")}
                              </div>
                            </div>
                          </div>

                          {/* Instructor Info (if available) */}
                          {evt.instructor && (
                            <div className="mt-3 pt-3 border-t border-orange-200/50 flex items-center gap-2">
                              <User className="h-4 w-4 text-orange-500" />
                              <span className="text-sm text-gray-600 font-medium">
                                {evt.instructor.name}
                              </span>
                            </div>
                          )}

                          {/* Admin Actions for THIS specific event in the list */}
                          {user.role === "admin" && (
                            <div className="flex gap-2 mt-4 pt-2 border-t border-orange-200/50 opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditEvent(evt)}
                                className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                              >
                                <Edit2 className="h-4 w-4" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(evt.id)}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : (
                /* ✅ CREATE/EDIT MODE - ADMIN ONLY (Protected by handler guard) */
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Event Title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none transition-all"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="datetime-local"
                      value={moment(eventStart).format("YYYY-MM-DDTHH:mm")}
                      onChange={(e) => setEventStart(new Date(e.target.value))}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none transition-all"
                    />
                    <input
                      type="datetime-local"
                      value={moment(eventEnd).format("YYYY-MM-DDTHH:mm")}
                      onChange={(e) => setEventEnd(new Date(e.target.value))}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSaveEvent}
                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all"
                  >
                    {editingEvent ? "Update Event" : "Create Event"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
