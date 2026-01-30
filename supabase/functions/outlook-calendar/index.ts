import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface OutlookConfig {
  id: string;
  tenant_id: string;
  client_id: string;
  client_secret: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
}

interface CalendarEvent {
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
  showAs?: string;
  importance?: string;
}

// Generate demo calendar events
function generateDemoEvents(startDate: string, endDate: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const sampleEvents = [
    { subject: 'Team Standup', duration: 30, hour: 9 },
    { subject: 'Project Review', duration: 60, hour: 14 },
    { subject: 'Client Call', duration: 45, hour: 11 },
    { subject: 'Sprint Planning', duration: 120, hour: 10 },
    { subject: '1:1 with Manager', duration: 30, hour: 15 },
    { subject: 'Strategy Meeting', duration: 90, hour: 13 },
  ];

  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let day = 0; day < daysDiff; day++) {
    const currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + day);
    
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
    
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
}

async function getAccessToken(config: OutlookConfig): Promise<string> {
  // Check if current token is still valid
  if (config.access_token && config.token_expires_at) {
    const expiresAt = new Date(config.token_expires_at);
    if (expiresAt > new Date()) {
      return config.access_token;
    }
  }

  // Refresh the token using client credentials flow
  const tokenUrl = `https://login.microsoftonline.com/${config.tenant_id}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams();
  params.append('client_id', config.client_id);
  params.append('client_secret', config.client_secret);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('grant_type', 'client_credentials');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const tokenData = await response.json();
  
  // Update the stored token
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in - 60); // Subtract 60s buffer

  await supabaseClient
    .from('outlook_config')
    .update({
      access_token: tokenData.access_token,
      token_expires_at: expiresAt.toISOString(),
    })
    .eq('id', config.id);

  return tokenData.access_token;
}

async function getCalendarEvents(
  accessToken: string,
  startDate: string,
  endDate: string,
  userEmail?: string
): Promise<CalendarEvent[]> {
  const graphUrl = userEmail
    ? `https://graph.microsoft.com/v1.0/users/${userEmail}/calendar/calendarView`
    : 'https://graph.microsoft.com/v1.0/me/calendar/calendarView';
  
  const url = `${graphUrl}?startDateTime=${encodeURIComponent(startDate)}&endDateTime=${encodeURIComponent(endDate)}&$orderby=start/dateTime&$top=100`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch calendar events: ${response.statusText}`);
  }

  const data = await response.json();
  return data.value || [];
}

async function createCalendarEvent(
  accessToken: string,
  event: {
    subject: string;
    body?: string;
    start: string;
    end: string;
    isAllDay?: boolean;
    location?: string;
    attendees?: string[];
  },
  userEmail?: string
): Promise<CalendarEvent> {
  const graphUrl = userEmail
    ? `https://graph.microsoft.com/v1.0/users/${userEmail}/calendar/events`
    : 'https://graph.microsoft.com/v1.0/me/calendar/events';

  const eventBody: any = {
    subject: event.subject,
    start: {
      dateTime: event.start,
      timeZone: 'UTC',
    },
    end: {
      dateTime: event.end,
      timeZone: 'UTC',
    },
    isAllDay: event.isAllDay || false,
  };

  if (event.body) {
    eventBody.body = {
      contentType: 'text',
      content: event.body,
    };
  }

  if (event.location) {
    eventBody.location = {
      displayName: event.location,
    };
  }

  if (event.attendees && event.attendees.length > 0) {
    eventBody.attendees = event.attendees.map(email => ({
      emailAddress: { address: email },
      type: 'required',
    }));
  }

  const response = await fetch(graphUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!response.ok) {
    throw new Error(`Failed to create event: ${response.statusText}`);
  }

  return await response.json();
}

async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  userEmail?: string
): Promise<void> {
  const graphUrl = userEmail
    ? `https://graph.microsoft.com/v1.0/users/${userEmail}/calendar/events/${eventId}`
    : `https://graph.microsoft.com/v1.0/me/calendar/events/${eventId}`;

  const response = await fetch(graphUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to delete event: ${response.statusText}`);
  }
}

async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: {
    subject?: string;
    body?: string;
    start?: string;
    end?: string;
    isAllDay?: boolean;
    location?: string;
    attendees?: string[];
  },
  userEmail?: string
): Promise<CalendarEvent> {
  const graphUrl = userEmail
    ? `https://graph.microsoft.com/v1.0/users/${userEmail}/calendar/events/${eventId}`
    : `https://graph.microsoft.com/v1.0/me/calendar/events/${eventId}`;

  const eventBody: any = {};

  if (event.subject !== undefined) {
    eventBody.subject = event.subject;
  }

  if (event.start !== undefined) {
    eventBody.start = {
      dateTime: event.start,
      timeZone: 'UTC',
    };
  }

  if (event.end !== undefined) {
    eventBody.end = {
      dateTime: event.end,
      timeZone: 'UTC',
    };
  }

  if (event.isAllDay !== undefined) {
    eventBody.isAllDay = event.isAllDay;
  }

  if (event.body !== undefined) {
    eventBody.body = {
      contentType: 'text',
      content: event.body,
    };
  }

  if (event.location !== undefined) {
    eventBody.location = {
      displayName: event.location,
    };
  }

  if (event.attendees && event.attendees.length > 0) {
    eventBody.attendees = event.attendees.map(email => ({
      emailAddress: { address: email },
      type: 'required',
    }));
  }

  const response = await fetch(graphUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!response.ok) {
    throw new Error(`Failed to update event: ${response.statusText}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests - must return 200 OK for CORS to pass
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Parse request body first to handle JSON parsing errors
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if Outlook configuration exists
    const { data: configs, error: configError } = await supabaseClient
      .from('outlook_config')
      .select('*')
      .eq('is_active', true)
      .limit(1);
    const { action, startDate, endDate, event, eventId } = body;

    // If no config exists, return demo data
    if (configError || !configs || configs.length === 0) {
      console.log('No Outlook configuration found, returning demo data');
      
      if (action === 'getEvents') {
        const demoEvents = generateDemoEvents(
          startDate || new Date().toISOString(),
          endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        );
        
        return new Response(JSON.stringify({ 
          demo: true, 
          events: demoEvents,
          message: 'Outlook not configured - showing demo data'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        demo: true, 
        message: 'Outlook not configured - operation simulated',
        success: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = configs[0] as OutlookConfig;
    const accessToken = await getAccessToken(config);

    switch (action) {
      case 'getEvents': {
        const events = await getCalendarEvents(
          accessToken,
          startDate,
          endDate
        );
        
        return new Response(JSON.stringify({ events }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'createEvent': {
        const createdEvent = await createCalendarEvent(accessToken, event);
        
        return new Response(JSON.stringify({ event: createdEvent }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'deleteEvent': {
        await deleteCalendarEvent(accessToken, eventId);
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'updateEvent': {
        const updatedEvent = await updateCalendarEvent(accessToken, eventId, event);
        
        return new Response(JSON.stringify({ event: updatedEvent }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in outlook-calendar function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
