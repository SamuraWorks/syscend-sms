<?php

namespace Tests\Concerns;

use App\Models\Announcement;
use App\Models\Asset;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Book;
use App\Models\FeeCategory;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\GradeScale;
use App\Models\Guardian;
use App\Models\Homework;
use App\Models\Hostel;
use App\Models\HostelRoom;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Package;
use App\Models\PackageModule;
use App\Models\Payroll;
use App\Models\ReportCard;
use App\Models\SalaryStructure;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SubjectOffering;
use App\Models\Syllabus;
use App\Models\Timetable;
use App\Models\TransportRoute;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Exam;
use App\Models\Mark;
use App\Models\Section;
use App\Services\RoleRegistry;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

trait InteractsWithDomain
{
    // ── Orchestration ───────────────────────────────────────────────────

    public function seedRolesAndPermissions(): void
    {
        $this->seed(RolePermissionSeeder::class);
    }

    public function seedAllRolesAndPermissions(): void
    {
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        $this->seed(RolePermissionSeeder::class);
    }

    public function ensureRole(string $role): void
    {
        if (! Role::where('name', $role)->exists()) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    // ── School / Package / Subscription ─────────────────────────────────

    public function createSchool(array $attributes = []): School
    {
        return School::create(array_merge([
            'name'           => 'Test School ' . Str::random(6),
            'slug'           => 'test-school-' . Str::lower(Str::random(12)),
            'email'          => 'admin@' . Str::lower(Str::random(8)) . '.test',
            'phone'          => '+232' . random_int(10000000, 99999999),
            'address'        => '123 Test Street',
            'city'           => 'Freetown',
            'country'        => 'SL',
            'timezone'       => 'Africa/Freetown',
            'currency'       => 'SLL',
            'currency_symbol'=> 'Le',
            'status'         => 'active',
            'is_configured'  => true,
            'registration_status' => 'approved',
        ], $attributes));
    }

    public function createPackage(array $attributes = []): Package
    {
        return Package::create(array_merge([
            'name'           => 'Test Package ' . Str::random(6),
            'slug'           => 'test-package-' . Str::lower(Str::random(12)),
            'price_monthly'  => 200,
            'price_yearly'   => 1500,
            'price_per_term' => 500,
            'max_students'   => 1000,
            'max_staff'      => 100,
            'is_active'      => true,
            'features'       => [],
        ], $attributes));
    }

    public function enableModulesFor(Package $package, ?array $slugs = null): void
    {
        $slugs ??= [
            'students', 'staff', 'attendance', 'timetable', 'exams',
            'fees', 'library', 'transport', 'hostel', 'inventory',
            'homework', 'communication', 'reports', 'hr',
        ];

        foreach ($slugs as $slug) {
            PackageModule::firstOrCreate([
                'package_id'   => $package->id,
                'module_slug'  => $slug,
            ]);
        }
    }

    public function createSubscription(School $school, Package $package, array $attributes = []): SchoolSubscription
    {
        $subscription = SchoolSubscription::create(array_merge([
            'school_id'      => $school->id,
            'package_id'     => $package->id,
            'start_date'     => now()->subDay(),
            'end_date'       => now()->addYear(),
            'status'         => 'active',
            'price_per_term' => 500,
            'amount_paid'    => 500,
        ], $attributes));

        $school->update(['current_subscription_id' => $subscription->id]);

        return $subscription;
    }

    public function activateSchool(School $school): void
    {
        $package = $this->createPackage();
        $this->enableModulesFor($package);
        $this->createSubscription($school, $package);
    }

    // ── Users ───────────────────────────────────────────────────────────

    public function createUser(array $attributes = [], string $role = RoleRegistry::SCHOOL_ADMIN): User
    {
        $this->ensureRole($role);

        $user = User::create(array_merge([
            'school_id'              => $attributes['school_id'] ?? null,
            'name'                   => 'Test User ' . Str::random(6),
            'email'                  => Str::lower(Str::random(10)) . '@example.test',
            'username'               => 'user_' . Str::lower(Str::random(8)),
            'phone'                  => '+232' . random_int(10000000, 99999999),
            'password'               => 'password',
            'status'                 => 'active',
            'email_verified_at'      => now(),
            'force_password_change'  => false,
            'must_change_password'   => false,
        ], $attributes));

        $user->assignRole($role);

        return $user;
    }

    public function createSuperAdmin(array $attributes = []): User
    {
        return $this->createUser($attributes, RoleRegistry::SUPER_ADMIN);
    }

    public function actingAsSchoolAdmin(School $school, array $attributes = []): User
    {
        $admin = $this->createUser(array_merge([
            'school_id' => $school->id,
        ], $attributes), RoleRegistry::SCHOOL_ADMIN);

        $this->actingAs($admin);

        return $admin;
    }

    public function actingAsSuperAdmin(array $attributes = []): User
    {
        $admin = $this->createSuperAdmin($attributes);
        $this->actingAs($admin);
        return $admin;
    }

    // ── Academic ─────────────────────────────────────────────────────────

    public function createAcademicYear(School $school, array $attributes = []): AcademicYear
    {
        return AcademicYear::create(array_merge([
            'school_id'  => $school->id,
            'name'       => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date'   => '2026-07-31',
        ], $attributes));
    }

    public function createAcademicTerm(School $school, AcademicYear $year, array $attributes = []): AcademicTerm
    {
        return AcademicTerm::create(array_merge([
            'school_id'        => $school->id,
            'academic_year_id' => $year->id,
            'name'             => 'Term 1',
            'start_date'       => '2025-09-01',
            'end_date'         => '2025-12-15',
        ], $attributes));
    }

    public function createClass(School $school, array $attributes = []): \App\Models\SchoolClass
    {
        return \App\Models\SchoolClass::create(array_merge([
            'school_id' => $school->id,
            'name'      => 'JSS 1',
        ], $attributes));
    }

    public function createSection(School $school, \App\Models\SchoolClass $class, array $attributes = []): Section
    {
        return Section::create(array_merge([
            'school_id' => $school->id,
            'class_id'  => $class->id,
            'name'      => 'Section A',
        ], $attributes));
    }

    public function createSubject(School $school, \App\Models\SchoolClass $class, array $attributes = []): Subject
    {
        return Subject::create(array_merge([
            'school_id' => $school->id,
            'class_id'  => $class->id,
            'name'      => 'Mathematics',
            'code'      => 'MTH',
        ], $attributes));
    }

    public function createSubjectOffering(School $school, AcademicYear $year, \App\Models\SchoolClass $class, Subject $subject, array $attributes = []): SubjectOffering
    {
        return SubjectOffering::create(array_merge([
            'school_id'        => $school->id,
            'academic_year_id' => $year->id,
            'class_id'         => $class->id,
            'subject_id'       => $subject->id,
            'subject_name'     => $subject->name,
            'subject_code'     => $subject->code,
        ], $attributes));
    }

    public function createGradeScale(School $school, array $attributes = []): GradeScale
    {
        return GradeScale::create(array_merge([
            'school_id'  => $school->id,
            'grade'      => 'A',
            'gpa'        => 4.0,
            'min_marks'  => 70,
            'max_marks'  => 100,
            'remarks'    => 'Excellent',
        ], $attributes));
    }

    public function createSyllabus(School $school, \App\Models\SchoolClass $class, Subject $subject, array $attributes = []): Syllabus
    {
        return Syllabus::create(array_merge([
            'school_id'       => $school->id,
            'class_id'        => $class->id,
            'subject_id'      => $subject->id,
            'academic_year'   => '2025-2026',
            'title'           => 'Term 1 Syllabus',
            'completion_percent' => 0,
        ], $attributes));
    }

    public function createTimetable(School $school, \App\Models\SchoolClass $class, Subject $subject, array $attributes = []): Timetable
    {
        return Timetable::create(array_merge([
            'school_id'   => $school->id,
            'class_id'    => $class->id,
            'subject_id'  => $subject->id,
            'day_of_week' => 'monday',
            'start_time'  => '08:00',
            'end_time'    => '09:00',
        ], $attributes));
    }

    // ── Students / Staff / Guardian ──────────────────────────────────────

    public function createStudent(School $school, \App\Models\SchoolClass $class, array $attributes = []): Student
    {
        return Student::create(array_merge([
            'school_id'    => $school->id,
            'class_id'     => $class->id,
            'first_name'   => 'John',
            'last_name'    => 'Doe',
            'gender'       => 'male',
            'status'       => 'active',
        ], $attributes));
    }

    public function createGuardian(School $school, array $attributes = []): Guardian
    {
        return Guardian::create(array_merge([
            'school_id' => $school->id,
            'name'      => 'Jane Doe',
            'phone'     => '+232770000001',
            'relation'  => 'Mother',
        ], $attributes));
    }

    public function createStaff(School $school, array $attributes = []): Staff
    {
        return Staff::create(array_merge([
            'school_id'   => $school->id,
            'first_name'  => 'Staff',
            'last_name'   => 'Member',
            'gender'      => 'female',
            'status'      => 'active',
        ], $attributes));
    }

    public function createTeacher(School $school, ?Staff $staff = null, array $attributes = []): User
    {
        $staff ??= $this->createStaff($school, $attributes['staff'] ?? []);
        $user = $this->createUser(array_merge([
            'school_id' => $school->id,
        ], $attributes['user'] ?? []), RoleRegistry::TEACHER);

        $staff->update(['user_id' => $user->id]);

        return $user;
    }

    // ── Exams / Marks ───────────────────────────────────────────────────

    public function createExam(School $school, \App\Models\SchoolClass $class, array $attributes = []): Exam
    {
        return Exam::create(array_merge([
            'school_id'   => $school->id,
            'class_id'    => $class->id,
            'name'        => 'First Term Exam',
            'type'        => 'mid_term',
            'status'      => 'draft',
            'max_score'   => 100,
        ], $attributes));
    }

    public function createMark(School $school, Exam $exam, Student $student, Subject $subject, array $attributes = []): Mark
    {
        return Mark::create(array_merge([
            'school_id'      => $school->id,
            'exam_id'        => $exam->id,
            'student_id'     => $student->id,
            'subject_id'     => $subject->id,
            'marks_obtained' => 75,
        ], $attributes));
    }

    // ── Attendance ──────────────────────────────────────────────────────

    public function createAttendanceSession(School $school, array $attributes = []): AttendanceSession
    {
        return AttendanceSession::create(array_merge([
            'school_id' => $school->id,
            'name'      => 'Morning',
            'slug'      => 'morning-' . Str::random(4),
        ], $attributes));
    }

    public function createAttendance(School $school, Student $student, array $attributes = []): Attendance
    {
        return Attendance::create(array_merge([
            'school_id'       => $school->id,
            'date'            => now()->toDateString(),
            'attendable_type' => Student::class,
            'attendable_id'   => $student->id,
            'status'          => 'present',
        ], $attributes));
    }

    // ── Fees ────────────────────────────────────────────────────────────

    public function createFeeCategory(School $school, array $attributes = []): FeeCategory
    {
        return FeeCategory::create(array_merge([
            'school_id' => $school->id,
            'name'      => 'Tuition',
            'is_active' => true,
        ], $attributes));
    }

    public function createFeeStructure(School $school, \App\Models\SchoolClass $class, FeeCategory $category, array $attributes = []): FeeStructure
    {
        return FeeStructure::create(array_merge([
            'school_id'        => $school->id,
            'class_id'         => $class->id,
            'fee_category_id'  => $category->id,
            'academic_year'    => '2025-2026',
            'amount'           => 500,
            'frequency'        => 'annual',
        ], $attributes));
    }

    public function createFeePayment(School $school, Student $student, FeeStructure $structure, array $attributes = []): FeePayment
    {
        return FeePayment::create(array_merge([
            'school_id'        => $school->id,
            'student_id'       => $student->id,
            'fee_structure_id' => $structure->id,
            'receipt_no'       => 'RCP-' . Str::random(8),
            'amount_due'       => $structure->amount,
            'amount_paid'      => 0,
            'status'           => 'pending',
        ], $attributes));
    }

    // ── Homework ────────────────────────────────────────────────────────

    public function createHomework(School $school, \App\Models\SchoolClass $class, Subject $subject, array $attributes = []): Homework
    {
        return Homework::create(array_merge([
            'school_id'  => $school->id,
            'class_id'   => $class->id,
            'subject_id' => $subject->id,
            'title'      => 'Homework 1',
            'due_date'   => now()->addWeek()->toDateString(),
        ], $attributes));
    }

    // ── Library ─────────────────────────────────────────────────────────

    public function createBook(School $school, array $attributes = []): Book
    {
        return Book::create(array_merge([
            'school_id'       => $school->id,
            'title'           => 'Test Book',
            'author'          => 'Author Name',
            'total_copies'    => 3,
            'available_copies'=> 3,
        ], $attributes));
    }

    // ── Transport ───────────────────────────────────────────────────────

    public function createVehicle(School $school, array $attributes = []): Vehicle
    {
        return Vehicle::create(array_merge([
            'school_id'       => $school->id,
            'registration_no' => 'ABC-' . strtoupper(Str::random(3)),
            'capacity'        => 40,
        ], $attributes));
    }

    public function createTransportRoute(School $school, array $attributes = []): TransportRoute
    {
        return TransportRoute::create(array_merge([
            'school_id'    => $school->id,
            'name'         => 'Route A',
            'monthly_fee'  => 50,
        ], $attributes));
    }

    // ── Hostel ──────────────────────────────────────────────────────────

    public function createHostel(School $school, array $attributes = []): Hostel
    {
        return Hostel::create(array_merge([
            'school_id'    => $school->id,
            'name'         => 'Main Hostel',
            'type'         => 'boys',
            'total_rooms'  => 10,
            'total_capacity'=> 20,
        ], $attributes));
    }

    public function createHostelRoom(School $school, Hostel $hostel, array $attributes = []): HostelRoom
    {
        return HostelRoom::create(array_merge([
            'school_id'   => $school->id,
            'hostel_id'   => $hostel->id,
            'room_no'     => '101',
            'capacity'    => 2,
            'occupied'    => 0,
        ], $attributes));
    }

    // ── Inventory / Assets ──────────────────────────────────────────────

    public function createInventoryCategory(School $school, array $attributes = []): InventoryCategory
    {
        return InventoryCategory::create(array_merge([
            'school_id' => $school->id,
            'name'      => 'Office Supplies',
        ], $attributes));
    }

    public function createInventoryItem(School $school, InventoryCategory $category, array $attributes = []): InventoryItem
    {
        return InventoryItem::create(array_merge([
            'school_id'     => $school->id,
            'category_id'   => $category->id,
            'name'          => 'A4 Paper',
            'current_stock' => 100,
        ], $attributes));
    }

    public function createAsset(School $school, array $attributes = []): Asset
    {
        return Asset::create(array_merge([
            'school_id'     => $school->id,
            'name'          => 'Projector',
            'purchase_price'=> 500,
            'current_value' => 350,
        ], $attributes));
    }

    // ── HR ──────────────────────────────────────────────────────────────

    public function createLeaveType(School $school, array $attributes = []): LeaveType
    {
        return LeaveType::create(array_merge([
            'school_id'        => $school->id,
            'name'             => 'Sick Leave',
            'max_days_per_year'=> 10,
            'is_paid'          => true,
        ], $attributes));
    }

    public function createLeaveRequest(School $school, Staff $staff, LeaveType $leaveType, array $attributes = []): LeaveRequest
    {
        return LeaveRequest::create(array_merge([
            'school_id'     => $school->id,
            'staff_id'      => $staff->id,
            'leave_type_id' => $leaveType->id,
            'start_date'    => now()->toDateString(),
            'end_date'      => now()->addDays(3)->toDateString(),
            'days'          => 3,
            'status'        => 'pending',
        ], $attributes));
    }

    public function createSalaryStructure(School $school, Staff $staff, array $attributes = []): SalaryStructure
    {
        return SalaryStructure::create(array_merge([
            'school_id'     => $school->id,
            'staff_id'      => $staff->id,
            'basic_salary'  => 2000,
        ], $attributes));
    }

    public function createPayroll(School $school, Staff $staff, array $attributes = []): Payroll
    {
        return Payroll::create(array_merge([
            'school_id'    => $school->id,
            'staff_id'     => $staff->id,
            'month_year'   => now()->format('Y-m'),
            'basic_salary' => 2000,
            'net_salary'   => 2000,
            'status'       => 'draft',
        ], $attributes));
    }

    // ── Communications ──────────────────────────────────────────────────

    public function createAnnouncement(School $school, User $author, array $attributes = []): Announcement
    {
        return Announcement::create(array_merge([
            'school_id'  => $school->id,
            'author_id'  => $author->id,
            'title'      => 'School Notice',
            'body'       => 'This is a test announcement.',
            'audience'   => 'all',
        ], $attributes));
    }

    // ── Report Cards ────────────────────────────────────────────────────

    public function createReportCard(School $school, Student $student, AcademicYear $year, \App\Models\SchoolClass $class, array $attributes = []): ReportCard
    {
        return ReportCard::create(array_merge([
            'school_id'        => $school->id,
            'student_id'       => $student->id,
            'academic_year_id' => $year->id,
            'class_id'         => $class->id,
            'total_marks'      => 1000,
            'obtained_marks'   => 750,
            'percentage'       => 75.00,
            'grade'            => 'A',
            'gpa'              => 3.8,
            'total_school_days'=> 100,
            'days_present'     => 95,
            'days_absent'      => 5,
            'status'           => 'draft',
        ], $attributes));
    }
}
