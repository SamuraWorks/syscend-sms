<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Book;
use App\Models\BookIssue;
use App\Models\Staff;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LibrarianPortalController extends Controller
{
    private function resolveLibrarian(): ?Staff
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
        $librarian = $this->resolveLibrarian();
        if (! $librarian) return $this->notLinked('LibrarianPortal/Dashboard');

        $schoolId = $librarian->school_id;

        $totalBooks = Book::where('school_id', $schoolId)->sum('total_copies');
        $activeIssues = BookIssue::where('school_id', $schoolId)->where('status', 'issued')->count();
        $overdueCount = BookIssue::where('school_id', $schoolId)
            ->where('status', 'issued')
            ->where('due_date', '<', now())
            ->count();
        $studentsWithBooks = BookIssue::where('school_id', $schoolId)
            ->where('status', 'issued')
            ->distinct('member_id')
            ->count('member_id');

        $recentIssues = BookIssue::where('school_id', $schoolId)
            ->with(['book:id,title', 'member'])
            ->orderByDesc('issued_date')
            ->limit(10)
            ->get()
            ->map(fn ($i) => [
                'id'          => $i->id,
                'book_title'  => $i->book?->title ?? 'N/A',
                'member_name' => $i->member?->full_name ?? $i->member?->name ?? 'N/A',
                'issued_date' => $i->issued_date?->format('d M Y'),
                'due_date'    => $i->due_date?->format('d M Y'),
                'status'      => $i->status,
            ]);

        return Inertia::render('LibrarianPortal/Dashboard', [
            'linked'        => true,
            'staff'         => [
                'id'          => $librarian->id,
                'full_name'   => $librarian->full_name,
                'emp_id'      => $librarian->emp_id,
                'photo_url'   => $librarian->photo_url,
            ],
            'stats'         => [
                'total_books'        => (int) $totalBooks,
                'active_issues'      => $activeIssues,
                'overdue_count'      => $overdueCount,
                'students_with_books'=> $studentsWithBooks,
            ],
            'recentIssues'  => $recentIssues,
        ]);
    }

    /* ─────────────────────────────────────────────
       BOOKS
    ───────────────────────────────────────────── */

    public function books(Request $request)
    {
        $librarian = $this->resolveLibrarian();
        if (! $librarian) return $this->notLinked('LibrarianPortal/Books');

        $schoolId = $librarian->school_id;

        $query = Book::where('school_id', $schoolId);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%")
                  ->orWhere('isbn', 'like', "%{$search}%");
            });
        }

        $books = $query->orderByDesc('created_at')
            ->paginate(15)
            ->through(fn ($b) => [
                'id'               => $b->id,
                'title'            => $b->title,
                'author'           => $b->author,
                'isbn'             => $b->isbn,
                'category'         => $b->category,
                'total_copies'     => (int) $b->total_copies,
                'available_copies' => (int) $b->available_copies,
                'is_active'        => $b->is_active,
            ]);

        return Inertia::render('LibrarianPortal/Books', [
            'linked'    => true,
            'books'     => $books,
            'filters'   => ['search' => $request->input('search', '')],
        ]);
    }

    /* ─────────────────────────────────────────────
       ISSUES
    ───────────────────────────────────────────── */

    public function issues(Request $request)
    {
        $librarian = $this->resolveLibrarian();
        if (! $librarian) return $this->notLinked('LibrarianPortal/Issues');

        $schoolId = $librarian->school_id;

        $issues = BookIssue::where('school_id', $schoolId)
            ->with(['book:id,title', 'member'])
            ->orderByDesc('issued_date')
            ->paginate(15)
            ->through(fn ($i) => [
                'id'          => $i->id,
                'book_title'  => $i->book?->title ?? 'N/A',
                'member_name' => $i->member?->full_name ?? $i->member?->name ?? 'N/A',
                'issued_date' => $i->issued_date?->format('d M Y'),
                'due_date'    => $i->due_date?->format('d M Y'),
                'returned_date'=> $i->returned_date?->format('d M Y'),
                'status'      => $i->status,
                'fine'        => (float) ($i->fine ?? 0),
            ]);

        return Inertia::render('LibrarianPortal/Issues', [
            'linked'  => true,
            'issues'  => $issues,
        ]);
    }

    /* ─────────────────────────────────────────────
       OVERDUE
    ───────────────────────────────────────────── */

    public function overdue()
    {
        $librarian = $this->resolveLibrarian();
        if (! $librarian) return $this->notLinked('LibrarianPortal/Overdue');

        $schoolId = $librarian->school_id;

        $overdue = BookIssue::where('school_id', $schoolId)
            ->where('status', 'issued')
            ->where('due_date', '<', now())
            ->with(['book:id,title,fine_per_day', 'member'])
            ->orderBy('due_date')
            ->get()
            ->map(function ($i) {
                $overdueDays = max(0, (int) now()->diffInDays($i->due_date));
                $fine = $overdueDays * (float) ($i->fine_per_day ?? 0);
                return [
                    'id'           => $i->id,
                    'book_title'   => $i->book?->title ?? 'N/A',
                    'member_name'  => $i->member?->full_name ?? $i->member?->name ?? 'N/A',
                    'issued_date'  => $i->issued_date?->format('d M Y'),
                    'due_date'     => $i->due_date?->format('d M Y'),
                    'overdue_days' => $overdueDays,
                    'fine'         => round($fine, 2),
                ];
            });

        return Inertia::render('LibrarianPortal/Overdue', [
            'linked'  => true,
            'overdue' => $overdue,
        ]);
    }

    /* ─────────────────────────────────────────────
       ANNOUNCEMENTS
    ───────────────────────────────────────────── */

    public function announcements()
    {
        $librarian = $this->resolveLibrarian();
        if (! $librarian) return $this->notLinked('LibrarianPortal/Announcements');

        $schoolId = $librarian->school_id;

        $announcements = Announcement::where('school_id', $schoolId)
            ->where(fn ($q) => $q->where('audience', 'all')
                ->orWhere('audience', 'librarian')
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

        return Inertia::render('LibrarianPortal/Announcements', [
            'linked'        => true,
            'announcements' => $announcements,
        ]);
    }

    /* ─────────────────────────────────────────────
       PROFILE
    ───────────────────────────────────────────── */

    public function profile()
    {
        $librarian = $this->resolveLibrarian();
        if (! $librarian) return $this->notLinked('LibrarianPortal/Profile');

        $librarian->load('department:id,name', 'designation:id,name');

        return Inertia::render('LibrarianPortal/Profile', [
            'linked'    => true,
            'staff'     => [
                'id'             => $librarian->id,
                'full_name'      => $librarian->full_name,
                'emp_id'         => $librarian->emp_id,
                'photo_url'      => $librarian->photo_url,
                'gender'         => $librarian->gender,
                'date_of_birth'  => $librarian->date_of_birth?->format('d M Y'),
                'blood_group'    => $librarian->blood_group,
                'religion'       => $librarian->religion,
                'nationality'    => $librarian->nationality,
                'phone'          => $librarian->phone,
                'email'          => $librarian->email,
                'address'        => $librarian->address,
                'joining_date'   => $librarian->joining_date?->format('d M Y'),
                'status'         => $librarian->status,
                'department'     => $librarian->department?->name,
                'designation'    => $librarian->designation?->name,
            ],
        ]);
    }
}
