<?php

namespace App\Services;

use App\Mail\InvoiceMail;
use App\Models\Invoice;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPayment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Mail;

class InvoiceService
{
    public function generateForSubscription(SchoolSubscription $subscription): Invoice
    {
        $package = $subscription->package;
        $amount  = (float) $subscription->price_per_term;
        $planName = $package?->name ?? 'Platform';
        $itemDescription = "Subscription — {$planName}";
        if ($subscription->term_number) {
            $itemDescription .= " · Term {$subscription->term_number}";
        }

        $items = [[
            'description' => $itemDescription,
            'qty'         => 1,
            'unit_price'  => $amount,
            'amount'      => $amount,
        ]];

        return Invoice::create([
            'school_id'       => $subscription->school_id,
            'subscription_id' => $subscription->id,
            'invoice_no'      => $this->nextInvoiceNo($subscription->school_id),
            'type'            => 'subscription',
            'status'          => 'issued',
            'description'     => "Subscription invoice for {$planName}",
            'issue_date'      => now()->toDateString(),
            'due_date'        => $subscription->end_date?->toDateString() ?? now()->addDays(30)->toDateString(),
            'subtotal'        => $amount,
            'discount'        => 0,
            'total'           => $amount,
            'currency'        => 'SLL',
            'items'           => $items,
            'notes'           => $subscription->is_trial ? 'Trial subscription — billed from the end of the trial period.' : null,
        ]);
    }

    public function settleForPayment(SubscriptionPayment $payment): ?Invoice
    {
        $invoice = Invoice::withoutGlobalScopes()
            ->where('school_id', $payment->school_id)
            ->where('subscription_id', $payment->subscription_id)
            ->where('status', 'issued')
            ->orderByDesc('issue_date')
            ->first();

        if (! $invoice) {
            return null;
        }

        $invoice->update([
            'status'      => 'paid',
            'paid_at'     => $payment->confirmed_at ?? $payment->paid_at ?? now(),
            'due_date'    => $invoice->due_date ?? now()->toDateString(),
        ]);

        $this->sendInvoiceEmail($invoice);

        return $invoice;
    }

    public function sendInvoiceEmail(Invoice $invoice): void
    {
        $school = $invoice->school;

        if (! $school || ! $school->email) {
            return;
        }

        try {
            Mail::to($school->email)->send(new InvoiceMail($invoice));
        } catch (\Throwable $e) {
            \Log::warning('Failed to send invoice email', [
                'invoice_id' => $invoice->id,
                'school_id'  => $invoice->school_id,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    public function renderPdf(Invoice $invoice)
    {
        $invoice->loadMissing(['school', 'subscription.package']);

        return Pdf::loadView('invoices.subscription', [
            'invoice' => $invoice,
            'school'  => $invoice->school,
        ])->setPaper('a4', 'portrait');
    }

    public function nextInvoiceNo(int $schoolId): string
    {
        $count = Invoice::withoutGlobalScopes()->where('school_id', $schoolId)->count() + 1;

        return 'INV-' . date('Y') . '-' . str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }
}