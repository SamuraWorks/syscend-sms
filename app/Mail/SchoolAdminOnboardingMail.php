<?php

namespace App\Mail;

use App\Models\{School, User};
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SchoolAdminOnboardingMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public School $school,
        public User $admin,
        public string $tempPassword,
        public string $loginUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Welcome to Syscend Campus — Your School Admin Account",
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    protected function buildHtml(): string
    {
        $schoolName = e($this->school->name);
        $schoolCode = e($this->school->code ?? 'N/A');
        $adminName = e($this->admin->name);
        $adminEmail = e($this->admin->email);
        $tempPassword = e($this->tempPassword);
        $loginUrl = e($this->loginUrl);

        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #4f46e5; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Welcome to Syscend Campus</h1>
    </div>
    <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear {$adminName},</p>
        <p>Your school has been successfully registered on Syscend Campus.</p>

        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 14px;">School Details</h3>
            <p style="margin: 4px 0;"><strong>School:</strong> {$schoolName}</p>
            <p style="margin: 4px 0;"><strong>School Code:</strong> {$schoolCode}</p>
            <p style="margin: 4px 0;"><strong>Platform:</strong> Syscend Campus</p>
        </div>

        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 14px;">Your Login Credentials</h3>
            <p style="margin: 4px 0;"><strong>Email:</strong> {$adminEmail}</p>
            <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">{$tempPassword}</code></p>
            <p style="margin: 4px 0;"><strong>Login:</strong> <a href="{$loginUrl}">{$loginUrl}</a></p>
        </div>

        <div style="background: #fef3c7; padding: 16px; border-radius: 6px; border: 1px solid #fbbf24; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px;">Important Security Notice</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li>This is a <strong>temporary password</strong>.</li>
                <li>You will be required to change your password immediately after your first login.</li>
                <li>Do not share this password with anyone.</li>
                <li>After changing your password, this temporary password will no longer work.</li>
            </ul>
        </div>

        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
            If you did not expect this email, please contact your system administrator.
        </p>
    </div>
    <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
        &copy; {date('Y')} Syscend Campus. All rights reserved.
    </div>
</body>
</html>
HTML;
    }
}
