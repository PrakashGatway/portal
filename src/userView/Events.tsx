// EventCalendar.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-datepicker/dist/react-datepicker.css';
import './CalendarComponent.css';

const localizer = momentLocalizer(moment);

const EventCalendar = () => {
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState(new Date());
  const [eventEnd, setEventEnd] = useState(new Date());
  const [eventDescription, setEventDescription] = useState('');
  const [eventColor, setEventColor] = useState('#10b981');
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventLocation, setEventLocation] = useState('');
  const [eventCategory, setEventCategory] = useState('live');

  const colorMap = {
    live: { bg: '#ecfdf5', text: '#065f46', border: '#10b981', label: 'Live' },
    skills: { bg: '#eff6ff', text: '#1e40af', border: '#3b82f6', label: 'Skills' },
    workshop: { bg: '#fffbeb', text: '#92400e', border: '#f59e0b', label: 'Workshop' },
    speaking: { bg: '#faf5ff', text: '#6b21a8', border: '#8b5cf6', label: 'Speaking' },
    custom: { bg: '#f8fafc', text: '#1e293b', border: '#64748b', label: 'Custom' }
  };

  // Load events from localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('rbcEvents');
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents).map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
      setEvents(parsedEvents);
    } else {
      const today = new Date();
      const y = today.getFullYear();
      const m = today.getMonth();
      const d = today.getDate();
      
      const sampleEvents = [
        {
          id: 1,
          title: 'Live: Grammar Masterclass',
          start: new Date(y, m, d, 10, 0),
          end: new Date(y, m, d, 11, 0),
          desc: 'Advanced grammar rules and sentence structure',
          location: 'Live Class',
          color: colorMap.live.bg,
          textColor: colorMap.live.text,
          borderColor: colorMap.live.border,
          category: 'live'
        },
        {
          id: 2,
          title: 'IELTS Reading Strategies',
          start: new Date(y, m, d, 14, 0),
          end: new Date(y, m, d, 15, 30),
          desc: 'Skimming and scanning techniques',
          location: 'Skills Class',
          color: colorMap.skills.bg,
          textColor: colorMap.skills.text,
          borderColor: colorMap.skills.border,
          category: 'skills'
        },
        {
          id: 3,
          title: 'Live: IELTS Speaking Practice',
          start: new Date(y, m, d + 1, 16, 0),
          end: new Date(y, m, d + 1, 17, 0),
          desc: 'Mock test and feedback session',
          location: 'Live Class',
          color: colorMap.live.bg,
          textColor: colorMap.live.text,
          borderColor: colorMap.live.border,
          category: 'live'
        },
        {
          id: 4,
          title: 'Writing Task 2 Workshop',
          start: new Date(y, m, d + 2, 11, 0),
          end: new Date(y, m, d + 2, 12, 30),
          desc: 'Essay structure and coherence',
          location: 'Workshop',
          color: colorMap.workshop.bg,
          textColor: colorMap.workshop.text,
          borderColor: colorMap.workshop.border,
          category: 'workshop'
        },
        {
          id: 5,
          title: 'Live: Listening Practice',
          start: new Date(y, m, d + 3, 15, 0),
          end: new Date(y, m, d + 3, 16, 0),
          desc: 'Section 4 practice with answers',
          location: 'Live Class',
          color: colorMap.live.bg,
          textColor: colorMap.live.text,
          borderColor: colorMap.live.border,
          category: 'live'
        },
        {
          id: 6,
          title: 'Vocabulary Boost Class',
          start: new Date(y, m, d + 4, 18, 0),
          end: new Date(y, m, d + 4, 19, 0),
          desc: 'Advanced synonyms and collocations',
          location: 'Skills Class',
          color: colorMap.skills.bg,
          textColor: colorMap.skills.text,
          borderColor: colorMap.skills.border,
          category: 'skills'
        }
      ];
      setEvents(sampleEvents);
    }
  }, []);

  // Save events to localStorage
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('rbcEvents', JSON.stringify(events));
    }
  }, [events]);

  const handleSelectSlot = useCallback((slotInfo) => {
    setSelectedSlot(slotInfo);
    setEditingEvent(null);
    setEventTitle('');
    setEventDescription('');
    setEventLocation('');
    setEventColor(colorMap.live.bg);
    setEventCategory('live');
    setEventAllDay(false);
    
    const start = slotInfo.start;
    const end = slotInfo.end || new Date(start.getTime() + 60 * 60 * 1000);
    setEventStart(start);
    setEventEnd(end);
    
    setShowEventModal(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setEditingEvent(event);
    setEventTitle(event.title);
    setEventStart(event.start);
    setEventEnd(event.end);
    setEventDescription(event.desc || '');
    setEventLocation(event.location || '');
    setEventColor(event.color || colorMap.live.bg);
    setEventCategory(event.category || 'live');
    setEventAllDay(event.allDay || false);
    setShowEventModal(true);
  }, []);

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) {
      alert('Please enter an event title');
      return;
    }

    if (eventEnd <= eventStart) {
      alert('End time must be after start time');
      return;
    }

    const categoryColors = colorMap[eventCategory] || colorMap.custom;
    
    const eventData = {
      id: editingEvent ? editingEvent.id : Date.now(),
      title: eventTitle,
      start: eventStart,
      end: eventEnd,
      desc: eventDescription,
      location: eventLocation,
      color: categoryColors.bg,
      textColor: categoryColors.text,
      borderColor: categoryColors.border,
      category: eventCategory,
      allDay: eventAllDay
    };

    if (editingEvent) {
      setEvents(events.map(ev => ev.id === editingEvent.id ? eventData : ev));
    } else {
      setEvents([...events, eventData]);
    }

    setShowEventModal(false);
    setEditingEvent(null);
    setEventTitle('');
    setEventDescription('');
    setEventLocation('');
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(ev => ev.id !== eventId));
      setShowEventModal(false);
      setEditingEvent(null);
    }
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: event.color || '#ecfdf5',
      color: event.textColor || '#065f46',
      borderRadius: '6px',
      border: `1px solid ${event.borderColor || '#10b981'}`,
      display: 'block',
      cursor: 'pointer',
      fontSize: '12px',
      padding: '2px 6px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease'
    };
    
    return { style };
  };

  const dayPropGetter = (date) => {
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return {
        style: {
          backgroundColor: '#f0fdf4'
        },
        className: 'today-cell'
      };
    }
    return {};
  };

  const CustomEvent = ({ event }) => (
    <div className="group relative flex flex-col">
      <div className="font-semibold truncate">{event.title}</div>
      {!event.allDay && (
        <div className="text-xs opacity-75">
          {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
        </div>
      )}
    </div>
  );

  const CustomAgendaEvent = ({ event }) => (
    <div className="flex gap-4 p-3">
      <div className="text-sm font-semibold whitespace-nowrap">
        {event.allDay 
          ? 'All Day' 
          : `${moment(event.start).format('HH:mm')} - ${moment(event.end).format('HH:mm')}`
        }
      </div>
      <div className="flex-1">
        <div className="font-semibold">{event.title}</div>
        {event.location && (
          <div className="text-sm text-gray-600">📍 {event.location}</div>
        )}
        {event.desc && (
          <div className="text-sm text-gray-500">{event.desc}</div>
        )}
      </div>
    </div>
  );

  const filteredEvents = useMemo(() => {
    if (!searchTerm) return events;
    return events.filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  const todayEvents = useMemo(() => {
    const today = new Date();
    return events.filter(event => 
      event.start.getDate() === today.getDate() &&
      event.start.getMonth() === today.getMonth() &&
      event.start.getFullYear() === today.getFullYear()
    ).sort((a, b) => a.start - b.start);
  }, [events]);

  const stats = useMemo(() => {
    return {
      total: events.length,
      live: events.filter(e => e.category === 'live').length,
      workshops: events.filter(e => e.category === 'workshop').length,
      skills: events.filter(e => e.category === 'skills').length,
      speaking: events.filter(e => e.category === 'speaking').length
    };
  }, [events]);

  return (
    <div className="min-h-screen">


      <div className="flex">

        {/* Main Content */}
        <main className="flex-1 p-3 space-y-6">

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Calendar</h2>
                  <p className="text-sm text-gray-500">Manage your classes and schedule</p>
                </div>
                <button
                  onClick={() => handleSelectSlot({start: new Date(), end: new Date(new Date().getTime() + 3600000)})}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/20 transition-all font-medium flex items-center gap-2"
                >
                  <span className="text-xl">+</span> Schedule Class
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNavigate(new Date())}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleNavigate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => handleNavigate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    →
                  </button>
                  <h3 className="text-lg font-semibold ml-2">
                    {moment(date).format('MMMM YYYY')}
                  </h3>
                </div>
                
                <div className="flex gap-2">
                  {['month', 'week', 'day', 'agenda'].map(viewName => (
                    <button
                      key={viewName}
                      onClick={() => handleViewChange(viewName)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        view === viewName
                          ? 'bg-emerald-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calendar Component */}
            <div className="p-6">
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
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
                  event: CustomEvent,
                  agenda: { event: CustomAgendaEvent }
                }}
                popup
                tooltipAccessor={(event) => event.title}
              />
            </div>

            {/* Legend */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex flex-wrap gap-6">
                {Object.entries(colorMap).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: value.border }}
                    />
                    <span className="text-sm text-gray-600">{value.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-90 space-y-6 p-3 hidden xl:block ">
          {/* Mini Calendar */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold mb-4">Mini Calendar</h3>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} className="font-semibold text-gray-500 py-1">{day}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i - 2;
                const isToday = moment().date() === dayNum && moment().month() === date.getMonth();
                return (
                  <div
                    key={i}
                    className={`py-1 rounded-lg cursor-pointer transition-colors ${
                      isToday
                        ? 'bg-emerald-500 text-white'
                        : dayNum > 0 && dayNum <= 31
                        ? 'hover:bg-gray-100'
                        : 'text-gray-300'
                    }`}
                  >
                    {dayNum > 0 && dayNum <= 31 ? dayNum : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Today's Schedule</h3>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                {todayEvents.length} Classes
              </span>
            </div>
            <div className="space-y-3">
              {todayEvents.length > 0 ? (
                todayEvents.map(event => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ borderLeftColor: event.borderColor, backgroundColor: event.color }}
                    onClick={() => handleSelectEvent(event)}
                  >
                    <div className="text-sm font-semibold" style={{ color: event.textColor }}>
                      {event.title}
                    </div>
                    <div className="text-xs mt-1 opacity-75">
                      {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                    </div>
                    {event.location && (
                      <div className="text-xs mt-1 opacity-60">📍 {event.location}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-sm">No classes scheduled for today</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowEventModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <input
                  type="text"
                  placeholder="Event title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full text-lg font-semibold border-b-2 border-gray-200 focus:border-emerald-500 outline-none pb-2"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={moment(eventStart).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setEventStart(new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={moment(eventEnd).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setEventEnd(new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Add location"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Add description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(colorMap).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setEventCategory(key);
                        setEventColor(value.bg);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        eventCategory === key
                          ? 'ring-2 ring-offset-2 ring-emerald-500'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: value.bg, color: value.text }}
                    >
                      {value.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eventAllDay}
                  onChange={(e) => setEventAllDay(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">All day event</span>
              </label>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              {editingEvent ? (
                <button
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  Delete
                </button>
              ) : (
                <div></div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/20 transition-all font-medium"
                >
                  {editingEvent ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;