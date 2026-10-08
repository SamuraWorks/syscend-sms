<?php

namespace App\Http\Controllers;

use App\Models\District;
use App\Models\MinistryAnnouncement;
use App\Models\MinistryDownload;
use App\Models\NationalExamination;
use App\Models\NationalStudentRegistry;
use App\Models\NationalTeacherRegistry;
use App\Models\School;
use App\Models\SchoolInspection;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MinistryPortalController extends Controller
{
    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       DASHBOARD â€” National KPIs
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function dashboard()
    {
        $user = auth()->user();

        $stats = [
            'total_schools'      => School::withoutGlobalScopes()->whereNull('deleted_at')->count(),
            'active_schools'     => School::withoutGlobalScopes()->whereNull('deleted_at')->where('status', 'active')->count(),
            'total_students'     => NationalStudentRegistry::count(),
            'total_teachers'     => NationalTeacherRegistry::count(),
            'total_districts'    => District::count(),
            'pending_inspections' => SchoolInspection::where('status', 'scheduled')->count(),
            'compliant_schools'  => School::withoutGlobalScopes()->whereNull('deleted_at')->where('inspection_status', 'compliant')->count(),
            'accredited_schools' => School::withoutGlobalScopes()->whereNull('deleted_at')->where('accreditation_status', 'accredited')->count(),
        ];

        $recentAnnouncements = MinistryAnnouncement::published()
            ->latest('published_at')
            ->take(5)
            ->get(['id', 'title', 'type', 'priority', 'published_at']);

        $districtStats = District::withCount(['schools', 'nationalStudents', 'nationalTeachers'])
            ->get(['id', 'name', 'code', 'province', 'schools_count', 'students_count', 'teachers_count']);

        $recentInspections = SchoolInspection::with('school:id,name')
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Ministry/Dashboard', [
            'user'                => $user,
            'stats'               => $stats,
            'recentAnnouncements' => $recentAnnouncements,
            'districtStats'       => $districtStats,
            'recentInspections'   => $recentInspections,
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       SCHOOLS MANAGEMENT
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function schools()
    {
        return Inertia::render('Ministry/Schools', [
            'schools' => School::withoutGlobalScopes()
                ->with('district:id,name')
                ->orderBy('name')
                ->get([
                    'id', 'name', 'slug', 'district_id', 'school_type',
                    'status', 'moe_approval_status', 'accreditation_status',
                    'inspection_status',
                ]),
        ]);
    }

    public function schoolApprovals()
    {
        return Inertia::render('Ministry/SchoolApprovals', [
            'pendingSchools' => School::withoutGlobalScopes()
                ->with('district:id,name')
                ->where('moe_approval_status', 'pending')
                ->orderBy('created_at')
                ->get([
                    'id', 'name', 'slug', 'district_id', 'school_type',
                    'status', 'moe_approval_status', 'email', 'phone',
                    'created_at',
                ]),
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       DISTRICT MANAGEMENT
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function districts()
    {
        return Inertia::render('Ministry/Districts', [
            'districts' => District::withCount(['schools', 'nationalStudents', 'nationalTeachers'])
                ->with('educationOfficer:id,name,email')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function districtOfficers()
    {
        return Inertia::render('Ministry/DistrictOfficers', [
            'officers' => User::role('district-officer')
                ->with('district:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'phone', 'status']),
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       STUDENT REGISTRY
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function students()
    {
        return Inertia::render('Ministry/Students', [
            'students' => NationalStudentRegistry::with('school:id,name')
                ->with('district:id,name')
                ->orderBy('name')
                ->get([
                    'id', 'national_student_id', 'name', 'date_of_birth',
                    'gender', 'school_id', 'district_id', 'current_level',
                    'status', 'enrollment_date',
                ]),
        ]);
    }

    public function studentAnalytics()
    {
        $byGender = NationalStudentRegistry::select('gender', DB::raw('count(*) as total'))
            ->groupBy('gender')
            ->pluck('total', 'gender');

        $byLevel = NationalStudentRegistry::select('current_level', DB::raw('count(*) as total'))
            ->groupBy('current_level')
            ->pluck('total', 'current_level');

        $byDistrict = District::withCount('nationalStudents')
            ->orderByDesc('national_students_count')
            ->get(['id', 'name']);

        $enrollmentTrend = NationalStudentRegistry::select(
            DB::raw("TO_CHAR(enrollment_date, 'YYYY-MM') as month"),
            DB::raw('count(*) as total')
        )
            ->whereNotNull('enrollment_date')
            ->groupBy('month')
            ->orderByDesc('month')
            ->limit(12)
            ->pluck('total', 'month');

        return Inertia::render('Ministry/StudentAnalytics', [
            'byGender'         => $byGender,
            'byLevel'          => $byLevel,
            'byDistrict'       => $byDistrict,
            'enrollmentTrend'  => $enrollmentTrend,
            'totalStudents'    => NationalStudentRegistry::count(),
            'activeStudents'   => NationalStudentRegistry::active()->count(),
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       TEACHER REGISTRY
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function teachers()
    {
        return Inertia::render('Ministry/Teachers', [
            'teachers' => NationalTeacherRegistry::with('school:id,name')
                ->with('district:id,name')
                ->orderBy('name')
                ->get([
                    'id', 'national_teacher_id', 'name', 'email', 'phone',
                    'school_id', 'district_id', 'qualification',
                    'specialization', 'years_of_experience',
                    'employment_status', 'licensing_status',
                ]),
        ]);
    }

    public function teacherLicensing()
    {
        $byStatus = NationalTeacherRegistry::select('licensing_status', DB::raw('count(*) as total'))
            ->groupBy('licensing_status')
            ->pluck('total', 'licensing_status');

        $expired = NationalTeacherRegistry::where('licensing_status', 'expired')
            ->with('school:id,name')
            ->orderBy('name')
            ->get([
                'id', 'national_teacher_id', 'name', 'email',
                'school_id', 'qualification', 'licensing_status',
            ]);

        $pending = NationalTeacherRegistry::where('licensing_status', 'pending')
            ->with('school:id,name')
            ->orderBy('name')
            ->get([
                'id', 'national_teacher_id', 'name', 'email',
                'school_id', 'qualification', 'licensing_status',
            ]);

        return Inertia::render('Ministry/TeacherLicensing', [
            'byStatus'   => $byStatus,
            'expired'    => $expired,
            'pending'    => $pending,
            'totalTeachers'  => NationalTeacherRegistry::count(),
            'licensedCount'  => NationalTeacherRegistry::licensed()->count(),
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       NATIONAL EXAMINATIONS
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function examNpse()
    {
        return Inertia::render('Ministry/ExamNpse', [
            'candidates' => NationalExamination::where('exam_type', 'npse')
                ->with('school:id,name')
                ->orderByDesc('exam_year')
                ->get([
                    'id', 'student_id', 'school_id', 'exam_type',
                    'exam_year', 'total_score', 'overall_grade',
                    'overall_result', 'status',
                ]),
            'summary' => [
                'total'   => NationalExamination::where('exam_type', 'npse')->count(),
                'passed'  => NationalExamination::where('exam_type', 'npse')->where('overall_result', 'pass')->count(),
                'failed'  => NationalExamination::where('exam_type', 'npse')->where('overall_result', 'fail')->count(),
            ],
        ]);
    }

    public function examBece()
    {
        return Inertia::render('Ministry/ExamBece', [
            'candidates' => NationalExamination::where('exam_type', 'bece')
                ->with('school:id,name')
                ->orderByDesc('exam_year')
                ->get([
                    'id', 'student_id', 'school_id', 'exam_type',
                    'exam_year', 'total_score', 'overall_grade',
                    'overall_result', 'status',
                ]),
            'summary' => [
                'total'   => NationalExamination::where('exam_type', 'bece')->count(),
                'passed'  => NationalExamination::where('exam_type', 'bece')->where('overall_result', 'pass')->count(),
                'failed'  => NationalExamination::where('exam_type', 'bece')->where('overall_result', 'fail')->count(),
            ],
        ]);
    }

    public function examWasse()
    {
        return Inertia::render('Ministry/ExamWasse', [
            'candidates' => NationalExamination::where('exam_type', 'wassce')
                ->with('school:id,name')
                ->orderByDesc('exam_year')
                ->get([
                    'id', 'student_id', 'school_id', 'exam_type',
                    'exam_year', 'total_score', 'overall_grade',
                    'overall_result', 'status',
                ]),
            'summary' => [
                'total'   => NationalExamination::where('exam_type', 'wassce')->count(),
                'passed'  => NationalExamination::where('exam_type', 'wassce')->where('overall_result', 'pass')->count(),
                'failed'  => NationalExamination::where('exam_type', 'wassce')->where('overall_result', 'fail')->count(),
            ],
        ]);
    }

    public function examAnalytics()
    {
        $byType = NationalExamination::select('exam_type', DB::raw('count(*) as total'))
            ->groupBy('exam_type')
            ->pluck('total', 'exam_type');

        $byYear = NationalExamination::select('exam_year', 'exam_type', DB::raw('count(*) as total'))
            ->groupBy('exam_year', 'exam_type')
            ->orderByDesc('exam_year')
            ->get();

        $resultByDistrict = District::withCount([
            'nationalStudents as total_students',
        ])->get(['id', 'name']);

        return Inertia::render('Ministry/ExamAnalytics', [
            'byType'          => $byType,
            'byYear'          => $byYear,
            'resultByDistrict' => $resultByDistrict,
            'totalCandidates'  => NationalExamination::count(),
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       QUALITY ASSURANCE â€” INSPECTIONS
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function inspections()
    {
        return Inertia::render('Ministry/Inspections', [
            'inspections' => SchoolInspection::with(['school:id,name', 'district:id,name', 'inspector:id,name'])
                ->latest()
                ->get(),
        ]);
    }

    public function inspectionCompliance()
    {
        $compliance = School::withoutGlobalScopes()
            ->select('inspection_status', DB::raw('count(*) as total'))
            ->groupBy('inspection_status')
            ->pluck('total', 'inspection_status');

        $nonCompliantSchools = School::withoutGlobalScopes()
            ->where('inspection_status', 'non_compliant')
            ->with('district:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'district_id', 'inspection_status']);

        return Inertia::render('Ministry/InspectionCompliance', [
            'compliance'            => $compliance,
            'nonCompliantSchools'   => $nonCompliantSchools,
            'totalSchools'          => School::withoutGlobalScopes()->whereNull('deleted_at')->count(),
        ]);
    }

    public function inspectionRatings()
    {
        $ratings = SchoolInspection::where('status', 'completed')
            ->select('score', DB::raw('count(*) as total'))
            ->selectRaw("CASE
                WHEN score >= 90 THEN 'Excellent'
                WHEN score >= 75 THEN 'Good'
                WHEN score >= 60 THEN 'Satisfactory'
                WHEN score >= 40 THEN 'Needs Improvement'
                ELSE 'Critical'
            END as rating_label")
            ->groupBy('rating_label', 'score')
            ->get();

        $avgScore = SchoolInspection::where('status', 'completed')
            ->avg('score');

        $topSchools = SchoolInspection::where('status', 'completed')
            ->with('school:id,name')
            ->orderByDesc('score')
            ->take(10)
            ->get(['id', 'school_id', 'score', 'inspection_type', 'completed_date']);

        $bottomSchools = SchoolInspection::where('status', 'completed')
            ->with('school:id,name')
            ->orderBy('score')
            ->take(10)
            ->get(['id', 'school_id', 'score', 'inspection_type', 'completed_date']);

        return Inertia::render('Ministry/InspectionRatings', [
            'ratings'       => $ratings,
            'avgScore'      => $avgScore ? round($avgScore, 1) : 0,
            'topSchools'    => $topSchools,
            'bottomSchools' => $bottomSchools,
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       REPORTS & ANALYTICS
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function reports()
    {
        return Inertia::render('Ministry/Reports', [
            'stats' => [
                'total_schools'     => School::withoutGlobalScopes()->whereNull('deleted_at')->count(),
                'total_students'    => NationalStudentRegistry::count(),
                'total_teachers'    => NationalTeacherRegistry::count(),
                'total_districts'   => District::count(),
                'total_exams'       => NationalExamination::count(),
                'completed_inspections' => SchoolInspection::where('status', 'completed')->count(),
            ],
        ]);
    }

    public function reportDistricts()
    {
        return Inertia::render('Ministry/ReportDistricts', [
            'districts' => District::withCount(['schools', 'nationalStudents', 'nationalTeachers', 'inspections'])
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function reportEnrollment()
    {
        $byLevel = NationalStudentRegistry::select('current_level', DB::raw('count(*) as total'))
            ->groupBy('current_level')
            ->pluck('total', 'current_level');

        $byDistrict = District::withCount('nationalStudents')
            ->orderByDesc('national_students_count')
            ->get(['id', 'name']);

        $trend = NationalStudentRegistry::select(
            DB::raw("TO_CHAR(enrollment_date, 'YYYY-MM') as month"),
            DB::raw('count(*) as total')
        )
            ->whereNotNull('enrollment_date')
            ->groupBy('month')
            ->orderByDesc('month')
            ->limit(24)
            ->pluck('total', 'month');

        return Inertia::render('Ministry/ReportEnrollment', [
            'byLevel'    => $byLevel,
            'byDistrict' => $byDistrict,
            'trend'      => $trend,
        ]);
    }

    public function reportGender()
    {
        $studentsByGender = NationalStudentRegistry::select('gender', DB::raw('count(*) as total'))
            ->groupBy('gender')
            ->pluck('total', 'gender');

        $teachersByGender = NationalTeacherRegistry::select(
            DB::raw("CASE WHEN name LIKE '% Mrs%' OR name LIKE '% Ms%' OR name LIKE '% Miss%' THEN 'female' ELSE 'male' END as gender"),
            DB::raw('count(*) as total')
        )
            ->groupBy('gender')
            ->pluck('total', 'gender');

        $genderByDistrict = District::withCount('nationalStudents')
            ->get(['id', 'name']);

        return Inertia::render('Ministry/ReportGender', [
            'studentsByGender' => $studentsByGender,
            'teachersByGender' => $teachersByGender,
            'genderByDistrict' => $genderByDistrict,
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       COMMUNICATION
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function announcements()
    {
        return Inertia::render('Ministry/Announcements', [
            'announcements' => MinistryAnnouncement::with('publisher:id,name')
                ->latest('published_at')
                ->get(),
        ]);
    }

    public function circulars()
    {
        return Inertia::render('Ministry/Circulars', [
            'circulars' => MinistryAnnouncement::where('type', 'circular')
                ->with('publisher:id,name')
                ->latest('published_at')
                ->get(),
        ]);
    }

    public function alerts()
    {
        return Inertia::render('Ministry/Alerts', [
            'alerts' => MinistryAnnouncement::where('priority', 'high')
                ->active()
                ->with('publisher:id,name')
                ->latest('published_at')
                ->get(),
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       DOWNLOADS
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function downloads()
    {
        return Inertia::render('Ministry/Downloads', [
            'downloads' => MinistryDownload::active()
                ->with('uploader:id,name')
                ->orderByDesc('created_at')
                ->get(),
        ]);
    }

    /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
       ADMINISTRATION
    â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

    public function adminUsers()
    {
        return Inertia::render('Ministry/AdminUsers', [
            'users' => User::orderBy('name')
                ->get(['id', 'name', 'email', 'phone', 'role', 'status']),
        ]);
    }

    public function adminRoles()
    {
        return Inertia::render('Ministry/AdminRoles', [
            'roles' => DB::table('roles')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function adminAudit()
    {
        return Inertia::render('Ministry/AdminAudit', [
            'activityLog' => \Spatie\Activitylog\Models\Activity::latest()
                ->take(100)
                ->get(),
        ]);
    }

    public function adminSettings()
    {
        return Inertia::render('Ministry/AdminSettings', [
            'settings' => [
                'app_name'     => config('app.name'),
                'app_env'      => config('app.env'),
                'timezone'     => config('app.timezone'),
                'currency'     => School::first()?->currency ?? 'SLL',
            ],
        ]);
    }
}
