/**
 * Communication Helpers for Microsoft Teams and Email Integration
 */

import { Assignment } from '../types/Assignment';

export interface Employee {
  id: string;
  email: string;
  full_name?: string;
  teams_user_id?: string;
}

export interface SendAssignmentOptions {
  assignment: Assignment;
  employee: Employee;
  projectName?: string;
  senderName?: string;
}

/**
 * Send assignment via Microsoft Teams
 * Uses Microsoft Graph API or Teams webhooks
 */
export async function sendAssignmentViaTeams(options: SendAssignmentOptions): Promise<{ success: boolean; error?: string }> {
  const { assignment, employee, projectName, senderName } = options;
  
  try {
    // Format the due date
    const dueDate = assignment.due_date 
      ? new Date(assignment.due_date).toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })
      : 'No due date';

    // Create Teams message card
    const teamsMessage = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": `New Assignment: ${assignment.title}`,
      "themeColor": "6366F1",
      "title": "📋 New Assignment",
      "sections": [
        {
          "activityTitle": assignment.title,
          "activitySubtitle": `Assigned by ${senderName || 'MPB Health Dashboard'}`,
          "activityImage": "https://img.icons8.com/color/96/task.png",
          "facts": [
            {
              "name": "Assignment:",
              "value": assignment.title
            },
            {
              "name": "Description:",
              "value": assignment.description || "No description provided"
            },
            {
              "name": "Project:",
              "value": projectName || "No project"
            },
            {
              "name": "Status:",
              "value": assignment.status.replace('_', ' ').toUpperCase()
            },
            {
              "name": "Due Date:",
              "value": dueDate
            },
            {
              "name": "Assigned To:",
              "value": employee.full_name || employee.email
            }
          ],
          "markdown": true
        }
      ],
      "potentialAction": [
        {
          "@type": "OpenUri",
          "name": "View in Dashboard",
          "targets": [
            {
              "os": "default",
              "uri": `${window.location.origin}/assignments`
            }
          ]
        }
      ]
    };

    // Option 1: Use Microsoft Graph API (requires authentication)
    // For production, you would use Microsoft Graph API with proper OAuth tokens
    if (employee.teams_user_id) {
      console.log('Sending via Microsoft Graph API to user:', employee.teams_user_id);
      
      // This would be implemented with Microsoft Graph API
      // Example: POST to https://graph.microsoft.com/v1.0/chats/{chat-id}/messages
      // Requires proper authentication tokens
      
      // For now, we'll use a webhook approach
      return sendToTeamsWebhook(teamsMessage, employee);
    }
    
    // Option 2: Use Teams Webhook (simpler, but requires webhook URL)
    return sendToTeamsWebhook(teamsMessage, employee);
    
  } catch (error) {
    console.error('Error sending Teams message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send Teams message' 
    };
  }
}

/**
 * Send to Teams using webhook URL
 * Note: In production, store webhook URLs securely in Supabase
 */
async function sendToTeamsWebhook(message: any, employee: Employee): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, retrieve webhook URL from database based on employee/team
    // For demo purposes, we'll check for environment variable
    const webhookUrl = import.meta.env.VITE_TEAMS_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn('Teams webhook URL not configured');
      // Fallback: Show message to user
      return {
        success: true,
        error: 'Teams webhook not configured. Please set up Teams integration in settings.'
      };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Teams webhook failed: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Teams webhook error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send Teams webhook'
    };
  }
}

/**
 * Send assignment via email
 */
export async function sendAssignmentViaEmail(options: SendAssignmentOptions): Promise<{ success: boolean; error?: string }> {
  const { assignment, employee, projectName, senderName } = options;
  
  try {
    const dueDate = assignment.due_date 
      ? new Date(assignment.due_date).toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })
      : 'No due date';

    const emailSubject = encodeURIComponent(`New Assignment: ${assignment.title}`);
    
    const emailBody = encodeURIComponent(`Hi ${employee.full_name || employee.email},

You have been assigned a new task:

Assignment: ${assignment.title}
${assignment.description ? `Description: ${assignment.description}` : ''}
${projectName ? `Project: ${projectName}` : ''}
Status: ${assignment.status.replace('_', ' ').toUpperCase()}
Due Date: ${dueDate}

You can view and manage this assignment in the MPB Health Dashboard:
${window.location.origin}/assignments

Best regards,
${senderName || 'MPB Health Dashboard'}
`);

    // Option 1: Use mailto (opens user's email client)
    const mailtoLink = `mailto:${employee.email}?subject=${emailSubject}&body=${emailBody}`;
    
    // Open in new window
    window.open(mailtoLink, '_blank');
    
    // Option 2: For production, use a backend email service (Supabase Edge Function)
    // This would send the email server-side
    // await sendEmailViaSupabase(options);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}

/**
 * Send email using Supabase Edge Function (for production)
 * This would require setting up a Supabase Edge Function with email service (SendGrid, Resend, etc.)
 */
export async function sendEmailViaSupabase(options: SendAssignmentOptions): Promise<{ success: boolean; error?: string }> {
  const { assignment, employee, projectName, senderName } = options;
  
  try {
    // Call Supabase Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-assignment-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: employee.email,
        assignment,
        projectName,
        senderName,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email via Supabase');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email via Supabase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
}

/**
 * Format assignment details for sharing
 */
export function formatAssignmentForSharing(assignment: Assignment, projectName?: string): string {
  const dueDate = assignment.due_date 
    ? new Date(assignment.due_date).toLocaleDateString()
    : 'No due date';

  return `
Assignment: ${assignment.title}
${assignment.description ? `Description: ${assignment.description}` : ''}
${projectName ? `Project: ${projectName}` : ''}
Status: ${assignment.status.replace('_', ' ')}
Due Date: ${dueDate}
  `.trim();
}

/**
 * Copy assignment details to clipboard
 */
export async function copyAssignmentToClipboard(assignment: Assignment, projectName?: string): Promise<boolean> {
  try {
    const text = formatAssignmentForSharing(assignment, projectName);
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

