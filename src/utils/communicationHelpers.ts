export function sendEmail(to: string, subject: string, body: string) {
  console.log('Sending email:', { to, subject, body });
}

export function sendTeamsMessage(channelId: string, message: string) {
  console.log('Sending Teams message:', { channelId, message });
}

export function sendSlackMessage(channelId: string, message: string) {
  console.log('Sending Slack message:', { channelId, message });
}

export default {
  sendEmail,
  sendTeamsMessage,
  sendSlackMessage,
};
