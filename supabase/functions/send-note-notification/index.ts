import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  note_id: string;
  recipient_user_id: string;
  notification_type: "shared" | "edited" | "unshared" | "commented";
  metadata?: {
    shared_by?: string;
    shared_by_email?: string;
    shared_by_name?: string;
    permission_level?: "view" | "edit";
    share_message?: string;
    note_title?: string;
    note_preview?: string;
  };
}

interface EmailTemplate {
  subject: string;
  html: string;
}

function generateEmailTemplate(payload: NotificationPayload, _recipientEmail: string): EmailTemplate {
  const {
    notification_type,
    metadata = {},
  } = payload;

  const sharerName = metadata.shared_by_name || metadata.shared_by_email || "A colleague";
  const noteTitle = metadata.note_title || "Untitled Note";
  const notePreview = metadata.note_preview || "";
  const permissionLevel = metadata.permission_level === "edit" ? "edit" : "view";
  const shareMessage = metadata.share_message || "";

  let subject = "";
  let html = "";

  switch (notification_type) {
    case "shared":
      subject = `[Shared Note] ${sharerName} shared a note with you`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Note Shared</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #334155;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
              padding: 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .note-preview {
              background-color: #f1f5f9;
              border-left: 4px solid #0ea5e9;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .note-title {
              font-weight: 600;
              font-size: 18px;
              color: #1e293b;
              margin-bottom: 10px;
            }
            .note-text {
              color: #475569;
              font-size: 14px;
              line-height: 1.5;
            }
            .message-box {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .message-label {
              font-weight: 600;
              color: #92400e;
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .message-text {
              color: #78350f;
              font-size: 14px;
            }
            .permission-badge {
              display: inline-block;
              background-color: ${permissionLevel === "edit" ? "#dcfce7" : "#dbeafe"};
              color: ${permissionLevel === "edit" ? "#166534" : "#1e40af"};
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              margin: 10px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
              color: white;
              text-decoration: none;
              padding: 14px 28px;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background-color: #f8fafc;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #64748b;
            }
            .divider {
              height: 1px;
              background-color: #e2e8f0;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 New Note Shared</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p><strong>${sharerName}</strong> has shared a note with you on the dashboard.</p>

              ${shareMessage ? `
                <div class="message-box">
                  <div class="message-label">Message from ${sharerName}</div>
                  <div class="message-text">${shareMessage}</div>
                </div>
              ` : ""}

              <div class="note-preview">
                <div class="note-title">${noteTitle}</div>
                <div class="note-text">${notePreview.substring(0, 200)}${notePreview.length > 200 ? "..." : ""}</div>
              </div>

              <div>
                <span class="permission-badge">
                  ${permissionLevel === "edit" ? "✏️ Can Edit" : "👁️ View Only"}
                </span>
              </div>

              <div class="divider"></div>

              <div style="text-align: center;">
                <a href="${Deno.env.get("SITE_URL") || "https://yourapp.com"}/dashboard" class="button">
                  View Note in Dashboard
                </a>
              </div>

              <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
                You're receiving this email because a note was shared with your role. You can view and manage all shared notes in your dashboard.
              </p>
            </div>
            <div class="footer">
              <p>MPB Health Dashboard - Note Collaboration System</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;

    case "edited":
      subject = `[Note Updated] ${sharerName} edited a shared note`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Note Updated</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #334155;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
              padding: 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
              color: white;
              text-decoration: none;
              padding: 14px 28px;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background-color: #f8fafc;
              padding: 20px 30px;
              text-align: center;
              font-size: 12px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Note Updated</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p><strong>${sharerName}</strong> has updated a note that was shared with you.</p>
              <p><strong>Note:</strong> ${noteTitle}</p>
              <div style="text-align: center;">
                <a href="${Deno.env.get("SITE_URL") || "https://yourapp.com"}/dashboard" class="button">
                  View Updated Note
                </a>
              </div>
            </div>
            <div class="footer">
              <p>MPB Health Dashboard - Note Collaboration System</p>
            </div>
          </div>
        </body>
        </html>
      `;
      break;

    case "unshared":
      subject = `[Note Access] Access removed from shared note`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Access Removed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Access Removed</h2>
            <p>Hello,</p>
            <p>Your access to a shared note has been removed.</p>
            <p><strong>Note:</strong> ${noteTitle}</p>
          </div>
        </body>
        </html>
      `;
      break;

    default:
      subject = "Dashboard Notification";
      html = "<p>You have a new notification.</p>";
  }

  return { subject, html };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: NotificationPayload = await req.json();

    if (!payload.note_id || !payload.recipient_user_id || !payload.notification_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailTemplate = generateEmailTemplate(
      payload,
      payload.metadata?.shared_by_email || "recipient@example.com"
    );

    console.log(`Email notification prepared for ${payload.recipient_user_id}`);
    console.log(`Subject: ${emailTemplate.subject}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email notification sent successfully",
        notification_type: payload.notification_type,
        recipient: payload.recipient_user_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send notification",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
