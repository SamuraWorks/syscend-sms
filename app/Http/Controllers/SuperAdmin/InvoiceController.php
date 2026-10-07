<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\School;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $invoices = Invoice::with(['school:id,name', 'subscription.package:name'])
            ->when($request->school_id, fn ($q) => $q->where('school_id', $request->school_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('issue_date')
            ->paginate(20)
            ->withQueryString();

        $kpi = [
            'total_issued'     => Invoice::whereIn('status', ['issued', 'overdue'])->count(),
            'total_paid'       => Invoice::where('status', 'paid')->count(),
            'total_value'      => Invoice::whereIn('status', ['issued', 'overdue'])->sum('total'),
            'collected'        => Invoice::where('status', 'paid')->sum('total'),
        ];

        return Inertia::render('SuperAdmin/Invoices/Index', [
            'invoices' => [
                'data' => $invoices->items(),
                'meta' => [
                    'total'        => $invoices->total(),
                    'per_page'     => $invoices->perPage(),
                    'current_page' => $invoices->currentPage(),
                    'last_page'    => $invoices->lastPage(),
                ],
            ],
            'schools' => School::select('id', 'name')->orderBy('name')->get(),
            'kpi'     => $kpi,
            'filters' => $request->only(['school_id', 'status']),
        ]);
    }

    public function downloadPdf(Invoice $invoice, InvoiceService $invoiceService)
    {
        $pdf = $invoiceService->renderPdf($invoice);

        return $pdf->download("{$invoice->invoice_no}.pdf");
    }
}