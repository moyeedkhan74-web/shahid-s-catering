export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, orderDetails, orderRef, totalAmount } = req.body;

  if (!email || !orderRef) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY is missing');
    return res.status(500).json({ error: 'Mail service configuration missing' });
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
        sender: { name: 'Deccan Catering', email: 'catering.deccan@gmail.com' },
        to: [{ email }],
        subject: `Order Received - #${orderRef}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #2C1E0F; text-transform: uppercase;">Order Confirmed</h2>
            <p>Hello,</p>
            <p>Thank you for choosing Deccan Catering. We have received your order details and represent your order with reference number <strong>#${orderRef}</strong>.</p>
            
            <div style="background: #EDE8D0; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; font-weight: bold; color: #B8860B;">Total Amount</p>
              <p style="margin: 0; font-size: 24px; font-weight: 900; color: #2C1E0F;">$${totalAmount}</p>
            </div>

            <h3>Order Summary:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${orderDetails.map(item => `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                    <strong>${item.name}</strong><br/>
                    <span style="font-size: 12px; color: #666;">Quantity: ${item.quantity}</span>
                  </td>
                  <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #eee;">
                    $${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              `).join('')}
            </table>

            <div style="margin-top: 30px; padding: 20px; background: #F5F5DC; border-radius: 10px; border-left: 4px solid #B8860B;">
              <p style="margin: 0; font-weight: bold;">Next Steps:</p>
              <p style="margin: 5px 0 0; font-size: 14px;">Please ensure your Zelle payment of <strong>$${totalAmount}</strong> to <strong>catering.deccan@gmail.com</strong> is completed with memo <strong>#${orderRef}</strong>. Your order will be processed once payment is verified.</p>
            </div>

            <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
              Deccan Catering & Events © 2026
            </p>
          </div>
        `,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true, messageId: result.messageId });
    } else {
      return res.status(response.status).json({ error: result.message || 'Failed to send email' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
