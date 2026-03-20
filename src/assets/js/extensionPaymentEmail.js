export const getExtensionPaymentEmailHtml = (details) => {
  const {
    userName,
    kennelName,
    bookingId,
    originalCheckout,
    newCheckout,
    extraDays,
    amount,
    paymentLink,
  } = details;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Extension - Wag N Wonder</title>
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
                    
                    <!-- Icon -->
                    <tr>
                        <td style="padding: 30px 40px 20px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="width: 70px; height: 70px; background: #eff6ff; border-radius: 50%; text-align: center; vertical-align: middle;">
                                        <span style="font-size: 32px; line-height: 70px;">📅</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h2 style="margin: 0 0 8px; color: #1e40af; font-size: 22px; font-weight: 600; text-align: center;">Stay Extended!</h2>
                            <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6; text-align: center;">
                                Hi <strong style="color: #1a1a1a;">${userName}</strong>, your boarding stay at <strong>${kennelName}</strong> has been extended. Please complete the payment to confirm.
                            </p>
                            
                            <!-- Extension Details Box -->
                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600;">Extension Details</h3>
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Booking ID</td>
                                        <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; text-align: right; font-weight: 500;">#${bookingId}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Original Checkout</td>
                                        <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; text-align: right;">${originalCheckout}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">New Checkout</td>
                                        <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; text-align: right; font-weight: 600;">${newCheckout}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Extra Days</td>
                                        <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; text-align: right;">${extraDays} night${extraDays > 1 ? "s" : ""}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Amount Box -->
                            <div style="background-color: #fef2f0; border: 2px solid #D84A39; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="color: #1a1a1a; font-size: 16px; font-weight: 600;">Amount Due</td>
                                        <td style="color: #D84A39; font-size: 20px; font-weight: 700; text-align: right;">₹${amount}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Pay Now Button -->
                            <a href="${paymentLink}" style="display: block; background: linear-gradient(135deg, #D84A39 0%, #471915 100%); color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-size: 15px; font-weight: 600; text-align: center;">
                                Pay Now
                            </a>
                            
                            <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.6; text-align: center;">
                                If the button doesn't work, copy and paste this link in your browser:<br>
                                <a href="${paymentLink}" style="color: #D84A39; word-break: break-all;">${paymentLink}</a>
                            </p>
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
};
