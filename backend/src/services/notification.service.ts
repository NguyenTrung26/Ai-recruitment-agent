import axios from "axios";
import { config } from "../config.ts";
import { logger } from "./logger.service.ts";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SlackNotification {
  channel?: string;
  text: string;
  blocks?: any[];
}

export interface TeamsNotification {
  text: string;
  title?: string;
  sections?: any[];
}

/**
 * Send email via n8n webhook or external service
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const emailWebhook = process.env.EMAIL_WEBHOOK_URL || config.n8n.webhookUrl;
    
    await axios.post(emailWebhook, {
      type: "email",
      to: options.to,
      subject: options.subject,
      html: options.html,
      from: options.from || process.env.EMAIL_FROM || "noreply@recruitment.com",
    });
    
    logger.info({ to: options.to, subject: options.subject }, "Email sent");
    return true;
  } catch (error: any) {
    logger.error({ error: error.message, to: options.to }, "Failed to send email");
    return false;
  }
};

/**
 * Send Slack notification
 */
export const sendSlackNotification = async (
  notification: SlackNotification
): Promise<boolean> => {
  try {
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    if (!slackWebhook) {
      logger.warn("Slack webhook URL not configured");
      return false;
    }
    
    await axios.post(slackWebhook, {
      channel: notification.channel,
      text: notification.text,
      blocks: notification.blocks,
    });
    
    logger.info({ channel: notification.channel }, "Slack notification sent");
    return true;
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to send Slack notification");
    return false;
  }
};

/**
 * Send Teams notification
 */
export const sendTeamsNotification = async (
  notification: TeamsNotification
): Promise<boolean> => {
  try {
    const teamsWebhook = process.env.TEAMS_WEBHOOK_URL;
    if (!teamsWebhook) {
      logger.warn("Teams webhook URL not configured");
      return false;
    }
    
    await axios.post(teamsWebhook, {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: notification.title || notification.text,
      themeColor: "0078D4",
      title: notification.title,
      text: notification.text,
      sections: notification.sections,
    });
    
    logger.info("Teams notification sent");
    return true;
  } catch (error: any) {
    logger.error({ error: error.message }, "Failed to send Teams notification");
    return false;
  }
};

/**
 * Send interview invitation email
 */
export const sendInterviewInvitation = async (
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  calendlyLink?: string
): Promise<boolean> => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Chúc mừng ${candidateName}!</h1>
    </div>
    <div class="content">
      <p>Xin chào ${candidateName},</p>
      <p>Chúng tôi rất vui mừng thông báo rằng hồ sơ của bạn đã vượt qua vòng sàng lọc cho vị trí <strong>${jobTitle}</strong>.</p>
      <p>Chúng tôi muốn mời bạn tham gia phỏng vấn để tìm hiểu thêm về kinh nghiệm và kỹ năng của bạn.</p>
      ${calendlyLink ? `<p style="text-align: center;"><a href="${calendlyLink}" class="button">Đặt lịch phỏng vấn</a></p>` : ""}
      <p>Vui lòng liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.</p>
      <p>Trân trọng,<br>Đội ngũ Tuyển dụng</p>
    </div>
    <div class="footer">
      <p>Email này được gửi tự động. Vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: candidateEmail,
    subject: `Mời phỏng vấn - Vị trí ${jobTitle}`,
    html,
  });
};

/**
 * Send rejection feedback email
 */
export const sendRejectionFeedback = async (
  candidateName: string,
  candidateEmail: string,
  jobTitle: string,
  feedback: string,
  missingSkills?: string[]
): Promise<boolean> => {
  const skillsList = missingSkills && missingSkills.length > 0
    ? `<p>Kỹ năng cần cải thiện:</p><ul>${missingSkills.map(s => `<li>${s}</li>`).join("")}</ul>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Cảm ơn ${candidateName}</h1>
    </div>
    <div class="content">
      <p>Xin chào ${candidateName},</p>
      <p>Cảm ơn bạn đã dành thời gian ứng tuyển vào vị trí <strong>${jobTitle}</strong> tại công ty chúng tôi.</p>
      <p>Sau khi xem xét kỹ lưỡng, chúng tôi rất tiếc phải thông báo rằng chúng tôi sẽ không tiếp tục với hồ sơ của bạn cho vị trí này.</p>
      ${skillsList}
      <p><strong>Nhận xét:</strong> ${feedback}</p>
      <p>Chúng tôi khuyến khích bạn tiếp tục phát triển các kỹ năng trên và ứng tuyển lại trong tương lai.</p>
      <p>Chúc bạn thành công trong sự nghiệp!</p>
      <p>Trân trọng,<br>Đội ngũ Tuyển dụng</p>
    </div>
    <div class="footer">
      <p>Email này được gửi tự động. Vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: candidateEmail,
    subject: `Thông báo kết quả ứng tuyển - Vị trí ${jobTitle}`,
    html,
  });
};

/**
 * Send notification to recruiter about new candidate
 */
export const notifyRecruiter = async (
  candidateName: string,
  candidateId: string,
  jobTitle: string,
  score: number,
  status: string
): Promise<void> => {
  const statusEmoji = status === "screening-passed" ? "✅" : status === "borderline" ? "⚠️" : "❌";
  const color = status === "screening-passed" ? "good" : status === "borderline" ? "warning" : "danger";

  const slackMessage = {
    text: `${statusEmoji} Ứng viên mới: ${candidateName}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Ứng viên mới*\n*Tên:* ${candidateName}\n*Vị trí:* ${jobTitle}\n*Điểm:* ${score}/100\n*Trạng thái:* ${status}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Xem chi tiết" },
            url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/candidates/${candidateId}`,
            style: "primary",
          },
        ],
      },
    ],
  };

  const teamsMessage = {
    title: `${statusEmoji} Ứng viên mới: ${candidateName}`,
    text: `**Vị trí:** ${jobTitle}\n**Điểm:** ${score}/100\n**Trạng thái:** ${status}`,
    sections: [
      {
        activityTitle: candidateName,
        activitySubtitle: jobTitle,
        facts: [
          { name: "Điểm AI", value: score.toString() },
          { name: "Trạng thái", value: status },
          { name: "Candidate ID", value: candidateId },
        ],
      },
    ],
  };

  await Promise.allSettled([
    sendSlackNotification(slackMessage),
    sendTeamsNotification(teamsMessage),
  ]);
};
