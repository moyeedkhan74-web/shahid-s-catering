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
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const luxuryStyle = `
    background-color: #FDFBF7;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #2C1E0F;
    line-height: 1.6;
  `;

  const displayName = customerName || 'Valued Guest';

  try {
    // 0. Save Order to Supabase (if configured)
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            order_ref: orderRef,
            customer_name: displayName,
            customer_phone: customerPhone || null,
            customer_email: customerEmail,
            items: items,
            total_amount: Number(totalAmount),
            status: 'pending'
          })
        });
      } catch (dbErr) {
        console.error('Order save error (non-blocking):', dbErr.message);
      }
    }

    // 1. Send Order Alert to Admin (PREMIUM)
    const adminRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Deccan Catering System', email: ADMIN_EMAIL },
        to: [{ email: ADMIN_EMAIL }],
        subject: `👑 NEW ORDER: #${orderRef} — ${displayName}`,
        htmlContent: `
          <div style="${luxuryStyle} padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 1px solid #F0EAD6;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #2C1E0F 0%, #483C32 100%); padding: 50px 40px; text-align: center;">
                <div style="display: inline-block; padding: 12px; background: rgba(184, 134, 11, 0.1); border-radius: 16px; margin-bottom: 20px;">
                  <span style="font-size: 40px;">🏰</span>
                </div>
                <h1 style="color: #B8860B; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 5px; font-weight: 900;">New Order</h1>
                <div style="height: 2px; width: 40px; background: #B8860B; margin: 20px auto;"></div>
                <p style="color: #EDE8D0; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Reference: #${orderRef}</p>
              </div>

              <div style="padding: 40px;">
                <!-- Customer Ribbon -->
                <div style="background: #F9F7F2; border-radius: 16px; padding: 25px; margin-bottom: 35px; border-left: 4px solid #B8860B;">
                  <h3 style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #B8860B;">Guest Information</h3>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding-bottom: 10px;">
                        <p style="margin: 0; font-size: 11px; color: #A89F94; text-transform: uppercase; font-weight: bold;">Name</p>
                        <p style="margin: 2px 0 0 0; font-size: 18px; font-weight: 900; color: #2C1E0F;">${displayName}</p>
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

                <!-- Order Items -->
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

                <!-- Total -->
                <div style="margin-top: 40px; background: #2C1E0F; border-radius: 20px; padding: 35px; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 0; right: 0; opacity: 0.1; font-size: 100px; transform: translate(30%, -30%);">👑</div>
                  <p style="margin: 0; font-size: 12px; color: #EDE8D0; text-transform: uppercase; letter-spacing: 3px;">Total Revenue</p>
                  <h2 style="margin: 10px 0 0 0; font-size: 48px; color: #B8860B; font-weight: 900; letter-spacing: -1px;">$${Number(totalAmount).toFixed(2)}</h2>
                  <p style="margin: 15px 0 0 0; font-size: 10px; color: #A89F94; text-transform: uppercase; letter-spacing: 1px;">Verify Zelle Memo #${orderRef}</p>
                </div>

                <div style="margin-top: 40px; text-align: center;">
                  <p style="font-size: 11px; color: #A89F94; font-style: italic;">Automated alert from Deccan Management System.</p>
                </div>
              </div>

              <div style="background: #F9F7F2; padding: 25px; text-align: center;">
                <p style="margin: 0; font-size: 9px; color: #C8BAA8; text-transform: uppercase; letter-spacing: 2px;">© 2026 Deccan Catering & Events. All rights reserved.</p>
              </div>
            </div>
          </div>
        `,
      }),
    });

    // 2. Send Premium Confirmation to Customer
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
        subject: `✨ ${displayName}, Your Deccan Order #${orderRef} is Confirmed`,
        htmlContent: `
          <div style="${luxuryStyle} padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 1px solid #F0EAD6;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #2C1E0F 0%, #483C32 100%); padding: 50px 40px; text-align: center;">
                <div style="display: inline-block; padding: 12px; background: rgba(184, 134, 11, 0.1); border-radius: 16px; margin-bottom: 20px;">
                  <span style="font-size: 40px;">🏰</span>
                </div>
                <h1 style="color: #B8860B; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 4px; font-weight: 900;">Order Confirmed</h1>
                <div style="height: 2px; width: 40px; background: #B8860B; margin: 20px auto;"></div>
                <p style="color: #EDE8D0; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Reference: #${orderRef}</p>
              </div>

              <div style="padding: 40px;">
                <!-- Greeting with Name -->
                <div style="text-align: center; margin-bottom: 35px;">
                  <p style="font-size: 13px; color: #A89F94; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Welcome</p>
                  <h2 style="font-size: 30px; font-weight: 900; color: #2C1E0F; margin: 8px 0 0 0; letter-spacing: -0.5px;">${displayName}</h2>
                  <div style="height: 2px; width: 50px; background: #B8860B; margin: 15px auto;"></div>
                </div>

                <p style="text-align: center; color: #73695F; font-size: 14px; line-height: 1.8; margin-bottom: 35px;">
                  Thank you for choosing Deccan Catering. Your order has been received and our team is preparing for fulfillment. Below are your complete order details.
                </p>

                <!-- Order Items -->
                <h3 style="margin: 0 0 20px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #B8860B; font-weight: 900; border-bottom: 1px solid #EEE; padding-bottom: 15px;">Your Selections</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  ${items.map(item => `
                    <tr>
                      <td style="padding: 15px 0; border-bottom: 1px solid #F5F5F5;">
                        <span style="font-weight: 800; color: #2C1E0F; display: block; font-size: 15px;">${item.name}</span>
                        <span style="font-size: 12px; color: #A89F94;">$${Number(item.price).toFixed(2)} each</span>
                      </td>
                      <td style="padding: 15px 0; border-bottom: 1px solid #F5F5F5; text-align: center;">
                        <div style="display: inline-block; padding: 4px 12px; background: #F9F7F2; color: #2C1E0F; border-radius: 8px; font-weight: 900; font-size: 12px; border: 1px solid #EDE8D0;">
                          ${item.quantity} QTY
                        </div>
                      </td>
                      <td style="padding: 15px 0; border-bottom: 1px solid #F5F5F5; text-align: right; font-weight: 800; color: #2C1E0F;">
                        $${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  `).join('')}
                </table>

                <!-- Total Box -->
                <div style="margin-top: 40px; background: #2C1E0F; border-radius: 20px; padding: 35px; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 0; right: 0; opacity: 0.1; font-size: 100px; transform: translate(30%, -30%);">✨</div>
                  <p style="margin: 0; font-size: 12px; color: #EDE8D0; text-transform: uppercase; letter-spacing: 3px;">Your Total</p>
                  <h2 style="margin: 10px 0 0 0; font-size: 48px; color: #B8860B; font-weight: 900; letter-spacing: -1px;">$${Number(totalAmount).toFixed(2)}</h2>
                </div>

                <!-- Payment Instructions -->
                <div style="margin-top: 35px; background: #F9F7F2; border-radius: 16px; padding: 25px; border-left: 4px solid #B8860B;">
                  <h3 style="margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #B8860B;">Payment Instructions</h3>
                  <p style="margin: 0; font-size: 14px; color: #2C1E0F; line-height: 1.8;">
                    Please send your Zelle payment and include reference <strong style="color: #B8860B;">#${orderRef}</strong> in the memo field. Our team will verify and contact you shortly.
                  </p>
                </div>

                <div style="margin-top: 40px; text-align: center;">
                  <p style="font-size: 11px; color: #A89F94; font-style: italic;">Questions? Contact us at ${ADMIN_EMAIL}</p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: linear-gradient(135deg, #2C1E0F 0%, #483C32 100%); padding: 30px; text-align: center;">
                <p style="margin: 0 0 5px 0; font-size: 11px; color: #B8860B; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Deccan Catering & Events</p>
                <p style="margin: 0; font-size: 9px; color: #EDE8D0; opacity: 0.5; text-transform: uppercase; letter-spacing: 2px;">Premium Culinary Experiences Since 2026</p>
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
