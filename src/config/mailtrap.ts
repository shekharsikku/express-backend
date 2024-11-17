import { MailtrapClient, MailtrapClientConfig } from "mailtrap";
import env from "../utils/env";

interface CustomMailtrapClientConfig extends MailtrapClientConfig {
  endpoint?: string;
}

export const mailtrapClient = new MailtrapClient({
  token: env.MAILTRAP_TOKEN,
  endpoint: env.MAILTRAP_ENDPOINT,
} as CustomMailtrapClientConfig);

export const mailtrapSender = {
  email: "mailtrap@demomailtrap.com",
  name: "Mailtrap Email",
};

export const mailtrapRecipient = [
  {
    email: env.MAILTRAP_EMAIL,
  },
];

/*
mailtrapClient
  .send({
    from: mailtrapSender,
    to: mailtrapRecipients,
    subject: "You are awesome!",
    text: "Congrats for sending test email with Mailtrap!",
    category: "Integration Test",
  })
  .then(console.log, console.error);
*/
