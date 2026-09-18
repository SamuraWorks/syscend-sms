<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\InventoryItem;
use App\Models\InventoryIssue;
use App\Models\InventoryPurchase;
use App\Models\Staff;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StoreManagerPortalController extends Controller
{
    private function resolveStoreManager(): ?Staff
    {
        $user = auth()->user();
        return Staff::where('school_id', $user->school_id)
            ->where('user_id', $user->id)
            ->first();
    }

    private function notLinked(string $page)
    {
        return Inertia::render($page, ['linked' => false]);
    }

    /* ─────────────────────────────────────────────
       DASHBOARD
    ───────────────────────────────────────────── */

    public function dashboard()
    {
        $manager = $this->resolveStoreManager();
        if (! $manager) return $this->notLinked('StoreManagerPortal/Dashboard');

        $schoolId = $manager->school_id;

        $totalItems = InventoryItem::where('school_id', $schoolId)->count();
        $lowStockItems = InventoryItem::where('school_id', $schoolId)
            ->whereRaw('current_stock <= minimum_stock')
            ->count();
        $totalStockValue = (float) InventoryItem::where('school_id', $schoolId)
            ->sum('current_stock');

        $recentPurchases = InventoryPurchase::where('school_id', $schoolId)
            ->with('item:id,name')
            ->orderByDesc('purchase_date')
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'id'            => $p->id,
                'item_name'     => $p->item?->name ?? 'N/A',
                'vendor'        => $p->vendor ?? 'N/A',
                'quantity'      => (float) $p->quantity,
                'total_price'   => (float) $p->total_price,
                'purchase_date' => $p->purchase_date?->format('d M Y'),
            ]);

        $lowStockList = InventoryItem::where('school_id', $schoolId)
            ->whereRaw('current_stock <= minimum_stock')
            ->with('category:id,name')
            ->orderBy('current_stock')
            ->limit(10)
            ->get()
            ->map(fn ($i) => [
                'id'             => $i->id,
                'name'           => $i->name,
                'category'       => $i->category?->name ?? 'N/A',
                'current_stock'  => (float) $i->current_stock,
                'minimum_stock'  => (float) $i->minimum_stock,
                'unit'           => $i->unit,
            ]);

        return Inertia::render('StoreManagerPortal/Dashboard', [
            'linked'         => true,
            'staff'          => [
                'id'        => $manager->id,
                'full_name' => $manager->full_name,
                'emp_id'    => $manager->emp_id,
                'photo_url' => $manager->photo_url,
            ],
            'stats'          => [
                'total_items'      => $totalItems,
                'low_stock_items'  => $lowStockItems,
                'total_stock_value'=> $totalStockValue,
            ],
            'recentPurchases'=> $recentPurchases,
            'lowStockList'   => $lowStockList,
        ]);
    }

    /* ─────────────────────────────────────────────
       ITEMS
    ───────────────────────────────────────────── */

    public function items(Request $request)
    {
        $manager = $this->resolveStoreManager();
        if (! $manager) return $this->notLinked('StoreManagerPortal/Items');

        $schoolId = $manager->school_id;

        $query = InventoryItem::where('school_id', $schoolId)
            ->with('category:id,name');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('low_stock')) {
            $query->whereRaw('current_stock <= minimum_stock');
        }

        $items = $query->orderByDesc('created_at')
            ->paginate(15)
            ->through(fn ($i) => [
                'id'             => $i->id,
                'name'           => $i->name,
                'category'       => $i->category?->name ?? 'N/A',
                'unit'           => $i->unit,
                'current_stock'  => (float) $i->current_stock,
                'minimum_stock'  => (float) $i->minimum_stock,
                'is_low_stock'   => $i->isLowStock(),
                'is_active'      => $i->is_active,
            ]);

        return Inertia::render('StoreManagerPortal/Items', [
            'linked'  => true,
            'items'   => $items,
            'filters' => [
                'search'    => $request->input('search', ''),
                'low_stock' => $request->input('low_stock', ''),
            ],
        ]);
    }

    /* ─────────────────────────────────────────────
       PURCHASES
    ───────────────────────────────────────────── */

    public function purchases(Request $request)
    {
        $manager = $this->resolveStoreManager();
        if (! $manager) return $this->notLinked('StoreManagerPortal/Purchases');

        $schoolId = $manager->school_id;

        $purchases = InventoryPurchase::where('school_id', $schoolId)
            ->with('item:id,name')
            ->orderByDesc('purchase_date')
            ->paginate(15)
            ->through(fn ($p) => [
                'id'            => $p->id,
                'item_name'     => $p->item?->name ?? 'N/A',
                'vendor'        => $p->vendor ?? 'N/A',
                'quantity'      => (float) $p->quantity,
                'unit_price'    => (float) $p->unit_price,
                'total_price'   => (float) $p->total_price,
                'invoice_no'    => $p->invoice_no,
                'purchase_date' => $p->purchase_date?->format('d M Y'),
                'notes'         => $p->notes,
            ]);

        $totalSpent = InventoryPurchase::where('school_id', $schoolId)->sum('total_price');

        return Inertia::render('StoreManagerPortal/Purchases', [
            'linked'     => true,
            'purchases'  => $purchases,
            'totalSpent' => (float) $totalSpent,
        ]);
    }

    /* ─────────────────────────────────────────────
       ISSUES
    ───────────────────────────────────────────── */

    public function issues(Request $request)
    {
        $manager = $this->resolveStoreManager();
        if (! $manager) return $this->notLinked('StoreManagerPortal/Issues');

        $schoolId = $manager->school_id;

        $issues = InventoryIssue::where('school_id', $schoolId)
            ->with('item:id,name')
            ->orderByDesc('issue_date')
            ->paginate(15)
            ->through(fn ($i) => [
                'id'             => $i->id,
                'item_name'      => $i->item?->name ?? 'N/A',
                'issued_to_name' => $i->issued_to_name ?? 'N/A',
                'quantity'       => (float) $i->quantity,
                'issue_date'     => $i->issue_date?->format('d M Y'),
                'return_date'    => $i->return_date?->format('d M Y'),
                'purpose'        => $i->purpose,
                'status'         => $i->status,
            ]);

        return Inertia::render('StoreManagerPortal/Issues', [
            'linked' => true,
            'issues' => $issues,
        ]);
    }

    /* ─────────────────────────────────────────────
       ANNOUNCEMENTS
    ───────────────────────────────────────────── */

    public function announcements()
    {
        $manager = $this->resolveStoreManager();
        if (! $manager) return $this->notLinked('StoreManagerPortal/Announcements');

        $schoolId = $manager->school_id;

        $announcements = Announcement::where('school_id', $schoolId)
            ->where(fn ($q) => $q->where('audience', 'all')
                ->orWhere('audience', 'store-manager')
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

        return Inertia::render('StoreManagerPortal/Announcements', [
            'linked'        => true,
            'announcements' => $announcements,
        ]);
    }

    /* ─────────────────────────────────────────────
       PROFILE
    ───────────────────────────────────────────── */

    public function profile()
    {
        $manager = $this->resolveStoreManager();
        if (! $manager) return $this->notLinked('StoreManagerPortal/Profile');

        $manager->load('department:id,name', 'designation:id,name');

        return Inertia::render('StoreManagerPortal/Profile', [
            'linked' => true,
            'staff'  => [
                'id'             => $manager->id,
                'full_name'      => $manager->full_name,
                'emp_id'         => $manager->emp_id,
                'photo_url'      => $manager->photo_url,
                'gender'         => $manager->gender,
                'date_of_birth'  => $manager->date_of_birth?->format('d M Y'),
                'blood_group'    => $manager->blood_group,
                'religion'       => $manager->religion,
                'nationality'    => $manager->nationality,
                'phone'          => $manager->phone,
                'email'          => $manager->email,
                'address'        => $manager->address,
                'joining_date'   => $manager->joining_date?->format('d M Y'),
                'status'         => $manager->status,
                'department'     => $manager->department?->name,
                'designation'    => $manager->designation?->name,
            ],
        ]);
    }
}
