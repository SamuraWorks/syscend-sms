<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Models\Attendance;
use App\Models\Exam;
use App\Models\FeePayment;
use App\Models\Guardian;
use App\Models\Homework;
use App\Models\Mark;
use App\Models\ReportCard;
use App\Models\Staff;
use App\Models\Student;
use App\Policies\AttendancePolicy;
use App\Policies\ExamPolicy;
use App\Policies\FeePaymentPolicy;
use App\Policies\GuardianPolicy;
use App\Policies\HomeworkPolicy;
use App\Policies\MarkPolicy;
use App\Policies\ReportCardPolicy;
use App\Policies\StaffPolicy;
use App\Policies\StudentPolicy;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Student::class       => StudentPolicy::class,
        Guardian::class      => GuardianPolicy::class,
        Staff::class         => StaffPolicy::class,
        Mark::class          => MarkPolicy::class,
        Attendance::class    => AttendancePolicy::class,
        Homework::class      => HomeworkPolicy::class,
        FeePayment::class    => FeePaymentPolicy::class,
        Exam::class          => ExamPolicy::class,
        ReportCard::class    => ReportCardPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
