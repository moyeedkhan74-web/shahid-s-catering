export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerName, customerPhone, items, totalAmount, orderRef, customerEmail } = req.body;

  // 1. Extra validation to find the "invalid email" issue
  if (!customerEmail || !customerEmail.includes('@')) {
    return res.status(400).json({ error: `The email you entered (${customerEmail}) is not valid.` });
  }

  // Using environment variables for security (GitHub blocks hardcoded keys)
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'deccancaterings1@gmail.com';

  if (!BREVO_API_KEY) {
    return res.status(500).json({ error: 'System Error: Brevo API Key is missing in Environment Variables.' });
  }

  try {
    // 1. Send Order Alert to Admin
    const adminRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Shahid Order System', email: ADMIN_EMAIL },
        to: [{ email: ADMIN_EMAIL }],
        subject: `[NEW ORDER] #${orderRef} - ${customerName}`,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #EEE; border-radius: 12px;">
            <h2 style="color: #2C1E0F;">NEW ORDER RECEIVED (#${orderRef})</h2>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Phone:</strong> ${customerPhone || 'Not provided'}</p>
            <p><strong>Customer Email:</strong> ${customerEmail}</p>
            <hr/>
            <h3>Items:</h3>
            <ul>
              ${items.map(item => `<li>${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`).join('')}
            </ul>
            <div style="background: #2C1E0F; color: #B8860B; padding: 15px; text-align: right; border-radius: 8px;">
               <p style="margin: 0;">GRAND TOTAL</p>
               <h2 style="margin: 0;">$${Number(totalAmount).toFixed(2)}</h2>
            </div>
          </div>
        `,
      }),
    });

    // 2. Send Confirmation to Customer
    const customerRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Deccan Catering', email: ADMIN_EMAIL },
        to: [{ email: customerEmail }],
        subject: `Order Received - #${orderRef}`,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #EEE; border-radius: 12px;">
            <h2 style="color: #2C1E0F;">Order Received!</h2>
            <p>Hi ${customerName},</p>
            <p>We've received your order <strong>#${orderRef}</strong>. We will process it after verifying your payment.</p>
            <p>Total Amount: <strong>$${totalAmount}</strong></p>
            <p>Thank you for choosing Deccan Catering!</p>
          </div>
        `,
      }),
    });

    if (!adminRes.ok) {
       const err = await adminRes.json();
       return res.status(400).json({ error: 'Admin Email Error: ' + err.message });
    }

    if (!customerRes.ok) {
        const err = await customerRes.json();
        return res.status(400).json({ error: 'Customer Email Error: ' + err.message });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'System Error: ' + error.message });
  }
}
