import crypto from "node:crypto";
import { Resend } from "resend";

const EMAIL_REQUEST_TIMEOUT_MS = 10_000;
let resendClient;

const escapeHtml = (value) =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    if (!resendClient) {
        resendClient = new Resend(apiKey);
    }

    return resendClient;
};

export const sendPasswordResetEmail = async ({ email, token }) => {
    const resetUrl = new URL(
        `/reset-password/${encodeURIComponent(token)}`,
        process.env.CLIENT_URL || "http://localhost:3000"
    ).toString();
    const safeResetUrl = escapeHtml(resetUrl);
    const appName = escapeHtml(process.env.EMAIL_FROM_NAME?.trim() || "X Clone");
    const sender = process.env.EMAIL_FROM?.trim() || "X Clone <onboarding@resend.dev>";
    const idempotencyKey = `password-reset-${crypto
        .createHash("sha256")
        .update(token)
        .digest("hex")}`;

    const { data, error } = await getResendClient().emails.send({
        from: sender,
        to: email,
        subject: "Reset your X Clone password",
        text: [
            "Reset your password",
            "",
            "We received a request to reset your X Clone password.",
            `Open this link to choose a new password: ${resetUrl}`,
            "",
            "This link expires in 15 minutes.",
            "If you did not request this, you can safely ignore this email.",
        ].join("\n"),
        html: `
            <!doctype html>
            <html lang="en">
                <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <title>Reset your password</title>
                </head>
                <body style="margin:0;padding:0;background-color:#000000;color:#f2f2f2;font-family:Arial,Helvetica,sans-serif;">
                    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
                        Your ${appName} password reset link expires in 15 minutes.
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#000000;">
                        <tr>
                            <td align="center" style="padding:32px 16px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;background-color:#181818;border:1px solid #2f3336;border-radius:16px;">
                                    <tr>
                                        <td style="padding:32px 32px 8px;text-align:center;">
                                            <div style="display:inline-block;width:48px;height:48px;line-height:48px;background-color:#f2f2f2;color:#000000;border-radius:50%;font-size:25px;font-weight:700;text-align:center;">X</div>
                                            <p style="margin:12px 0 0;color:#f2f2f2;font-size:18px;font-weight:700;">${appName}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:16px 32px 32px;">
                                            <h1 style="margin:0 0 16px;color:#f2f2f2;font-size:28px;line-height:1.25;text-align:center;">Reset your password</h1>
                                            <p style="margin:0 0 24px;color:#b4b4b4;font-size:16px;line-height:1.6;text-align:center;">
                                                We received a request to reset your ${appName} password. Click the button below to choose a new one.
                                            </p>

                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td align="center" style="padding-bottom:24px;">
                                                        <a href="${safeResetUrl}" target="_blank" style="display:inline-block;padding:13px 28px;background-color:rgb(29, 155, 240);color:#ffffff;text-decoration:none;border-radius:9999px;font-size:16px;font-weight:700;line-height:1.25;">Reset password</a>
                                                    </td>
                                                </tr>
                                            </table>

                                            <div style="margin:0 0 24px;padding:14px 16px;background-color:#202327;border-left:3px solid rgb(29, 155, 240);border-radius:8px;color:#d6d9db;font-size:14px;line-height:1.5;">
                                                This link expires in <strong style="color:#ffffff;">15 minutes</strong> and can only be used once.
                                            </div>

                                            <p style="margin:0 0 8px;color:#8b98a5;font-size:13px;line-height:1.5;">
                                                If the button does not work, copy and paste this URL into your browser:
                                            </p>
                                            <p style="margin:0 0 24px;font-size:13px;line-height:1.5;word-break:break-all;">
                                                <a href="${safeResetUrl}" target="_blank" style="color:rgb(29, 155, 240);text-decoration:underline;">${safeResetUrl}</a>
                                            </p>

                                            <p style="margin:0;padding-top:20px;border-top:1px solid #2f3336;color:#8b98a5;font-size:13px;line-height:1.5;">
                                                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                                            </p>
                                        </td>
                                    </tr>
                                </table>

                                <p style="max-width:560px;margin:20px 0 0;color:#536471;font-size:12px;line-height:1.5;text-align:center;">
                                    This is an automated security message from ${appName}. Please do not reply to this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `,
    }, {
        idempotencyKey,
        signal: AbortSignal.timeout(EMAIL_REQUEST_TIMEOUT_MS),
    });

    if (error) {
        const resendError = new Error(error.message || "Resend could not send the email");
        resendError.code = error.name || "RESEND_ERROR";
        resendError.statusCode = error.statusCode;
        throw resendError;
    }

    return data;
};
