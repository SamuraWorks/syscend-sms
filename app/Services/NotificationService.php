<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentAlert;
use App\Models\Staff;
use App\Models\Guardian;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    public function notifyStudentAlert(StudentAlert $alert): void
    {
        $student = $alert->student()->with(['schoolClass', 'guardian', 'guardian.user'])->first();
        if (!$student) return;

        $this->notifyPrincipal($alert, $student);
        $this->notifyClassTeacher($alert, $student);

        if ($student->guardian) {
            $this->notifyParent($alert, $student);
        }

        Log::info("Performance alert notification sent", [
            'alert_id' => $alert->id,
            'student_id' => $student->id,
            'type' => $alert->type,
            'severity' => $alert->severity,
        ]);
    }

    public function notifyCriticalAlert(StudentAlert $alert, Student $student): void
    {
        $this->notifyPrincipal($alert, $student);
        $this->notifyClassTeacher($alert, $student);

        if ($student->guardian) {
            $this->notifyParent($alert, $student);
        }

        Log::critical("Critical performance alert", [
            'alert_id' => $alert->id,
            'student_id' => $student->id,
            'type' => $alert->type,
        ]);
    }

    public function notifySignificantImprovement(StudentAlert $alert, Student $student): void
    {
        $this->notifyParent($alert, $student);

        Log::info("Student improvement notification", [
            'alert_id' => $alert->id,
            'student_id' => $student->id,
            'total_score' => $alert->data['total_score'] ?? null,
        ]);
    }

    protected function notifyPrincipal(StudentAlert $alert, Student $student): void
    {
        Staff::where('school_id', $student->school_id)
            ->whereHas('designation', fn($q) => $q->where('name', 'ILIKE', '%principal%'))
            ->whereHas('user', fn($q) => $q->where('email', '!=', null))
            ->each(fn(Staff $principal) => $this->dispatchNotification(
                $principal->user,
                $alert->title,
                $this->buildMessage($alert, $student),
                'performance_alert',
                ['alert_id' => $alert->id, 'student_id' => $student->id]
            ));
    }

    protected function notifyClassTeacher(StudentAlert $alert, Student $student): void
    {
        $teacherId = $student->schoolClass?->class_teacher_id;
        if (!$teacherId) return;

        $teacher = Staff::find($teacherId);
        if ($teacher && $teacher->user) {
            $this->dispatchNotification(
                $teacher->user,
                $alert->title,
                $this->buildMessage($alert, $student),
                'performance_alert',
                ['alert_id' => $alert->id, 'student_id' => $student->id]
            );
        }
    }

    protected function notifyParent(StudentAlert $alert, Student $student): void
    {
        $guardian = $student->guardian()->with('user')->first();
        if (!$guardian || !$guardian->user) return;

        $this->dispatchNotification(
            $guardian->user,
            $alert->title,
            $this->buildParentMessage($alert, $student),
            'child_performance_alert',
            ['alert_id' => $alert->id, 'student_id' => $student->id]
        );
    }

    protected function buildMessage(StudentAlert $alert, Student $student): string
    {
        return "{$student->full_name}: {$alert->message}";
    }

    protected function buildParentMessage(StudentAlert $alert, Student $student): string
    {
        return "Dear Parent, {$alert->message} Please contact the school for more details.";
    }

    protected function dispatchNotification(User $user, string $title, string $message, string $type, array $data = []): void
    {
        try {
            $existing = $user->notifications()
                ->where('type', $type)
                ->where('data->alert_id', $data['alert_id'] ?? null)
                ->first();

            if (!$existing) {
                $user->notifications()->create([
                    'id'     => \Illuminate\Support\Str::uuid(),
                    'type'   => $type,
                    'data'   => json_encode(array_merge(['title' => $title, 'message' => $message], $data)),
                ]);
            }
        } catch (\Exception $e) {
            Log::warning("Failed to dispatch notification to user {$user->id}", [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
