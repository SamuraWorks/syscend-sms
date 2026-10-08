<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminResetPasswordRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Password reset requested — {$this->user->name} ({$this->user->email})",
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
        $name = e($this->user->name);
        $email = e($this->user->email);
        $school = $this->user->school?->name ? e($this->user->school->name) : '—';
        $roles = e($this->user->getRoleNames()->implode(', '));
        $date = now()->format('F j, Y \a\t g:i A');
        $adminUrl = route('super-admin.users.index');

        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #4f46e5; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Password Reset Requested</h1>
        <p style="margin: 4px 0 0 0; opacity: 0.85; font-size: 13px;">A user forgot their password and is waiting on you</p>
    </div>
    <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 14px;">User Information</h3>
            <p style="margin: 4px 0;"><strong>Name:</strong> {$name}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:{$email}">{$email}</a></p>
            <p style="margin: 4px 0;"><strong>School:</strong> {$school}</p>
            <p style="margin: 4px 0;"><strong>Roles:</strong> {$roles}</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
            <a href="{$adminUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">Open User Management</a>
        </div>

        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
            Requested on {$date}. Please set new credentials for this user and share them directly.
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