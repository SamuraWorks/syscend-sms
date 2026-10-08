export interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    avatar_url: string | null;
    role: string | null;
    roles: string[];
    activeRole: string;
    permissions: string[];
    school_id: number | null;
    status: string;
    last_login_at: string | null;
}

export interface School {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    logo_url: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string;
    timezone: string;
    currency: string;
    language: string;
    status: 'active' | 'inactive' | 'suspended';
    registration_status?: 'pending' | 'approved' | 'rejected';
    registration_approved_at?: string | null;
    registration_approved_by?: number | null;
    registration_rejected_at?: string | null;
    registration_rejection_reason?: string | null;
    users_count?: number;
    created_at: string;
    updated_at: string;
}

export interface AcademicYear {
    id: number;
    school_id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export interface AcademicTerm {
    id: number;
    school_id: number;
    academic_year_id: number;
    name: string;
    start_date: string;
    end_date: string;
    mid_term_start_date: string | null;
    mid_term_end_date: string | null;
    is_current: boolean;
}

export type SchoolSubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended';

export interface LicenseStatus {
    status: SchoolSubscriptionStatus;
    is_trial: boolean;
    is_fully_paid: boolean;
    trial_ends_at: string | null;
    end_date: string | null;
    balance: number;
    package_name: string | null;
    currency_symbol: string | null;
}

export interface PageProps {
    auth: {
        user: User | null;
    };
    school: School | null;
    schoolBranding: {
        name: string | null;
        short_name: string | null;
        slug: string | null;
        motto: string | null;
        tagline: string | null;
        footer_text: string | null;
        logo_url: string | null;
        badge_url: string | null;
        banner_url: string | null;
        favicon_url: string | null;
        primary_color: string | null;
        secondary_color: string | null;
        about_school: string | null;
        school_mission: string | null;
        school_vision: string | null;
    } | null;
    schoolConfig: {
        primary_color: string | null;
        secondary_color: string | null;
        currency: string | null;
        currency_symbol: string | null;
        language: string;
        terms_per_year: number;
        ca_weight: number;
        exam_weight: number;
        grading_system: string;
        pass_mark: number;
        enable_ece: boolean;
        enable_primary: boolean;
        enable_jss: boolean;
        enable_sss: boolean;
        section_format: string;
        school_level: string | null;
        school_type: string | null;
        result_show_position: string;
        result_position_type: string;
    } | null;
    subscription: LicenseStatus | null;
    flash: {
        success?: string;
        error?: string;
        temp_password?: string;
        show_credentials?: boolean;
        parent_name?: string;
    };
    faviconUrl: string | null;
    platformLogoUrl: string | null;
    webPush?: { enabled: boolean; vapidPublicKey: string | null } | null;
    errors: Record<string, string>;
    import_errors?: string[];
    [key: string]: unknown;
}

export interface Guardian {
    id: number;
    school_id: number;
    user_id: number | null;
    name: string;
    relation: string;
    phone: string | null;
    alt_phone?: string | null;
    email: string | null;
    occupation: string | null;
    address: string | null;
    photo: string | null;
    pivot?: { guardian_id: number; student_id: number; relationship: string | null; is_primary: boolean };
}

export interface StudentDocument {
    id: number;
    student_id: number;
    title: string;
    file_path: string;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    visible_to_parent?: boolean;
    created_at: string;
}

export interface House {
    id: number;
    school_id: number;
    name: string;
    color: string | null;
    is_active: boolean;
    house_master_id?: number | null;
    house_master?: { id: number; name: string } | null;
    students_count?: number;
}

export interface Student {
    id: number;
    school_id: number;
    class_id: number;
    section_id: number | null;
    guardian_id: number | null;
    house_id: number | null;
    department_id: number | null;
    admission_no: string;
    student_id: string | null;
    roll_no: string | null;
    first_name: string;
    last_name: string | null;
    full_name: string;
    initials?: string;
    gender: 'male' | 'female' | 'other';
    date_of_birth: string | null;
    place_of_birth: string | null;
    blood_group: string | null;
    religion: string | null;
    nationality: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    photo: string | null;
    photo_url: string | null;
    category: 'general' | 'disabled' | 'quota';
    status: 'active' | 'alumni' | 'transferred' | 'inactive';
    registration_status?: string | null;
    admission_date: string | null;
    admission_type: 'new' | 'transfer' | 'returning' | null;
    previous_school: string | null;
    created_at: string;
    school_class?: SchoolClass;
    section?: Section;
    guardian?: Guardian;
    guardians?: Guardian[];
    house?: House;
    department?: { id: number; name: string };
    documents?: StudentDocument[];
}

export interface SchoolClass {
    id: number;
    school_id: number;
    name: string;
    short_name: string | null;
    numeric_name: number | null;
    capacity: number;
    class_teacher_id: number | null;
    school_level: string | null;
    level_order: number | null;
    department_id: number | null;
    description: string | null;
    is_active: boolean;
    sections_count?: number;
    subjects_count?: number;
    students_count?: number;
    sections?: Section[];
    subjects?: Subject[];
}

export interface Section {
    id: number;
    school_id: number;
    class_id: number;
    name: string;
    section_code: string | null;
    capacity: number;
    form_master_id: number | null;
    classroom: string | null;
    is_active: boolean;
    students_count?: number;
    school_class?: SchoolClass;
    form_master?: Staff;
}

export interface Subject {
    id: number;
    school_id: number;
    class_id: number;
    name: string;
    code: string | null;
    type: 'theory' | 'practical';
    full_marks: number;
    pass_marks: number;
    school_level: string | null;
    department_id: number | null;
    is_core: boolean;
    is_active: boolean;
    school_class?: SchoolClass;
    department?: Department;
}

export interface Shift {
    id: number;
    school_id: number;
    name: string;
    start_time: string;
    end_time: string;
}

export interface Holiday {
    id: number;
    school_id: number;
    name: string;
    date: string;
    description: string | null;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Timetable {
    id: number;
    school_id: number;
    class_id: number;
    section_id: number | null;
    subject_id: number;
    teacher_id: number | null;
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
    room: string | null;
    notes: string | null;
    subject?: Subject;
    teacher?: Staff;
    school_class?: SchoolClass;
    section?: Section;
}

export interface TimeSlot {
    start: string;
    end: string;
}

export interface Attendance {
    id: number;
    school_id: number;
    date: string;
    attendable_type: string;
    attendable_id: number;
    status: 'present' | 'absent' | 'late' | 'half_day';
    status_draft: string | null;
    remarks: string | null;
    session_id: number | null;
    submitted_by: number | null;
    submitted_at: string | null;
    approved_at: string | null;
    approved_by: number | null;
    session?: AttendanceSession;
}

export interface Department {
    id: number;
    school_id: number;
    name: string;
    code: string | null;
    description: string | null;
    type: 'academic' | 'staff';
    is_active: boolean;
    staff_count?: number;
    classes_count?: number;
}

export interface Designation {
    id: number;
    school_id: number;
    department_id: number | null;
    name: string;
    description: string | null;
    staff_count?: number;
    department?: Department;
}

export interface StaffDocument {
    id: number;
    staff_id: number;
    title: string;
    file_path: string;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    created_at: string;
}

export interface Staff {
    id: number;
    school_id: number;
    user_id: number | null;
    department_id: number | null;
    designation_id: number | null;
    emp_id: string;
    first_name: string;
    last_name: string | null;
    full_name: string;
    gender: 'male' | 'female' | 'other';
    date_of_birth: string | null;
    blood_group: string | null;
    religion: string | null;
    nationality: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    photo: string | null;
    photo_url: string | null;
    joining_date: string | null;
    salary_type: 'fixed' | 'hourly';
    salary: string | null;
    status: 'active' | 'resigned' | 'terminated' | 'on_leave';
    registration_status?: string | null;
    notes: string | null;
    created_at: string;
    department?: Department;
    designation?: Designation;
    documents?: StaffDocument[];
}

export interface Exam {
    id: number;
    school_id: number;
    class_id: number;
    name: string;
    type: 'unit_test' | 'mid_term' | 'final' | 'custom';
    start_date: string | null;
    end_date: string | null;
    status: 'draft' | 'published' | 'completed';
    description: string | null;
    academic_year_id: number | null;
    term_id: number | null;
    assessment_category: string | null;
    ca_weight: number;
    exam_weight: number;
    max_score: number;
    assessment_model: string | null;
    submitted_by: number | null;
    submitted_at: string | null;
    approved_by: number | null;
    approved_at: string | null;
    school_class?: SchoolClass;
    term?: AcademicTerm;
    marks?: Mark[];
    assessment_links?: ExamAssessmentLink[];
}

export interface ExamAssessmentLink {
    id: number;
    exam_id: number;
    assessment_type_id: number;
    max_marks: number;
    weight: number;
    sort_order: number;
    assessment_type?: AssessmentType;
}

export interface AssessmentType {
    id: number;
    school_id: number;
    name: string;
    slug: string;
    category: 'continuous_assessment' | 'summative';
    is_active: boolean;
    sort_order: number;
}

export interface Mark {
    id: number;
    exam_id: number;
    student_id: number;
    subject_id: number;
    school_id: number;
    marks_obtained: number | null;
    grade: string | null;
    gpa: number | null;
    is_absent: boolean;
    remarks: string | null;
    raw_score: number | null;
    weighted_score: number | null;
    assessment_type: string | null;
    assessment_type_slug: string | null;
    component_marks: number | null;
    component_max: number | null;
}

export interface AttendanceSession {
    id: number;
    school_id: number;
    name: string;
    slug: string;
    start_time: string | null;
    end_time: string | null;
    is_active: boolean;
    sort_order: number;
}

export interface AttendanceCorrection {
    id: number;
    school_id: number;
    attendance_id: number;
    requested_by: number;
    original_status: string;
    new_status: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by: number | null;
    reviewer_notes: string | null;
    reviewed_at: string | null;
    attendance?: Attendance;
    requester?: User;
    reviewer?: User;
}

export interface AssessmentComponent {
    id: number;
    school_id: number;
    academic_year_id: number;
    name: string;
    slug: string;
    category: 'coursework' | 'examination';
    description: string | null;
    max_marks: number;
    weight_percentage: number;
    sort_order: number;
    is_active: boolean;
    include_in_final_result: boolean;
    include_in_promotion: boolean;
    require_approval: boolean;
}

export interface SchoolAssessmentConfig {
    id: number;
    school_id: number;
    academic_year_id: number;
    name: string;
    description: string | null;
    is_default: boolean;
    is_active: boolean;
    config_data: Record<string, unknown> | null;
    total_coursework_weight: number;
    total_examination_weight: number;
    require_approval_before_publishing: boolean;
    academic_year?: AcademicYear;
}

export interface DocumentImport {
    id: number;
    school_id: number;
    user_id: number;
    document_type: string;
    file_path: string;
    file_name: string;
    file_type: string | null;
    file_size: number | null;
    status: 'uploaded' | 'processing' | 'extracted' | 'reviewed' | 'imported' | 'failed';
    extracted_data: Record<string, unknown> | null;
    extraction_metadata: Record<string, unknown> | null;
    import_results: Record<string, unknown> | null;
    admin_notes: string | null;
    records_imported: number;
    records_skipped: number;
    records_updated: number;
    processed_at: string | null;
    imported_at: string | null;
    user?: User;
}

export interface ResultApprovalLog {
    id: number;
    school_id: number;
    approvable_type: string;
    approvable_id: number;
    user_id: number;
    action: string;
    notes: string | null;
    previous_state: Record<string, unknown> | null;
    new_state: Record<string, unknown> | null;
    user?: User;
}

export interface ReportCard {
    id: number;
    school_id: number;
    student_id: number;
    academic_year_id: number;
    term_id: number | null;
    class_id: number;
    section_id: number | null;
    total_marks: number | null;
    obtained_marks: number | null;
    percentage: number | null;
    grade: string | null;
    gpa: number | null;
    rank: number | null;
    total_school_days: number;
    days_present: number;
    days_absent: number;
    days_late: number;
    promotion_status: string | null;
    teacher_comment: string | null;
    form_master_comment: string | null;
    principal_comment: string | null;
    subject_data: SubjectResult[] | null;
    extra_data: Record<string, unknown> | null;
    pdf_path: string | null;
    status: 'draft' | 'submitted' | 'approved' | 'published';
    submitted_by: number | null;
    submitted_at: string | null;
    approved_by: number | null;
    approved_at: string | null;
    published_at: string | null;
    assessment_config_id: number | null;
    student?: Student;
    school_class?: SchoolClass;
    term?: AcademicTerm;
}

export interface SubjectResult {
    subject_id: number;
    subject_name: string;
    total_marks: number;
    max_marks: number;
    percentage: number;
    grade: string;
    gpa: number;
    remarks: string;
    components: ComponentScore[];
    is_absent: boolean;
}

export interface ComponentScore {
    exam_id: number;
    exam_name: string;
    marks_obtained: number | null;
    max_score: number;
    grade: string | null;
    gpa: number | null;
    is_absent: boolean;
    remarks: string | null;
}

export type PaginatedResponse<T> = {
    data: T[];
    meta: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
    };
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
};

export type FlatPaginatedResponse<T> = {
    data: T[];
    current_page: number;
    first_page_url: string | null;
    from: number | null;
    last_page: number;
    last_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
};

export interface UserAuditLog {
    id: number;
    school_id: number;
    user_id: number;
    performed_by: number | null;
    action: string;
    subject_type: string | null;
    subject_id: number | null;
    description: string | null;
    metadata: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    performer?: User;
}

export interface SchoolTimeSetting {
    id: number;
    school_id: number;
    academic_year_id: number | null;
    opening_time: string;
    closing_time: string;
    working_days: string;
    timezone: string | null;
    clock_format: '12h' | '24h';
    day_start: string;
    day_end: string;
}

export interface ScheduleEventType {
    id: number;
    school_id: number;
    name: string;
    slug: string;
    color: string | null;
    icon: string | null;
    is_instructional: boolean;
    attendance_required: boolean;
    is_active: boolean;
    sort_order: number;
}

export interface SchedulePeriod {
    id: number;
    school_id: number;
    academic_year_id: number | null;
    event_type_id: number | null;
    name: string;
    period_number: number | null;
    start_time: string;
    end_time: string;
    duration_minutes: number | null;
    is_break: boolean;
    is_active: boolean;
    sort_order: number;
    event_type?: ScheduleEventType;
}
