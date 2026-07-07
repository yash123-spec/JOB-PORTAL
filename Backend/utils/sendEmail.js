import nodemailer from 'nodemailer';

// Create transporter with Gmail configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD  // Use App Password for Gmail
    }
  });
};



// Recruiter Approval Email
export const sendApprovalEmail = async (email, fullname) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Your Recruiter Account has been Approved!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-icon { font-size: 48px; margin-bottom: 10px; }
            .btn { display: inline-block; background: #11998e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Account Approved!</h1>
            </div>
            <div class="content">
              <p>Dear ${fullname},</p>
              <p>Congratulations! Your recruiter account has been approved by our admin team.</p>
              <p>You can now:</p>
              <ul>
                <li>Post job openings</li>
                <li>View and manage applications</li>
                <li>Connect with talented candidates</li>
                <li>Update application statuses</li>
              </ul>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/login" class="btn">Login to Dashboard</a>
              </p>
              <p>Welcome to Job Portal! We're excited to have you on board.</p>
              <p>Best regards,<br>Job Portal Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Approval Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
};

// Recruiter Rejection Email
export const sendRejectionEmail = async (email, fullname, reason, blockDuration) => {
  try {
    const transporter = createTransporter();

    let reapplyMessage = '';
    if (blockDuration === 'permanent') {
      reapplyMessage = 'You are permanently blocked from reapplying.';
    } else if (blockDuration === 'none') {
      reapplyMessage = 'You can reapply immediately if you wish.';
    } else {
      const durationText = {
        '1week': '1 week',
        '2weeks': '2 weeks',
        '1month': '1 month',
        '2months': '2 months'
      }[blockDuration];
      reapplyMessage = `You can reapply after ${durationText}.`;
    }

    const mailOptions = {
      from: `"Job Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recruiter Account Application Update',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .reason-box { background: white; border-left: 4px solid #f5576c; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Status Update</h1>
            </div>
            <div class="content">
              <p>Dear ${fullname},</p>
              <p>Thank you for your interest in becoming a recruiter on Job Portal.</p>
              <p>After careful review, we regret to inform you that your application has not been approved at this time.</p>
              
              ${reason ? `
              <div class="reason-box">
                <strong>Reason:</strong><br>
                ${reason}
              </div>
              ` : ''}
              
              <p><strong>${reapplyMessage}</strong></p>
              
              <p>If you have any questions or would like to discuss this decision, please contact our support team.</p>
              
              <p>Best regards,<br>Job Portal Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw error;
  }
};

export default {
  sendApprovalEmail,
  sendRejectionEmail
};
