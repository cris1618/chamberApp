// src/lib/email.ts
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.BOOKING_FROM_EMAIL;

if (!resendApiKey) {
  console.warn(
    "RESEND_API_KEY is not set. Booking confirmation emails will not be sent."
  );
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export type BookingEmailPayload = {
  to: string;
  requesterName: string;
  venueName: string;
  venueAddress?: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
};

export async function sendBookingConfirmationEmail(
  payload: BookingEmailPayload
) {
  if (!resend || !fromEmail) {
    console.warn(
      "Resend client or BOOKING_FROM_EMAIL not configured. Skipping email."
    );
    return;
  }

  const {
    to,
    requesterName,
    venueName,
    venueAddress,
    eventDate,
    startTime,
    endTime,
  } = payload;

  const subject = `Your booking request for ${venueName}`;

  const textBody = [
    `Hello ${requesterName},`,
    "",
    "Thank you for submitting a booking request. Here is a summary of your request:",
    "",
    `Venue: ${venueName}${venueAddress ? ` — ${venueAddress}` : ""}`,
    `Date: ${eventDate}`,
    `Start time: ${startTime}`,
    `End time: ${endTime}`,
    "",
    "The Chamber team will review your request and contact you.",
    "",
    "Best regards,",
    "Chamber of Commerce",
  ].join("\n");

  const htmlBody = `
    <p>Hello ${requesterName},</p>
    <p>Thank you for submitting a booking request. Here is a summary of your request:</p>
    <ul>
      <li><strong>Venue:</strong> ${venueName}${
        venueAddress ? ` — ${venueAddress}` : ""
      }</li>
      <li><strong>Date:</strong> ${eventDate}</li>
      <li><strong>Start time:</strong> ${startTime}</li>
      <li><strong>End time:</strong> ${endTime}</li>
    </ul>
    <p>
      The Chamber team will review your request.
    </p>
    <p>Best regards,<br/>Chamber of Commerce</p>
  `;

  const result = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    text: textBody,
    html: htmlBody,
  });

  console.log("Resend result:", result);
}
