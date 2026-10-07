<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Invoice $invoice)
    {
        $this->invoice->loadMissing(['school']);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Invoice {$this->invoice->invoice_no} — Syscend Campus",
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    public function attachments(): array
    {
        $pdf = app(InvoiceService::class)->renderPdf($this->invoice);

        return [
            Attachment::fromData(fn () => $pdf->output(), "{$this->invoice->invoice_no}.pdf")
                ->withMime('application/pdf'),
        ];
    }

    protected function buildHtml(): string
    {
        $schoolName = e($this->invoice->school?->name ?? 'Your school');
        $invoiceNo  = e($this->invoice->invoice_no);
        $status     = $this->invoice->status === 'paid' ? 'has been settled in full' : 'is now due';
        $amount     = number_format((float) $this->invoice->total, 0);
        $planName   = e($this->invoice->subscription?->package?->name ?? 'Syscend Campus');
        $invoiceUrl = e(url('/school/billing/invoices'));
        $dueDate    = $this->invoice->due_date?->format('d M Y');

        return <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #4f46e5; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">Invoice {$invoiceNo}</h1>
    </div>
    <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear {$schoolName},</p>
        <p>Your subscription invoice {$invoiceNo} for the <strong>{$planName}</strong> plan {$status}.</p>

        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Invoice:</strong> {$invoiceNo}</p>
            <p style="margin: 4px 0;"><strong>Plan:</strong> {$planName}</p>
            <p style="margin: 4px 0;"><strong>Amount:</strong> Le {$amount}</p>
            <p style="margin: 4px 0;"><strong>Status:</strong> " . ucfirst($status) . "</p>
            <p style="margin: 4px 0;"><strong>Due:</strong> {$dueDate}</p>
        </div>

        <p>A copy of the invoice is attached to this email. You can also view and download it any time from your school portal.</p>

        <p style="margin: 24px 0 0 0;">
            <a href="{$invoiceUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: 600;">View Invoices</a>
        </p>

        <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
            If you did not expect this email, please contact Syscend Campus support.
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