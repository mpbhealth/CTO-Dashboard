interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  status: string;
}

interface Employee {
  id: string;
  email: string;
  full_name: string;
  teams_user_id?: string;
}

interface SendAssignmentParams {
  assignment: Assignment;
  employee: Employee;
  projectName?: string;
  senderName: string;
}

interface CommunicationResult {
  success: boolean;
  error?: string;
}

export async function sendAssignmentViaTeams(params: SendAssignmentParams): Promise<CommunicationResult> {
  try {
    const { assignment, employee, projectName, senderName } = params;

    // Format the message
    const message = `
**New Assignment from ${senderName}**

**Title:** ${assignment.title}

**Description:** ${assignment.description}

${projectName ? `**Project:** ${projectName}` : ''}

${assignment.due_date ? `**Due Date:** ${new Date(assignment.due_date).toLocaleDateString()}` : ''}

**Status:** ${assignment.status.replace('_', ' ').toUpperCase()}

Please check your dashboard for more details.
    `.trim();

    // Mock Teams integration - in a real implementation, this would:
    // 1. Use Microsoft Graph API to send a Teams message
    // 2. Handle authentication and permissions
    // 3. Format the message according to Teams adaptive cards

    console.log('Sending Teams message:', {
      recipient: employee.email,
      message,
      teamsUserId: employee.teams_user_id
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send Teams message'
    };
  }
}

export async function sendAssignmentViaEmail(params: SendAssignmentParams): Promise<CommunicationResult> {
  try {
    const { assignment, employee, projectName, senderName } = params;

    // Format the email
    const subject = `New Assignment: ${assignment.title}`;
    const body = `
Dear ${employee.full_name || employee.email},

You have received a new assignment from ${senderName}.

Title: ${assignment.title}

Description:
${assignment.description}

${projectName ? `Project: ${projectName}\n` : ''}
${assignment.due_date ? `Due Date: ${new Date(assignment.due_date).toLocaleDateString()}\n` : ''}
Status: ${assignment.status.replace('_', ' ').toUpperCase()}

Please check your dashboard for more details and to update the status.

Best regards,
${senderName}
    `.trim();

    // Create mailto URL
    const mailtoUrl = `mailto:${employee.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open default email client
    if (typeof window !== 'undefined') {
      window.open(mailtoUrl, '_blank');
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open email client'
    };
  }
}

export async function copyAssignmentToClipboard(assignment: Assignment, projectName?: string): Promise<boolean> {
  try {
    const text = `
Assignment: ${assignment.title}

Description: ${assignment.description}

${projectName ? `Project: ${projectName}\n` : ''}
${assignment.due_date ? `Due Date: ${new Date(assignment.due_date).toLocaleDateString()}\n` : ''}
Status: ${assignment.status.replace('_', ' ').toUpperCase()}
    `.trim();

    if (typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else if (typeof window !== 'undefined') {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// Additional communication utilities
export function formatAssignmentForSlack(assignment: Assignment, projectName?: string): string {
  return `
*New Assignment*

*Title:* ${assignment.title}
*Description:* ${assignment.description}
${projectName ? `*Project:* ${projectName}\n` : ''}
${assignment.due_date ? `*Due Date:* ${new Date(assignment.due_date).toLocaleDateString()}\n` : ''}
*Status:* ${assignment.status.replace('_', ' ').toUpperCase()}
  `.trim();
}

export function generateAssignmentSummary(assignments: Assignment[]): string {
  const total = assignments.length;
  const byStatus = assignments.reduce((acc, assignment) => {
    acc[assignment.status] = (acc[assignment.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return `
Assignment Summary:
- Total: ${total}
- To Do: ${byStatus.todo || 0}
- In Progress: ${byStatus.in_progress || 0}
- Done: ${byStatus.done || 0}
  `.trim();
}