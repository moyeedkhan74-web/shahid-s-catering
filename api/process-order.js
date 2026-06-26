export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerName, customerPhone, items, totalAmount, orderRef, customerEmail } = req.body;

  if (!customerEmail || !customerEmail.includes('@')) {
    return res.status(400).json({ error: `The email you entered (${customerEmail}) is not valid.` });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'deccancaterings1@gmail.com';

  const luxuryStyle = `
    background-color: #FDFBF7;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #2C1E0F;
    line-height: 1.6;
  `;

  try {
    // 1. Send Order Alert to Admin (ENHANCED PREMIUM UI)
    const adminRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Shahid Luxury Catering', email: ADMIN_EMAIL },
        to: [{ email: ADMIN_EMAIL }],
        subject: `👑 NEW CULINARY ORDER: #${orderRef} - ${customerName}`,
        htmlContent: `
          <div style="${luxuryStyle} padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 1px solid #F0EAD6;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #2C1E0F 0%, #483C32 100%); padding: 50px 40px; text-align: center;">
                <div style="display: inline-block; padding: 12px; background: rgba(184, 134, 11, 0.1); border-radius: 16px; margin-bottom: 20px;">
                  <span style="font-size: 40px;">🏰</span>
                </div>
                <h1 style="color: #B8860B; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 5px; font-weight: 900;">New Request</h1>
                <div style="height: 2px; width: 40px; background: #B8860B; margin: 20px auto;"></div>
                <p style="color: #EDE8D0; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Reference: #${orderRef}</p>
              </div>

              <!-- Content Body -->
              <div style="padding: 40px;">
                
                <!-- Customer Ribbon -->
                <div style="background: #F9F7F2; border-radius: 16px; padding: 25px; margin-bottom: 35px; border-left: 4px solid #B8860B;">
                  <h3 style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #B8860B;">Guest Information</h3>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding-bottom: 10px;">
                        <p style="margin: 0; font-size: 11px; color: #A89F94; text-transform: uppercase; font-weight: bold;">Name</p>
                        <p style="margin: 2px 0 0 0; font-size: 16px; font-weight: 800; color: #2C1E0F;">${customerName}</p>
                      </td>
                      <td style="padding-bottom: 10px;">
                        <p style="margin: 0; font-size: 11px; color: #A89F94; text-transform: uppercase; font-weight: bold;">Phone</p>
                        <p style="margin: 2px 0 0 0; font-size: 16px; font-weight: 800; color: #2C1E0F;">${customerPhone || 'N/A'}</p>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <p style="margin: 5px 0 0 0; font-size: 11px; color: #A89F94; text-transform: uppercase; font-weight: bold;">Email</p>
                        <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 600; color: #2C1E0F;">${customerEmail}</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Order Details -->
                <h3 style="margin: 0 0 20px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #2C1E0F; font-weight: 900; border-bottom: 1px solid #EEE; padding-bottom: 15px;">Selected Delicacies</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  ${items.map(item => `
                    <tr>
                      <td style="padding: 15px 0; border-bottom: 1px solid #F5F5F5;">
                        <span style="font-weight: 800; color: #2C1E0F; display: block; font-size: 15px;">${item.name}</span>
                        <span style="font-size: 12px; color: #A89F94;">$${Number(item.price).toFixed(2)} per unit</span>
                      </td>
                      <td style="padding: 15px 0; border-bottom: 1px solid #F5F5F5; text-align: center;">
                        <div style="display: inline-block; padding: 4px 12px; background: #2C1E0F; color: #B8860B; border-radius: 8px; font-weight: 900; font-size: 12px;">
                          ${item.quantity} QTY
                        </div>
                      </td>
                      <td style="padding: 15px 0; border-bottom: 1px solid #F5F5F5; text-align: right; font-weight: 800; color: #2C1E0F;">
                        $${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  `).join('')}
                </table>

                <!-- Total Money Box -->
                <div style="margin-top: 40px; background: #2C1E0F; border-radius: 20px; padding: 35px; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 0; right: 0; opacity: 0.1; font-size: 100px; transform: translate(30%, -30%);">👑</div>
                  <p style="margin: 0; font-size: 12px; color: #EDE8D0; text-transform: uppercase; letter-spacing: 3px;">Total Revenue</p>
                  <h2 style="margin: 10px 0 0 0; font-size: 48px; color: #B8860B; font-weight: 900; letter-spacing: -1px;">$${Number(totalAmount).toFixed(2)}</h2>
                  <p style="margin: 15px 0 0 0; font-size: 10px; color: #A89F94; text-transform: uppercase; letter-spacing: 1px;">Action required: Verify Zelle Memo #${orderRef}</p>
                </div>

                <div style="margin-top: 40px; text-align: center;">
                  <p style="font-size: 11px; color: #A89F94; font-style: italic;">This is an automated culinary alert from Shahid Management System.</p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #F9F7F2; padding: 25px; text-align: center;">
                <p style="margin: 0; font-size: 9px; color: #C8BAA8; text-transform: uppercase; letter-spacing: 2px;">© 2026 Deccan Catering & Events. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
      }),
    });

    // 2. Send Confirmation to Customer (MATCHING LUXURY UI)
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
        subject: `Your Deccan Culinary Order - #${orderRef}`,
        htmlContent: `
          <div style="${luxuryStyle} padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 1px solid #F0EAD6;">
              <div style="background: #2C1E0F; padding: 40px; text-align: center;">
                <h2 style="color: #B8860B; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 3px;">Order Received</h2>
                <p style="color: #EDE8D0; margin-top: 10px; font-size: 12px;">Ref: #${orderRef}</p>
              </div>
              <div style="padding: 40px; text-align: center;">
                <p style="font-size: 18px; color: #2C1E0F; font-weight: 600;">Dear ${customerName},</p>
                <p style="color: #73695F; margin-bottom: 30px;">Thank you for choosing Deccan Catering. We have successfully received your order details and are preparing for fulfillment.</p>
                
                <div style="background: #F9F7F2; border: 1px dashed #B8860B; padding: 25px; border-radius: 16px; margin-bottom: 30px;">
                  <p style="margin: 0; font-size: 11px; color: #B8860B; text-transform: uppercase; font-weight: bold;">Final Total</p>
                  <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: 900; color: #2C1E0F;">$${totalAmount}</p>
                  <p style="margin: 15px 0 0 0; font-size: 12px; color: #73695F;">Please ensure your Zelle payment includes memo: <strong>#${orderRef}</strong></p>
                </div>

                <p style="font-size: 13px; color: #A89F94;">Our team will contact you shortly once payment is verified.</p>
              </div>
              <div style="background: #2C1E0F; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 9px; color: #EDE8D0; opacity: 0.6; text-transform: uppercase; letter-spacing: 2px;">Premium Culinary Experiences</p>
              </div>
            </div>
          </div>
        `,
      }),
    });

    if (!adminRes.ok || !customerRes.ok) {
       const adminErr = !adminRes.ok ? await adminRes.json() : null;
       const customerErr = !customerRes.ok ? await customerRes.json() : null;
       return res.status(400).json({ error: 'Mail Error', details: { adminErr, customerErr } });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'System Error: ' + error.message });
  }
}
