<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Package;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Services\SubscriptionPaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function index(Request $request): Response
    {
        $subscriptions = SchoolSubscription::with(['school', 'package', 'coupon', 'confirmedPayments'])
            ->when($request->school_id, fn ($q) => $q->where('school_id', $request->school_id))
            ->when($request->status,    fn ($q) => $q->where('status', $request->status))
            ->withTrashed(false)
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $kpi = [
            'total'            => SchoolSubscription::count(),
            'active'           => SchoolSubscription::where('status', 'active')->count(),
            'trial'            => SchoolSubscription::where('status', 'trial')->count(),
            'expired'          => SchoolSubscription::where('status', 'expired')->count(),
            'total_revenue'    => SchoolSubscription::sum('amount_paid'),
            'pending_balances' => SchoolSubscription::where('status', 'active')
                ->sum(\Illuminate\Support\Facades\DB::raw("GREATEST(0, price_per_term - COALESCE((SELECT SUM(sp.amount) FROM subscription_payments sp WHERE sp.subscription_id = school_subscriptions.id AND sp.status = 'confirmed'), 0))")),
        ];

        return Inertia::render('SuperAdmin/Subscriptions/Index', [
            'subscriptions' => [
                'data' => $subscriptions->items(),
                'meta' => [
                    'total'        => $subscriptions->total(),
                    'per_page'     => $subscriptions->perPage(),
                    'current_page' => $subscriptions->currentPage(),
                    'last_page'    => $subscriptions->lastPage(),
                ],
            ],
            'schools'  => School::select('id', 'name')->orderBy('name')->get(),
            'packages' => Package::where('is_active', true)->select('id', 'name', 'price_per_term')->get(),
            'coupons'  => Coupon::where('is_active', true)->select('id', 'code', 'type', 'value')->get(),
            'kpi'      => $kpi,
            'filters'  => $request->only(['school_id', 'status']),
        ]);
    }

    public function store(Request $request, SubscriptionPaymentService $paymentService): RedirectResponse
    {
        $data = $request->validate([
            'school_id'      => 'required|integer|exists:schools,id',
            'package_id'     => 'required|integer|exists:packages,id',
            'coupon_id'      => 'nullable|integer|exists:coupons,id',
            'academic_year_id' => 'nullable|integer|exists:academic_years,id',
            'start_date'     => 'required|date',
            'end_date'       => 'required|date|after:start_date',
            'term_number'    => 'required|integer|min:1|max:3',
            'price_per_term' => 'required|numeric|min:0',
            'status'         => 'required|in:trial,active,expired,suspended',
            'is_trial'       => 'boolean',
            'trial_ends_at'  => 'nullable|date',
            'amount_paid'    => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|max:50',
            'notes'          => 'nullable|string|max:500',
        ]);

        $data['amount_paid'] = $data['amount_paid'] ?? 0;
        $sub = SchoolSubscription::create($data);

        if ($request->has('coupon_id') && $data['coupon_id']) {
            Coupon::find($data['coupon_id'])->apply();
        }

        app(\App\Services\InvoiceService::class)->generateForSubscription($sub);

        if ($request->input('initiate_payment') && $request->input('payer_phone')) {
            $result = $paymentService->initiatePayment($sub, $request->input('payer_phone'), (float) $data['price_per_term']);
            if ($result['success'] && isset($result['payment_url'])) {
                return redirect($result['payment_url']);
            }
        }

        return back()->with('success', 'Subscription assigned.');
    }

    public function update(Request $request, SchoolSubscription $subscription, SubscriptionPaymentService $paymentService): RedirectResponse
    {
        $data = $request->validate([
            'package_id'     => 'required|integer|exists:packages,id',
            'coupon_id'      => 'nullable|integer|exists:coupons,id',
            'academic_year_id' => 'nullable|integer|exists:academic_years,id',
            'start_date'     => 'required|date',
            'end_date'       => 'required|date|after:start_date',
            'term_number'    => 'required|integer|min:1|max:3',
            'price_per_term' => 'required|numeric|min:0',
            'status'         => 'required|in:trial,active,expired,suspended',
            'is_trial'       => 'boolean',
            'trial_ends_at'  => 'nullable|date',
            'amount_paid'    => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|max:50',
            'notes'          => 'nullable|string|max:500',
        ]);

        $subscription->update($data);

        if ($request->has('coupon_id') && $data['coupon_id'] && ! $subscription->coupon_id) {
            Coupon::find($data['coupon_id'])->apply();
        }

        if ($request->input('initiate_payment') && $request->input('payer_phone')) {
            $result = $paymentService->initiatePayment($subscription, $request->input('payer_phone'), (float) $data['price_per_term']);
            if ($result['success'] && isset($result['payment_url'])) {
                return redirect($result['payment_url']);
            }
        }

        return back()->with('success', 'Subscription updated.');
    }

    public function destroy(SchoolSubscription $subscription): RedirectResponse
    {
        $subscription->delete();
        return back()->with('success', 'Subscription removed.');
    }

    public function recordOfflinePayment(Request $request, SchoolSubscription $subscription, SubscriptionPaymentService $paymentService): RedirectResponse
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:999999',
            'method' => 'required|in:orange_money,monime,bank_transfer,cash,mobile_money',
            'notes'  => 'nullable|string|max:500',
        ]);

        $paymentService->recordOfflinePayment($subscription, $data['amount'], $data['method'], $data['notes'] ?? '');

        return back()->with('success', 'Payment recorded and subscription updated.');
    }

    public function initiateOnlinePayment(Request $request, SchoolSubscription $subscription, SubscriptionPaymentService $paymentService): RedirectResponse
    {
        $data = $request->validate([
            'phone'  => 'required|string|min:8',
            'method' => 'nullable|in:orange_money,monime',
        ]);

        $method = $data['method'] ?? 'orange_money';

        $result = $paymentService->initiatePayment($subscription, $request->input('phone'), (float) $subscription->price_per_term, $method);

        if ($result['success'] && isset($result['payment_url'])) {
            return redirect($result['payment_url']);
        }

        return back()->withErrors(['phone' => $result['error'] ?? 'Payment initiation failed.']);
    }
}
