<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Announcement;
use App\Models\FeeCategory;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\InventoryItem;
use App\Models\InventoryPurchase;
use App\Models\Message;
use App\Models\Payroll;
use App\Models\Staff;
use App\Models\StaffDocument;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountantPortalController extends Controller
{
    private function resolveAccountant(): ?Staff
    {
        $user = auth()->user();
        return Staff::with([
            'department:id,name',
            'designation:id,name',
        ])
            ->where('school_id', $user->school_id)
            ->where('user_id', $user->id)
            ->first();
    }

    private function notLinked(string $page)
    {
        return Inertia::render($page, ['linked' => false]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       DASHBOARD
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function dashboard()
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/Dashboard');

        $user     = auth()->user();
        $schoolId = $user->school_id;

        $totalCollected = FeePayment::where('school_id', $schoolId)->sum('amount_paid');
        $totalDue       = FeePayment::where('school_id', $schoolId)->sum('amount_due');
        $totalOutstanding = $totalDue - $totalCollected;

        $monthlyCollections = FeePayment::where('school_id', $schoolId)
            ->whereMonth('payment_date', Carbon::now()->month)
            ->whereYear('payment_date', Carbon::now()->year)
            ->sum('amount_paid');

        $staffCount    = Staff::where('school_id', $schoolId)->count();
        $totalStudents = Student::where('school_id', $schoolId)->count();

        $recentPayments = FeePayment::where('school_id', $schoolId)
            ->with([
                'student:id,first_name,last_name,admission_no,class_id,user_id',
'student.user:id,avatar',
                'student.schoolClass:id,name',
                'feeStructure:id,fee_category_id,amount',
                'feeStructure.feeCategory:id,name',
            ])
            ->orderByDesc('payment_date')
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'student_name'  => $p->student?->full_name ?? 'N/A',
                'class'         => $p->student?->schoolClass?->name ?? 'N/A',
                'amount'        => (float) $p->amount_paid,
                'date'          => $p->payment_date?->format('d M Y'),
                'category'      => $p->feeStructure?->feeCategory?->name ?? 'N/A',
            ]);

        $feeByCategory = FeeCategory::where('school_id', $schoolId)
            ->withSum(['feeStructures' => fn ($q) => $q->whereHas('payments')], 'amount')
            ->get()
            ->map(function ($cat) use ($schoolId) {
                $categoryId = $cat->id;
                $collected  = FeePayment::where('school_id', $schoolId)
                    ->whereHas('feeStructure', fn ($q) => $q->where('fee_category_id', $categoryId))
                    ->sum('amount_paid');
                $count = FeePayment::where('school_id', $schoolId)
                    ->whereHas('feeStructure', fn ($q) => $q->where('fee_category_id', $categoryId))
                    ->count();
                return [
                    'name'  => $cat->name,
                    'total' => (float) $collected,
                    'count' => (int) $count,
                ];
            });

        $announcements = Announcement::where('school_id', $schoolId)
            ->where(fn ($q) => $q->where('audience', 'all')
                ->orWhere('audience', 'accountant')
                ->orWhere('audience', 'staff')
            )
            ->orderByDesc('published_at')
            ->limit(5)
            ->get(['id', 'title', 'body', 'is_pinned', 'published_at'])
            ->map(fn ($a) => [
                'id'     => $a->id,
                'title'  => $a->title,
                'body'   => $a->body,
                'pinned' => $a->is_pinned,
                'date'   => $a->published_at?->format('d M Y'),
            ]);

        $academicYear = AcademicYear::where('school_id', $schoolId)->where('is_current', true)->first();
        $academicTerm = AcademicTerm::where('school_id', $schoolId)->where('is_current', true)->first();

        return Inertia::render('Accountant/Dashboard', [
            'linked'              => true,
            'staff'               => [
                'id'          => $accountant->id,
                'full_name'   => $accountant->full_name,
                'emp_id'      => $accountant->emp_id,
                'photo_url'   => $accountant->photo_url,
                'designation' => $accountant->designation?->name,
                'department'  => $accountant->department?->name,
            ],
            'stats'               => [
                'total_collected'    => (float) $totalCollected,
                'total_outstanding'  => (float) $totalOutstanding,
                'monthly_collections'=> (float) $monthlyCollections,
                'staff_count'        => $staffCount,
                'total_students'     => $totalStudents,
            ],
            'recentPayments'      => $recentPayments,
            'feeByCategory'       => $feeByCategory,
            'recentAnnouncements'  => $announcements,
            'academicYear'        => $academicYear?->name,
            'academicTerm'        => $academicTerm?->name,
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       FEES
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function fees(Request $request)
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/Fees');

        $schoolId = $accountant->school_id;

        $query = FeePayment::where('school_id', $schoolId)
            ->with([
                'student:id,first_name,last_name,admission_no,class_id,section_id',
                'student.schoolClass:id,name',
                'feeStructure:id,fee_category_id,amount',
                'feeStructure.feeCategory:id,name',
            ]);

        if ($request->filled('class_id')) {
            $query->whereHas('student', fn ($q) => $q->where('class_id', $request->class_id));
        }

        if ($request->filled('category_id')) {
            $query->whereHas('feeStructure', fn ($q) => $q->where('fee_category_id', $request->category_id));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $payments = $query->orderByDesc('payment_date')
            ->get()
            ->map(fn ($p) => [
                'id'             => $p->id,
                'student_name'   => $p->student?->full_name ?? 'N/A',
                'class'          => $p->student?->schoolClass?->name ?? 'N/A',
                'category'       => $p->feeStructure?->feeCategory?->name ?? 'N/A',
                'amount_due'     => (float) $p->amount_due,
                'amount_paid'    => (float) $p->amount_paid,
                'balance'        => (float) $p->balance,
                'payment_date'   => $p->payment_date?->format('d M Y'),
                'status'         => $p->status,
            ]);

        $totalCollected = FeePayment::where('school_id', $schoolId)->sum('amount_paid');
        $totalDue       = FeePayment::where('school_id', $schoolId)->sum('amount_due');

        $classes    = DB::table('school_classes')->where('school_id', $schoolId)->get(['id', 'name']);
        $categories = FeeCategory::where('school_id', $schoolId)->get(['id', 'name']);

        return Inertia::render('Accountant/Fees', [
            'linked'     => true,
            'payments'   => $payments,
            'filters'    => [
                'class_id'    => $request->input('class_id', ''),
                'category_id' => $request->input('category_id', ''),
                'status'      => $request->input('status', ''),
            ],
            'classes'    => $classes,
            'categories' => $categories,
            'summary'    => [
                'total_due'     => (float) $totalDue,
                'total_paid'    => (float) $totalCollected,
                'total_balance' => (float) ($totalDue - $totalCollected),
            ],
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       FEE STRUCTURE
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function feeStructure()
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/FeeStructure');

        $schoolId = $accountant->school_id;

        $structures = FeeStructure::where('school_id', $schoolId)
            ->with(['schoolClass:id,name', 'feeCategory:id,name'])
            ->orderBy('class_id')
            ->get()
            ->groupBy(fn ($s) => $s->class_id)
            ->map(fn ($items, $classId) => [
                'class_id'   => (int) $classId,
                'class_name' => $items->first()->schoolClass?->name ?? 'Unclassified',
                'categories' => $items->map(fn ($s) => [
                    'id'     => $s->feeCategory?->id,
                    'name'   => $s->feeCategory?->name ?? 'N/A',
                    'amount' => (float) $s->amount,
                ])->values()->toArray(),
            ])
            ->values();

        $classes      = DB::table('school_classes')->where('school_id', $schoolId)->get(['id', 'name']);
        $categories   = FeeCategory::where('school_id', $schoolId)->get(['id', 'name']);

        return Inertia::render('Accountant/FeeStructure', [
            'linked'     => true,
            'structures' => $structures,
            'classes'    => $classes,
            'categories' => $categories,
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       FEE COLLECTIONS
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function feeCollections()
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/FeeCollections');

        $schoolId = $accountant->school_id;

        $dailyData = FeePayment::where('school_id', $schoolId)
            ->with([
                'student:id,first_name,last_name,admission_no,class_id,user_id',
'student.user:id,avatar',
                'student.schoolClass:id,name',
                'feeStructure:id,fee_category_id,amount',
                'feeStructure.feeCategory:id,name',
            ])
            ->select('id', 'student_id', 'fee_structure_id', 'amount_paid', 'payment_date', 'created_at')
            ->orderByDesc('payment_date')
            ->get()
            ->groupBy(fn ($p) => $p->payment_date?->format('Y-m-d'))
            ->map(fn ($items, $dateKey) => [
                'date'     => Carbon::parse($dateKey)->format('d M Y'),
                'total'    => (float) $items->sum('amount_paid'),
                'count'    => $items->count(),
                'payments' => $items->map(fn ($p) => [
                    'student_name' => $p->student?->full_name ?? 'N/A',
                    'class'        => $p->student?->schoolClass?->name ?? 'N/A',
                    'amount'       => (float) $p->amount_paid,
                    'category'     => $p->feeStructure?->feeCategory?->name ?? 'N/A',
                    'time'         => $p->created_at?->format('H:i'),
                ])->values()->toArray(),
            ])
            ->values();

        $today = Carbon::now()->format('Y-m-d');
        $todayData = $dailyData->first(fn ($d) => Carbon::parse($d['date'])->format('Y-m-d') === $today);
        $dailyTotals = [
            'total' => (float) ($todayData['total'] ?? 0),
            'count' => (int) ($todayData['count'] ?? 0),
        ];

        $monthStart = Carbon::now()->startOfMonth();
        $monthlyData = FeePayment::where('school_id', $schoolId)
            ->where('payment_date', '>=', $monthStart)
            ->select(DB::raw('SUM(amount_paid) as total'), DB::raw('COUNT(*) as count'))
            ->first();
        $monthlyTotals = [
            'total' => (float) ($monthlyData->total ?? 0),
            'count' => (int) ($monthlyData->count ?? 0),
        ];

        $term = AcademicTerm::where('school_id', $schoolId)->where('is_current', true)->first();
        $termTotal = 0;
        $termCount = 0;
        if ($term) {
            $termData = FeePayment::where('school_id', $schoolId)
                ->where('payment_date', '>=', $term->start_date)
                ->where('payment_date', '<=', $term->end_date ?? $term->start_date)
                ->select(DB::raw('SUM(amount_paid) as total'), DB::raw('COUNT(*) as count'))
                ->first();
            $termTotal = (float) ($termData->total ?? 0);
            $termCount = (int) ($termData->count ?? 0);
        }
        $termTotals = [
            'total' => $termTotal,
            'count' => $termCount,
        ];

        return Inertia::render('Accountant/FeeCollections', [
            'linked'        => true,
            'collections'   => $dailyData,
            'dailyTotals'   => $dailyTotals,
            'monthlyTotals' => $monthlyTotals,
            'termTotals'    => $termTotals,
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       OUTSTANDING
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function outstanding(Request $request)
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/Outstanding');

        $schoolId = $accountant->school_id;

        $query = FeePayment::where('school_id', $schoolId)
            ->whereIn('status', ['partial', 'unpaid'])
            ->with([
                'student:id,first_name,last_name,admission_no,class_id,user_id',
'student.user:id,avatar',
                'student.schoolClass:id,name',
                'feeStructure:id,fee_category_id,amount',
                'feeStructure.feeCategory:id,name',
            ]);

        if ($request->filled('class_id')) {
            $query->whereHas('student', fn ($q) => $q->where('class_id', $request->class_id));
        }

        if ($request->filled('category_id')) {
            $query->whereHas('feeStructure', fn ($q) => $q->where('fee_category_id', $request->category_id));
        }

        $records = $query->get();

        $outstanding = $records
            ->groupBy(fn ($p) => $p->student_id)
            ->map(function ($payments) {
                $student = $payments->first()->student;
                $breakdown = $payments->groupBy(fn ($p) => $p->feeStructure?->feeCategory?->name ?? 'N/A')
                    ->map(fn ($items, $catName) => [
                        'category' => $catName,
                        'due'      => (float) $items->sum('amount_due'),
                        'paid'     => (float) $items->sum('amount_paid'),
                        'balance'  => (float) $items->sum(fn ($p) => $p->balance),
                    ])
                    ->values()
                    ->toArray();
                return [
                    'student_name'      => $student?->full_name ?? 'N/A',
                    'class'             => $student?->schoolClass?->name ?? 'N/A',
                    'total_due'         => (float) $payments->sum('amount_due'),
                    'total_paid'        => (float) $payments->sum('amount_paid'),
                    'balance'           => (float) $payments->sum(fn ($p) => $p->balance),
                    'category_breakdown' => $breakdown,
                ];
            })
            ->values();

        $totalOutstanding = (float) $outstanding->sum('balance');
        $studentCount     = $outstanding->count();

        return Inertia::render('Accountant/Outstanding', [
            'linked'     => true,
            'outstanding' => $outstanding,
            'filters'    => [
                'class_id'    => $request->input('class_id', ''),
                'category_id' => $request->input('category_id', ''),
            ],
            'summary'    => [
                'total_outstanding' => $totalOutstanding,
                'student_count'     => $studentCount,
            ],
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       PAYROLL
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function payroll()
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/Payroll');

        $schoolId = $accountant->school_id;

        $payrolls = Payroll::where('school_id', $schoolId)
            ->with('staff:id,first_name,last_name,emp_id')
            ->orderByDesc('month_year')
            ->get()
            ->map(fn ($p) => [
                'id'           => $p->id,
                'staff_name'   => $p->staff?->full_name ?? 'N/A',
                'month'        => $p->month_year,
                'basic_salary' => (float) $p->basic_salary,
                'allowances'   => (float) $p->total_allowances,
                'deductions'   => (float) $p->total_deductions,
                'net_salary'   => (float) $p->net_salary,
                'status'       => $p->status,
            ]);

        $totalPayroll = Payroll::where('school_id', $schoolId)->sum('net_salary');
        $totalPaid    = Payroll::where('school_id', $schoolId)->where('status', 'paid')->sum('net_salary');
        $totalPending = Payroll::where('school_id', $schoolId)->where('status', '!=', 'paid')->sum('net_salary');

        return Inertia::render('Accountant/Payroll', [
            'linked'   => true,
            'payrolls' => $payrolls,
            'summary'  => [
                'total_amount' => (float) $totalPayroll,
                'total_paid'   => (float) $totalPaid,
                'total_pending'=> (float) $totalPending,
            ],
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       EXPENSES
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function expenses()
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/Expenses');

        $schoolId = $accountant->school_id;

        $expenses = InventoryPurchase::where('school_id', $schoolId)
            ->with('item:id,name,category_id')
            ->orderByDesc('purchase_date')
            ->get()
            ->map(fn ($p) => [
                'id'          => $p->id,
                'description' => $p->item?->name ?? 'N/A',
                'category'    => 'Expense',
                'amount'      => (float) $p->total_price,
                'date'        => $p->purchase_date?->format('d M Y'),
                'vendor'      => $p->vendor ?? 'N/A',
            ]);

        $monthlyTotals = InventoryPurchase::where('school_id', $schoolId)
            ->select(
                DB::raw('YEAR(purchase_date) as year'),
                DB::raw('MONTH(purchase_date) as month'),
                DB::raw('SUM(total_price) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('year', 'month')
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->limit(12)
            ->get()
            ->map(fn ($row) => [
                'month' => Carbon::createFromDate($row->year, $row->month, 1)->format('M Y'),
                'total' => (float) $row->total,
            ]);

        $categoryTotals = InventoryPurchase::where('school_id', $schoolId)
            ->join('inventory_items', 'inventory_purchases.item_id', '=', 'inventory_items.id')
            ->select('inventory_items.name as item_name', DB::raw('SUM(inventory_purchases.total_price) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('inventory_items.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'category' => $row->item_name,
                'total'    => (float) $row->total,
                'count'    => (int) $row->count,
            ]);

        return Inertia::render('Accountant/Expenses', [
            'linked'        => true,
            'expenses'      => $expenses,
            'monthlyTotals' => $monthlyTotals,
            'categoryTotals'=> $categoryTotals,
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       REPORTS
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function reports()
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/Reports');

        $schoolId = $accountant->school_id;

        $totalIncome    = FeePayment::where('school_id', $schoolId)->sum('amount_paid');
        $totalExpenses  = InventoryPurchase::where('school_id', $schoolId)->sum('total_price');
        $totalDue       = FeePayment::where('school_id', $schoolId)->sum('amount_due');
        $totalOutstanding = $totalDue - $totalIncome;

        $collectionRate = $totalDue > 0 ? round(($totalIncome / $totalDue) * 100, 1) : 0;
        $outstandingRatio = $totalDue > 0 ? round(($totalOutstanding / $totalDue) * 100, 1) : 0;

        $monthlyCollection = FeePayment::where('school_id', $schoolId)
            ->where('payment_date', '>=', Carbon::now()->subMonths(12))
            ->select(
                DB::raw('YEAR(payment_date) as year'),
                DB::raw('MONTH(payment_date) as month'),
                DB::raw('SUM(amount_paid) as collected'),
                DB::raw('SUM(amount_due) - SUM(amount_paid) as outstanding')
            )
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month'      => Carbon::createFromDate($row->year, $row->month, 1)->format('M Y'),
                'collected'  => (float) $row->collected,
                'outstanding'=> (float) ($row->outstanding ?? 0),
            ]);

        $totalPayroll = Payroll::where('school_id', $schoolId)->sum('net_salary');
        $paidPayroll  = Payroll::where('school_id', $schoolId)->where('status', 'paid')->sum('net_salary');
        $pendingPayroll = Payroll::where('school_id', $schoolId)->where('status', '!=', 'paid')->sum('net_salary');

        return Inertia::render('Accountant/Reports', [
            'linked'            => true,
            'financialSummary'  => [
                'income'    => (float) $totalIncome,
                'expenses'  => (float) $totalExpenses,
                'net'       => (float) ($totalIncome - $totalExpenses),
            ],
            'collectionRate'    => $collectionRate,
            'outstandingRatio'  => $outstandingRatio,
            'monthlyCollection' => $monthlyCollection,
            'payrollSummary'    => [
                ['label' => 'Total Payroll',  'value' => (float) $totalPayroll],
                ['label' => 'Paid',           'value' => (float) $paidPayroll],
                ['label' => 'Pending',        'value' => (float) $pendingPayroll],
            ],
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       ANNOUNCEMENTS
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function announcements()
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/Announcements');

        $schoolId = $accountant->school_id;

        $announcements = Announcement::where('school_id', $schoolId)
            ->where(fn ($q) => $q->where('audience', 'all')
                ->orWhere('audience', 'accountant')
                ->orWhere('audience', 'staff')
            )
            ->with('author:id,name')
            ->orderByDesc('published_at')
            ->get()
            ->map(fn ($a) => [
                'id'       => $a->id,
                'title'    => $a->title,
                'body'     => $a->body,
                'pinned'   => $a->is_pinned,
                'audience' => $a->audience,
                'author'   => $a->author?->name,
                'date'     => $a->published_at?->format('d M Y'),
            ]);

        return Inertia::render('Accountant/Announcements', [
            'linked'        => true,
            'accountant'    => ['full_name' => $accountant->full_name],
            'announcements' => $announcements,
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       MESSAGES
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function messages()
    {
        $user       = auth()->user();
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/Messages');

        $inbox = Message::where('school_id', $user->school_id)
            ->where('recipient_id', $user->id)
            ->with('sender:id,name')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($m) => [
                'id'         => $m->id,
                'subject'    => $m->subject ?? 'Message',
                'body'       => $m->body,
                'sender'     => $m->sender?->name ?? 'System',
                'is_read'    => ! is_null($m->read_at),
                'created_at' => $m->created_at->format('d M Y H:i'),
            ]);

        $sent = Message::where('school_id', $user->school_id)
            ->where('sender_id', $user->id)
            ->with('recipient:id,name')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($m) => [
                'id'         => $m->id,
                'subject'    => $m->subject ?? 'Message',
                'recipient'  => $m->recipient?->name ?? 'Unknown',
                'is_read'    => ! is_null($m->read_at),
                'created_at' => $m->created_at->format('d M Y H:i'),
            ]);

        $users = DB::table('users')
            ->where('school_id', $user->school_id)
            ->where('id', '!=', $user->id)
            ->get(['id', 'name']);

        return Inertia::render('Accountant/Messages', [
            'linked'     => true,
            'accountant' => ['full_name' => $accountant->full_name],
            'inbox'      => $inbox,
            'sent'       => $sent,
            'users'      => $users,
        ]);
    }

    public function messageSend(Request $request)
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return back()->withErrors(['error' => 'Accountant not linked']);

        $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'subject'      => 'required|string|max:255',
            'body'         => 'required|string',
        ]);

        Message::create([
            'school_id'    => auth()->user()->school_id,
            'sender_id'    => auth()->id(),
            'recipient_id' => $request->recipient_id,
            'subject'      => $request->subject,
            'body'         => $request->body,
        ]);

        return back()->with('success', 'Message sent.');
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       NOTIFICATIONS
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function notifications()
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/Notifications');

        $user = auth()->user();

        $unreadMessages = Message::where('school_id', $user->school_id)
            ->where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->count();

        $recentAnnouncements = Announcement::where('school_id', $user->school_id)
            ->where(fn ($q) => $q->where('audience', 'all')
                ->orWhere('audience', 'accountant')
                ->orWhere('audience', 'staff')
            )
            ->where('published_at', '>=', Carbon::now()->subDays(7))
            ->count();

        return Inertia::render('Accountant/Notifications', [
            'linked'              => true,
            'accountant'          => ['full_name' => $accountant->full_name],
            'unreadMessages'      => $unreadMessages,
            'recentAnnouncements' => $recentAnnouncements,
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       DOWNLOADS
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function downloads()
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/Downloads');

        $schoolId = $accountant->school_id;

        $documents = StaffDocument::where('school_id', $schoolId)
            ->where('staff_id', $accountant->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($d) => [
                'id'        => $d->id,
                'title'     => $d->title,
                'file_type' => $d->file_type,
                'file_size' => $d->file_size,
                'file_url'  => $d->file_url,
                'date'      => $d->created_at->format('d M Y'),
            ]);

        return Inertia::render('Accountant/Downloads', [
            'linked'     => true,
            'accountant' => ['full_name' => $accountant->full_name],
            'documents'  => $documents,
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       PROFILE
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function profile()
    {
        $accountant = $this->resolveAccountant();
        if (! $accountant) return $this->notLinked('Accountant/Profile');

        $accountant->load('documents');

        $assignedDuties = Staff::where('school_id', $accountant->school_id)
            ->where('user_id', auth()->id())
            ->with('designation:id,name')
            ->first()
            ->designation?->name;

        return Inertia::render('Accountant/Profile', [
            'linked'     => true,
            'accountant' => [
                'id'             => $accountant->id,
                'full_name'      => $accountant->full_name,
                'emp_id'         => $accountant->emp_id,
                'photo_url'      => $accountant->photo_url,
                'gender'         => $accountant->gender,
                'date_of_birth'  => $accountant->date_of_birth?->format('d M Y'),
                'blood_group'    => $accountant->blood_group,
                'religion'       => $accountant->religion,
                'nationality'    => $accountant->nationality,
                'phone'          => $accountant->phone,
                'email'          => $accountant->email,
                'address'        => $accountant->address,
                'joining_date'   => $accountant->joining_date?->format('d M Y'),
                'status'         => $accountant->status,
                'salary_type'    => $accountant->salary_type,
                'salary'         => (float) $accountant->salary,
                'department'     => $accountant->department?->name,
                'designation'    => $accountant->designation?->name,
            ],
            'assignedDuties' => $assignedDuties,
        ]);
    }
}
