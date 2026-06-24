import { config } from "./config";

async function sendEmail(toEmail: string, subject: string, htmlContent: string) {
  if (!config.sendgridApiKey) {
    console.log(`[EMAIL] Would send to ${toEmail}: ${subject}`);
    return;
  }
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: config.senderEmail },
        subject,
        content: [{ type: "text/html", value: htmlContent }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.log(`[EMAIL] SendGrid error ${res.status}: ${text}`);
    } else {
      console.log(`[EMAIL] Sent to ${toEmail}: ${res.status}`);
    }
  } catch (e) {
    console.log(`[EMAIL] Failed to ${toEmail}: ${e}`);
  }
}

export function sendPurchaseConfirmation(customerEmail: string, customerName: string, bookTitle: string, amount: number) {
  sendEmail(
    customerEmail,
    `Purchase Confirmed - ${bookTitle}`,
    `<h2>Thank you for your purchase, ${customerName}!</h2>
     <p>You have purchased <strong>${bookTitle}</strong>.</p>
     <p><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
     <p>Happy reading! You can access your book anytime from your dashboard.</p>`
  );
}

export function sendRentConfirmation(customerEmail: string, customerName: string, bookTitle: string, amount: number, rentalDays: number, dueDate: string) {
  sendEmail(
    customerEmail,
    `Rental Confirmed - ${bookTitle}`,
    `<h2>Rental Confirmed, ${customerName}!</h2>
     <p>You have rented <strong>${bookTitle}</strong> for <strong>${rentalDays} days</strong>.</p>
     <p><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
     <p><strong>Due Date:</strong> ${dueDate}</p>
     <p>Please return the book by the due date to avoid late fees.</p>`
  );
}

export function sendReturnRequestNotification(sellerEmail: string, sellerName: string, bookTitle: string, customerName: string) {
  sendEmail(
    sellerEmail,
    `Return Request - ${bookTitle}`,
    `<h2>Return Request Received</h2>
     <p>Hi ${sellerName},</p>
     <p>Customer <strong>${customerName}</strong> has requested to return <strong>${bookTitle}</strong>.</p>
     <p>Please review and approve or reject this request in your seller dashboard.</p>`
  );
}

export function sendReturnApprovedNotification(customerEmail: string, customerName: string, bookTitle: string, fineAmount: number = 0) {
  const fineMsg = fineAmount ? `<p><strong>Late fee charged:</strong> ₹${fineAmount.toFixed(2)}</p>` : "";
  sendEmail(
    customerEmail,
    `Return Approved - ${bookTitle}`,
    `<h2>Return Approved, ${customerName}!</h2>
     <p>Your request to return <strong>${bookTitle}</strong> has been approved.</p>
     ${fineMsg}
     <p>The book has been added back to inventory.</p>
     <p>Thank you for using E-Book Library!</p>`
  );
}

export function sendReturnRejectedNotification(customerEmail: string, customerName: string, bookTitle: string, reason: string) {
  sendEmail(
    customerEmail,
    `Return Request Rejected - ${bookTitle}`,
    `<h2>Return Request Rejected</h2>
     <p>Hi ${customerName},</p>
     <p>Your request to return <strong>${bookTitle}</strong> has been rejected.</p>
     <p><strong>Reason provided by seller:</strong></p>
     <blockquote style="border-left:4px solid #ccc;padding-left:12px;color:#555;">${reason}</blockquote>
     <p>If you have questions, please contact the seller for more details.</p>`
  );
}
