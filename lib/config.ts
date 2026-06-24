import "dotenv/config";

export const config = {
  commissionRate: parseFloat(process.env.COMMISSION_RATE || "0.15"),
  finePerDay: parseFloat(process.env.FINE_PER_DAY || "5.0"),
  returnDays: parseInt(process.env.RETURN_DAYS || "14", 10),
  sendgridApiKey: process.env.SENDGRID_API_KEY || "",
  senderEmail: process.env.SENDER_EMAIL || "patelhet.0507@gmail.com",
};
