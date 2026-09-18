<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\AcademicTerm;
use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\BookIssue;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Exam;
use App\Models\FeeCategory;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\GradeScale;
use App\Models\Guardian;
use App\Models\Holiday;
use App\Models\Book;
use App\Models\Mark;
use App\Models\Message;
use App\Models\Package;
use App\Models\Payroll;
use App\Models\ReportCard;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\SchoolSubscription;
use App\Models\SchoolTimeSetting;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Timetable;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    private int $schoolId;
    private $school;
    private $academicYear;
    private $term1;
    private array $classes = [];
    private array $subjects = [];
    private array $teachers = [];
    private array $students = [];
    private array $exams = [];

    private string $domain = 'freetownacademy.edu';
    private string $demoPass = 'Demo@123';

    public function run(): void
    {
        $this->command->info('Seeding Freetown International Academy demo environment...');

        $this->createSuperAdmin();
        $this->createSchoolAndSubscription();
        $this->createAcademicStructure();
        $this->createDepartmentsAndDesignations();
        $this->createGradeScale();
        $this->createFeeCategories();
        $this->createClassesAndSections();
        $this->createSubjects();
        $this->createAttendanceSessions();
        $this->createManagementStaff();
        $this->createTeachers();
        $this->createStudentsAndParents();
        $this->createExams();
        $this->createMarks();
        $this->createAttendance();
        $this->createTimetable();
        $this->createFeesAndPayments();
        $this->createPayroll();
        $this->createLibrary();
        $this->createCommunication();
        $this->createHolidays();
        $this->createReportCards();
        $this->createSchoolSettings();

        $this->command->info('Demo environment seeded successfully!');
        $this->printSummary();
    }

    private function createSuperAdmin(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'syscend@gmail.com'],
            [
                'name' => 'Super Administrator',
                'phone' => '+23279630777',
                'password' => Hash::make($this->demoPass),
                'status' => 'active',
            ]
        );
        $user->syncRoles(['super-admin']);
        $this->command->line('  Super Administrator preserved');
    }

    private function createSchoolAndSubscription(): void
    {
        $this->school = School::create([
            'name' => 'Freetown International Academy',
            'short_name' => 'FIA',
            'slug' => 'freetown-international-academy',
            'email' => "info@{$this->domain}",
            'phone' => '+23278123456',
            'address' => '25 Lumley Beach Road, Freetown',
            'city' => 'Freetown',
            'state' => 'Western Area',
            'country' => 'SL',
            'timezone' => 'Africa/Freetown',
            'currency' => 'SLL',
            'currency_symbol' => 'Le',
            'language' => 'en',
            'status' => 'active',
            'is_configured' => true,
            'motto' => 'Excellence Through Knowledge',
            'year_established' => '2010',
            'school_level' => 'combined',
            'mbsse_registration_number' => 'MBSSE/FIA/2010/001',
            'emis_code' => 'EMIS-FIA-001',
            'npse_centre_number' => 'NPSE-FIA-001',
            'bece_centre_number' => 'BECE-FIA-001',
            'wassce_centre_number' => 'WASSCE-FIA-001',
            'primary_color' => '#1e40af',
            'secondary_color' => '#f59e0b',
            'about_school' => 'Freetown International Academy is a leading co-educational institution in Sierra Leone, providing quality education from Nursery through Senior Secondary level.',
            'school_mission' => 'To provide quality education that prepares students for academic excellence and responsible citizenship.',
            'school_vision' => 'To be the premier educational institution in West Africa.',
            'working_days' => 'monday,tuesday,wednesday,thursday,friday',
            'school_opening_time' => '07:30',
            'school_closing_time' => '15:00',
            'ca_weight' => 40,
            'exam_weight' => 60,
            'public_profile_enabled' => true,
            'proprietor_name' => 'Mr. Abdulai Conteh',
            'principal_name' => 'Mrs. Fatima Bangura',
        ]);
        $this->schoolId = $this->school->id;

        $package = Package::firstOrCreate(
            ['slug' => 'small-school'],
            [
                'name' => 'Small school',
                'description' => 'For a single small school getting organised.',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'price_per_term' => 850,
                'max_students' => 0,
                'max_staff' => 20,
                'storage_gb' => 5,
                'is_active' => true,
                'features' => ['students', 'attendance', 'fees', 'reports', 'exams'],
            ]
        );

        $largePackage = Package::firstOrCreate(
            ['slug' => 'large-school'],
            [
                'name' => 'Large school',
                'description' => 'For larger schools and multi-branch campuses.',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'price_per_term' => 1400,
                'max_students' => 0,
                'max_staff' => 0,
                'storage_gb' => 50,
                'is_active' => true,
                'features' => ['students', 'staff', 'exams', 'fees', 'library', 'transport', 'hostel', 'inventory', 'payroll'],
            ]
        );

        $subscription = SchoolSubscription::create([
            'school_id' => $this->schoolId,
            'package_id' => $package->id,
            'start_date' => now()->subMonth(),
            'end_date' => now()->addYear(),
            'status' => 'active',
            'is_trial' => false,
            'price_per_term' => 850,
            'amount_paid' => 850,
            'payment_method' => 'bank_transfer',
            'notes' => 'Small school term subscription (demo)',
        ]);

        \App\Models\School::where('id', $this->schoolId)->update(['current_subscription_id' => $subscription->id]);

        foreach (\App\Http\Controllers\SuperAdmin\ModuleManagerController::ALL_MODULES as $slug) {
            \App\Models\PackageModule::firstOrCreate([
                'package_id'  => $package->id,
                'module_slug' => $slug,
            ]);
            \App\Models\PackageModule::firstOrCreate([
                'package_id'  => $largePackage->id,
                'module_slug' => $slug,
            ]);
        }

        $this->command->line('  School + Small school term Subscription');
    }

    private function createAcademicStructure(): void
    {
        $this->academicYear = AcademicYear::create([
            'school_id' => $this->schoolId,
            'name' => '2025-2026',
            'start_date' => '2025-09-01',
            'end_date' => '2026-07-15',
            'is_current' => true,
        ]);

        $this->term1 = AcademicTerm::create([
            'school_id' => $this->schoolId,
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Term 1',
            'start_date' => '2025-09-01',
            'end_date' => '2025-12-15',
            'mid_term_start' => '2025-10-20',
            'mid_term_end' => '2025-10-24',
            'is_current' => true,
        ]);

        AcademicTerm::create([
            'school_id' => $this->schoolId,
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Term 2',
            'start_date' => '2026-01-05',
            'end_date' => '2026-04-10',
            'is_current' => false,
        ]);

        AcademicTerm::create([
            'school_id' => $this->schoolId,
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Term 3',
            'start_date' => '2026-04-27',
            'end_date' => '2026-07-15',
            'is_current' => false,
        ]);

        $this->command->line('  Academic Year + 3 Terms');
    }

    private function createDepartmentsAndDesignations(): void
    {
        $depts = [];
        foreach (['Mathematics', 'English', 'Science', 'Humanities', 'Administration'] as $name) {
            $depts[$name] = Department::create([
                'school_id' => $this->schoolId,
                'name' => $name,
                'code' => strtoupper(substr($name, 0, 3)),
                'type' => $name === 'Administration' ? 'administrative' : 'academic',
                'is_active' => true,
            ]);
        }

        $adminDept = $depts['Administration'];
        foreach (['Teacher', 'Senior Teacher', 'Head of Department', 'Principal', 'Accountant', 'Librarian', 'School Administrator', 'Proprietor'] as $name) {
            Designation::create(['school_id' => $this->schoolId, 'department_id' => $adminDept->id, 'name' => $name]);
        }

        $this->store['depts'] = $depts;
        $this->store['adminDept'] = $adminDept;
        $this->command->line('  Departments + Designations');
    }

    private function createGradeScale(): void
    {
        $grades = [
            ['grade' => 'A1', 'gpa' => 4.0, 'min_marks' => 75, 'max_marks' => 100, 'remarks' => 'Excellent', 'sort_order' => 1],
            ['grade' => 'B2', 'gpa' => 3.5, 'min_marks' => 65, 'max_marks' => 74, 'remarks' => 'Very Good', 'sort_order' => 2],
            ['grade' => 'B3', 'gpa' => 3.0, 'min_marks' => 55, 'max_marks' => 64, 'remarks' => 'Good', 'sort_order' => 3],
            ['grade' => 'C4', 'gpa' => 2.5, 'min_marks' => 45, 'max_marks' => 54, 'remarks' => 'Average', 'sort_order' => 4],
            ['grade' => 'C5', 'gpa' => 2.0, 'min_marks' => 40, 'max_marks' => 44, 'remarks' => 'Above Average', 'sort_order' => 5],
            ['grade' => 'C6', 'gpa' => 1.5, 'min_marks' => 35, 'max_marks' => 39, 'remarks' => 'Average', 'sort_order' => 6],
            ['grade' => 'D7', 'gpa' => 1.0, 'min_marks' => 30, 'max_marks' => 34, 'remarks' => 'Pass', 'sort_order' => 7],
            ['grade' => 'E8', 'gpa' => 0.5, 'min_marks' => 20, 'max_marks' => 29, 'remarks' => 'Weak Pass', 'sort_order' => 8],
            ['grade' => 'F9', 'gpa' => 0.0, 'min_marks' => 0, 'max_marks' => 19, 'remarks' => 'Fail', 'sort_order' => 9],
        ];
        foreach ($grades as $g) {
            GradeScale::create(array_merge($g, ['school_id' => $this->schoolId]));
        }
        $this->command->line('  Grade Scale (A1-F9)');
    }

    private function createFeeCategories(): void
    {
        foreach ([
            ['name' => 'Tuition Fee', 'type' => 'tuition'],
            ['name' => 'Examination Fee', 'type' => 'exam'],
            ['name' => 'Library Fee', 'type' => 'library'],
            ['name' => 'Transport Fee', 'type' => 'transport'],
            ['name' => 'Sports Fee', 'type' => 'sports'],
        ] as $cat) {
            FeeCategory::create(array_merge($cat, ['school_id' => $this->schoolId, 'is_active' => true]));
        }
        $this->command->line('  Fee Categories');
    }

    private function createClassesAndSections(): void
    {
        $levelMap = [
            'Nursery 1'   => ['early_childhood', 1, 35],
            'Primary 1'   => ['primary', 2, 45],
            'Primary 4'   => ['primary', 5, 45],
            'Primary 6'   => ['primary', 7, 45],
            'JSS 1'       => ['junior_secondary', 8, 45],
            'JSS 3'       => ['junior_secondary', 10, 45],
            'SSS 1'       => ['senior_secondary', 11, 40],
            'SSS 3'       => ['senior_secondary', 13, 40],
        ];

        $order = 0;
        foreach ($levelMap as $name => [$level, $levelOrder, $cap]) {
            $order++;
            $class = SchoolClass::create([
                'school_id' => $this->schoolId,
                'name' => $name,
                'short_name' => $name,
                'numeric_name' => $order,
                'capacity' => $cap,
                'school_level' => $level,
                'level_order' => $levelOrder,
                'is_active' => true,
            ]);

            $secA = Section::create(['school_id' => $this->schoolId, 'class_id' => $class->id, 'name' => 'A', 'section_code' => 'SEC-A', 'capacity' => (int)($cap / 2), 'is_active' => true]);
            $secB = Section::create(['school_id' => $this->schoolId, 'class_id' => $class->id, 'name' => 'B', 'section_code' => 'SEC-B', 'capacity' => (int)($cap / 2), 'is_active' => true]);

            $this->classes[$name] = $class;
        }
        $this->command->line('  ' . count($this->classes) . ' Classes + Sections');
    }

    private function createSubjects(): void
    {
        $subjectDefs = [
            'Nursery 1' => [
                ['name' => 'Literacy', 'code' => 'LIT', 'type' => 'theory'],
                ['name' => 'Numeracy', 'code' => 'NUM', 'type' => 'theory'],
                ['name' => 'Creative Activities', 'code' => 'CRE', 'type' => 'practical'],
                ['name' => 'Physical Education', 'code' => 'PE', 'type' => 'practical'],
            ],
            'Primary 1' => [
                ['name' => 'English Language', 'code' => 'ENG', 'type' => 'theory'],
                ['name' => 'Mathematics', 'code' => 'MAT', 'type' => 'theory'],
                ['name' => 'Science', 'code' => 'SCI', 'type' => 'theory'],
                ['name' => 'Social Studies', 'code' => 'SST', 'type' => 'theory'],
                ['name' => 'Religious Studies', 'code' => 'REL', 'type' => 'theory'],
                ['name' => 'Physical Education', 'code' => 'PE', 'type' => 'practical'],
            ],
            'Primary 4' => [
                ['name' => 'English Language', 'code' => 'ENG', 'type' => 'theory'],
                ['name' => 'Mathematics', 'code' => 'MAT', 'type' => 'theory'],
                ['name' => 'Science', 'code' => 'SCI', 'type' => 'theory'],
                ['name' => 'Social Studies', 'code' => 'SST', 'type' => 'theory'],
                ['name' => 'Agric Science', 'code' => 'AGR', 'type' => 'theory'],
                ['name' => 'Religious Studies', 'code' => 'REL', 'type' => 'theory'],
            ],
            'Primary 6' => [
                ['name' => 'English Language', 'code' => 'ENG', 'type' => 'theory'],
                ['name' => 'Mathematics', 'code' => 'MAT', 'type' => 'theory'],
                ['name' => 'Science', 'code' => 'SCI', 'type' => 'theory'],
                ['name' => 'Social Studies', 'code' => 'SST', 'type' => 'theory'],
                ['name' => 'Agric Science', 'code' => 'AGR', 'type' => 'theory'],
                ['name' => 'Religious Studies', 'code' => 'REL', 'type' => 'theory'],
                ['name' => 'Home Economics', 'code' => 'HEC', 'type' => 'practical'],
            ],
            'JSS 1' => [
                ['name' => 'English Language', 'code' => 'ENG', 'type' => 'theory'],
                ['name' => 'Mathematics', 'code' => 'MAT', 'type' => 'theory'],
                ['name' => 'Science', 'code' => 'SCI', 'type' => 'theory'],
                ['name' => 'Social Studies', 'code' => 'SST', 'type' => 'theory'],
                ['name' => 'French', 'code' => 'FRE', 'type' => 'theory'],
                ['name' => 'Computer Studies', 'code' => 'ICT', 'type' => 'practical'],
                ['name' => 'Physical Education', 'code' => 'PE', 'type' => 'practical'],
            ],
            'JSS 3' => [
                ['name' => 'English Language', 'code' => 'ENG', 'type' => 'theory'],
                ['name' => 'Mathematics', 'code' => 'MAT', 'type' => 'theory'],
                ['name' => 'Science', 'code' => 'SCI', 'type' => 'theory'],
                ['name' => 'Social Studies', 'code' => 'SST', 'type' => 'theory'],
                ['name' => 'French', 'code' => 'FRE', 'type' => 'theory'],
                ['name' => 'Agric Science', 'code' => 'AGR', 'type' => 'theory'],
                ['name' => 'Computer Studies', 'code' => 'ICT', 'type' => 'practical'],
            ],
            'SSS 1' => [
                ['name' => 'English Language', 'code' => 'ENG', 'type' => 'theory'],
                ['name' => 'Mathematics', 'code' => 'MAT', 'type' => 'theory'],
                ['name' => 'Physics', 'code' => 'PHY', 'type' => 'theory'],
                ['name' => 'Chemistry', 'code' => 'CHE', 'type' => 'theory'],
                ['name' => 'Biology', 'code' => 'BIO', 'type' => 'theory'],
                ['name' => 'Literature in English', 'code' => 'LIT', 'type' => 'theory'],
                ['name' => 'Geography', 'code' => 'GEO', 'type' => 'theory'],
                ['name' => 'Economics', 'code' => 'ECO', 'type' => 'theory'],
            ],
            'SSS 3' => [
                ['name' => 'English Language', 'code' => 'ENG', 'type' => 'theory'],
                ['name' => 'Mathematics', 'code' => 'MAT', 'type' => 'theory'],
                ['name' => 'Physics', 'code' => 'PHY', 'type' => 'theory'],
                ['name' => 'Chemistry', 'code' => 'CHE', 'type' => 'theory'],
                ['name' => 'Biology', 'code' => 'BIO', 'type' => 'theory'],
                ['name' => 'Literature in English', 'code' => 'LIT', 'type' => 'theory'],
                ['name' => 'Government', 'code' => 'GOV', 'type' => 'theory'],
                ['name' => 'Economics', 'code' => 'ECO', 'type' => 'theory'],
            ],
        ];

        foreach ($subjectDefs as $className => $subs) {
            $class = $this->classes[$className] ?? null;
            if (!$class) continue;
            foreach ($subs as $s) {
                $this->subjects[$className][] = Subject::create([
                    'school_id' => $this->schoolId,
                    'class_id' => $class->id,
                    'name' => $s['name'],
                    'code' => $s['code'],
                    'type' => $s['type'],
                    'full_marks' => 100,
                    'pass_marks' => 50,
                    'school_level' => $class->school_level,
                    'is_core' => in_array($s['name'], ['English Language', 'Mathematics']),
                ]);
            }
        }
        $this->command->line('  Subjects across all classes');
    }

    private function createAttendanceSessions(): void
    {
        $sessions = [
            ['name' => 'Morning Assembly', 'slug' => 'morning', 'start' => '07:30', 'end' => '08:00'],
            ['name' => 'Morning Period', 'slug' => 'am', 'start' => '08:00', 'end' => '12:00'],
            ['name' => 'Afternoon Period', 'slug' => 'pm', 'start' => '13:00', 'end' => '15:00'],
        ];
        foreach ($sessions as $i => $s) {
            AttendanceSession::create([
                'school_id' => $this->schoolId,
                'name' => $s['name'],
                'slug' => $s['slug'],
                'start_time' => $s['start'],
                'end_time' => $s['end'],
                'is_active' => true,
                'sort_order' => $i + 1,
            ]);
        }
        $this->command->line('  Attendance Sessions');
    }

    private function createManagementStaff(): void
    {
        $adminDept = $this->store['adminDept'];
        $desigMap = [
            'Proprietor'          => 'Proprietor',
            'School Administrator'=> 'School Administrator',
            'Principal'           => 'Principal',
            'Accountant'          => 'Accountant',
            'Librarian'           => 'Librarian',
        ];
        $desigs = [];
        foreach ($desigMap as $name) {
            $desigs[$name] = Designation::where('school_id', $this->schoolId)->where('name', $name)->first();
        }

        $mgmt = [
            ['first' => 'Abdulai', 'last' => 'Conteh', 'role' => 'proprietor', 'phone' => '+23278100001', 'dob' => '1965-05-20', 'salary' => 8000000, 'desig' => 'Proprietor'],
            ['first' => 'Mohamed', 'last' => 'Sesay', 'role' => 'school-admin', 'phone' => '+23278100002', 'dob' => '1978-08-12', 'salary' => 5000000, 'desig' => 'School Administrator'],
            ['first' => 'Fatima', 'last' => 'Bangura', 'role' => 'principal', 'phone' => '+23278100003', 'dob' => '1972-03-15', 'salary' => 6000000, 'desig' => 'Principal'],
            ['first' => 'Ishmael', 'last' => 'Turay', 'role' => 'accountant', 'phone' => '+23278100005', 'dob' => '1980-06-10', 'salary' => 3500000, 'desig' => 'Accountant'],
            ['first' => 'Aminata', 'last' => 'Sesay', 'role' => 'librarian', 'phone' => '+23278100006', 'dob' => '1983-09-22', 'salary' => 3000000, 'desig' => 'Librarian'],
        ];

        $empNo = 1;
        foreach ($mgmt as $m) {
            $user = User::create([
                'school_id' => $this->schoolId,
                'name' => $m['first'] . ' ' . $m['last'],
                'email' => strtolower($m['first']) . '.' . strtolower($m['last']) . '@' . $this->domain,
                'username' => strtolower($m['first']) . '.' . strtolower($m['last']),
                'phone' => $m['phone'],
                'password' => Hash::make($this->demoPass),
                'status' => 'active',
                'is_temporary_password' => true,
                'must_change_password' => false,
            ]);
            $user->syncRoles([$m['role']]);

            Staff::create([
                'school_id' => $this->schoolId,
                'user_id' => $user->id,
                'department_id' => $adminDept->id,
                'designation_id' => $desigs[$m['desig']]->id,
                'emp_id' => 'FIA-ADM-' . str_pad($empNo++, 3, '0', STR_PAD_LEFT),
                'first_name' => $m['first'],
                'last_name' => $m['last'],
                'gender' => $m['first'] === 'Fatima' || $m['first'] === 'Aminata' ? 'female' : 'male',
                'date_of_birth' => $m['dob'],
                'nationality' => 'Sierra Leonean',
                'phone' => $m['phone'],
                'email' => strtolower($m['first']) . '.' . strtolower($m['last']) . '@' . $this->domain,
                'joining_date' => '2015-09-01',
                'salary_type' => 'fixed',
                'salary' => $m['salary'],
                'status' => 'active',
                'teacher_type' => 'non_teaching',
            ]);
        }
        $this->command->line('  Management Staff (5 users)');
    }

    private function createTeachers(): void
    {
        $adminDept = $this->store['adminDept'];
        $teacherDesig = Designation::where('school_id', $this->schoolId)->where('name', 'Teacher')->first();

        $teachers = [
            ['first' => 'Amara', 'last' => 'Kamara', 'phone' => '+23278200001', 'gender' => 'female', 'dob' => '1985-03-15', 'dept' => 'Mathematics', 'salary' => 3500000, 'teaches' => ['Mathematics'], 'classes' => ['Primary 4', 'JSS 1', 'JSS 3', 'SSS 1', 'SSS 3'], 'formTeacher' => 'JSS 3'],
            ['first' => 'Ibrahim', 'last' => 'Sesay', 'phone' => '+23278200002', 'gender' => 'male', 'dob' => '1982-07-22', 'dept' => 'English', 'salary' => 3500000, 'teaches' => ['English Language'], 'classes' => ['Primary 1', 'Primary 4', 'Primary 6', 'JSS 1', 'JSS 3'], 'formTeacher' => 'Primary 6'],
            ['first' => 'Fatmata', 'last' => 'Bangura', 'phone' => '+23278200003', 'gender' => 'female', 'dob' => '1987-01-10', 'dept' => 'Science', 'salary' => 3200000, 'teaches' => ['Science', 'Biology'], 'classes' => ['Primary 4', 'Primary 6', 'JSS 1', 'JSS 3', 'SSS 1', 'SSS 3'], 'formTeacher' => 'SSS 3'],
            ['first' => 'Samuel', 'last' => 'Koroma', 'phone' => '+23278200004', 'gender' => 'male', 'dob' => '1980-11-05', 'dept' => 'Humanities', 'salary' => 3200000, 'teaches' => ['Social Studies', 'Geography', 'Government'], 'classes' => ['Primary 6', 'JSS 1', 'JSS 3', 'SSS 1', 'SSS 3'], 'formTeacher' => 'Nursery 1'],
        ];

        $empNo = 1;
        foreach ($teachers as $t) {
            $user = User::create([
                'school_id' => $this->schoolId,
                'name' => $t['first'] . ' ' . $t['last'],
                'email' => strtolower($t['first']) . '.' . strtolower($t['last']) . '@' . $this->domain,
                'username' => strtolower($t['first']) . '.' . strtolower($t['last']),
                'phone' => $t['phone'],
                'password' => Hash::make($this->demoPass),
                'status' => 'active',
                'is_temporary_password' => true,
                'must_change_password' => false,
            ]);
            $user->syncRoles(['teacher']);

            $formClass = $this->classes[$t['formTeacher']] ?? null;
            $formSection = null;
            if ($formClass) {
                $formSection = Section::where('school_id', $this->schoolId)->where('class_id', $formClass->id)->where('name', 'A')->first();
            }

            $staff = Staff::create([
                'school_id' => $this->schoolId,
                'user_id' => $user->id,
                'department_id' => ($this->store['depts'][$t['dept']] ?? $adminDept)->id,
                'designation_id' => $teacherDesig->id,
                'emp_id' => 'FIA-TCH-' . str_pad($empNo++, 3, '0', STR_PAD_LEFT),
                'first_name' => $t['first'],
                'last_name' => $t['last'],
                'gender' => $t['gender'],
                'date_of_birth' => $t['dob'],
                'nationality' => 'Sierra Leonean',
                'phone' => $t['phone'],
                'email' => strtolower($t['first']) . '.' . strtolower($t['last']) . '@' . $this->domain,
                'joining_date' => '2018-09-01',
                'salary_type' => 'fixed',
                'salary' => $t['salary'],
                'status' => 'active',
                'teacher_type' => 'subject_teacher',
                'form_master_section_id' => $formSection?->id,
                'form_master_class_id' => $formClass?->id,
            ]);
            $this->teachers[] = ['staff' => $staff, 'data' => $t];
        }
        $this->command->line('  4 Teachers with form teacher assignments');
    }

    private function createStudentsAndParents(): void
    {
        $studentsData = [
            ['first' => 'Ibrahim', 'last' => 'Bangura', 'gender' => 'male', 'dob' => '2014-04-12', 'className' => 'Primary 4', 'section' => 'A', 'religion' => 'Islam', 'parentFirst' => 'Abubakarr', 'parentLast' => 'Bangura', 'relation' => 'Father'],
            ['first' => 'Fatima', 'last' => 'Sesay', 'gender' => 'female', 'dob' => '2010-09-20', 'className' => 'Primary 6', 'section' => 'A', 'religion' => 'Islam', 'parentFirst' => 'Mohamed', 'parentLast' => 'Sesay', 'relation' => 'Father'],
            ['first' => 'Aminata', 'last' => 'Kamara', 'gender' => 'female', 'dob' => '2008-06-08', 'className' => 'JSS 3', 'section' => 'A', 'religion' => 'Christianity', 'parentFirst' => 'Grace', 'parentLast' => 'Kamara', 'relation' => 'Mother'],
            ['first' => 'Mohamed', 'last' => 'Conteh', 'gender' => 'male', 'dob' => '2006-01-15', 'className' => 'SSS 3', 'section' => 'A', 'religion' => 'Islam', 'parentFirst' => 'Hawa', 'parentLast' => 'Conteh', 'relation' => 'Mother'],
            ['first' => 'Samuel', 'last' => 'Koroma', 'gender' => 'male', 'dob' => '2020-03-22', 'className' => 'Nursery 1', 'section' => 'A', 'religion' => 'Christianity', 'parentFirst' => 'Daniel', 'parentLast' => 'Koroma', 'relation' => 'Father'],
        ];

        $i = 0;
        foreach ($studentsData as $s) {
            $i++;
            $guardianEmail = strtolower($s['parentFirst']) . '.parent' . $i . '@' . $this->domain;

            $guardian = Guardian::create([
                'school_id' => $this->schoolId,
                'name' => $s['parentFirst'] . ' ' . $s['parentLast'],
                'relation' => $s['relation'],
                'phone' => '+2327830000' . $i,
                'email' => $guardianEmail,
                'occupation' => ['Teacher', 'Trader', 'Civil Servant', 'Doctor', 'Engineer'][$i - 1],
                'address' => ['12 Lumley Road, Freetown', '45 Kissy Road, Freetown', '7 Siaka Stevens Street', '23 Wilberforce, Freetown', '31 Congo Cross, Freetown'][$i - 1],
            ]);

            $parentUser = User::create([
                'school_id' => $this->schoolId,
                'name' => $s['parentFirst'] . ' ' . $s['parentLast'],
                'email' => $guardianEmail,
                'username' => strtolower($s['parentFirst']) . '.parent' . $i,
                'phone' => '+2327830000' . $i,
                'password' => Hash::make($this->demoPass),
                'status' => 'active',
                'is_temporary_password' => true,
                'must_change_password' => false,
            ]);
            $parentUser->syncRoles(['parent']);
            $guardian->update(['user_id' => $parentUser->id]);

            $class = $this->classes[$s['className']] ?? null;
            $section = $class ? Section::where('school_id', $this->schoolId)->where('class_id', $class->id)->where('name', $s['section'])->first() : null;

            $student = Student::create([
                'school_id' => $this->schoolId,
                'class_id' => $class?->id,
                'section_id' => $section?->id,
                'guardian_id' => $guardian->id,
                'first_name' => $s['first'],
                'last_name' => $s['last'],
                'gender' => $s['gender'],
                'date_of_birth' => $s['dob'],
                'nationality' => 'Sierra Leonean',
                'religion' => $s['religion'],
                'blood_group' => ['A+', 'B+', 'O+', 'AB+', 'A-'][$i - 1],
                'category' => 'general',
                'status' => 'active',
                'admission_date' => date('Y-m-d', strtotime($s['dob'] . '+5 years')),
                'admission_no' => 'FIA-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'roll_no' => (string) $i,
            ]);

            $this->students[] = $student;
        }
        $this->command->line('  5 Students + 5 Parent Users');
    }

    private function createExams(): void
    {
        foreach ($this->classes as $className => $class) {
            $this->exams[$className] = Exam::create([
                'school_id' => $this->schoolId,
                'class_id' => $class->id,
                'name' => 'Term 1 Examination',
                'type' => 'final',
                'start_date' => '2025-11-24',
                'end_date' => '2025-12-05',
                'status' => 'published',
                'academic_year_id' => $this->academicYear->id,
                'term_id' => $this->term1->id,
                'assessment_category' => 'exam',
                'ca_weight' => 40,
                'exam_weight' => 60,
                'max_score' => 100,
                'submitted_by' => User::where('school_id', $this->schoolId)->where('email', 'mohamed.sesay@' . $this->domain)->first()?->id,
                'submitted_at' => now()->subDays(10),
                'approved_by' => User::where('school_id', $this->schoolId)->where('email', 'fatima.bangura@' . $this->domain)->first()?->id,
                'approved_at' => now()->subDays(5),
            ]);
        }
        $this->command->line('  Exams for all classes');
    }

    private function createMarks(): void
    {
        $count = 0;
        foreach ($this->students as $student) {
            $class = SchoolClass::withoutGlobalScopes()->find($student->class_id);
            if (!$class || !isset($this->exams[$class->name]) || !isset($this->subjects[$class->name])) continue;

            foreach ($this->subjects[$class->name] as $subject) {
                $marks = rand(35, 92);
                Mark::create([
                    'school_id' => $this->schoolId,
                    'exam_id' => $this->exams[$class->name]->id,
                    'student_id' => $student->id,
                    'subject_id' => $subject->id,
                    'marks_obtained' => $marks,
                    'grade' => $this->calcGrade($marks),
                    'gpa' => $this->calcGpa($marks),
                    'is_absent' => false,
                    'remarks' => $marks >= 75 ? 'Excellent' : ($marks >= 50 ? 'Good' : 'Needs improvement'),
                    'status' => 'approved',
                ]);
                $count++;
            }
        }
        $this->command->line("  {$count} Marks records");
    }

    private function calcGrade(int $m): string
    {
        return match(true) {
            $m >= 75 => 'A1', $m >= 65 => 'B2', $m >= 55 => 'B3', $m >= 45 => 'C4',
            $m >= 40 => 'C5', $m >= 35 => 'C6', $m >= 30 => 'D7', $m >= 20 => 'E8', default => 'F9',
        };
    }

    private function calcGpa(int $m): float
    {
        return match(true) {
            $m >= 75 => 4.0, $m >= 65 => 3.5, $m >= 55 => 3.0, $m >= 45 => 2.5,
            $m >= 40 => 2.0, $m >= 35 => 1.5, $m >= 30 => 1.0, $m >= 20 => 0.5, default => 0.0,
        };
    }

    private function createAttendance(): void
    {
        $count = 0;
        $start = new \Carbon\Carbon('2025-09-08');
        $days = 0;
        for ($d = 0; $days < 20; $d++) {
            $date = $start->copy()->addDays($d);
            if ($date->isWeekend()) continue;
            $days++;
            foreach ($this->students as $student) {
                $rand = rand(1, 100);
                Attendance::create([
                    'school_id' => $this->schoolId,
                    'academic_year_id' => $this->academicYear->id,
                    'date' => $date->toDateString(),
                    'attendable_type' => 'App\\Models\\Student',
                    'attendable_id' => $student->id,
                    'status' => $rand <= 85 ? 'present' : ($rand <= 93 ? 'absent' : 'late'),
                    'status_draft' => 'approved',
                    'approved_by' => User::where('school_id', $this->schoolId)->where('email', 'fatima.bangura@' . $this->domain)->first()?->id,
                    'approved_at' => now(),
                    'remarks' => $rand > 85 ? 'Marked during school hours' : null,
                ]);
                $count++;
            }
        }
        $this->command->line("  {$count} Attendance records (20 school days)");
    }

    private function createTimetable(): void
    {
        $slots = [
            ['start' => '08:00', 'end' => '08:45'],
            ['start' => '08:50', 'end' => '09:35'],
            ['start' => '09:45', 'end' => '10:30'],
            ['start' => '10:40', 'end' => '11:25'],
            ['start' => '11:35', 'end' => '12:20'],
        ];
        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        $count = 0;
        $tIdx = 0;

        foreach (['Primary 4', 'JSS 3', 'SSS 3'] as $className) {
            $class = $this->classes[$className] ?? null;
            $subs = $this->subjects[$className] ?? [];
            if (!$class || empty($subs)) continue;
            $teacher = $this->teachers[$tIdx % count($this->teachers)]['staff'] ?? null;
            $tIdx++;
            if (!$teacher) continue;

            foreach ($days as $day) {
                foreach ($slots as $si => $slot) {
                    Timetable::create([
                        'school_id' => $this->schoolId,
                        'class_id' => $class->id,
                        'subject_id' => $subs[$si % count($subs)]->id,
                        'teacher_id' => $teacher->id,
                        'day_of_week' => $day,
                        'start_time' => $slot['start'],
                        'end_time' => $slot['end'],
                        'room' => 'Room ' . ($class->numeric_name ?? 1),
                    ]);
                    $count++;
                }
            }
        }
        $this->command->line("  {$count} Timetable entries");
    }

    private function createFeesAndPayments(): void
    {
        $feeCat = FeeCategory::where('school_id', $this->schoolId)->where('type', 'tuition')->first();
        if (!$feeCat) return;

        $amounts = ['Nursery 1' => 1500000, 'Primary 1' => 2000000, 'Primary 4' => 2000000, 'Primary 6' => 2000000, 'JSS 1' => 2500000, 'JSS 3' => 2500000, 'SSS 1' => 3000000, 'SSS 3' => 3000000];

        foreach ($amounts as $cn => $amt) {
            $class = $this->classes[$cn] ?? null;
            if (!$class) continue;
            FeeStructure::create([
                'school_id' => $this->schoolId,
                'class_id' => $class->id,
                'fee_category_id' => $feeCat->id,
                'academic_year' => '2025-2026',
                'amount' => $amt,
                'due_date' => '2025-10-31',
                'frequency' => 'annual',
                'is_active' => true,
            ]);
        }

        $payCount = 0;
        foreach ($this->students as $student) {
            $class = SchoolClass::withoutGlobalScopes()->find($student->class_id);
            $struct = $class ? FeeStructure::where('school_id', $this->schoolId)->where('class_id', $class->id)->first() : null;
            if (!$struct) continue;

            $paid = rand(0, 1) ? $struct->amount : (int)($struct->amount * (rand(40, 90) / 100));
            FeePayment::create([
                'school_id' => $this->schoolId,
                'student_id' => $student->id,
                'fee_structure_id' => $struct->id,
                'amount_due' => $struct->amount,
                'amount_paid' => $paid,
                'discount' => 0,
                'fine' => 0,
                'payment_date' => now()->subDays(rand(1, 60))->toDateString(),
                'method' => rand(0, 1) ? 'cash' : 'mobile_money',
                'status' => $paid >= $struct->amount ? 'paid' : 'partial',
            ]);
            $payCount++;
        }
        $this->command->line("  Fee Structures + {$payCount} Payments");
    }

    private function createPayroll(): void
    {
        $staffList = Staff::withoutGlobalScopes()->where('school_id', $this->schoolId)->where('status', 'active')->get();
        foreach ($staffList as $staff) {
            $basic = $staff->salary ?? 2500000;
            Payroll::create([
                'school_id' => $this->schoolId,
                'staff_id' => $staff->id,
                'month_year' => now()->format('Y-m'),
                'basic_salary' => $basic,
                'total_allowances' => (int)($basic * 0.15),
                'total_deductions' => (int)($basic * 0.10),
                'net_salary' => $basic + (int)($basic * 0.15) - (int)($basic * 0.10),
                'working_days' => 22,
                'present_days' => rand(18, 22),
                'leave_days' => rand(0, 2),
                'status' => 'paid',
                'paid_on' => now()->subDays(5)->toDateString(),
            ]);
        }
        $this->command->line('  Payroll for all staff');
    }

    private function createLibrary(): void
    {
        $books = [
            ['title' => 'Introduction to Mathematics', 'author' => 'J.K. Williams', 'isbn' => '978-001-001', 'category' => 'Textbook', 'qty' => 30],
            ['title' => 'English Grammar in Use', 'author' => 'Raymond Murphy', 'isbn' => '978-001-002', 'category' => 'Textbook', 'qty' => 25],
            ['title' => 'Chemistry for West Africa', 'author' => 'T.E. Archbold', 'isbn' => '978-001-003', 'category' => 'Textbook', 'qty' => 20],
            ['title' => 'The Things Fall Apart', 'author' => 'Chinua Achebe', 'isbn' => '978-001-005', 'category' => 'Literature', 'qty' => 15],
            ['title' => 'Sierra Leone History', 'author' => 'Akintola Wyse', 'isbn' => '978-001-006', 'category' => 'History', 'qty' => 12],
            ['title' => 'Computer Basics', 'author' => 'David Reynolds', 'isbn' => '978-001-007', 'category' => 'ICT', 'qty' => 18],
            ['title' => 'Principles of Economics', 'author' => 'N. Gregory Mankiw', 'isbn' => '978-001-009', 'category' => 'Economics', 'qty' => 16],
            ['title' => 'Biology: A Global Approach', 'author' => 'Neil Campbell', 'isbn' => '978-001-011', 'category' => 'Textbook', 'qty' => 20],
        ];

        foreach ($books as $b) {
            $book = Book::create([
                'school_id' => $this->schoolId,
                'title' => $b['title'],
                'author' => $b['author'],
                'isbn' => $b['isbn'],
                'category' => $b['category'],
                'total_copies' => $b['qty'],
                'available_copies' => $b['qty'] - rand(0, 3),
                'location' => 'Rack ' . rand(1, 5),
                'is_active' => true,
            ]);

            if (rand(0, 1)) {
                $student = $this->students[array_rand($this->students)];
                BookIssue::create([
                    'school_id' => $this->schoolId,
                    'book_id' => $book->id,
                    'member_type' => 'App\\Models\\Student',
                    'member_id' => $student->id,
                    'issued_date' => now()->subDays(rand(5, 30))->toDateString(),
                    'due_date' => now()->addDays(rand(1, 14))->toDateString(),
                    'returned_date' => rand(0, 1) ? now()->subDays(rand(1, 5))->toDateString() : null,
                    'status' => rand(0, 1) ? 'returned' : 'issued',
                    'fine' => 0,
                ]);
            }
        }
        $this->command->line('  Library Books + Issues');
    }

    private function createCommunication(): void
    {
        $authorId = User::where('school_id', $this->schoolId)->where('email', 'mohamed.sesay@' . $this->domain)->first()?->id
            ?? User::where('school_id', $this->schoolId)->where('email', 'fatima.bangura@' . $this->domain)->first()?->id
            ?? User::where('school_id', $this->schoolId)->first()?->id;

        $announcements = [
            ['title' => 'Welcome Back - Term 1', 'body' => 'Welcome back to Freetown International Academy for the 2025-2026 academic year. School resumes on Monday, September 8th.'],
            ['title' => 'Mid-Term Break Notice', 'body' => 'Mid-term break will commence from October 20th to October 24th, 2025. Classes resume on October 27th.'],
            ['title' => 'Parent-Teacher Conference', 'body' => 'A parent-teacher conference is scheduled for November 15th, 2025. All parents are expected to attend.'],
            ['title' => 'Examination Timetable Released', 'body' => 'The Term 1 examination timetable has been released. Students are advised to check with their class teachers.'],
            ['title' => 'Sports Day Announcement', 'body' => 'Annual sports day will be held on December 12th, 2025. All students should participate in their house activities.'],
        ];

        foreach ($announcements as $a) {
            Announcement::create([
                'school_id' => $this->schoolId,
                'title' => $a['title'],
                'body' => $a['body'],
                'author_id' => $authorId,
                'published_at' => now()->subDays(rand(1, 30)),
            ]);
        }

        $recipientId = User::where('school_id', $this->schoolId)->where('email', 'abubakarr.parent1@' . $this->domain)->first()?->id;
        if ($authorId && $recipientId) {
            foreach ([
                ['subject' => 'Fee Payment Reminder', 'body' => 'Dear Parent, this is a reminder that fee payment for Term 1 is due.'],
                ['subject' => 'School Calendar Update', 'body' => 'Please note that the school calendar has been updated.'],
                ['subject' => 'Examination Guidelines', 'body' => 'Students are reminded to follow all examination guidelines.'],
            ] as $m) {
                Message::create([
                    'school_id' => $this->schoolId,
                    'sender_id' => $authorId,
                    'recipient_id' => $recipientId,
                    'subject' => $m['subject'],
                    'body' => $m['body'],
                ]);
            }
        }
        $this->command->line('  5 Announcements + 3 Messages');
    }

    private function createHolidays(): void
    {
        foreach ([
            ['name' => "New Year's Day", 'date' => '2026-01-01', 'description' => 'National holiday'],
            ['name' => 'Independence Day', 'date' => '2026-04-27', 'description' => 'Republic Day'],
            ['name' => 'Good Friday', 'date' => '2026-04-03', 'description' => 'Religious holiday'],
            ['name' => 'Eid-ul-Fitr', 'date' => '2026-03-30', 'description' => 'Religious holiday'],
            ['name' => 'Christmas Day', 'date' => '2026-12-25', 'description' => 'Religious holiday'],
        ] as $h) {
            Holiday::create(array_merge($h, ['school_id' => $this->schoolId]));
        }
        $this->command->line('  5 Holidays');
    }

    private function createReportCards(): void
    {
        $count = 0;

        foreach ($this->students as $student) {
            $class = SchoolClass::withoutGlobalScopes()->find($student->class_id);
            if (!$class || !isset($this->exams[$class->name]) || !isset($this->subjects[$class->name])) continue;

            $marks = Mark::where('exam_id', $this->exams[$class->name]->id)
                ->where('student_id', $student->id)->get();

            $totalMarks = 0;
            $obtained = 0;
            $subjectData = [];
            foreach ($marks as $mark) {
                $subj = Subject::withoutGlobalScopes()->find($mark->subject_id);
                $totalMarks += $subj?->full_marks ?? 100;
                $obtained += $mark->marks_obtained;
                $subjectData[] = [
                    'subject' => $subj?->name ?? 'Unknown',
                    'marks' => $mark->marks_obtained,
                    'grade' => $mark->grade,
                    'gpa' => $mark->gpa,
                ];
            }

            $percentage = $totalMarks > 0 ? round(($obtained / $totalMarks) * 100, 2) : 0;
            $daysPresent = (int)(20 * 0.85);
            $daysAbsent = 20 - $daysPresent;

            ReportCard::create([
                'school_id' => $this->schoolId,
                'student_id' => $student->id,
                'academic_year_id' => $this->academicYear->id,
                'term_id' => $this->term1->id,
                'class_id' => $class->id,
                'section_id' => $student->section_id,
                'total_marks' => $totalMarks,
                'obtained_marks' => round($obtained, 2),
                'percentage' => $percentage,
                'grade' => $this->calcGrade((int)$percentage),
                'gpa' => round($this->calcGpa((int)$percentage), 2),
                'rank' => $count + 1,
                'total_school_days' => 20,
                'days_present' => $daysPresent,
                'days_absent' => $daysAbsent,
                'days_late' => 0,
                'promotion_status' => $percentage >= 50 ? 'promoted' : 'pending',
                'teacher_comment' => $percentage >= 75 ? 'Excellent performance.' : ($percentage >= 50 ? 'Good work, keep it up.' : 'Needs improvement.'),
                'form_master_comment' => $percentage >= 60 ? 'A diligent student.' : 'Requires more effort.',
                'principal_comment' => 'Keep striving for excellence.',
                'subject_data' => $subjectData,
                'status' => 'published',
            ]);
            $count++;
        }
        $this->command->line("  {$count} Report Cards");
    }

    private function createSchoolSettings(): void
    {
        $settings = [
            ['key' => 'academic_year_format', 'value' => 'YYYY-YYYY', 'group' => 'academic'],
            ['key' => 'grading_system', 'value' => 'ugce', 'group' => 'academic'],
            ['key' => 'attendance_required', 'value' => 'true', 'group' => 'attendance'],
            ['key' => 'sms_enabled', 'value' => 'false', 'group' => 'communication'],
            ['key' => 'email_notifications', 'value' => 'true', 'group' => 'communication'],
        ];
        foreach ($settings as $s) {
            SchoolSetting::create(array_merge($s, ['school_id' => $this->schoolId]));
        }
        $this->command->line('  School Settings');
    }

    private function printSummary(): void
    {
        $counts = [
            'Users' => User::where('school_id', $this->schoolId)->count() + 1,
            'Students' => Student::where('school_id', $this->schoolId)->count(),
            'Staff' => Staff::where('school_id', $this->schoolId)->count(),
            'Classes' => SchoolClass::where('school_id', $this->schoolId)->count(),
            'Subjects' => Subject::where('school_id', $this->schoolId)->count(),
            'Exams' => Exam::where('school_id', $this->schoolId)->count(),
            'Marks' => Mark::where('school_id', $this->schoolId)->count(),
            'Attendance' => Attendance::where('school_id', $this->schoolId)->count(),
            'Timetable' => Timetable::where('school_id', $this->schoolId)->count(),
            'Fee Payments' => FeePayment::where('school_id', $this->schoolId)->count(),
            'Report Cards' => ReportCard::where('school_id', $this->schoolId)->count(),
        ];

        $this->command->info('');
        $this->command->info('=== SEED SUMMARY ===');
        foreach ($counts as $label => $count) {
            $this->command->line("  {$label}: {$count}");
        }
        $this->command->info('');
        $this->command->info('Demo Accounts:');
        $this->command->line('  Super Admin: syscend@gmail.com');
        $this->command->line('  All demo accounts use password: Demo@123');
        $this->command->info('');
    }
}
