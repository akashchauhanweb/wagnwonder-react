export const getVerificationEmailHtml = (userName, verificationCode) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Wag N Wonder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #D84A39 0%, #B33D2E 50%, #471915 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Wag N Wonder</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Premium Care for Your Furry Family</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 22px; font-weight: 600;">Verify Your Email</h2>
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                Hi <strong style="color: #1a1a1a;">${userName}</strong>,<br><br>
                Welcome to Wag N Wonder! Please use the verification code below to complete your registration.
              </p>
              
              <!-- Verification Code Box -->
              <div style="background-color: #fef2f0; border: 2px dashed #D84A39; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <p style="margin: 0; color: #471915; font-size: 36px; font-weight: 700; letter-spacing: 8px;">${verificationCode}</p>
              </div>
              
              <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                This code will expire in <strong style="color: #1a1a1a;">10 minutes</strong>. If you didn't request this code, please ignore this email.
              </p>
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              
              <!-- Features -->
              <p style="margin: 0 0 16px; color: #1a1a1a; font-size: 14px; font-weight: 600;">Why join Wag N Wonder?</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    ✓ &nbsp; Verified & trusted pet services
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    ✓ &nbsp; Live CCTV access to facilities
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                    ✓ &nbsp; 24/7 customer support
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 8px; color: #ffffff; font-size: 14px; font-weight: 500;">Wag N Wonder</p>
              <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 12px;">
                Sikha Road, Ballam Para, Farabari, West Bengal, 735135
              </p>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.6); font-size: 12px;">
                © ${new Date().getFullYear()} Wag N Wonder. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
