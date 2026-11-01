<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Hostel;
use App\Models\HostelAllocation;
use App\Models\HostelRoom;
use App\Models\Staff;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WardenPortalController extends Controller
{
    private function resolveWarden(): ?Staff
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

    private function assignedHostel(): ?Hostel
    {
        $warden = $this->resolveWarden();
        if (! $warden) return null;

        return Hostel::where('school_id', $warden->school_id)
            ->where('warden_id', $warden->id)
            ->first();
    }

    /* ─────────────────────────────────────────────
       DASHBOARD
    ───────────────────────────────────────────── */

    public function dashboard()
    {
        $warden = $this->resolveWarden();
        if (! $warden) return $this->notLinked('WardenPortal/Dashboard');

        $schoolId = $warden->school_id;
        $hostel = $this->assignedHostel();

        $totalRooms = 0;
        $totalCapacity = 0;
        $occupied = 0;
        $occupancyRate = 0;
        $recentAllocations = collect();

        if ($hostel) {
            $totalRooms = HostelRoom::where('school_id', $schoolId)
                ->where('hostel_id', $hostel->id)->count();
            $totalCapacity = HostelRoom::where('school_id', $schoolId)
                ->where('hostel_id', $hostel->id)->sum('capacity');
            $occupied = HostelRoom::where('school_id', $schoolId)
                ->where('hostel_id', $hostel->id)->sum('occupied');
            $occupancyRate = $totalCapacity > 0 ? round(($occupied / $totalCapacity) * 100) : 0;

            $recentAllocations = HostelAllocation::where('school_id', $schoolId)
                ->where('hostel_id', $hostel->id)
                ->with(['student:id,first_name,last_name,admission_no', 'room:id,room_no'])
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->map(fn ($a) => [
                    'id'            => $a->id,
                    'student_name'  => $a->student?->full_name ?? 'N/A',
                    'room_no'       => $a->room?->room_no ?? 'N/A',
                    'bed_no'        => $a->bed_no,
                    'joining_date'  => $a->joining_date?->format('d M Y'),
                    'status'        => $a->status,
                ]);
        }

        return Inertia::render('WardenPortal/Dashboard', [
            'linked'            => true,
            'staff'             => [
                'id'          => $warden->id,
                'full_name'   => $warden->full_name,
                'emp_id'      => $warden->emp_id,
                'photo_url'   => $warden->photo_url,
            ],
            'hostel'            => $hostel ? [
                'id'    => $hostel->id,
                'name'  => $hostel->name,
                'type'  => $hostel->type,
                'status'=> $hostel->status,
            ] : null,
            'stats'             => [
                'total_rooms'     => (int) $totalRooms,
                'total_capacity'  => (int) $totalCapacity,
                'occupied'        => (int) $occupied,
                'occupancy_rate'  => $occupancyRate,
            ],
            'recentAllocations' => $recentAllocations,
        ]);
    }

    /* ─────────────────────────────────────────────
       HOSTEL
    ───────────────────────────────────────────── */

    public function hostel()
    {
        $warden = $this->resolveWarden();
        if (! $warden) return $this->notLinked('WardenPortal/Hostel');

        $hostel = $this->assignedHostel();

        $hostelData = null;
        if ($hostel) {
            $totalRooms = HostelRoom::where('school_id', $warden->school_id)
                ->where('hostel_id', $hostel->id)->count();
            $totalCapacity = HostelRoom::where('school_id', $warden->school_id)
                ->where('hostel_id', $hostel->id)->sum('capacity');
            $occupied = HostelRoom::where('school_id', $warden->school_id)
                ->where('hostel_id', $hostel->id)->sum('occupied');

            $hostelData = [
                'id'             => $hostel->id,
                'name'           => $hostel->name,
                'type'           => $hostel->type,
                'address'        => $hostel->address,
                'total_rooms'    => $totalRooms,
                'total_capacity' => (int) $totalCapacity,
                'occupied'       => (int) $occupied,
                'status'         => $hostel->status,
            ];
        }

        return Inertia::render('WardenPortal/Hostel', [
            'linked' => true,
            'hostel' => $hostelData,
        ]);
    }

    /* ─────────────────────────────────────────────
       ROOMS
    ───────────────────────────────────────────── */

    public function rooms()
    {
        $warden = $this->resolveWarden();
        if (! $warden) return $this->notLinked('WardenPortal/Rooms');

        $hostel = $this->assignedHostel();

        $rooms = collect();
        if ($hostel) {
            $rooms = HostelRoom::where('school_id', $warden->school_id)
                ->where('hostel_id', $hostel->id)
                ->orderBy('floor')
                ->orderBy('room_no')
                ->get()
                ->map(fn ($r) => [
                    'id'        => $r->id,
                    'room_no'   => $r->room_no,
                    'floor'     => $r->floor,
                    'type'      => $r->type,
                    'capacity'  => (int) $r->capacity,
                    'occupied'  => (int) $r->occupied,
                    'available' => max(0, $r->capacity - $r->occupied),
                    'ac'        => $r->ac,
                    'monthly_fee' => (float) $r->monthly_fee,
                    'status'    => $r->status,
                ]);
        }

        return Inertia::render('WardenPortal/Rooms', [
            'linked' => true,
            'rooms'  => $rooms,
            'hostel' => $hostel ? ['name' => $hostel->name] : null,
        ]);
    }

    /* ─────────────────────────────────────────────
       ALLOCATIONS
    ───────────────────────────────────────────── */

    public function allocations()
    {
        $warden = $this->resolveWarden();
        if (! $warden) return $this->notLinked('WardenPortal/Allocations');

        $hostel = $this->assignedHostel();

        $allocations = collect();
        if ($hostel) {
            $allocations = HostelAllocation::where('school_id', $warden->school_id)
                ->where('hostel_id', $hostel->id)
                ->with([
                    'student:id,first_name,last_name,admission_no',
                    'room:id,room_no',
                ])
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($a) => [
                    'id'            => $a->id,
                    'student_name'  => $a->student?->full_name ?? 'N/A',
                    'admission_no'  => $a->student?->admission_no ?? 'N/A',
                    'room_no'       => $a->room?->room_no ?? 'N/A',
                    'bed_no'        => $a->bed_no,
                    'joining_date'  => $a->joining_date?->format('d M Y'),
                    'leaving_date'  => $a->leaving_date?->format('d M Y'),
                    'status'        => $a->status,
                    'notes'         => $a->notes,
                ]);
        }

        return Inertia::render('WardenPortal/Allocations', [
            'linked'      => true,
            'allocations' => $allocations,
        ]);
    }

    /* ─────────────────────────────────────────────
       STUDENTS
    ───────────────────────────────────────────── */

    public function students()
    {
        $warden = $this->resolveWarden();
        if (! $warden) return $this->notLinked('WardenPortal/Students');

        $hostel = $this->assignedHostel();

        $students = collect();
        if ($hostel) {
            $students = HostelAllocation::where('school_id', $warden->school_id)
                ->where('hostel_id', $hostel->id)
                ->where('status', 'active')
                ->with([
                    'student:id,first_name,last_name,admission_no,phone,class_id',
                    'student.schoolClass:id,name',
                    'room:id,room_no',
                ])
                ->get()
                ->map(fn ($a) => [
                    'id'            => $a->student?->id,
                    'full_name'     => $a->student?->full_name ?? 'N/A',
                    'admission_no'  => $a->student?->admission_no ?? 'N/A',
                    'class'         => $a->student?->schoolClass?->name ?? 'N/A',
                    'phone'         => $a->student?->phone,
                    'room_no'       => $a->room?->room_no ?? 'N/A',
                    'bed_no'        => $a->bed_no,
                ]);
        }

        return Inertia::render('WardenPortal/Students', [
            'linked'   => true,
            'students' => $students,
            'hostel'   => $hostel ? ['name' => $hostel->name] : null,
        ]);
    }

    /* ─────────────────────────────────────────────
       ANNOUNCEMENTS
    ───────────────────────────────────────────── */

    public function announcements()
    {
        $warden = $this->resolveWarden();
        if (! $warden) return $this->notLinked('WardenPortal/Announcements');

        $schoolId = $warden->school_id;

        $announcements = Announcement::where('school_id', $schoolId)
            ->where(fn ($q) => $q->where('audience', 'all')
                ->orWhere('audience', 'warden')
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

        return Inertia::render('WardenPortal/Announcements', [
            'linked'        => true,
            'announcements' => $announcements,
        ]);
    }

    /* ─────────────────────────────────────────────
       PROFILE
    ───────────────────────────────────────────── */

    public function profile()
    {
        $warden = $this->resolveWarden();
        if (! $warden) return $this->notLinked('WardenPortal/Profile');

        $warden->load('department:id,name', 'designation:id,name');

        return Inertia::render('WardenPortal/Profile', [
            'linked' => true,
            'staff'  => [
                'id'             => $warden->id,
                'full_name'      => $warden->full_name,
                'emp_id'         => $warden->emp_id,
                'photo_url'      => $warden->photo_url,
                'gender'         => $warden->gender,
                'date_of_birth'  => $warden->date_of_birth?->format('d M Y'),
                'blood_group'    => $warden->blood_group,
                'religion'       => $warden->religion,
                'nationality'    => $warden->nationality,
                'phone'          => $warden->phone,
                'email'          => $warden->email,
                'address'        => $warden->address,
                'joining_date'   => $warden->joining_date?->format('d M Y'),
                'status'         => $warden->status,
                'department'     => $warden->department?->name,
                'designation'    => $warden->designation?->name,
            ],
        ]);
    }
}
