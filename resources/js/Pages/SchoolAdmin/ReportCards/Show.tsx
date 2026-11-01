import { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Check, Send, MessageSquare, Download } from 'lucide-react';
import type { PageProps } from '@/Types';

interface Student { id: number; first_name: string; last_name: string; admission_no: string; student_id: string; }
interface SchoolClass { id: number; name: string; }
interface Section { id: number; name: string; }
interface AcademicTerm { id: number; name: string; }
interface AcademicYear { id: number; name: string; }
interface GradeScale { id: number; grade: string; min_marks: number; max_marks: number; gpa: number; remarks: string; }

interface SubjectScore {
    subject_id: number; subject_name: string; ca_score: number; exam_score: number;
    total_score: number; weighted_score: number; grade: string; gpa: number; remarks: string | null;
}

interface ReportCard {
    id: number; student_id: number; class_id: number; term_id: number; academic_year_id: number;
    total_marks: number; obtained_marks: number; percentage: number; grade: string; gpa: number;
    rank: number | null; status: string; promotion_status: string | null;
    teacher_comment: string | null; form_master_comment: string | null; principal_comment: string | null;
    total_school_days: number; days_present: number; days_absent: number; days_late: number;
    subject_data: SubjectScore[]; created_at: string; updated_at: string;
    student?: Student; schoolClass?: SchoolClass; section?: Section; term?: AcademicTerm; academicYear?: AcademicYear;
}

interface SchoolConfig {
    result_show_position: string;
    result_position_type: string;
    result_show_teacher_comment: boolean;
    result_show_principal_comment: boolean;
    result_show_form_master_comment: boolean;
    result_show_conduct: boolean;
    result_show_behaviour: boolean;
}

const STATUS_STYLE: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    approved: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
};

interface Props extends PageProps { reportCard: ReportCard; gradeScale: GradeScale[]; }

function ordinal(n: number): string {
    const s = ['th','st','nd','rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function ReportCardsShow({ reportCard, gradeScale }: Props) {
    const rc = reportCard;
    const [editComment, setEditComment] = useState<string | null>(null);
    const { schoolConfig } = usePage<any>().props;
    const cfg: SchoolConfig = schoolConfig ?? {
        result_show_position: 'overall', result_position_type: 'rank',
        result_show_teacher_comment: false, result_show_principal_comment: false,
        result_show_form_master_comment: false, result_show_conduct: false, result_show_behaviour: false,
    };

    const showRank = cfg.result_show_position !== 'none';
    const rankDisplay = rc.rank != null
        ? cfg.result_position_type === 'position' ? ordinal(rc.rank) : `#${rc.rank}`
        : '—';

    const commentForm = useForm({
        teacher_comment: rc.teacher_comment ?? '',
        form_master_comment: rc.form_master_comment ?? '',
        principal_comment: rc.principal_comment ?? '',
        promotion_status: rc.promotion_status ?? '',
    });

    const hasCommentFields = cfg.result_show_teacher_comment || cfg.result_show_form_master_comment || cfg.result_show_principal_comment;

    function saveComment(field: string) {
        commentForm.put(`/school/report-cards/${rc.id}/comments`, {
            preserveScroll: true,
            onSuccess: () => setEditComment(null),
        });
    }

    const attendanceRate = rc.total_school_days > 0 ? ((rc.days_present / rc.total_school_days) * 100).toFixed(1) : '—';

    return (
        <AppLayout breadcrumbs={[
            { label: 'Report Cards', href: '/school/report-cards' },
            { label: `${rc.student?.first_name} ${rc.student?.last_name}` },
        ]}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => router.visit('/school/report-cards')}><ArrowLeft className="w-4 h-4" /></Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{rc.student?.first_name} {rc.student?.last_name}</h1>
                            <p className="text-sm text-slate-500">Admission No: {rc.student?.admission_no} — {rc.schoolClass?.name} — {rc.term?.name} {rc.academicYear?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={`${STATUS_STYLE[rc.status]} text-sm px-3 py-1`}>{rc.status}</Badge>
                        <Button variant="outline" size="sm" onClick={() => window.open(`/school/report-cards/${rc.id}/print`, '_blank')}>
                            <Download className="w-4 h-4 mr-1" /> Download PDF
                        </Button>
                    </div>
                </div>

                <div className={`grid gap-4 ${showRank ? 'grid-cols-5' : 'grid-cols-4'}`}>
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-indigo-600">{Number(rc.percentage).toFixed(1)}%</p>
                            <p className="text-xs text-slate-500">Overall Score</p>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-purple-600">{rc.gpa != null ? Number(rc.gpa).toFixed(2) : '—'}</p>
                            <p className="text-xs text-slate-500">GPA</p>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-green-600">{rc.grade}</p>
                            <p className="text-xs text-slate-500">Overall Grade</p>
                        </CardContent>
                    </Card>
                    {showRank && (
                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardContent className="p-4 text-center">
                                <p className="text-3xl font-bold text-amber-600">{rankDisplay}</p>
                                <p className="text-xs text-slate-500">Class Rank</p>
                            </CardContent>
                        </Card>
                    )}
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold text-blue-600">{attendanceRate}%</p>
                            <p className="text-xs text-slate-500">Attendance ({rc.days_present}/{rc.total_school_days})</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Subject Scores */}
                <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardHeader><CardTitle className="text-sm font-semibold">Subject Breakdown</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead className="text-center">CA Score</TableHead>
                                    <TableHead className="text-center">Exam Score</TableHead>
                                    <TableHead className="text-center">Total</TableHead>
                                    <TableHead className="text-center">Weighted</TableHead>
                                    <TableHead className="text-center">Grade</TableHead>
                                    <TableHead className="text-center">GPA</TableHead>
                                    <TableHead>Remarks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rc.subject_data.map((sub, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{sub.subject_name}</TableCell>
                                        <TableCell className="text-center">{sub.ca_score}</TableCell>
                                        <TableCell className="text-center">{sub.exam_score}</TableCell>
                                        <TableCell className="text-center">{sub.total_score}</TableCell>
                                        <TableCell className="text-center font-medium">{Number(sub.weighted_score).toFixed(1)}</TableCell>
                                        <TableCell className="text-center"><Badge>{sub.grade}</Badge></TableCell>
                                        <TableCell className="text-center">{Number(sub.gpa).toFixed(2)}</TableCell>
                                        <TableCell className="text-sm text-slate-500">{sub.remarks ?? '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Comments Section */}
                <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Remarks & Comments</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            cfg.result_show_teacher_comment     && { field: 'teacher_comment', label: "Class Teacher's Remark" },
                            cfg.result_show_form_master_comment  && { field: 'form_master_comment', label: "Form Master's Remark" },
                            cfg.result_show_principal_comment    && { field: 'principal_comment', label: "Principal's Remark" },
                        ].filter(Boolean).map(({ field, label }: any) => (
                            <div key={field}>
                                <Label className="text-xs text-slate-500">{label}</Label>
                                {editComment === field ? (
                                    <div className="flex gap-2 mt-1">
                                        <Textarea
                                            value={commentForm.data[field as keyof typeof commentForm.data] as string}
                                            onChange={(e) => commentForm.setData(field as 'teacher_comment', e.target.value)}
                                            rows={2}
                                        />
                                        <Button size="sm" onClick={() => saveComment(field)} disabled={commentForm.processing}>Save</Button>
                                        <Button size="sm" variant="outline" onClick={() => setEditComment(null)}>Cancel</Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded px-3 py-2 flex-1">
                                            {(commentForm.data[field as keyof typeof commentForm.data] as string) || '—'}
                                        </p>
                                        <Button size="sm" variant="ghost" onClick={() => setEditComment(field)}>Edit</Button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div>
                            <Label className="text-xs text-slate-500">Promotion Status</Label>
                            {editComment === 'promotion_status' ? (
                                <div className="flex gap-2 mt-1">
                                    <Select value={commentForm.data.promotion_status} onValueChange={(v) => commentForm.setData('promotion_status', v)}>
                                        <SelectTrigger className="w-60"><SelectValue placeholder="Not set" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="promoted">Promoted</SelectItem>
                                            <SelectItem value="retained">Retained</SelectItem>
                                            <SelectItem value="promoted_with_conditions">Promoted with Conditions</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button size="sm" onClick={() => saveComment('promotion_status')} disabled={commentForm.processing}>Save</Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditComment(null)}>Cancel</Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-sm">
                                        {commentForm.data.promotion_status?.replace(/_/g, ' ') || 'Not set'}
                                    </Badge>
                                    <Button size="sm" variant="ghost" onClick={() => setEditComment('promotion_status')}>Edit</Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Grade Scale Reference */}
                {gradeScale.length > 0 && (
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader><CardTitle className="text-sm font-semibold">Grade Scale</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {gradeScale.map((g) => (
                                    <div key={g.id} className="px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 text-sm">
                                        <span className="font-bold">{g.grade}</span> — {g.remarks} ({g.min_marks}–{g.max_marks})
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
