import { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus, Send, Check, ArrowUpCircle, FileText, GraduationCap,
    Eye, Clock, CheckCircle2, AlertCircle, History, LayoutTemplate,
    Download, Trash2, Filter, XCircle, Printer,
} from 'lucide-react';
import type { PageProps, PaginatedResponse } from '@/Types';

interface Student { id: number; first_name: string; last_name: string; admission_no: string; }
interface SchoolClass { id: number; name: string; }
interface AcademicTerm { id: number; name: string; }
interface AcademicYear { id: number; name: string; is_current: boolean; }

interface ReportCard {
    id: number; student_id: number; class_id: number; term_id: number; academic_year_id: number;
    total_marks: number; obtained_marks: number; percentage: number; grade: string; gpa: number;
    rank: number | null; status: string; promotion_status: string | null;
    total_school_days: number; days_present: number; days_absent: number; days_late: number;
    teacher_comment: string | null; principal_comment: string | null;
    created_at: string; published_at: string | null;
    student?: Student; schoolClass?: SchoolClass; term?: AcademicTerm; academicYear?: AcademicYear;
}

interface Props extends PageProps {
    reportCards: PaginatedResponse<ReportCard>;
    classes: SchoolClass[];
    terms: AcademicTerm[];
    academicYears: AcademicYear[];
    filters: { class_id?: string; term_id?: string; status?: string };
}

const STATUS_STYLE: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    submitted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

type TabId = 'overview' | 'draft' | 'submitted' | 'approved' | 'published' | 'history';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutTemplate },
    { id: 'draft', label: 'Drafts', icon: FileText },
    { id: 'submitted', label: 'Submitted', icon: Send },
    { id: 'approved', label: 'Approved', icon: CheckCircle2 },
    { id: 'published', label: 'Published', icon: Eye },
    { id: 'history', label: 'History', icon: History },
];

export default function ReportCardsIndex({ reportCards, classes, terms, academicYears, filters }: Props) {
    const [activeTab, setActiveTab] = useState<TabId>(
        filters.status ? (filters.status as TabId) : 'overview'
    );
    const [generateOpen, setGenerateOpen] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [promoteOpen, setPromoteOpen] = useState(false);
    const [previewCard, setPreviewCard] = useState<ReportCard | null>(null);
    const [bulkSubmitOpen, setBulkSubmitOpen] = useState(false);
    const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
    const [bulkPrintOpen, setBulkPrintOpen] = useState(false);
    const [unpublishAllOpen, setUnpublishAllOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: string; data: Record<string, string> } | null>(null);

    const genForm = useForm({ class_id: '', term_id: '', academic_year_id: '', section_id: '' });
    const bulkForm = useForm({ class_id: '', term_id: '' });
    const bulkSubmitForm = useForm({ class_id: '', term_id: '' });
    const bulkApproveForm = useForm({ class_id: '', term_id: '' });
    const bulkPrintForm = useForm({ class_id: '', term_id: '', section_id: '' });
    const unpublishAllForm = useForm({ class_id: '', term_id: '' });
    const promoteForm = useForm({ class_id: '', term_id: '', academic_year_id: '', min_gpa: '2.0' });

    function switchTab(tab: TabId) {
        setActiveTab(tab);
        if (tab === 'history') {
            router.get('/school/report-cards/history');
            return;
        }
        const statusFilter = tab === 'overview' ? undefined : tab;
        router.get('/school/report-cards', { ...filters, status: statusFilter }, { preserveScroll: true, preserveState: true });
    }

    function applyFilter(key: string, value: string) {
        const statusFilter = activeTab === 'overview' || activeTab === 'history' ? undefined : activeTab;
        router.get('/school/report-cards', { ...filters, [key]: value || undefined, status: statusFilter }, { preserveScroll: true });
    }

    function executeConfirm() {
        if (!confirmAction) return;
        const actions: Record<string, () => void> = {
            'approve': () => router.patch(`/school/report-cards/${confirmAction!.data.id}/approve`, {}, { onFinish: () => setConfirmAction(null) }),
            'publish': () => router.patch(`/school/report-cards/${confirmAction!.data.id}/publish`, {}, { onFinish: () => setConfirmAction(null) }),
            'submit': () => router.post(`/school/report-cards/${confirmAction!.data.id}/submit`, {}, { onFinish: () => setConfirmAction(null) }),
            'unpublish': () => router.post(`/school/report-cards/${confirmAction!.data.id}/unpublish`, {}, { onFinish: () => setConfirmAction(null) }),
            'bulk-publish': () => bulkForm.post('/school/report-cards/bulk-publish', { onSuccess: () => { setBulkOpen(false); setConfirmAction(null); } }),
            'bulk-submit': () => bulkSubmitForm.post('/school/report-cards/bulk-submit', { onSuccess: () => { setBulkSubmitOpen(false); setConfirmAction(null); } }),
            'bulk-approve': () => bulkApproveForm.post('/school/report-cards/bulk-approve', { onSuccess: () => { setBulkApproveOpen(false); setConfirmAction(null); } }),
            'unpublish-all': () => unpublishAllForm.post('/school/report-cards/unpublish-all', { onSuccess: () => { setUnpublishAllOpen(false); setConfirmAction(null); } }),
            'bulk-print': () => bulkPrintForm.post('/school/report-cards/bulk-print', { onSuccess: () => { setBulkPrintOpen(false); setConfirmAction(null); } }),
            'promote': () => promoteForm.post('/school/report-cards/promote-students', { onSuccess: () => { setPromoteOpen(false); setConfirmAction(null); } }),
        };
        actions[confirmAction.type]?.();
    }

    const draftCount = reportCards.data.filter((r) => r.status === 'draft').length;
    const submittedCount = reportCards.data.filter((r) => r.status === 'submitted').length;
    const approvedCount = reportCards.data.filter((r) => r.status === 'approved').length;
    const publishedCount = reportCards.data.filter((r) => r.status === 'published').length;
    const avgGpa = reportCards.data.length > 0 ? (reportCards.data.reduce((s, r) => s + Number(r.gpa ?? 0), 0) / reportCards.data.length).toFixed(2) : '—';

    const displayData = activeTab === 'overview'
        ? reportCards.data
        : reportCards.data;

    return (
        <AppLayout breadcrumbs={[{ label: 'Report Cards' }]}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Report Card Management</h1>
                        <p className="text-sm text-slate-500">Generate, review, approve and publish student report cards</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => setBulkSubmitOpen(true)}>
                            <Send className="w-4 h-4 mr-1" /> Bulk Submit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
                            <Check className="w-4 h-4 mr-1" /> Bulk Publish
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setUnpublishAllOpen(true)}>
                            <XCircle className="w-4 h-4 mr-1" /> Unpublish All
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setBulkPrintOpen(true)}>
                            <Printer className="w-4 h-4 mr-1" /> Bulk Print
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPromoteOpen(true)}>
                            <ArrowUpCircle className="w-4 h-4 mr-1" /> Promote
                        </Button>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setGenerateOpen(true)}>
                            <Plus className="w-4 h-4 mr-1" /> Generate Reports
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="flex items-center gap-3 p-3">
                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950"><FileText className="w-4 h-4 text-indigo-600" /></div>
                            <div><p className="text-lg font-bold">{reportCards.meta.total}</p><p className="text-[10px] text-slate-500">Total</p></div>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="flex items-center gap-3 p-3">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800"><Clock className="w-4 h-4 text-slate-500" /></div>
                            <div><p className="text-lg font-bold">{draftCount}</p><p className="text-[10px] text-slate-500">Drafts</p></div>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="flex items-center gap-3 p-3">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950"><AlertCircle className="w-4 h-4 text-amber-600" /></div>
                            <div><p className="text-lg font-bold">{submittedCount}</p><p className="text-[10px] text-slate-500">Submitted</p></div>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="flex items-center gap-3 p-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950"><Check className="w-4 h-4 text-blue-600" /></div>
                            <div><p className="text-lg font-bold">{approvedCount}</p><p className="text-[10px] text-slate-500">Approved</p></div>
                        </CardContent>
                    </Card>
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="flex items-center gap-3 p-3">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950"><GraduationCap className="w-4 h-4 text-green-600" /></div>
                            <div><p className="text-lg font-bold">{publishedCount}</p><p className="text-[10px] text-slate-500">Published</p></div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-800">
                    <div className="flex gap-1 overflow-x-auto">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const count = tab.id === 'draft' ? draftCount : tab.id === 'submitted' ? submittedCount : tab.id === 'approved' ? approvedCount : tab.id === 'published' ? publishedCount : undefined;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => switchTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                    {count !== undefined && (
                                        <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
                                            activeTab === tab.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                        }`}>{count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <Select value={filters.class_id ?? 'all'} onValueChange={(v) => applyFilter('class_id', v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Classes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.term_id ?? 'all'} onValueChange={(v) => applyFilter('term_id', v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Terms" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Terms</SelectItem>
                            {terms.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900">
                                <TableHead>Student</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Term</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>GPA</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Attendance</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12 text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="w-8 h-8 text-slate-300" />
                                            <p className="text-sm">No report cards found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : displayData.map((rc) => (
                                <TableRow key={rc.id}>
                                    <TableCell className="font-medium text-sm">{rc.student?.first_name} {rc.student?.last_name}</TableCell>
                                    <TableCell className="text-sm">{rc.schoolClass?.name}</TableCell>
                                    <TableCell className="text-sm">{rc.term?.name}</TableCell>
                                    <TableCell className="text-sm">{Number(rc.percentage).toFixed(1)}%</TableCell>
                                    <TableCell className="text-sm">{rc.gpa != null ? Number(rc.gpa).toFixed(2) : '—'}</TableCell>
                                    <TableCell><Badge variant="outline" className="text-xs">{rc.grade}</Badge></TableCell>
                                    <TableCell className="text-sm">{rc.total_school_days > 0 ? `${rc.days_present}/${rc.total_school_days}` : '—'}</TableCell>
                                    <TableCell><Badge className={`border-0 text-xs ${STATUS_STYLE[rc.status] ?? ''}`}>{rc.status}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPreviewCard(rc)}>
                                                <Eye className="w-3 h-3 mr-1" /> View
                                            </Button>
                                            {rc.status === 'draft' && (
                                                <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-600" onClick={() => setConfirmAction({ type: 'submit', data: { id: String(rc.id) } })}>
                                                    Submit
                                                </Button>
                                            )}
                                            {rc.status === 'submitted' && (
                                                <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600" onClick={() => setConfirmAction({ type: 'approve', data: { id: String(rc.id) } })}>
                                                    Approve
                                                </Button>
                                            )}
                                            {rc.status === 'approved' && (
                                                <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600" onClick={() => setConfirmAction({ type: 'publish', data: { id: String(rc.id) } })}>
                                                    Publish
                                                </Button>
                                            )}
                                            {rc.status === 'published' && (
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => router.visit(`/school/report-cards/${rc.id}/print`)}>
                                                        <Download className="w-3 h-3 mr-1" /> PDF
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => setConfirmAction({ type: 'unpublish', data: { id: String(rc.id) } })}>
                                                        Unpublish
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {reportCards.meta && reportCards.meta.last_page > 1 && (
                        <div className="flex justify-between items-center px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-500">Page {reportCards.meta.current_page} of {reportCards.meta.last_page}</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!reportCards.links.prev} onClick={() => reportCards.links.prev && router.visit(reportCards.links.prev)}>Previous</Button>
                                <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!reportCards.links.next} onClick={() => reportCards.links.next && router.visit(reportCards.links.next)}>Next</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={!!previewCard} onOpenChange={() => setPreviewCard(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Report Card Preview</DialogTitle>
                    </DialogHeader>
                    {previewCard && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-slate-500">Student:</span> <span className="font-medium">{previewCard.student?.first_name} {previewCard.student?.last_name}</span></div>
                                <div><span className="text-slate-500">Admission No:</span> <span className="font-medium">{previewCard.student?.admission_no}</span></div>
                                <div><span className="text-slate-500">Class:</span> <span className="font-medium">{previewCard.schoolClass?.name}</span></div>
                                <div><span className="text-slate-500">Term:</span> <span className="font-medium">{previewCard.term?.name}</span></div>
                                <div><span className="text-slate-500">Percentage:</span> <span className="font-medium">{Number(previewCard.percentage).toFixed(1)}%</span></div>
                                <div><span className="text-slate-500">GPA:</span> <span className="font-medium">{previewCard.gpa != null ? Number(previewCard.gpa).toFixed(2) : '—'}</span></div>
                                <div><span className="text-slate-500">Grade:</span> <Badge variant="outline">{previewCard.grade}</Badge></div>
                                <div><span className="text-slate-500">Rank:</span> <span className="font-medium">{previewCard.rank ?? '—'}</span></div>
                            </div>
                            <div className="border-t pt-3">
                                <p className="text-xs text-slate-500 mb-1">Attendance</p>
                                <div className="flex gap-4 text-sm">
                                    <span>Present: <strong>{previewCard.days_present}</strong></span>
                                    <span>Absent: <strong>{previewCard.days_absent}</strong></span>
                                    <span>Late: <strong>{previewCard.days_late}</strong></span>
                                    <span>Total Days: <strong>{previewCard.total_school_days}</strong></span>
                                </div>
                            </div>
                            {previewCard.teacher_comment && (
                                <div className="border-t pt-3">
                                    <p className="text-xs text-slate-500 mb-1">Teacher Comment</p>
                                    <p className="text-sm">{previewCard.teacher_comment}</p>
                                </div>
                            )}
                            {previewCard.principal_comment && (
                                <div className="border-t pt-3">
                                    <p className="text-xs text-slate-500 mb-1">Principal Comment</p>
                                    <p className="text-sm">{previewCard.principal_comment}</p>
                                </div>
                            )}
                            {previewCard.promotion_status && (
                                <div className="border-t pt-3">
                                    <p className="text-xs text-slate-500 mb-1">Promotion Status</p>
                                    <Badge variant="outline">{previewCard.promotion_status}</Badge>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewCard(null)}>Close</Button>
                        {previewCard && (
                            <Button onClick={() => router.visit(`/school/report-cards/${previewCard.id}`)}>
                                View Full Report Card
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Generate Dialog */}
            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Generate Report Cards</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">Generate report cards for all active students in a class. Existing report cards will be updated.</p>
                    <form onSubmit={(e) => { e.preventDefault(); genForm.post('/school/report-cards/generate', { onSuccess: () => { genForm.reset(); setGenerateOpen(false); } }); }} className="space-y-4">
                        <div>
                            <Label>Class *</Label>
                            <Select value={genForm.data.class_id} onValueChange={(v) => genForm.setData('class_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Term *</Label>
                            <Select value={genForm.data.term_id} onValueChange={(v) => genForm.setData('term_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                                <SelectContent>{terms.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Academic Year *</Label>
                            <Select value={genForm.data.academic_year_id} onValueChange={(v) => genForm.setData('academic_year_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                <SelectContent>{academicYears.map((y) => <SelectItem key={y.id} value={String(y.id)}>{y.name}{y.is_current ? ' (Current)' : ''}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={genForm.processing}>{genForm.processing ? 'Generating...' : 'Generate'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Publish Dialog */}
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Bulk Publish Report Cards</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">Publish all <strong>approved</strong> report cards for a class and term. Parents will be notified.</p>
                    <form onSubmit={(e) => { e.preventDefault(); setConfirmAction({ type: 'bulk-publish', data: bulkForm.data as Record<string, string> }); }} className="space-y-4">
                        <div>
                            <Label>Class *</Label>
                            <Select value={bulkForm.data.class_id} onValueChange={(v) => bulkForm.setData('class_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Term *</Label>
                            <Select value={bulkForm.data.term_id} onValueChange={(v) => bulkForm.setData('term_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                                <SelectContent>{terms.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Publish All</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Promote Students Dialog */}
            <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Promote Students</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">Students with GPA ≥ minimum will be promoted to the next class. Others will be retained. This action runs on <strong>published</strong> report cards only.</p>
                    <form onSubmit={(e) => { e.preventDefault(); setConfirmAction({ type: 'promote', data: promoteForm.data as Record<string, string> }); }} className="space-y-4">
                        <div>
                            <Label>Class *</Label>
                            <Select value={promoteForm.data.class_id} onValueChange={(v) => promoteForm.setData('class_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Term *</Label>
                            <Select value={promoteForm.data.term_id} onValueChange={(v) => promoteForm.setData('term_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                                <SelectContent>{terms.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Academic Year *</Label>
                            <Select value={promoteForm.data.academic_year_id} onValueChange={(v) => promoteForm.setData('academic_year_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                <SelectContent>{academicYears.map((y) => <SelectItem key={y.id} value={String(y.id)}>{y.name}{y.is_current ? ' (Current)' : ''}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setPromoteOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Promote Students</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Submit Dialog */}
            <Dialog open={bulkSubmitOpen} onOpenChange={setBulkSubmitOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Bulk Submit Report Cards</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">Submit all <strong>draft</strong> report cards for approval. They will be locked from further editing.</p>
                    <form onSubmit={(e) => { e.preventDefault(); setConfirmAction({ type: 'bulk-submit', data: bulkSubmitForm.data as Record<string, string> }); }} className="space-y-4">
                        <div>
                            <Label>Class *</Label>
                            <Select value={bulkSubmitForm.data.class_id} onValueChange={(v) => bulkSubmitForm.setData('class_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Term *</Label>
                            <Select value={bulkSubmitForm.data.term_id} onValueChange={(v) => bulkSubmitForm.setData('term_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                                <SelectContent>{terms.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setBulkSubmitOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">Submit All</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Unpublish All Dialog */}
            <Dialog open={unpublishAllOpen} onOpenChange={setUnpublishAllOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Unpublish All Report Cards</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">Withdraw all <strong>published</strong> report cards for this class and term. They will revert to approved status and be hidden from parents and students.</p>
                    <form onSubmit={(e) => { e.preventDefault(); setConfirmAction({ type: 'unpublish-all', data: unpublishAllForm.data as Record<string, string> }); }} className="space-y-4">
                        <div>
                            <Label>Class *</Label>
                            <Select value={unpublishAllForm.data.class_id} onValueChange={(v) => unpublishAllForm.setData('class_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Term *</Label>
                            <Select value={unpublishAllForm.data.term_id} onValueChange={(v) => unpublishAllForm.setData('term_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                                <SelectContent>{terms.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setUnpublishAllOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">Unpublish All</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Print Dialog */}
            <Dialog open={bulkPrintOpen} onOpenChange={setBulkPrintOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Bulk Print Report Cards</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">Download a combined PDF of all <strong>published</strong> report cards for a class and term.</p>
                    <form onSubmit={(e) => { e.preventDefault(); setConfirmAction({ type: 'bulk-print', data: bulkPrintForm.data as Record<string, string> }); }} className="space-y-4">
                        <div>
                            <Label>Class *</Label>
                            <Select value={bulkPrintForm.data.class_id} onValueChange={(v) => bulkPrintForm.setData('class_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Term *</Label>
                            <Select value={bulkPrintForm.data.term_id} onValueChange={(v) => bulkPrintForm.setData('term_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                                <SelectContent>{terms.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setBulkPrintOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Printer className="w-4 h-4 mr-1" /> Download PDF</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!confirmAction}
                onOpenChange={() => setConfirmAction(null)}
                title={
                    confirmAction?.type === 'approve' ? 'Approve Report Card'
                    : confirmAction?.type === 'publish' ? 'Publish Report Card'
                    : confirmAction?.type === 'submit' ? 'Submit Report Card'
                    : confirmAction?.type === 'unpublish' ? 'Unpublish Report Card'
                    : confirmAction?.type === 'bulk-publish' ? 'Bulk Publish'
                    : confirmAction?.type === 'bulk-submit' ? 'Bulk Submit'
                    : confirmAction?.type === 'bulk-approve' ? 'Bulk Approve'
                    : confirmAction?.type === 'unpublish-all' ? 'Unpublish All'
                    : confirmAction?.type === 'bulk-print' ? 'Bulk Print'
                    : 'Confirm Promotion'
                }
                description={
                    confirmAction?.type === 'approve' ? 'This will mark the report card as approved and ready to publish.'
                    : confirmAction?.type === 'publish' ? 'This will publish the report card and notify parents.'
                    : confirmAction?.type === 'submit' ? 'This will submit the report card for approval. It will be locked from further editing.'
                    : confirmAction?.type === 'unpublish' ? 'This will withdraw the report card from parents and students. It will revert to approved status.'
                    : confirmAction?.type === 'bulk-publish' ? 'Publish all approved report cards for this class and term? Parents will be notified.'
                    : confirmAction?.type === 'bulk-submit' ? 'Submit all draft report cards for approval? They will be locked from editing.'
                    : confirmAction?.type === 'bulk-approve' ? 'Approve all submitted report cards for this class and term?'
                    : confirmAction?.type === 'unpublish-all' ? 'Withdraw all published report cards? Parents and students will no longer see them.'
                    : confirmAction?.type === 'bulk-print' ? 'Download a combined PDF of all published report cards?'
                    : 'Promote students based on their GPA. This action cannot be undone.'
                }
                confirmText={
                    confirmAction?.type === 'approve' ? 'Approve'
                    : confirmAction?.type === 'publish' ? 'Publish'
                    : confirmAction?.type === 'submit' ? 'Submit'
                    : confirmAction?.type === 'unpublish' ? 'Unpublish'
                    : confirmAction?.type === 'bulk-publish' ? 'Publish All'
                    : confirmAction?.type === 'bulk-submit' ? 'Submit All'
                    : confirmAction?.type === 'bulk-approve' ? 'Approve All'
                    : confirmAction?.type === 'unpublish-all' ? 'Unpublish All'
                    : confirmAction?.type === 'bulk-print' ? 'Download PDF'
                    : 'Promote'
                }
                onConfirm={executeConfirm}
            />
        </AppLayout>
    );
}
