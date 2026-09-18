<?php

namespace App\Mail;

use App\Models\DemoRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminDemoRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public DemoRequest $demo)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New Demo Request — {$this->demo->school_name}",
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
        $school = e($this->demo->school_name);
        $contact = e($this->demo->contact_name);
        $email = e($this->demo->contact_email);
        $phone = e($this->demo->contact_phone);
        $district = e($this->demo->district);
        $type = e($this->demo->school_type);
        $level = e($this->demo->school_level);
        $students = $this->demo->number_of_students ? e($this->demo->number_of_students) : 'N/A';
        $teachers = $this->demo->number_of_teachers ? e($this->demo->number_of_teachers) : 'N/A';
        $modules = e(implode(', ', $this->demo->modules_of_interest ?? []));
        $management = e($this->demo->current_management);
        $challenge = e($this->demo->biggest_challenge ?? 'Not provided');
        $requestId = e($this->demo->request_id);
        $date = $this->demo->created_at->format('F j, Y \a\t g:i A');
        $adminUrl = url("/super-admin/demo-requests/{$this->demo->id}");

        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #4f46e5; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">New Demo Request</h1>
        <p style="margin: 4px 0 0 0; opacity: 0.85; font-size: 13px;">Reference: {$requestId}</p>
    </div>
    <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 14px;">School Information</h3>
            <p style="margin: 4px 0;"><strong>School:</strong> {$school}</p>
            <p style="margin: 4px 0;"><strong>Type:</strong> {$type}</p>
            <p style="margin: 4px 0;"><strong>Level:</strong> {$level}</p>
            <p style="margin: 4px 0;"><strong>District:</strong> {$district}</p>
            <p style="margin: 4px 0;"><strong>Students:</strong> {$students}</p>
            <p style="margin: 4px 0;"><strong>Teachers:</strong> {$teachers}</p>
        </div>

        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 14px;">Contact Details</h3>
            <p style="margin: 4px 0;"><strong>Name:</strong> {$contact}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:{$email}">{$email}</a></p>
            <p style="margin: 4px 0;"><strong>Phone:</strong> <a href="tel:{$phone}">{$phone}</a></p>
        </div>

        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 14px;">Details</h3>
            <p style="margin: 4px 0;"><strong>Modules of Interest:</strong> {$modules}</p>
            <p style="margin: 4px 0;"><strong>Current Management:</strong> {$management}</p>
            <p style="margin: 4px 0;"><strong>Biggest Challenge:</strong> {$challenge}</p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
            <a href="{$adminUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">View in Admin Panel</a>
        </div>

        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
            Submitted on {$date}. Please respond within 24–48 business hours.
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
