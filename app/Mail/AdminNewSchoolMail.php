<?php

namespace App\Mail;

use App\Models\School;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminNewSchoolMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public School $school, public User $admin)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New School Registered — {$this->school->name}",
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
        $school = e($this->school->name);
        $slug = e($this->school->slug);
        $admin = e($this->admin->name);
        $email = e($this->admin->email);
        $phone = e($this->admin->phone ?? 'Not provided');
        $city = e($this->school->city ?? 'Not provided');
        $address = e($this->school->address ?? 'Not provided');
        $date = now()->format('F j, Y \a\t g:i A');
        $adminUrl = url('/super-admin/schools');
        $schoolUrl = url('/' . $slug);

        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #4f46e5; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">New School Registered</h1>
        <p style="margin: 4px 0 0 0; opacity: 0.85; font-size: 13px;">Free trial — self-registered</p>
    </div>
    <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 14px;">School Information</h3>
            <p style="margin: 4px 0;"><strong>School:</strong> {$school}</p>
            <p style="margin: 4px 0;"><strong>City:</strong> {$city}</p>
            <p style="margin: 4px 0;"><strong>Address:</strong> {$address}</p>
            <p style="margin: 4px 0;"><strong>Website:</strong> <a href="{$schoolUrl}">{$schoolUrl}</a></p>
        </div>

        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 14px;">School Admin Account</h3>
            <p style="margin: 4px 0;"><strong>Name:</strong> {$admin}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:{$email}">{$email}</a></p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> <a href="tel:{$phone}">{$phone}</a></p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
            <a href="{$adminUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">View in Admin Panel</a>
        </div>

        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
            Registered on {$date}. The school is on a free trial; no setup is required on your side.
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