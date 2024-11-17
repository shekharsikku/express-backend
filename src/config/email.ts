import { mailtrapClient, mailtrapSender, mailtrapRecipient } from "./mailtrap";

export const sendVerificationEmail = async (email: string, code: string) => {
  try {
    const response = await mailtrapClient.send({
      from: mailtrapSender,
      to: mailtrapRecipient,
      subject: "Verify Your Email!",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #414141;">
          <p style="margin: 0 0 16px;">Hello User,</p>
          <p style="margin: 0 0 16px;">
            Please, verify your email address <span style="font-weight: 500;">${email}</span> 
            using the following verification code!
          </p>
          <p style="font-size: 20px; font-weight: 600; letter-spacing: 1.5px; margin: 0 0 16px;">${code}</p>
          <p style="margin: 0;">Thank You!</p>
        </div>
      `,
      category: "Verification",
    });
    console.log("Verification email response:", response);
    return true;
  } catch (error: any) {
    console.error(`Error sending verification email: ${error.message}`);
    return false;
  }
};

export const sendWelcomeEmail = async (email: string) => {
  try {
    const response = await mailtrapClient.send({
      from: mailtrapSender,
      to: mailtrapRecipient,
      subject: "Verification Complete!",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #414141;">
          <p style="margin: 0 0 16px;">Welcome User,</p>
          <p style="margin: 0 0 16px;">
            Your email address <span style="font-weight: 500;">${email}</span> verified successfully!
          </p>
          <p style="margin: 0;">Thank You!</p>
        </div>
      `,
      category: "Welcome",
    });
    console.log("Welcome email response:", response);
    return true;
  } catch (error: any) {
    console.log(`Error sending welcome email: ${error.message}`);
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string, code: string) => {
  try {
    const response = await mailtrapClient.send({
      from: mailtrapSender,
      to: mailtrapRecipient,
      subject: "Reset Your Password!",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #414141;">
          <p style="margin: 0 0 16px;">Hello User,</p>
          <p style="margin: 0 0 16px;">
            Use the following code to reset your password for email <span style="font-weight: 500;">${email}</span>. 
            This code will expires in one hour after issue!
          </p>
          <p style="font-size: 20px; font-weight: 600; letter-spacing: 1.5px; margin: 0 0 16px;">${code}</p>
          <p style="margin: 0;">Thank You!</p>
        </div>
      `,
      category: "Reset",
    });
    console.log("Reset password email response:", response);
    return true;
  } catch (error: any) {
    console.log(`Error sending password reset email: ${error.message}`);
    return false;
  }
};

export const sendResetSuccessEmail = async (email: string) => {
  try {
    const response = await mailtrapClient.send({
      from: mailtrapSender,
      to: mailtrapRecipient,
      subject: "Password Successfully Reset",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #414141;">
          <p style="margin: 0 0 16px;">Welcome User,</p>
          <p style="margin: 0 0 16px;">
            Your password for your email address <span style="font-weight: 500;">${email}</span> reset successfully!
          </p>
          <p style="margin: 0;">Thank You!</p>
        </div>
      `,
      category: "Reset",
    });
    console.log("Password reset email sent response:", response);
    return true;
  } catch (error: any) {
    console.log(`Error sending password reset success email: ${error.message}`);
    return false;
  }
};
