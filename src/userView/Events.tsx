// EventCalendar.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarComponent.css';
import api from '../axiosInstance';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
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
  Edit2
} from 'lucide-react';

const localizer = momentLocalizer(moment);

const EventCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState(new Date());
  const [eventEnd, setEventEnd] = useState(new Date());
  const [eventDescription, setEventDescription] = useState('');
  const [eventCategory, setEventCategory] = useState('session');
  const [eventInstructor, setEventInstructor] = useState('');

  // Color map with orange theme
  const colorMap = {
    session: {
      bg: '#fff7ed',
      text: '#c2410c',
      border: '#f97316',
      gradient: 'from-orange-400 to-orange-600',
      label: 'Session',
      icon: Video
    },
    liveClass: {
      bg: '#ffedd5',
      text: '#9a3412',
      border: '#ea580c',
      gradient: 'from-orange-500 to-red-500',
      label: 'Live Class',
      icon: BookOpen
    },
    speaking: {
      bg: '#fef3c7',
      text: '#b45309',
      border: '#f59e0b',
      gradient: 'from-amber-400 to-orange-500',
      label: 'Speaking',
      icon: MessageCircle
    },
    skills: {
      bg: '#ffedd5',
      text: '#c2410c',
      border: '#fb923c',
      gradient: 'from-orange-400 to-amber-500',
      label: 'Skills',
      icon: Award
    },
    custom: {
      bg: '#fff7ed',
      text: '#9a3412',
      border: '#f97316',
      gradient: 'from-orange-300 to-orange-500',
      label: 'Custom',
      icon: CalendarIcon
    }
  };

  // Fetch events from API
  useEffect(() => {
    const fetchEventsFromApi = async () => {
      try {
        setLoading(true);
        const response = await api.get('/content/schedule');

        if (response.data && response.data.data) {
          const mappedEvents = response.data.data.map(item => {
            // Determine category based on contentType or type
            let category = 'session';
            if (item.contentType?.toLowerCase().includes('liveClass')) category = 'liveClass';
            else if (item.type?.toLowerCase().includes('speaking')) category = 'speaking';
            else if (item.contentType?.toLowerCase().includes('skills')) category = 'skills';

            const colors = colorMap[category] || colorMap.custom;

            return {
              id: item._id,
              title: item.title,
              start: new Date(item.scheduledStart),
              end: new Date(item.scheduledEnd),
              instructor: item.instructor,
              category: category,
              contentType: item.contentType,
              slug: item.slug,
              status: item.status,
              color: colors.bg,
              textColor: colors.text,
              borderColor: colors.border,
              gradient: colors.gradient,
              icon: colors.icon
            };
          });

          setEvents(mappedEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventsFromApi();
  }, []);

  const handleSelectSlot = useCallback((slotInfo) => {
    setSelectedSlot(slotInfo);
    setEditingEvent(null);
    setViewingEvent(null);
    setEventTitle('');
    setEventDescription('');
    setEventInstructor('');
    setEventCategory('session');

    const start = slotInfo.start;
    const end = slotInfo.end || new Date(start.getTime() + 60 * 60 * 1000);
    setEventStart(start);
    setEventEnd(end);

    setShowEventModal(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setViewingEvent(event);
    setEditingEvent(null);
    setShowEventModal(true);
  }, []);

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setViewingEvent(null);
    setEventTitle(event.title);
    setEventStart(event.start);
    setEventEnd(event.end);
    setEventDescription(event.instructor?.name || '');
    setEventInstructor(event.instructor?.name || '');
    setEventCategory(event.category || 'session');
    setShowEventModal(true);
  };

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) {
      alert('Please enter an event title');
      return;
    }

    if (eventEnd <= eventStart) {
      alert('End time must be after start time');
      return;
    }

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
      gradient: colors.gradient
    };

    if (editingEvent) {
      setEvents(events.map(ev => ev.id === editingEvent.id ? eventData : ev));
    } else {
      setEvents([...events, eventData]);
    }

    setShowEventModal(false);
    resetForm();
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(ev => ev.id !== eventId));
      setShowEventModal(false);
      setEditingEvent(null);
      setViewingEvent(null);
    }
  };

  const resetForm = () => {
    setEventTitle('');
    setEventDescription('');
    setEventInstructor('');
    setEventCategory('session');
    setEditingEvent(null);
    setViewingEvent(null);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        borderRadius: '6px',
        border: `2px solid #f97316`,
        display: 'flex',
        alignItems: 'center',
        padding: '4px 6px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#c2410c',
        boxShadow: '0 2px 4px rgba(249, 115, 22, 0.15)',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minHeight: '24px'
      }
    };
  };

  const dayPropGetter = (date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    return {
      style: {
        backgroundColor: isToday ? '#fff7ed' : 'transparent'
      },
      className: isToday ? 'today-cell rounded-lg' : ''
    };
  };

  const CustomEvent = ({ event }) => {
    const Icon = event.icon || Video;
    const startTime = moment(event.start).format('HH:mm');
    const endTime = moment(event.end).format('HH:mm');

    return (
      <div className="flex items-center gap-1.5 w-full">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <Icon className="h-3 w-3 flex-shrink-0 text-orange-600" />
          <span className="truncate font-semibold text-orange-700 text-xs">
            {event.title}
          </span>
        </div>
        <span className="text-xs text-orange-600 font-medium flex-shrink-0">
          {startTime}
        </span>
      </div>
    );
  };

  const CustomMonthEvent = ({ event }) => {
    const Icon = event.icon || Video;

    return (
      <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-l-4 border-orange-500 rounded-md px-2 py-1.5 mb-1 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-orange-800 truncate">
              {event.title}
            </div>
            <div className="text-[10px] text-orange-600 font-medium">
              {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
            </div>
            {event.instructor && (
              <div className="text-[10px] text-orange-500 truncate">
                {event.instructor.name}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const CustomAgendaEvent = ({ event }) => {
    const Icon = event.icon || Video;
    return (
      <div className="flex items-center gap-4 p-3 hover:bg-orange-50 rounded-lg transition-colors">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${event.gradient || 'from-orange-400 to-orange-600'} text-white shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 truncate">{event.title}</div>
          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-orange-500" />
              {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
            </span>
            {event.instructor && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-orange-500" />
                {event.instructor.name}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const CustomTimeSlotWrapper = ({ children }) => {
    return <div className="hover:bg-orange-50/30 transition-colors">{children}</div>;
  };

  const filteredEvents = useMemo(() => {
    return events;
  }, [events]);

  const todayEvents = useMemo(() => {
    const today = moment();
    return events.filter(event =>
      moment(event.start).isSame(today, 'day')
    ).sort((a, b) => a.start - b.start);
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = moment();
    return events.filter(event =>
      moment(event.start).isAfter(now)
    ).sort((a, b) => a.start - b.start).slice(0, 5);
  }, [events]);

  const stats = useMemo(() => {
    return {
      total: events.length,
      today: todayEvents.length,
      thisWeek: events.filter(e =>
        moment(e.start).isSame(moment(), 'week')
      ).length,
      sessions: events.filter(e => e.category === 'session').length,
      liveClass: events.filter(e => e.category === 'liveClass').length
    };
  }, [events, todayEvents]);

  const navigateCalendar = (direction) => {
    const newDate = moment(date).clone();
    if (direction === 'prev') {
      if (view === Views.MONTH) newDate.subtract(1, 'month');
      else if (view === Views.WEEK) newDate.subtract(1, 'week');
      else if (view === Views.DAY) newDate.subtract(1, 'day');
    } else {
      if (view === Views.MONTH) newDate.add(1, 'month');
      else if (view === Views.WEEK) newDate.add(1, 'week');
      else if (view === Views.DAY) newDate.add(1, 'day');
    }
    setDate(newDate.toDate());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-orange-100 overflow-hidden flex flex-col`}>
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Calendar</h1>
              <p className="text-sm text-gray-500">Manage your schedule</p>
            </div>

            {/* Create Button */}
            <button
              onClick={() => handleSelectSlot({ start: new Date(), end: new Date(new Date().getTime() + 3600000) })}
              className="w-full mb-8 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Schedule Class
            </button>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">{stats.today}</div>
                <div className="text-xs opacity-90">Today</div>
              </div>
              <div className="bg-white border-2 border-orange-200 rounded-xl p-4">
                <div className="text-2xl font-bold text-orange-600">{stats.thisWeek}</div>
                <div className="text-xs text-gray-600">This Week</div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Today's Schedule
              </h3>
              <div className="space-y-3">
                {todayEvents.length > 0 ? (
                  todayEvents.map(event => {
                    const Icon = event.icon || Video;
                    return (
                      <div
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        className="group p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 cursor-pointer hover:shadow-md hover:shadow-orange-500/10 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${event.gradient || 'from-orange-400 to-orange-600'} text-white flex-shrink-0`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 text-sm truncate">{event.title}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                            </div>
                            {event.instructor && (
                              <div className="text-xs text-orange-600 mt-1 font-medium">
                                {event.instructor.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No classes today</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 text-orange-500" />
                Upcoming
              </h3>
              <div className="space-y-2">
                {upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                  >
                    <div className="text-center min-w-[40px]">
                      <div className="text-xs font-bold text-orange-600">
                        {moment(event.start).format('MMM')}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {moment(event.start).format('DD')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{event.title}</div>
                      <div className="text-xs text-gray-500">
                        {moment(event.start).format('HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="bg-white border-b border-orange-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <MoreVertical className="h-5 w-5 text-gray-600" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateCalendar('prev')}
                    className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => navigateCalendar('next')}
                    className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                  <h2 className="text-xl font-bold text-gray-900 ml-2">
                    {moment(date).format('MMMM YYYY')}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNavigate(new Date())}
                  className="px-4 py-2 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  Today
                </button>

                <div className="flex bg-gray-100 rounded-lg p-1">
                  {['month', 'week', 'day', 'agenda'].map(viewName => (
                    <button
                      key={viewName}
                      onClick={() => handleViewChange(viewName)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === viewName
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-1 overflow-hidden bg-white m-6 rounded-2xl border border-orange-100 shadow-sm">
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
                style={{ height: '100%' }}
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
                  month: {
                    event: CustomMonthEvent
                  },
                  week: {
                    event: CustomEvent
                  },
                  day: {
                    event: CustomEvent
                  },
                  agenda: {
                    event: CustomAgendaEvent
                  },
                  timeSlotWrapper: CustomTimeSlotWrapper
                }}
                popup
                popupComponent={({ event, date }) => (
                  <div className="p-2">
                    <div className="font-bold text-orange-800">{event.title}</div>
                    <div className="text-sm text-orange-600">
                      {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                    </div>
                  </div>
                )}
                tooltipAccessor={(event) => `${event.title}\n${moment(event.start).format('HH:mm')} - ${moment(event.end).format('HH:mm')}`}
                step={30}
                timeslots={2}
                min={new Date(2025, 1, 1, 6, 0)}
                max={new Date(2025, 1, 1, 22, 0)}
              />

            )}
          </div>
        </main>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowEventModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {viewingEvent ? (
                  <>
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      {viewingEvent.icon && <viewingEvent.icon className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Event Details</h3>
                      <p className="text-sm text-orange-100">View event information</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
                      <p className="text-sm text-orange-100">Fill in the details below</p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {viewingEvent ? (
                // View Mode
                <div className="space-y-6">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{viewingEvent.title}</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${viewingEvent.gradient || 'from-orange-400 to-orange-600'} text-white`}>
                      {viewingEvent.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <div className="flex items-center gap-2 text-orange-600 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-semibold">Start Time</span>
                      </div>
                      <p className="font-bold text-gray-900">{moment(viewingEvent.start).format('MMMM DD, YYYY')}</p>
                      <p className="text-sm text-gray-600">{moment(viewingEvent.start).format('HH:mm')}</p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <div className="flex items-center gap-2 text-orange-600 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-semibold">End Time</span>
                      </div>
                      <p className="font-bold text-gray-900">{moment(viewingEvent.end).format('MMMM DD, YYYY')}</p>
                      <p className="text-sm text-gray-600">{moment(viewingEvent.end).format('HH:mm')}</p>
                    </div>
                  </div>

                  {viewingEvent.instructor && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-semibold">Instructor</span>
                      </div>
                      <p className="font-bold text-gray-900">{viewingEvent.instructor.name}</p>
                      {viewingEvent.instructor.email && (
                        <p className="text-sm text-gray-600">{viewingEvent.instructor.email}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleEditEvent(viewingEvent)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-semibold flex items-center justify-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Event
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(viewingEvent.id)}
                      className="px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-semibold flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                // Edit/Create Mode
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
                    <input
                      type="text"
                      placeholder="Enter event title"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        value={moment(eventStart).format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => setEventStart(new Date(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        value={moment(eventEnd).format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => setEventEnd(new Date(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Instructor</label>
                    <input
                      type="text"
                      placeholder="Enter instructor name"
                      value={eventInstructor}
                      onChange={(e) => setEventInstructor(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(colorMap).map(([key, value]) => {
                        const Icon = value.icon;
                        return (
                          <button
                            key={key}
                            onClick={() => setEventCategory(key)}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${eventCategory === key
                                ? `border-orange-500 bg-gradient-to-br ${value.gradient} text-white shadow-lg`
                                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                              }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-sm font-semibold">{value.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!viewingEvent && (
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 rounded-xl transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-semibold"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;