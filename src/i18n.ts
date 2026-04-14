import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "new_reflection": "New Reflection",
      "resources": "Resources",
      "badges": "Badges",
      "welcome": "Welcome back, {{name}}!",
      "week_status": "You're currently in Week {{week}} of your teaching practice.",
      "start_reflection": "Start Week {{week}} Reflection",
      "average_quality": "Average Quality",
      "completed": "Completed",
      "badges_earned": "Badges Earned",
      "recent_reflections": "Recent Reflections",
      "growth_analytics": "Growth Analytics",
      "top_focus": "Top Focus Areas",
      "reflection_depth": "Reflection Depth",
      "xp": "XP",
      "level": "Level",
      "streak": "Streak",
      "dark_mode": "Dark Mode",
      "language": "Language",
      "quick_mode": "Quick Mode",
      "description": "Description",
      "feelings": "Feelings",
      "evaluation": "Evaluation",
      "analysis": "Analysis",
      "conclusion": "Conclusion",
      "action_plan": "Action Plan",
      "video_reflection": "Video Reflection",
      "collaboration": "Collaboration",
      "peer_reflection": "Peer Reflection",
      "supervisor_reflection": "Supervisor Reflection",
      "write_reflection": "Write Reflection",
      "recipient_email": "Recipient Email",
      "send_invitation": "Send Invitation",
      "invitation_sent": "Invitation Sent Successfully!",
      "back_to_collaboration": "Back to Collaboration",
      "select_recipient_type": "Select Recipient Type",
      "reflection_placeholder": "Write your reflection here...",
      "comments": "Comments",
      "add_comment": "Add a comment...",
      "post_comment": "Post Comment",
      "no_comments": "No comments yet. Be the first to provide feedback!",
      "invitations_received": "Invitations Received",
      "my_sent_invitations": "My Sent Invitations",
      "accept": "Accept",
      "decline": "Decline",
      "view_details": "View Details",
      "connect_for_collaboration": "Connect with Google to Collaborate",
      "collaboration_login_desc": "You need to be signed in to send real invitations and receive feedback from peers and supervisors."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
