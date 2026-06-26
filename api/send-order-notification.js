export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerName, customerPhone, items, totalAmount, orderRef } = req.body;

  if (!customerName || !items || !totalAmount || !orderRef) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'deccancaterings1@gmail.com';

  if (!BREVO_API_KEY) {
    console.error('Environment variable BREVO_API_KEY is missing');
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
        sender: { name: 'Deccan Order System', email: 'deccancaterings1@gmail.com' },
        to: [{ email: ADMIN_EMAIL }],
        subject: `NEW ORDER: #${orderRef} - ${customerName}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #EEE; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #2C1E0F; color: #B8860B; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">NEW ORDER ALERT</h1>
              <p style="color: #EDE8D0; margin: 5px 0 0; font-size: 14px;">Order Reference: #${orderRef}</p>
            </div>
            
            <div style="padding: 20px;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #EEE;"><strong>Customer Name:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #EEE;">${customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #EEE;"><strong>Contact Phone:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #EEE;">${customerPhone || 'Not provided'}</td>
                </tr>
              </table>

              <h3 style="color: #2C1E0F; text-transform: uppercase;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #F8F5F0; text-align: left;">
                    <th style="padding: 10px; border-bottom: 1px solid #DDD;">Item</th>
                    <th style="padding: 10px; border-bottom: 1px solid #DDD; text-align: center;">Qty</th>
                    <th style="padding: 10px; border-bottom: 1px solid #DDD; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #EEE;">${item.name}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #EEE; text-align: center;">${item.quantity}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #EEE; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="margin-top: 20px; background-color: #2C1E0F; padding: 20px; border-radius: 8px; color: #B8860B; text-align: right;">
                <p style="margin: 0; font-size: 12px; color: #EDE8D0;">TOTAL MONEY TO RECEIVE</p>
                <h2 style="margin: 0; font-size: 32px;">$${Number(totalAmount).toFixed(2)}</h2>
              </div>
              
              <p style="font-size: 12px; color: #777; margin-top: 25px; text-align: center;">
                Check Zelle for memo #${orderRef} before processing.
              </p>
            </div>
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
