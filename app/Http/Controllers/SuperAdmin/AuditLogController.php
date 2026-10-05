<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    /**
     * Event keywords that make an entry worth surfacing as critical.
     */
    private const CRITICAL_EVENTS = ['deleted', 'destroyed', 'suspended', 'failed', 'rejected', 'revoked', 'deactivated'];

    private const WARNING_EVENTS = ['updated', 'expired', 'reset', 'disabled'];

    /**
     * Platform-wide audit trail. Unlike the school-scoped report this is not
     * filtered to a single school: a platform operator needs every actor's
     * activity across the whole estate.
     */
    public function index(Request $request)
    {
        $filters = $this->filters($request);
        $query = $this->buildQuery($filters);

        $logs = $query->with('causer')
            ->latest()
            ->paginate(50)
            ->withQueryString();

        // Totals are computed over the filtered set, not just the current page.
        $summaryQuery = $this->buildQuery($filters);

        return Inertia::render('SuperAdmin/AuditLog/Index', [
            'logs'           => $logs,
            'stats'          => [
                'total'          => (clone $summaryQuery)->count(),
                'today'          => (clone $summaryQuery)->whereDate('created_at', Carbon::today())->count(),
                'last_7_days'    => (clone $summaryQuery)->where('created_at', '>=', Carbon::now()->subDays(7))->count(),
                'unique_actors'  => (clone $summaryQuery)->whereNotNull('causer_id')->distinct()->count('causer_id'),
                'schools_touched' => $this->schoolsTouched($summaryQuery),
                'critical_count' => (clone $summaryQuery)->where(function ($q) {
                    foreach (self::CRITICAL_EVENTS as $kw) {
                        $q->orWhere('event', 'ilike', "%{$kw}%");
                    }
                })->count(),
            ],
            'topEvents'      => $this->topEvents($filters),
            'subjectTypes'   => $this->filterOptions('subject_type'),
            'events'         => $this->filterOptions('event'),
            'actors'         => User::orderBy('name')->get(['id', 'name', 'school_id']),
            'filters'        => $filters,
        ]);
    }

    /**
     * Poll endpoint: tells the client whether anything newer than the supplied
     * cursor exists, so the table can refresh without a full page load.
     */
    public function stream(Request $request)
    {
        $latest = Activity::latest('id')->value('id');
        $cursor = (int) $request->query('cursor', 0);

        return response()->json([
            'latest_id'  => $latest,
            'has_new'    => $latest !== null && $latest > $cursor,
            'new_count'  => $latest !== null && $latest > $cursor
                ? Activity::where('id', '>', $cursor)->count()
                : 0,
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * Stream the filtered audit trail as CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $filters = $this->filters($request);

        $rows = $this->buildQuery($filters)
            ->with('causer')
            ->latest()
            ->cursor()
            ->map(fn (Activity $a) => [
                $a->created_at?->toIso8601String(),
                $a->log_name,
                $a->event,
                $a->description,
                $a->causer?->name ?? 'System',
                $this->causerRole($a),
                $this->subjectLabel($a),
            ]);

        $filename = 'platform-audit-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');

            fputcsv($out, [
                'Timestamp', 'Log', 'Event', 'Description', 'Actor', 'Actor Role', 'Subject',
            ]);

            foreach ($rows as $row) {
                fputcsv($out, $row);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * @param  array<string, string|null>  $filters
     */
    private function buildQuery(array $filters): \Illuminate\Database\Eloquent\Builder
    {
        $query = Activity::query();

        if (! empty($filters['causer_id'])) {
            $query->where('causer_id', $filters['causer_id']);
        }

        if (! empty($filters['event'])) {
            $query->where('event', 'ilike', "%{$filters['event']}%");
        }

        if (! empty($filters['subject_type'])) {
            $query->where('subject_type', 'like', "%{$filters['subject_type']}%");
        }

        if (! empty($filters['log_name'])) {
            $query->where('log_name', $filters['log_name']);
        }

        if (! empty($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }

        if (! empty($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        // Platform view: restrict to critical-looking entries when asked.
        if (($filters['severity'] ?? 'all') === 'critical') {
            $query->where(function ($q) {
                foreach (self::CRITICAL_EVENTS as $kw) {
                    $q->orWhere('event', 'ilike', "%{$kw}%");
                }
            });
        } elseif (($filters['severity'] ?? 'all') === 'warning') {
            $query->where(function ($q) {
                foreach (self::WARNING_EVENTS as $kw) {
                    $q->orWhere('event', 'ilike', "%{$kw}%");
                }
            });
        }

        return $query;
    }

    /**
     * @param  array<string, string|null>  $filters
     * @return array<int, array{event: string, count: int}>
     */
    private function topEvents(array $filters): array
    {
        return $this->buildQuery($filters)
            ->whereNotNull('event')
            ->selectRaw('event, COUNT(*) as aggregate')
            ->groupBy('event')
            ->orderByDesc('aggregate')
            ->limit(8)
            ->get()
            ->map(fn ($r) => ['event' => $r->event, 'count' => (int) $r->aggregate])
            ->all();
    }

    /**
     * Distinct values for a column, to populate filter dropdowns.
     *
     * @return array<int, string>
     */
    private function filterOptions(string $column): array
    {
        return Activity::whereNotNull($column)
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->take(60)
            ->all();
    }

    /**
     * How many distinct schools are represented by the filtered activities.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     */
    private function schoolsTouched($query): int
    {
        // Causers are users, so map the filtered causer ids onto their schools.
        $causerIds = (clone $query)->whereNotNull('causer_id')
            ->whereIn('causer_type', [User::class, 'App\Models\User'])
            ->distinct()
            ->pluck('causer_id');

        return User::whereIn('id', $causerIds)
            ->whereNotNull('school_id')
            ->distinct()
            ->count('school_id');
    }

    private function causerRole(Activity $a): string
    {
        if (! $a->causer) {
            return 'system';
        }

        $roles = method_exists($a->causer, 'roles')
            ? $a->causer->roles->pluck('name')->implode(', ')
            : '';

        return $roles !== '' ? $roles : 'user';
    }

    private function subjectLabel(Activity $a): string
    {
        if (! $a->subject_type) {
            return '—';
        }

        $class = class_basename($a->subject_type);

        return $a->subject_id ? "{$class} #{$a->subject_id}" : $class;
    }

    /**
     * @return array<string, string|null>
     */
    private function filters(Request $request): array
    {
        return [
            'causer_id'    => $request->query('causer_id') ?: null,
            'event'        => $request->query('event') ?: null,
            'subject_type' => $request->query('subject_type') ?: null,
            'log_name'     => $request->query('log_name') ?: null,
            'severity'     => in_array($request->query('severity'), ['all', 'critical', 'warning'], true)
                ? $request->query('severity') : 'all',
            'from_date'    => $request->query('from_date') ?: null,
            'to_date'      => $request->query('to_date') ?: null,
        ];
    }
}