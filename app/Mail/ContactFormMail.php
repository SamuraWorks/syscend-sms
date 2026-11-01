<?php

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactFormMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ContactMessage $contact)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "New Contact Message — {$this->contact->subject}",
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
        $name = e($this->contact->name);
        $email = e($this->contact->email);
        $subject = e($this->contact->subject);
        $message = nl2br(e($this->contact->message));
        $date = $this->contact->created_at->format('F j, Y \a\t g:i A');

        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #4f46e5; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">New Contact Message</h1>
    </div>
    <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 14px;">Sender Details</h3>
            <p style="margin: 4px 0;"><strong>Name:</strong> {$name}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:{$email}">{$email}</a></p>
            <p style="margin: 4px 0;"><strong>Date:</strong> {$date}</p>
        </div>

        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 14px;">Subject</h3>
            <p style="margin: 0;">{$subject}</p>
        </div>

        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <h3 style="margin: 0 0 8px 0; color: #4f46e5; font-size: 14px;">Message</h3>
            <p style="margin: 0; white-space: pre-wrap;">{$message}</p>
        </div>
    </div>
    <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
        &copy; {date('Y')} Syscend Campus. All rights reserved.
    </div>
</body>
</html>
HTML;
    }
}
