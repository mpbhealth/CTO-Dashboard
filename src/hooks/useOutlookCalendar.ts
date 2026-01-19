import { useState, useEffect, useCallback } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface CalendarEvent {
  id: string;
  subject: string;
  bodyPreview?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  isAllDay: boolean;
  organizer?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  attendees?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
    status: {
      response: string;
    };
  }>;
  categories?: string[];
  importance?: 'low' | 'normal' | 'high';
  showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
  webLink?: string;
  isOnlineMeeting?: boolean;
  onlineMeetingUrl?: string;
}

export interface CalendarEventCreate {
  subject: string;
  body?: string;
  start: string; // ISO date string
  end: string; // ISO date string
  isAllDay?: boolean;
  location?: string;
  attendees?: string[]; // email addresses
}

export interface UseOutlookCalendarOptions {
  autoRefresh?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Demo events for when Outlook is not configured
const generateDemoEvents = (startDate: Date, endDate: Date): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  
  // Generate some sample events
  const sampleEvents = [
    { subject: 'Team Standup', duration: 30, hour: 9, recurring: true },
    { subject: 'Project Review', duration: 60, hour: 14, recurring: false },
    { subject: 'Client Call', duration: 45, hour: 11, recurring: false },
    { subject: 'Sprint Planning', duration: 120, hour: 10, recurring: false },
    { subject: 'Lunch Break', duration: 60, hour: 12, recurring: true },
    { subject: '1:1 with Manager', duration: 30, hour: 15, recurring: false },
  ];

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let day = 0; day < daysDiff; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
    
    // Add 2-3 events per day
    const numEvents = Math.floor(Math.random() * 2) + 2;
    const shuffled = [...sampleEvents].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numEvents; i++) {
      const event = shuffled[i];
      const eventStart = new Date(currentDate);
      eventStart.setHours(event.hour, 0, 0, 0);
      
      const eventEnd = new Date(eventStart);
      eventEnd.setMinutes(eventEnd.getMinutes() + event.duration);
      
      events.push({
        id: `demo-event-${day}-${i}`,
        subject: event.subject,
        bodyPreview: `Demo event for ${event.subject}`,
        start: {
          dateTime: eventStart.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: eventEnd.toISOString(),
          timeZone: 'UTC',
        },
        isAllDay: false,
        organizer: {
          emailAddress: {
            name: 'Demo User',
            address: 'demo@mpbhealth.com',
          },
        },
        showAs: 'busy',
        importance: 'normal',
      });
    }
  }
  
  return events.sort((a, b) => 
    new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
  );
};

export function useOutlookCalendar(options: UseOutlookCalendarOptions = {}) {
  const { autoRefresh = false } = options;
  const { user, isDemoMode } = useAuth();
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Check if we should use demo mode
  const isInDemoMode = isDemoMode || !isSupabaseConfigured;

  // Get default date range (current week)
  const getDefaultDateRange = useCallback(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    return { startDate: startOfWeek, endDate: endOfWeek };
  }, []);

  const fetchEvents = useCallback(async (startDate?: Date, endDate?: Date) => {
    const dateRange = startDate && endDate 
      ? { startDate, endDate } 
      : getDefaultDateRange();

    // Demo mode: return demo events
    if (isInDemoMode) {
      const demoEvents = generateDemoEvents(dateRange.startDate, dateRange.endDate);
      setEvents(demoEvents);
      setIsConnected(false);
      setLoading(false);
      setError(null);
      return demoEvents;
    }

    try {
      setLoading(true);
      setSyncStatus('syncing');
      setError(null);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-calendar`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'getEvents',
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.demo) {
        // Edge function returned demo data (not connected)
        setIsConnected(false);
        setEvents(data.events || []);
      } else {
        setIsConnected(true);
        setEvents(data.events || []);
      }

      setSyncStatus('success');
      return data.events || [];
    } catch (err) {
      console.error('[useOutlookCalendar] Error fetching events:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch calendar events';
      setError(errorMessage);
      setSyncStatus('error');
      
      // Fall back to demo events on error
      const demoEvents = generateDemoEvents(dateRange.startDate, dateRange.endDate);
      setEvents(demoEvents);
      setIsConnected(false);
      return demoEvents;
    } finally {
      setLoading(false);
    }
  }, [isInDemoMode, getDefaultDateRange]);

  const createEvent = async (eventData: CalendarEventCreate) => {
    if (isInDemoMode) {
      // Create a demo event locally
      const newEvent: CalendarEvent = {
        id: `demo-event-${Date.now()}`,
        subject: eventData.subject,
        bodyPreview: eventData.body,
        start: {
          dateTime: eventData.start,
          timeZone: 'UTC',
        },
        end: {
          dateTime: eventData.end,
          timeZone: 'UTC',
        },
        isAllDay: eventData.isAllDay || false,
        location: eventData.location ? { displayName: eventData.location } : undefined,
        organizer: {
          emailAddress: {
            name: 'You',
            address: user?.email || 'demo@mpbhealth.com',
          },
        },
      };
      
      setEvents(prev => [...prev, newEvent].sort((a, b) => 
        new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
      ));
      
      return newEvent;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-calendar`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'createEvent',
          event: eventData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Refresh events after creation
      await fetchEvents();
      return data.event;
    } catch (err) {
      console.error('[useOutlookCalendar] Error creating event:', err);
      throw err;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (isInDemoMode) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      return;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-calendar`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'deleteEvent',
          eventId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.statusText}`);
      }

      // Refresh events after deletion
      await fetchEvents();
    } catch (err) {
      console.error('[useOutlookCalendar] Error deleting event:', err);
      throw err;
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<CalendarEventCreate>) => {
    if (isInDemoMode) {
      // Update the event locally in demo mode
      setEvents(prev => prev.map(e => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          subject: eventData.subject || e.subject,
          start: eventData.start ? { dateTime: eventData.start, timeZone: 'UTC' } : e.start,
          end: eventData.end ? { dateTime: eventData.end, timeZone: 'UTC' } : e.end,
          isAllDay: eventData.isAllDay ?? e.isAllDay,
          location: eventData.location ? { displayName: eventData.location } : e.location,
        };
      }));
      return;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outlook-calendar`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'updateEvent',
          eventId,
          event: eventData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Refresh events after update
      await fetchEvents();
      return data.event;
    } catch (err) {
      console.error('[useOutlookCalendar] Error updating event:', err);
      throw err;
    }
  };

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  }, [events]);

  // Get today's events
  const getTodayEvents = useCallback((): CalendarEvent[] => {
    return getEventsForDate(new Date());
  }, [getEventsForDate]);

  // Initial fetch
  useEffect(() => {
    fetchEvents(options.startDate, options.endDate);
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && !isInDemoMode) {
      const interval = setInterval(() => {
        fetchEvents(options.startDate, options.endDate);
      }, 5 * 60 * 1000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [autoRefresh, isInDemoMode, fetchEvents, options.startDate, options.endDate]);

  return {
    events,
    loading,
    error,
    isConnected,
    isInDemoMode,
    syncStatus,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getTodayEvents,
    refresh: () => fetchEvents(options.startDate, options.endDate),
  };
}
