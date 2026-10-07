<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolBillingController extends Controller
{
    public function index(Request $request): Response
    {
        $invoices = Invoice::with(['subscription.package:name'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('issue_date')
            ->paginate(20)
            ->withQueryString();

        $kpi = [
            'total_issued' => Invoice::whereIn('status', ['issued', 'overdue'])->count(),
            'total_paid'   => Invoice::where('status', 'paid')->count(),
            'outstanding'  => Invoice::whereIn('status', ['issued', 'overdue'])->sum('total'),
            'collected'    => Invoice::where('status', 'paid')->sum('total'),
        ];

        return Inertia::render('SchoolAdmin/Billing/Invoices', [
            'invoices' => [
                'data' => $invoices->items(),
                'meta' => [
                    'total'        => $invoices->total(),
                    'per_page'     => $invoices->perPage(),
                    'current_page' => $invoices->currentPage(),
                    'last_page'    => $invoices->lastPage(),
                ],
            ],
            'kpi'     => $kpi,
            'filters' => $request->only(['status']),
        ]);
    }

    public function downloadPdf(Invoice $invoice, InvoiceService $invoiceService)
    {
        if (! $invoice->school_id || $invoice->school_id !== auth()->user()->school_id) {
            abort(403);
        }

        $pdf = $invoiceService->renderPdf($invoice);

        return $pdf->download("{$invoice->invoice_no}.pdf");
    }
}