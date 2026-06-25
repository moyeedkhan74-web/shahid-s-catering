export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerName, customerPhone, items, totalAmount } = req.body;

  if (!customerName || !customerPhone || !items || !totalAmount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  if (!BREVO_API_KEY || !ADMIN_EMAIL) {
    console.error('Environment variables BREVO_API_KEY or ADMIN_EMAIL are missing');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Deccan Catering Order Bot', email: 'no-reply@deccan.com' },
        to: [{ email: ADMIN_EMAIL }],
        subject: `New Order Received - ${customerName}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 700px; margin: auto; border: 1px solid #ddd; padding: 30px; border-radius: 12px; color: #2C1E0F;">
            <h2 style="color: #B8860B; text-align: center; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 2px;">New Catering Order</h2>
            
            <div style="background: #F8F5F0; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #2C1E0F;">
              <h3 style="margin-top: 0; font-size: 16px; text-transform: uppercase;">Customer Details</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${customerPhone}</p>
            </div>

            <h3 style="text-transform: uppercase; font-size: 14px; border-bottom: 2px solid #EEE; padding-bottom: 10px; margin-bottom: 15px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr style="background: #F7F3EE; text-align: left;">
                  <th style="padding: 12px; border-bottom: 1px solid #DDD;">Item Name</th>
                  <th style="padding: 12px; border-bottom: 1px solid #DDD; text-align: center;">Qty</th>
                  <th style="padding: 12px; border-bottom: 1px solid #DDD; text-align: right;">Price</th>
                  <th style="padding: 12px; border-bottom: 1px solid #DDD; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #EEE;">${item.name}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #EEE; text-align: center;">${item.quantity}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #EEE; text-align: right;">$${Number(item.price).toFixed(2)}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #EEE; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="background: #2C1E0F; color: #B8860B; padding: 25px; border-radius: 12px; text-align: right;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #EDE8D0;">Grand Total</p>
              <h2 style="margin: 0; font-size: 32px; font-weight: 900;">$${Number(totalAmount).toFixed(2)}</h2>
            </div>

            <p style="font-size: 12px; color: #999; margin-top: 40px; text-align: center; border-top: 1px solid #EEE; padding-top: 20px;">
              Deccan Catering Management System Notification
            </p>
          </div>
        `,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true, messageId: result.messageId });
    } else {
      console.error('Brevo Error:', result);
      return res.status(response.status).json({ error: result.message || 'Failed to send admin notification' });
    }
  } catch (error) {
    console.error('Serverless Function Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
