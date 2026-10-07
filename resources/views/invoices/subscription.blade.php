<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_no }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 32px; font-size: 13px; line-height: 1.5; }
        .topbar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; }
        .brand h1 { margin: 0; font-size: 22px; color: #4f46e5; }
        .brand p { margin: 2px 0 0; color: #64748b; font-size: 12px; }
        .status { text-align: right; }
        .status .badge { display: inline-block; padding: 6px 16px; border-radius: 4px; font-weight: 700; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; }
        .badge.paid { background: #dcfce7; color: #166534; border: 1px solid #16a34a; }
        .badge.issued { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
        .badge.overdue { background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; }
        .badge.cancelled { background: #f1f5f9; color: #475569; border: 1px solid #94a3b8; }
        .meta { display: flex; justify-content: space-between; margin-top: 24px; }
        .bill-box { width: 48%; }
        .bill-box h3 { margin: 0 0 6px; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
        .bill-box p { margin: 2px 0; }
        .bill-box strong { color: #0f172a; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 28px; }
        table.items th { background: #4f46e5; color: #fff; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        table.items td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
        table.items tr:nth-child(even) td { background: #f8fafc; }
        .num { text-align: right; }
        .totals { width: 100%; margin-top: 20px; }
        .totals td { padding: 6px 12px; }
        .totals .label { text-align: right; color: #64748b; }
        .totals .grand { border-top: 2px solid #334155; font-size: 16px; font-weight: 700; color: #0f172a; }
        .notes { margin-top: 28px; padding: 14px 16px; background: #f1f5f9; border-radius: 6px; color: #475569; font-size: 12px; }
        .footer { margin-top: 32px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 14px; }
        .due { margin-top: 18px; font-size: 12px; color: #475569; }
    </style>
</head>
<body>
    <div class="topbar">
        <div class="brand">
            <h1>Syscend Campus</h1>
            <p>School Management Platform</p>
        </div>
        <div class="status">
            <span class="badge {{ $invoice->status }}">{{ ucfirst($invoice->status) }}</span>
        </div>
    </div>

    <div class="meta">
        <div class="bill-box">
            <h3>Invoice To</h3>
            <p><strong>{{ $school?->name ?? 'N/A' }}</strong></p>
            @if ($school?->address)
                <p>{{ $school->address }}</p>
            @endif
            @if ($school?->city)
                <p>{{ $school->city }}</p>
            @endif
            @if ($school?->email)
                <p>{{ $school->email }}</p>
            @endif
        </div>
        <div class="bill-box">
            <h3>Invoice Details</h3>
            <p><strong>Invoice No:</strong> {{ $invoice->invoice_no }}</p>
            <p><strong>Issued:</strong> {{ $invoice->issue_date->format('d M Y') }}</p>
            <p><strong>Due:</strong> {{ $invoice->due_date?->format('d M Y') ?? '—' }}</p>
            <p><strong>Plan:</strong> {{ $invoice->subscription?->package?->name ?? 'Syscend Campus' }}</p>
        </div>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Description</th>
                <th class="num">Qty</th>
                <th class="num">Unit Price</th>
                <th class="num">Amount</th>
            </tr>
        </thead>
        <tbody>
            @forelse (($invoice->items ?? []) as $item)
                <tr>
                    <td>{{ $item['description'] ?? 'Subscription' }}</td>
                    <td class="num">{{ $item['qty'] ?? 1 }}</td>
                    <td class="num">Le {{ number_format((float) ($item['unit_price'] ?? 0), 0) }}</td>
                    <td class="num">Le {{ number_format((float) ($item['amount'] ?? 0), 0) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4">Subscription charges</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td></td>
            <td class="label">Subtotal</td>
            <td class="num">Le {{ number_format((float) $invoice->subtotal, 0) }}</td>
        </tr>
        @if ((float) $invoice->discount > 0)
            <tr>
                <td></td>
                <td class="label">Discount</td>
                <td class="num">− Le {{ number_format((float) $invoice->discount, 0) }}</td>
            </tr>
        @endif
        <tr class="grand">
            <td></td>
            <td class="label">Total</td>
            <td class="num">Le {{ number_format((float) $invoice->total, 0) }}</td>
        </tr>
    </table>

    @if ($invoice->due_date && $invoice->status !== 'paid')
        <div class="due">
            Payment is due on {{ $invoice->due_date->format('d M Y') }}. Late settlement may suspend subscription services.
        </div>
    @endif

    @if ($invoice->notes)
        <div class="notes">{{ $invoice->notes }}</div>
    @endif

    <div class="footer">
        Thank you — Syscend Campus Support &bull; https://syscend-campus.com
    </div>
</body>
</html>