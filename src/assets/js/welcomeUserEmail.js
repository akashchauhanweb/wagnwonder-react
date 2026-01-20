export const getWelcomeUserEmailHtml = (userDetails) => {
    const {
        firstName,
        email,
        phoneNumber,
        password
    } = userDetails;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Wag N Wonder</title>
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
                    
                    <!-- Welcome Icon -->
                    <tr>
                        <td style="padding: 30px 40px 20px; text-align: center;">
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="width: 70px; height: 70px; background: #ecfdf5; border-radius: 50%; text-align: center; vertical-align: middle;">
                                        <span style="font-size: 32px; line-height: 70px;">🐾</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h2 style="margin: 0 0 8px; color: #065f46; font-size: 22px; font-weight: 600; text-align: center;">Welcome to the Family!</h2>
                            <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px; line-height: 1.6; text-align: center;">
                                Hi <strong style="color: #1a1a1a;">${firstName}</strong>, your account has been created successfully.
                            </p>
                            
                            <!-- Account Details Box -->
                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 600;">Your Account Details</h3>
                                
                                <div style="margin-bottom: 16px;">
                                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</p>
                                    <p style="margin: 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${email}</p>
                                </div>
                                
                                <div>
                                    <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Phone</p>
                                    <p style="margin: 0; color: #1a1a1a; font-size: 15px; font-weight: 500;">${phoneNumber}</p>
                                </div>
                            </div>
                            
                            <!-- Password Box -->
                            <div style="background-color: #fef2f0; border: 2px solid #D84A39; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                                <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Password</p>
                                <p style="margin: 0; padding: 12px 16px; background: #ffffff; border-radius: 8px; font-family: monospace; font-size: 16px; color: #1a1a1a; text-align: center; letter-spacing: 1px;">${password}</p>
                            </div>
                            
                            <!-- Security Note -->
                            <div style="background-color: #fffbeb; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                                    <strong>Security Tip:</strong> We recommend changing your password after your first login for added security.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <a href="https://wagnwonder.co/login" style="display: block; background: linear-gradient(135deg, #D84A39 0%, #471915 100%); color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-size: 15px; font-weight: 600; text-align: center;">
                                Login to Your Account
                            </a>
                            
                            <!-- Note -->
                            <p style="margin: 24px 0 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center;">
                                If you did not request this account, please ignore this email or contact our support team.
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