export const EmailCodeHTML = ({ code }: { code: string }) => {
    return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body {
      background: #111;
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 0;
      color: #222;
    }

    .container {
      max-width: 420px;
      margin: 24px auto;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid #e0e0e0;
    }

    .content {
      padding: 24px 20px 20px 20px;
      font-size: 16px;
      color: #222;
    }

    @media (max-width: 500px) {
      .container {
        max-width: 100%;
        margin: 0;
        border-radius: 0;
      }

      .content {
        padding: 16px 8px 12px 8px;
      }
    }
  </style>
</head>

<body>
  <div class="container">
    <div
      style="background: #000; color: #fff; display: flex; padding: 16px 20px;">
      <div
        style="width: 100%; display: flex;">
        <span style="font-size: 20px; font-weight: 900; color: #f59e0b; letter-spacing: 1px;">TC GAMING</span>
        <span
          style="margin-left: auto; margin-top: auto; margin-bottom: auto; background: #222; color: #fff; border: none; border-radius: 4px; padding: 6px 16px; font-size: 14px; font-weight: bold; cursor: pointer;">
          Stay Secure</span>
      </div>
    </div>
    <div class="content">
      <p>Hi, there</p>
      <p>Welcome to <b style="color: #000 !important">TC-GAMING.LIVE</b>!</p>
      <h2 style="text-align: center; margin-top: 0; color: #1abc5b; font-size: 22px;">Verify your email address of your account!</h2>
      <p style="margin: 18px 0 8px 0;">Enter this code:</p>
      <div
        style="background: #f7f7f7; color: #000; font-weight: bold; font-size: 18px; padding: 10px 0; text-align: center; border-radius: 4px; margin: 12px 0; letter-spacing: 2px;">
        ${code}</div>
      <p>If you did not create an account, you can safely ignore this email.</p>
    </div>
    <div class="footer" style="font-size: 13px; color: #888; text-align: center; padding: 16px 10px 10px 10px;">
      &copy; 2026 TC-GAMING.LIVE. All rights reserved.
    </div>
  </div>
</body>

</html>
`;
};
