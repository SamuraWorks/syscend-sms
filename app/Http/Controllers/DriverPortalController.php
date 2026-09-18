<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Staff;
use App\Models\TransportRoute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DriverPortalController extends Controller
{
    private function resolveDriver(): ?Staff
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

    private function assignedRoute(): ?TransportRoute
    {
        $driver = $this->resolveDriver();
        if (! $driver) return null;

        return TransportRoute::where('school_id', $driver->school_id)
            ->where('vehicle_id', $driver->vehicle_id ?? 0)
            ->with(['vehicle:id,plate_no,name,driver_name,capacity'])
            ->first();
    }

    /* ─────────────────────────────────────────────
       DASHBOARD
    ───────────────────────────────────────────── */

    public function dashboard()
    {
        $driver = $this->resolveDriver();
        if (! $driver) return $this->notLinked('DriverPortal/Dashboard');

        $schoolId = $driver->school_id;
        $route = $this->assignedRoute();

        $studentCount = 0;
        $todayPickups = collect();
        if ($route) {
            $studentCount = $route->students()->count();
            $stops = $route->stops ?? [];
            $todayPickups = collect($stops)->map(fn ($stop, $i) => [
                'stop'        => $stop['name'] ?? $stop,
                'time'        => $stop['time'] ?? null,
                'status'      => 'pending',
                'order'       => $i + 1,
            ]);
        }

        return Inertia::render('DriverPortal/Dashboard', [
            'linked'        => true,
            'staff'         => [
                'id'          => $driver->id,
                'full_name'   => $driver->full_name,
                'emp_id'      => $driver->emp_id,
                'photo_url'   => $driver->photo_url,
            ],
            'route'         => $route ? [
                'id'           => $route->id,
                'name'         => $route->name,
                'start_point'  => $route->start_point,
                'end_point'    => $route->end_point,
                'vehicle'      => [
                    'plate_no'    => $route->vehicle?->plate_no,
                    'name'        => $route->vehicle?->name,
                    'capacity'    => $route->vehicle?->capacity,
                ],
            ] : null,
            'studentCount'  => $studentCount,
            'todayPickups'  => $todayPickups,
        ]);
    }

    /* ─────────────────────────────────────────────
       ROUTE
    ───────────────────────────────────────────── */

    public function route()
    {
        $driver = $this->resolveDriver();
        if (! $driver) return $this->notLinked('DriverPortal/Route');

        $route = $this->assignedRoute();

        $routeData = null;
        if ($route) {
            $stops = $route->stops ?? [];
            $routeData = [
                'id'          => $route->id,
                'name'        => $route->name,
                'start_point' => $route->start_point,
                'end_point'   => $route->end_point,
                'monthly_fee' => (float) $route->monthly_fee,
                'vehicle'     => [
                    'plate_no'    => $route->vehicle?->plate_no,
                    'name'        => $route->vehicle?->name,
                    'capacity'    => $route->vehicle?->capacity,
                ],
                'stops' => collect($stops)->map(fn ($s, $i) => [
                    'name'  => $s['name'] ?? $s,
                    'time'  => $s['time'] ?? null,
                    'order' => $i + 1,
                ])->values(),
            ];
        }

        return Inertia::render('DriverPortal/Route', [
            'linked' => true,
            'route'  => $routeData,
        ]);
    }

    /* ─────────────────────────────────────────────
       STUDENTS
    ───────────────────────────────────────────── */

    public function students()
    {
        $driver = $this->resolveDriver();
        if (! $driver) return $this->notLinked('DriverPortal/Students');

        $route = $this->assignedRoute();

        $students = [];
        if ($route) {
            $students = $route->students()
                ->with(['schoolClass:id,name'])
                ->get()
                ->map(fn ($s) => [
                    'id'            => $s->id,
                    'full_name'     => $s->full_name,
                    'admission_no'  => $s->admission_no,
                    'class'         => $s->schoolClass?->name ?? 'N/A',
                    'phone'         => $s->phone,
                    'stop'          => $s->pivot?->stop ?? 'N/A',
                ])
                ->values();
        }

        return Inertia::render('DriverPortal/Students', [
            'linked'   => true,
            'students' => $students,
            'route'    => $route ? ['name' => $route->name] : null,
        ]);
    }

    /* ─────────────────────────────────────────────
       SCHEDULE
    ───────────────────────────────────────────── */

    public function schedule()
    {
        $driver = $this->resolveDriver();
        if (! $driver) return $this->notLinked('DriverPortal/Schedule');

        $route = $this->assignedRoute();

        $schedule = [];
        if ($route) {
            $stops = $route->stops ?? [];
            $schedule = [
                'route_name' => $route->name,
                'morning'    => collect($stops)->map(fn ($s, $i) => [
                    'stop'   => $s['name'] ?? $s,
                    'time'   => $s['pickup_time'] ?? $s['time'] ?? null,
                    'order'  => $i + 1,
                ])->values(),
                'afternoon'  => collect($stops)->reverse()->map(fn ($s, $i) => [
                    'stop'   => $s['name'] ?? $s,
                    'time'   => $s['dropoff_time'] ?? null,
                    'order'  => $i + 1,
                ])->values(),
            ];
        }

        return Inertia::render('DriverPortal/Schedule', [
            'linked'   => true,
            'schedule' => $schedule,
        ]);
    }

    /* ─────────────────────────────────────────────
       ANNOUNCEMENTS
    ───────────────────────────────────────────── */

    public function announcements()
    {
        $driver = $this->resolveDriver();
        if (! $driver) return $this->notLinked('DriverPortal/Announcements');

        $schoolId = $driver->school_id;

        $announcements = Announcement::where('school_id', $schoolId)
            ->where(fn ($q) => $q->where('audience', 'all')
                ->orWhere('audience', 'driver')
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

        return Inertia::render('DriverPortal/Announcements', [
            'linked'        => true,
            'announcements' => $announcements,
        ]);
    }

    /* ─────────────────────────────────────────────
       PROFILE
    ───────────────────────────────────────────── */

    public function profile()
    {
        $driver = $this->resolveDriver();
        if (! $driver) return $this->notLinked('DriverPortal/Profile');

        $driver->load('department:id,name', 'designation:id,name');

        return Inertia::render('DriverPortal/Profile', [
            'linked' => true,
            'staff'  => [
                'id'             => $driver->id,
                'full_name'      => $driver->full_name,
                'emp_id'         => $driver->emp_id,
                'photo_url'      => $driver->photo_url,
                'gender'         => $driver->gender,
                'date_of_birth'  => $driver->date_of_birth?->format('d M Y'),
                'blood_group'    => $driver->blood_group,
                'religion'       => $driver->religion,
                'nationality'    => $driver->nationality,
                'phone'          => $driver->phone,
                'email'          => $driver->email,
                'address'        => $driver->address,
                'joining_date'   => $driver->joining_date?->format('d M Y'),
                'status'         => $driver->status,
                'department'     => $driver->department?->name,
                'designation'    => $driver->designation?->name,
            ],
        ]);
    }
}
