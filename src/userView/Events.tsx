// EventCalendar.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  
  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState(new Date());
  const [eventEnd, setEventEnd] = useState(new Date());
  const [eventDescription, setEventDescription] = useState('');
  const [eventColor, setEventColor] = useState('#3174ad');
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventLocation, setEventLocation] = useState('');

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
      // Add sample events matching the image
      const today = new Date();
      const y = today.getFullYear();
      const m = today.getMonth();
      
      const sampleEvents = [
        {
          id: 1,
          title: 'Live: Grammar Masterclass',
          start: new Date(y, m, 1, 10, 0),
          end: new Date(y, m, 1, 11, 0),
          desc: 'Advanced grammar rules',
          location: 'Live Class',
          color: '#dcfce7', 
          textColor: '#166534',
          category: 'live'
        },
        {
          id: 2,
          title: 'IELTS Reading Strategies',
          start: new Date(y, m, 2, 12, 0),
          end: new Date(y, m, 2, 13, 30),
          desc: 'Skimming and scanning techniques',
          location: 'Skills Class',
          color: '#e0e7ff',
          textColor: '#3730a3',
          category: 'skills'
        },
        {
          id: 3,
          title: 'Live: IELTS Speaking Practice',
          start: new Date(y, m, 5, 16, 0),
          end: new Date(y, m, 5, 17, 0),
          desc: 'Mock test',
          location: 'Live Class',
          color: '#dcfce7',
          textColor: '#166534',
          category: 'live'
        },
        {
          id: 4,
          title: 'Writing Task 2 Workshop',
          start: new Date(y, m, 6, 11, 0),
          end: new Date(y, m, 6, 12, 0),
          desc: 'Essay structure',
          location: 'Workshop',
          color: '#fef3c7',
          textColor: '#92400e',
          category: 'workshop'
        },
        {
          id: 5,
          title: 'Live: Listening Practice',
          start: new Date(y, m, 8, 15, 0),
          end: new Date(y, m, 8, 16, 0),
          desc: 'Section 4 practice',
          location: 'Live Class',
          color: '#dcfce7',
          textColor: '#166534',
          category: 'live'
        },
        {
          id: 6,
          title: 'Vocabulary Boost Class',
          start: new Date(y, m, 9, 18, 0),
          end: new Date(y, m, 9, 19, 0),
          desc: 'Advanced synonyms',
          location: 'Skills Class',
          color: '#e0e7ff',
          textColor: '#3730a3',
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
    setEventColor('#dcfce7');
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
    setEventColor(event.color || '#dcfce7');
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

    const eventData = {
      id: editingEvent ? editingEvent.id : Date.now(),
      title: eventTitle,
      start: eventStart,
      end: eventEnd,
      desc: eventDescription,
      location: eventLocation,
      color: eventColor,
      textColor: '#000',
      category: 'custom',
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

  // Custom Styling for events to match the image
  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: event.color || '#dcfce7',
      color: event.textColor || '#166534',
      borderRadius: '8px',
      border: 'none',
      display: 'block',
      cursor: 'pointer',
      fontSize: '11px',
      padding: '4px 8px',
      height: '100%',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
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
          backgroundColor: '#f8fafc'
        }
      };
    }
    return {};
  };

  // Custom Toolbar to match the image UI
  const CustomToolbar = ({ label, onNavigate, onView, view }) => (
    <div className="custom-toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn today-btn" onClick={() => onNavigate('TODAY')}>
          Today
        </button>
        <button className="toolbar-btn nav-btn" onClick={() => onNavigate('PREV')}>
          ‹
        </button>
        <button className="toolbar-btn nav-btn" onClick={() => onNavigate('NEXT')}>
          ›
        </button>
        <span className="toolbar-label">{label}</span>
      </div>
      <div className="toolbar-right">
        <div className="view-buttons">
          {['month', 'week', 'day', 'agenda'].map(viewName => (
            <button
              key={viewName}
              className={`view-btn ${view === viewName ? 'active' : ''}`}
              onClick={() => onView(viewName)}
            >
              {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Custom Event Component to match the image's specific card look
  const CustomEvent = ({ event }) => (
    <div className="custom-event">
      <div className="event-title">
        {event.title}
      </div>
      <div className="event-meta">
        {!event.allDay && (
          <span className="event-time">
            {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
          </span>
        )}
        <span className="event-icon">
          {event.category === 'live' && '▶'}
          {event.category === 'skills' && '📘'}
          {event.category === 'workshop' && '⚒️'}
        </span>
      </div>
    </div>
  );

  const CustomAgendaEvent = ({ event }) => (
    <div className="agenda-event">
      <div className="agenda-event-time">
        {event.allDay 
          ? 'All Day' 
          : `${moment(event.start).format('HH:mm')} - ${moment(event.end).format('HH:mm')}`
        }
      </div>
      <div className="agenda-event-content">
        <div className="agenda-event-title">{event.title}</div>
        {event.location && (
          <div className="agenda-event-location">📍 {event.location}</div>
        )}
        {event.desc && (
          <div className="agenda-event-desc">{event.desc}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="">


      {/* Main Content */}
      <div className="">

        <div className="content-layout">
          {/* Calendar Area */}
          <div className="calendar-wrapper">
            <div className="calendar-header">
              <h2>Class Schedule Calendar</h2>
              <p>Manage and view your live classes and other scheduled classes.</p>
              <div className="header-actions-row">
                <div className="toolbar-left-inner">
                  <button className="toolbar-btn today-btn" onClick={() => handleNavigate(new Date())}>Today</button>
                  <button className="toolbar-btn nav-btn" onClick={() => handleNavigate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}>‹</button>
                  <button className="toolbar-btn nav-btn" onClick={() => handleNavigate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}>›</button>
                  <h3>{moment(date).format('MMMM YYYY')}</h3>
                </div>
                <div className="header-actions-right">
                  <select className="view-select" value={view} onChange={(e) => handleViewChange(e.target.value)}>
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                    <option value="day">Day</option>
                  </select>
                  <button className="new-class-btn" onClick={() => handleSelectSlot({start: new Date(), end: new Date(new Date().getTime() + 3600000)})}>
                    + Schedule Class
                  </button>
                </div>
              </div>
            </div>

            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '700px' }}
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

            {/* Legend */}
            <div className="calendar-legend">
              <span><span className="dot green"></span> Live Classes</span>
              <span><span className="dot blue"></span> Speaking Classes</span>
              <span><span className="dot purple"></span> Skill Classes</span>
              <span><span className="dot orange"></span> Workshops & Others</span>
            </div>
          </div>

          {/* Right Side Panel */}
          <aside className="side-panel">
            {/* Mini Calendar */}
            <div className="panel-card mini-calendar-card">
              <h4>Mini Calendar</h4>
              <div className="mini-calendar">
                <div className="mini-cal-header">
                  <button>‹</button>
                  <span>{moment(date).format('MMMM YYYY')}</span>
                  <button>›</button>
                </div>
                <div className="mini-cal-grid">
                  {['S','M','T','W','T','F','S'].map(d => <div key={d} className="mini-cal-dayname">{d}</div>)}
                  {/* Simplified static mini grid for demo */}
                  {Array.from({length: 35}, (_, i) => {
                    const dayNum = i - 2;
                    const isToday = moment().date() === dayNum && moment().month() === date.getMonth();
                    return <div key={i} className={`mini-cal-day ${isToday ? 'active' : ''}`}>{dayNum > 0 && dayNum <= 31 ? dayNum : ''}</div>;
                  })}
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="panel-card">
              <div className="panel-header">
                <h4>Today's Schedule</h4>
                <span className="badge-count">2 Classes</span>
              </div>
              <div className="schedule-list">
                <div className="schedule-item" style={{borderLeftColor: '#dcfce7'}}>
                  <span className="schedule-time">05:00 PM - 06:00 PM</span>
                  <span className="schedule-title">Live: Pronunciation Clinic</span>
                  <span className="schedule-type">📘 Speaking Class</span>
                </div>
                <div className="schedule-item" style={{borderLeftColor: '#e0e7ff'}}>
                  <span className="schedule-time">04:00 PM - 05:30 PM</span>
                  <span className="schedule-title">Business English Class</span>
                  <span className="schedule-type">📘 Skills Class</span>
                </div>
              </div>
            </div>

            {/* Schedule Overview */}
            <div className="panel-card">
              <h4>Schedule Overview</h4>
              <div className="overview-stats">
                <div className="stat-box">
                  <div className="stat-icon blue">📄</div>
                  <div className="stat-num">14</div>
                  <div className="stat-label">Total Classes</div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon green">▶</div>
                  <div className="stat-num">7</div>
                  <div className="stat-label">Live Classes</div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon orange">⚒️</div>
                  <div className="stat-num">4</div>
                  <div className="stat-label">Workshops</div>
                </div>
                <div className="stat-box">
                  <div className="stat-icon purple">📘</div>
                  <div className="stat-num">3</div>
                  <div className="stat-label">Skill Classes</div>
                </div>
              </div>
            </div>

            {/* Upcoming Live Class */}
            <div className="panel-card upcoming-live-card">
              <div className="live-badge">🔴 LIVE</div>
              <h4>Upcoming Live Class</h4>
              <div className="upcoming-live-detail">
                <div className="user-avatar-small">🧑‍🏫</div>
                <div>
                  <span className="class-name">IELTS Speaking Practice</span>
                  <div className="class-meta">with Emma Watson</div>
                  <div className="class-time">🕐 Today, 04:00 PM</div>
                </div>
              </div>
              <button className="join-btn full-width">Join Now</button>
            </div>
          </aside>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
              <button className="close-btn" onClick={() => setShowEventModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Add title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="title-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start</label>
                <input
                  type="datetime-local"
                  value={moment(eventStart).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => setEventStart(new Date(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">End</label>
                <input
                  type="datetime-local"
                  value={moment(eventEnd).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => setEventEnd(new Date(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  placeholder="Add location"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Add description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Color Category</label>
                <div className="color-picker">
                  {[
                    {color: '#dcfce7', label: 'Live'},
                    {color: '#e0e7ff', label: 'Skills'},
                    {color: '#fef3c7', label: 'Workshop'},
                    {color: '#fce7f3', label: 'Speaking'},
                    {color: '#3174ad', label: 'Custom'}
                  ].map(c => (
                    <div
                      key={c.color}
                      className={`color-option ${eventColor === c.color ? 'active' : ''}`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                      onClick={() => setEventColor(c.color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {editingEvent ? (
                <button className="delete-btn" onClick={() => handleDeleteEvent(editingEvent.id)}>
                  Delete
                </button>
              ) : (
                <div></div>
              )}
              <div className="footer-right">
                <button className="cancel-btn" onClick={() => setShowEventModal(false)}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSaveEvent}>
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