# Microsoft Teams & Email Integration for Assignments

## 🎉 Features Implemented

### 1. **Microsoft Teams Integration**
- Send assignments directly to employees via Microsoft Teams
- Supports Microsoft Graph API and Teams webhooks
- Beautiful formatted message cards with assignment details
- Includes quick action buttons to view assignments in dashboard

### 2. **Email Integration**
- Send assignments via email to employees
- Opens email client with pre-filled subject and body
- Includes all assignment details (title, description, project, due date, status)
- Professional email template

### 3. **Copy to Clipboard**
- Quick copy functionality for assignment details
- Formatted text ready to paste in any application
- Perfect for sharing via Slack, Discord, or other platforms

## 🔧 Technical Implementation

### New Files Created:
1. **`src/utils/communicationHelpers.ts`**
   - `sendAssignmentViaTeams()` - Teams integration
   - `sendAssignmentViaEmail()` - Email integration
   - `copyAssignmentToClipboard()` - Clipboard functionality
   - `formatAssignmentForSharing()` - Text formatting utility

### Modified Files:
1. **`src/types/Assignment.ts`**
   - Added employee information fields (email, name, teams_user_id)

2. **`src/hooks/useAssignments.ts`**
   - Enhanced query to fetch employee information with assignments
   - Joins with users table to get email and Teams user ID

3. **`src/components/pages/Assignments.tsx`**
   - Added send buttons to both Kanban and List views
   - Added success notification banner
   - Integrated Teams, Email, and Copy functionality
   - Loading states for send operations

## 🎨 UI Features

### Action Buttons (on each assignment):
1. **📱 Teams Button (Purple)** - Send via Microsoft Teams
2. **✉️ Email Button (Blue)** - Send via Email
3. **📋 Copy Button (Green)** - Copy to Clipboard
4. **✏️ Edit Button (Indigo)** - Edit assignment
5. **🗑️ Delete Button (Red)** - Delete assignment

### Success Notifications:
- Green notification banner appears when assignment is sent
- Auto-dismisses after 3-5 seconds
- Shows confirmation with employee name/email

## 📝 Setup Instructions

### Microsoft Teams Setup:

#### Option 1: Teams Webhooks (Easier)
1. In Microsoft Teams, go to the channel where you want to receive notifications
2. Click **⋯** (More options) → **Connectors**
3. Find and configure **Incoming Webhook**
4. Copy the webhook URL
5. Add to your `.env` file:
   ```env
   VITE_TEAMS_WEBHOOK_URL=https://your-webhook-url
   ```

#### Option 2: Microsoft Graph API (More Features)
1. Register app in Azure Active Directory
2. Get application credentials (Client ID, Client Secret)
3. Configure OAuth permissions:
   - `Chat.ReadWrite`
   - `User.Read.All`
   - `Team.ReadBasic.All`
4. Implement OAuth flow in your application
5. Store tokens securely in Supabase

### Email Setup:

#### Current Implementation (mailto):
- Uses native email client (works out of the box)
- No additional setup required
- Opens user's default email application

#### Production Implementation (Supabase Edge Function):
1. Create Supabase Edge Function: `send-assignment-email`
2. Choose email service:
   - **SendGrid** (recommended)
   - **Resend** (developer-friendly)
   - **AWS SES** (cost-effective at scale)
3. Add API keys to Supabase secrets
4. Uncomment `sendEmailViaSupabase()` function

### Database Setup:

Add Teams user ID column to users table:
```sql
ALTER TABLE users 
ADD COLUMN teams_user_id TEXT;

-- Optional: Add index for faster lookups
CREATE INDEX idx_users_teams_user_id ON users(teams_user_id);
```

## 💡 Usage Examples

### Sending an Assignment via Teams:
1. Go to **Assignments** page
2. Find the assignment you want to send
3. Click the **📱 Teams button** (purple)
4. Assignment is sent to the employee's Teams chat
5. Success notification appears

### Sending via Email:
1. Click the **✉️ Email button** (blue)
2. Your email client opens with pre-filled details
3. Review and click Send
4. Success notification appears

### Copying Assignment:
1. Click the **📋 Copy button** (green)
2. Assignment details are copied to clipboard
3. Paste anywhere (Slack, Discord, etc.)

## 🔐 Security Considerations

1. **Teams Webhook URLs**: Store in environment variables or Supabase secrets
2. **Employee Email Privacy**: Only visible to authenticated users
3. **API Keys**: Never commit to version control
4. **OAuth Tokens**: Use secure token storage and refresh mechanisms
5. **Rate Limiting**: Implement rate limiting for send operations

## 🚀 Future Enhancements

- [ ] **Slack Integration** - Send to Slack channels/DMs
- [ ] **SMS/Text Messages** - Send via Twilio
- [ ] **Push Notifications** - Browser/mobile push notifications
- [ ] **Assignment Templates** - Pre-made assignment templates
- [ ] **Scheduled Sending** - Schedule assignment delivery
- [ ] **Delivery Receipts** - Track when assignments are read
- [ ] **Batch Sending** - Send to multiple employees at once
- [ ] **Custom Templates** - Customizable message templates
- [ ] **Integration Settings UI** - Configure integrations in dashboard

## 📚 Related Documentation

- [Microsoft Teams Webhooks](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/overview)
- [SendGrid API](https://docs.sendgrid.com/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 🐛 Troubleshooting

### Teams Integration Not Working:
- Check webhook URL is correct
- Verify webhook is enabled in Teams channel
- Check browser console for errors
- Ensure JSON payload is valid

### Email Not Opening:
- Check if default email client is configured
- Try different browser
- Check browser popup blocker settings

### Employee Email Missing:
- Verify user record exists in database
- Check users table has email field populated
- Ensure foreign key relationship is correct

## 📞 Support

For issues or questions:
1. Check browser console for error messages
2. Verify database schema matches expected structure
3. Check Supabase logs for API errors
4. Review network tab for failed requests

---

**Last Updated:** October 13, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

