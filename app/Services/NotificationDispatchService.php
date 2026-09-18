<?php
namespace App\Services;

use App\Models\{User, Notification, AuditLog};
use Illuminate\Support\Facades\Notification as NotificationFacade;

class NotificationDispatchService
{
    /**
     * Dispatch a notification to users with the given role in the school.
     */
    public static function notifyRole(int $schoolId, string $role, string $title, string $message, string $url = null): void
    {
        $users = User::where('school_id', $schoolId)
            ->whereHas('roles', fn($q) => $q->where('name', $role))
            ->get();
            
        foreach ($users as $user) {
            Notification::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => 'App\\Notifications\\SystemNotification',
                'notifiable_type' => User::class,
                'notifiable_id' => $user->id,
                'data' => json_encode([
                    'title' => $title,
                    'message' => $message,
                    'url' => $url,
                ]),
            ]);
        }
    }

    /**
     * Notify specific user
     */
    public static function notifyUser(User $user, string $title, string $message, string $url = null): void
    {
        Notification::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => 'App\\Notifications\\SystemNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'data' => json_encode([
                'title' => $title,
                'message' => $message,
                'url' => $url,
            ]),
        ]);
    }

    /**
     * Notify on attendance approval
     */
    public static function onAttendanceApproved(int $schoolId, string $date, int $classId, int $approvedBy): void
    {
        $approver = User::find($approvedBy);
        self::notifyRole($schoolId, 'principal', 
            'Attendance Approved',
            "{$approver->name} approved attendance for {$date}",
            '/school/reports/attendance'
        );
    }

    /**
     * Notify on result change request
     */
    public static function onResultChangeRequested(int $schoolId, int $requestId, int $requestedBy): void
    {
        self::notifyRole($schoolId, 'principal',
            'Result Change Request',
            'A new result change request has been submitted for review.',
            "/school/result-change-requests"
        );
    }

    /**
     * Notify on result change approved/rejected
     */
    public static function onResultChangeReviewed(int $schoolId, int $requestId, int $userId, string $status): void
    {
        $user = User::find($userId);
        $label = $status === 'approved' ? 'approved' : 'rejected';
        self::notifyUser($user,
            'Result Change ' . ucfirst($status),
            "Your result change request has been {$label}.",
            "/school/result-change-requests"
        );
    }

    /**
     * Notify on fee payment
     */
    public static function onFeePaymentReceived(int $schoolId, int $studentId, float $amount): void
    {
        $student = \App\Models\Student::find($studentId);
        if ($student?->guardian?->user_id) {
            $guardianUser = User::find($student->guardian->user_id);
            self::notifyUser($guardianUser,
                'Fee Payment Received',
                "A payment of Le " . number_format($amount, 2) . " has been recorded for {$student->full_name}.",
                '/school/parent/fees'
            );
        }
    }

    /**
     * Notify on report card published
     */
    public static function onReportCardPublished(int $schoolId, int $reportCardId, int $classId): void
    {
        $students = \App\Models\Student::where('class_id', $classId)->get();
        foreach ($students as $student) {
            if ($student->guardian?->user_id) {
                $user = User::find($student->guardian->user_id);
                self::notifyUser($user,
                    'Report Card Published',
                    "A new report card has been published for {$student->full_name}.",
                    '/school/parent/report-cards'
                );
            }
        }
    }
}
