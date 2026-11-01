<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Report Cards — Bulk Print</title>
    @php
        $tc = $templateConfig ?? null;
        $primaryColor = $tc['colors']['primary'] ?? ($school->primary_color ?: '#1e3a5f');
        $secondaryColor = $tc['colors']['secondary'] ?? ($school->secondary_color ?: '#4a5568');
        $headerBg = $tc['colors']['header_bg'] ?? $primaryColor;
        $showAttendance = $tc['sections']['attendance'] ?? true;
        $showGradeScale = $tc['sections']['grade_scale'] ?? true;
        $showSignatures = $tc['sections']['signatures'] ?? true;
        $showStamp = $tc['sections']['stamp'] ?? (!empty($school->official_stamp));
    @endphp
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #1a1a1a; }
        .page { width: 100%; padding: 20px; page-break-after: always; }
        .page:last-child { page-break-after: avoid; }

        .header { text-align: center; border-bottom: 3px solid {{ $primaryColor }}; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { font-size: 18px; color: {{ $primaryColor }}; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px; }
        .header h2 { font-size: 13px; color: #4a5568; font-weight: normal; }
        .header .subtitle { font-size: 11px; color: #718096; margin-top: 4px; }
        .school-motto { font-style: italic; color: #6b7280; font-size: 10px; margin-top: 2px; }
        .flag-bar { height: 4px; background: linear-gradient(to right, #1e8449 33%, #ffffff 33%, #ffffff 66%, #c0392b 66%); margin-bottom: 16px; }

        .info-grid { display: flex; justify-content: space-between; margin-bottom: 14px; padding: 10px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 4px; }
        .info-left, .info-right { width: 48%; }
        .info-row { margin-bottom: 4px; }
        .info-label { font-weight: bold; color: #4a5568; display: inline-block; width: 100px; }
        .info-value { color: #1a1a1a; }

        .section-title { font-size: 12px; font-weight: bold; color: {{ $primaryColor }}; text-transform: uppercase; border-bottom: 2px solid {{ $primaryColor }}; padding-bottom: 3px; margin: 14px 0 8px 0; letter-spacing: 0.5px; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: {{ $headerBg }}; color: #ffffff; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
        td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
        tr:nth-child(even) { background: #f7fafc; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .summary-grid { display: flex; gap: 12px; margin-bottom: 14px; }
        .summary-card { flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; text-align: center; }
        .summary-card .big { font-size: 20px; font-weight: bold; color: {{ $primaryColor }}; }
        .summary-card .label { font-size: 9px; color: #718096; text-transform: uppercase; }

        .grade-a { color: #16a34a; font-weight: bold; }
        .grade-b { color: #2563eb; font-weight: bold; }
        .grade-c { color: #d97706; font-weight: bold; }
        .grade-f { color: #dc2626; font-weight: bold; }

        .comments { margin-bottom: 14px; }
        .comment-box { margin-bottom: 8px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; }
        .comment-label { font-weight: bold; color: #4a5568; font-size: 10px; margin-bottom: 3px; }
        .comment-text { color: #1a1a1a; font-size: 10px; min-height: 18px; }

        .grade-scale { margin-bottom: 14px; }
        .grade-scale table th { font-size: 9px; padding: 4px 6px; }
        .grade-scale table td { font-size: 9px; padding: 3px 6px; }

        .footer { text-align: center; border-top: 2px solid {{ $primaryColor }}; padding-top: 10px; margin-top: 16px; font-size: 9px; color: #718096; }

        .signatures { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 10px; }
        .signature-line { width: 30%; text-align: center; }
        .signature-line .sig-image { max-height: 40px; max-width: 120px; margin-bottom: 2px; }
        .signature-line .line { border-top: 1px solid #1a1a1a; margin-top: 4px; padding-top: 4px; font-size: 9px; color: #4a5568; }

        .stamp-area { text-align: center; margin-top: 10px; }
        .stamp-area .stamp-image { max-height: 70px; max-width: 70px; opacity: 0.85; }

        .promotion-badge { display: inline-block; padding: 3px 10px; border-radius: 3px; font-size: 10px; font-weight: bold; }
        .promoted { background: #dcfce7; color: #166534; }
        .retained { background: #fee2e2; color: #991b1b; }
        .conditions { background: #fef3c7; color: #92400e; }
    </style>
</head>
<body>
    @foreach($reportCards as $rc)
        @php
            $student = $rc->student;
            $schoolClass = $rc->schoolClass;
            $section = $rc->section;
            $term = $rc->term;
            $academicYear = $rc->academicYear;
            $subjectData = $rc->subject_data ?? [];
        @endphp
        <div class="page">
            <div class="header">
                @if(!empty($school->logo) && file_exists(storage_path('app/public/' . $school->logo)))
                    <img src="{{ storage_path('app/public/' . $school->logo) }}" style="height: 60px; margin-bottom: 6px;" alt="School Logo">
                @endif
                <h1>{{ $school->name }}</h1>
                <h2>Student Academic Report Card</h2>
                <div class="subtitle">{{ $academicYear->name }} — {{ $term->name }}</div>
                @if($school->motto)
                    <div class="school-motto">"{{ $school->motto }}"</div>
                @endif
            </div>

            <div class="flag-bar"></div>

            <div class="info-grid">
                <div class="info-left">
                    <div class="info-row"><span class="info-label">Student Name:</span> <span class="info-value">{{ $student->first_name }} {{ $student->last_name }}</span></div>
                    <div class="info-row"><span class="info-label">Admission No:</span> <span class="info-value">{{ $student->admission_no }}</span></div>
                    <div class="info-row"><span class="info-label">Class:</span> <span class="info-value">{{ $schoolClass->name }}</span></div>
                    @if($section)
                        <div class="info-row"><span class="info-label">Section:</span> <span class="info-value">{{ $section->name }}</span></div>
                    @endif
                </div>
                <div class="info-right">
                    <div class="info-row"><span class="info-label">Grade:</span> <span class="info-value" style="font-size:14px; font-weight:bold; color:{{ $primaryColor }};">{{ $rc->grade }}</span></div>
                    <div class="info-row"><span class="info-label">GPA:</span> <span class="info-value" style="font-size:14px; font-weight:bold; color:{{ $primaryColor }};">{{ number_format($rc->gpa, 2) }}</span></div>
                    <div class="info-row"><span class="info-label">Percentage:</span> <span class="info-value">{{ number_format($rc->percentage, 1) }}%</span></div>
                    @if($rc->rank)
                        <div class="info-row"><span class="info-label">Class Rank:</span> <span class="info-value">#{{ $rc->rank }}</span></div>
                    @endif
                    @if($rc->promotion_status)
                        <div class="info-row">
                            <span class="info-label">Status:</span>
                            <span class="promotion-badge {{ $rc->promotion_status === 'promoted' ? 'promoted' : ($rc->promotion_status === 'retained' ? 'retained' : 'conditions') }}">
                                {{ ucfirst(str_replace('_', ' ', $rc->promotion_status)) }}
                            </span>
                        </div>
                    @endif
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <div class="big">{{ number_format($rc->percentage, 1) }}%</div>
                    <div class="label">Overall Score</div>
                </div>
                <div class="summary-card">
                    <div class="big">{{ number_format($rc->gpa, 2) }}</div>
                    <div class="label">GPA</div>
                </div>
                <div class="summary-card">
                    <div class="big">{{ $rc->days_present }}/{{ $rc->total_school_days }}</div>
                    <div class="label">Days Present</div>
                </div>
                <div class="summary-card">
                    <div class="big">{{ $rc->total_school_days > 0 ? round(($rc->days_present / $rc->total_school_days) * 100, 1) : 0 }}%</div>
                    <div class="label">Attendance</div>
                </div>
            </div>

            <div class="section-title">Subject Performance</div>
            <table>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th class="text-center">CA Score</th>
                        <th class="text-center">Exam Score</th>
                        <th class="text-center">Total</th>
                        <th class="text-center">Weighted</th>
                        <th class="text-center">Grade</th>
                        <th class="text-center">GPA</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($subjectData as $subject)
                        <tr>
                            <td><strong>{{ $subject['subject_name'] }}</strong></td>
                            <td class="text-center">{{ $subject['ca_score'] }}</td>
                            <td class="text-center">{{ $subject['exam_score'] }}</td>
                            <td class="text-center">{{ $subject['total_score'] }}</td>
                            <td class="text-center"><strong>{{ number_format($subject['weighted_score'], 1) }}</strong></td>
                            <td class="text-center">
                                @php
                                    $gc = str_starts_with($subject['grade'], 'A') ? 'grade-a' : (str_starts_with($subject['grade'], 'B') ? 'grade-b' : (str_starts_with($subject['grade'], 'C') ? 'grade-c' : 'grade-f'));
                                @endphp
                                <span class="{{ $gc }}">{{ $subject['grade'] }}</span>
                            </td>
                            <td class="text-center">{{ number_format($subject['gpa'], 2) }}</td>
                            <td>{{ $subject['remarks'] ?? '—' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            @if($showAttendance)
            <div class="section-title">Attendance</div>
            <table>
                <thead><tr><th class="text-center">Total Days</th><th class="text-center">Present</th><th class="text-center">Absent</th><th class="text-center">Late</th><th class="text-center">Rate</th></tr></thead>
                <tbody><tr><td class="text-center">{{ $rc->total_school_days }}</td><td class="text-center">{{ $rc->days_present }}</td><td class="text-center">{{ $rc->days_absent }}</td><td class="text-center">{{ $rc->days_late }}</td><td class="text-center"><strong>{{ $rc->total_school_days > 0 ? round(($rc->days_present / $rc->total_school_days) * 100, 1) : 0 }}%</strong></td></tr></tbody>
            </table>
            @endif

            <div class="section-title">Remarks & Comments</div>
            <div class="comments">
                @if($rc->teacher_comment)
                    <div class="comment-box"><div class="comment-label">Class Teacher:</div><div class="comment-text">{{ $rc->teacher_comment }}</div></div>
                @endif
                @if($rc->form_master_comment)
                    <div class="comment-box"><div class="comment-label">Form Master:</div><div class="comment-text">{{ $rc->form_master_comment }}</div></div>
                @endif
                @if($rc->principal_comment)
                    <div class="comment-box"><div class="comment-label">Principal:</div><div class="comment-text">{{ $rc->principal_comment }}</div></div>
                @endif
            </div>

            @if($showGradeScale && !empty($gradeScale) && count($gradeScale) > 0)
                <div class="grade-scale">
                    <div class="section-title">Grade Scale</div>
                    <table>
                        <thead><tr>@foreach($gradeScale as $s)<th class="text-center">{{ $s->grade }}</th>@endforeach</tr></thead>
                        <tbody><tr>@foreach($gradeScale as $s)<td class="text-center">{{ $s->min_marks }}–{{ $s->max_marks }}</td>@endforeach</tr></tbody>
                    </table>
                </div>
            @endif

            @if($showStamp && !empty($school->official_stamp) && file_exists(storage_path('app/public/' . $school->official_stamp)))
                <div class="stamp-area"><img src="{{ storage_path('app/public/' . $school->official_stamp) }}" class="stamp-image" alt="Official Stamp"></div>
            @endif

            @if($showSignatures)
            <div class="signatures">
                <div class="signature-line">
                    @if(!empty($school->official_signature) && file_exists(storage_path('app/public/' . $school->official_signature)))
                        <img src="{{ storage_path('app/public/' . $school->official_signature) }}" class="sig-image" alt="Signature">
                    @endif
                    <div class="line">Class Teacher</div>
                </div>
                <div class="signature-line">
                    @if(!empty($school->official_signature) && file_exists(storage_path('app/public/' . $school->official_signature)))
                        <img src="{{ storage_path('app/public/' . $school->official_signature) }}" class="sig-image" alt="Signature">
                    @endif
                    <div class="line">Principal</div>
                </div>
                <div class="signature-line"><div class="line">Parent/Guardian</div></div>
            </div>
            @endif

            <div class="footer">
                <p>{{ $school->name }}@if($school->address) — {{ $school->address }}@endif</p>
                @if($school->phone)<p>Tel: {{ $school->phone }}@if($school->email) | Email: {{ $school->email }}@endif</p>@endif
                <p style="margin-top: 4px;">Generated on {{ now()->format('d M Y \a\t h:i A') }} — Syscend Campus</p>
            </div>
        </div>
    @endforeach
</body>
</html>
