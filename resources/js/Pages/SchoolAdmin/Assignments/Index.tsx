import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { UserCog, Plus, Trash2, Users, BookOpen, GraduationCap, ChevronDown, ChevronRight } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { PageProps } from '@/Types';

interface StaffMember {
    id: number;
    first_name: string;
    last_name: string | null;
    emp_id: string;
    teacher_type: string | null;
    form_master_section_id: number | null;
    form_master_class_id: number | null;
}

interface SubjectData {
    id: number;
    name: string;
}

interface SectionData {
    id: number;
    name: string;
}

interface ClassData {
    id: number;
    name: string;
    sections: SectionData[];
}

interface SubjectOffering {
    id: number;
    class_id: number;
    section_id: number | null;
    subject_id: number;
    subject_name: string;
    subject_code: string;
    subject_type: string;
    active_teachers_count: number;
    school_class: { id: number; name: string } | null;
    section: SectionData | null;
    subject: SubjectData | null;
}

interface Assignment {
    id: number;
    staff_id: number;
    subject_offering_id: number;
    academic_year_id: number;
    is_active: boolean;
    staff: { id: number; first_name: string; last_name: string | null; emp_id: string } | null;
    subjectOffering: {
        id: number;
        subject_name: string;
        subject_code: string;
        school_class: { id: number; name: string } | null;
        section: SectionData | null;
        subject: SubjectData | null;
    } | null;
}

interface FormMasterEntry {
    id: number;
    name: string;
    class_id: number;
    form_master_id: number;
    form_master: { id: number; first_name: string; last_name: string | null; emp_id: string } | null;
    school_class: { id: number; name: string } | null;
}

interface AcademicYearData {
    id: number;
    name: string;
    is_current: boolean;
}

interface Props extends PageProps {
    assignments: Assignment[];
    offerings: SubjectOffering[];
    classes: ClassData[];
    staff: StaffMember[];
    academicYears: AcademicYearData[];
    formMasters: FormMasterEntry[];
    filters: { academic_year_id?: string };
}

export default function AssignmentsIndex() {
    const { assignments = [], offerings = [], classes = [], staff = [], academicYears = [], formMasters = [], filters } = usePage<Props>().props;
    const [tab, setTab] = useState<'subjects' | 'form-masters'>('subjects');
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [formMasterDialogOpen, setFormMasterDialogOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedOfferingId, setSelectedOfferingId] = useState<string>('');
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [expandedClasses, setExpandedClasses] = useState<Set<number>>(new Set());

    const currentYear = academicYears.find(y => y.is_current) ?? academicYears[0];

    const filteredOfferings = selectedClassId
        ? offerings.filter(o => o.class_id === Number(selectedClassId))
        : offerings;

    const classOfferings = classes.map(cls => ({
        ...cls,
        offerings: offerings.filter(o => o.class_id === cls.id),
    })).filter(cls => cls.offerings.length > 0);

    const filteredFormMasters = selectedClassId
        ? formMasters.filter(fm => fm.school_class?.id === Number(selectedClassId))
        : formMasters;

    const teachers = staff.filter(s => ['subject_teacher', 'form_master', 'both'].includes(s.teacher_type ?? '') || !s.teacher_type);
    const unassignedTeachers = teachers.filter(t =>
        !assignments.some(a => a.staff_id === t.id && a.is_active)
    );

    function toggleClass(classId: number) {
        setExpandedClasses(prev => {
            const next = new Set(prev);
            if (next.has(classId)) next.delete(classId);
            else next.add(classId);
            return next;
        });
    }

    function handleAssign() {
        if (!selectedStaffId || !selectedOfferingId || !currentYear) return;
        router.post('/school-admin/assignments', {
            staff_id: selectedStaffId,
            subject_offering_id: selectedOfferingId,
            academic_year_id: currentYear.id,
        }, {
            onSuccess: () => {
                setAssignDialogOpen(false);
                setSelectedStaffId('');
                setSelectedOfferingId('');
                setSelectedClassId('');
            },
        });
    }

    function handleBulkAssign() {
        if (!selectedOfferingId || !currentYear) return;
        router.post('/school-admin/assignments/bulk', {
            staff_ids: unassignedTeachers.map(t => t.id),
            subject_offering_id: selectedOfferingId,
            academic_year_id: currentYear.id,
        }, {
            onSuccess: () => {
                setBulkDialogOpen(false);
                setSelectedOfferingId('');
            },
        });
    }

    function handleRemoveAssignment(assignmentId: number) {
        if (!confirm('Remove this teacher assignment?')) return;
        router.delete(`/school-admin/assignments/${assignmentId}`);
    }

    function handleAssignFormMaster() {
        if (!selectedSectionId || !selectedStaffId) return;
        router.post('/school-admin/assignments/form-master', {
            section_id: selectedSectionId,
            staff_id: selectedStaffId,
        }, {
            onSuccess: () => {
                setFormMasterDialogOpen(false);
                setSelectedSectionId('');
                setSelectedStaffId('');
            },
        });
    }

    function handleRemoveFormMaster(sectionId: number) {
        if (!confirm('Remove form master from this section?')) return;
        router.delete(`/school-admin/assignments/form-master/${sectionId}`);
    }

    function getTeachersForOffering(offeringId: number) {
        return assignments.filter(a => a.subject_offering_id === offeringId && a.is_active);
    }

    return (
        <AppLayout breadcrumbs={[{ label: 'Teacher Assignments' }]}>
            <Head title="Teacher Assignments" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Teacher Assignments</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Assign teachers to subjects and form master duties — {currentYear?.name ?? 'No active year'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {tab === 'subjects' && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setBulkDialogOpen(true)} className="inline-flex items-center gap-2">
                                <Users className="w-4 h-4" /> Assign All Unassigned
                            </Button>
                            <Button size="sm" onClick={() => setAssignDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Assign Teacher
                            </Button>
                        </>
                    )}
                    {tab === 'form-masters' && (
                        <Button size="sm" onClick={() => setFormMasterDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Assign Form Master
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setTab('subjects')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        tab === 'subjects'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                >
                    <span className="inline-flex items-center gap-2"><BookOpen className="w-4 h-4" /> Subject Assignments</span>
                </button>
                <button
                    onClick={() => setTab('form-masters')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        tab === 'form-masters'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                >
                    <span className="inline-flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Form Masters</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{assignments.length}</div>
                        <div className="text-sm text-slate-500">Active Assignments</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{formMasters.length}</div>
                        <div className="text-sm text-slate-500">Form Masters</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{staff.length}</div>
                        <div className="text-sm text-slate-500">Total Teachers</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{offerings.length}</div>
                        <div className="text-sm text-slate-500">Subject Offerings</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter by Class */}
            <div className="flex items-center gap-3 mb-4">
                <Label className="text-sm font-medium whitespace-nowrap">Filter by Class:</Label>
                <Select value={selectedClassId || 'all'} onValueChange={v => setSelectedClassId(v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map(cls => (
                            <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Subject Assignments Tab */}
            {tab === 'subjects' && (
                <div className="space-y-3">
                    {classOfferings.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center text-slate-500">
                                No subject offerings found. Set up curriculum first.
                            </CardContent>
                        </Card>
                    )}
                    {classOfferings.map(cls => {
                        const isExpanded = expandedClasses.has(cls.id) || classOfferings.length <= 5;
                        const teacherCount = cls.offerings.reduce(
                            (sum, o) => sum + getTeachersForOffering(o.id).length, 0
                        );
                        return (
                            <Card key={cls.id}>
                                <button
                                    onClick={() => toggleClass(cls.id)}
                                    className="flex items-center justify-between w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-xl transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                        <span className="font-semibold text-slate-900 dark:text-white">{cls.name}</span>
                                        <span className="text-sm text-slate-500">{cls.offerings.length} offerings</span>
                                    </div>
                                    <span className="text-sm text-slate-500">{teacherCount} assigned</span>
                                </button>
                                {isExpanded && (
                                    <div className="border-t border-slate-200 dark:border-slate-800">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400">Subject</th>
                                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400">Section</th>
                                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400">Type</th>
                                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400">Assigned Teachers</th>
                                                    <th className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 w-24">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {cls.offerings.map(offering => {
                                                    const assigned = getTeachersForOffering(offering.id);
                                                    return (
                                                        <tr key={offering.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                            <td className="px-4 py-2.5">
                                                                <div className="font-medium text-slate-900 dark:text-white">{offering.subject_name}</div>
                                                                <div className="text-xs text-slate-400">{offering.subject_code}</div>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{offering.section?.name ?? '—'}</td>
                                                            <td className="px-4 py-2.5">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    offering.subject_type === 'compulsory' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' :
                                                                    offering.subject_type === 'elective' ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' :
                                                                    'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400'
                                                                }`}>
                                                                    {offering.subject_type}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                {assigned.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {assigned.map(a => (
                                                                            <span key={a.id} className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs">
                                                                                {a.staff?.first_name} {a.staff?.last_name}
                                                                                <button onClick={() => handleRemoveAssignment(a.id)} className="ml-0.5 hover:text-red-500">
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 italic text-xs">No teacher assigned</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 text-xs"
                                                                    onClick={() => {
                                                                        setSelectedOfferingId(String(offering.id));
                                                                        setAssignDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Plus className="w-3 h-3 mr-1" /> Add
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Form Masters Tab */}
            {tab === 'form-masters' && (
                <div className="space-y-3">
                    {classes.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-slate-500">
                                No classes found.
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                                            <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Class</th>
                                            <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Section</th>
                                            <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Form Master</th>
                                            <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Emp ID</th>
                                            <th className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 w-24">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {classes.flatMap(cls =>
                                            (cls.sections.length > 0 ? cls.sections : [{ id: 0, name: 'No Section', class_id: cls.id }]).map(section => {
                                                const fm = formMasters.find(f => f.id === section.id);
                                                return (
                                                    <tr key={`${cls.id}-${section.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                        <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{cls.name}</td>
                                                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{section.name}</td>
                                                        <td className="px-4 py-2.5">
                                                            {fm?.form_master ? (
                                                                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-medium">
                                                                    {fm.form_master.first_name} {fm.form_master.last_name}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 italic text-xs">Unassigned</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-slate-500 text-xs">{fm?.form_master?.emp_id ?? '—'}</td>
                                                        <td className="px-4 py-2.5">
                                                            {fm ? (
                                                                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={() => handleRemoveFormMaster(fm.id)}>
                                                                    <Trash2 className="w-3 h-3 mr-1" /> Remove
                                                                </Button>
                                                            ) : (
                                                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                                                                    setSelectedSectionId(String(section.id));
                                                                    setFormMasterDialogOpen(true);
                                                                }}>
                                                                    <Plus className="w-3 h-3 mr-1" /> Assign
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Assign Teacher Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCog className="w-5 h-5" /> Assign Teacher to Subject
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Class</Label>
                            <Select value={selectedClassId || undefined} onValueChange={v => { setSelectedClassId(v); setSelectedOfferingId(''); }}>
                                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                                <SelectContent>
                                    {classes.map(cls => <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Subject Offering</Label>
                            <Select value={selectedOfferingId || undefined} onValueChange={setSelectedOfferingId}>
                                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                                <SelectContent>
                                    {filteredOfferings.map(o => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.subject_name} ({o.subject_code}) {o.section ? `— ${o.section.name}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Teacher</Label>
                            <Select value={selectedStaffId || undefined} onValueChange={setSelectedStaffId}>
                                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.first_name} {t.last_name} ({t.emp_id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssign} disabled={!selectedStaffId || !selectedOfferingId}>Assign</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Assign Dialog */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" /> Assign All Unassigned Teachers
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">
                            This will assign {unassignedTeachers.length} unassigned teacher(s) to a subject offering.
                        </p>
                        <div>
                            <Label>Subject Offering</Label>
                            <Select value={selectedOfferingId || undefined} onValueChange={setSelectedOfferingId}>
                                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                                <SelectContent>
                                    {offerings.map(o => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.subject_name} ({o.subject_code}) — {o.school_class?.name} {o.section ? `/ ${o.section.name}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {unassignedTeachers.length > 0 && (
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                                Teachers to assign: {unassignedTeachers.map(t => t.first_name).join(', ')}
                            </div>
                        )}
                        {unassignedTeachers.length === 0 && (
                            <p className="text-sm text-amber-600">All teachers are already assigned to subjects.</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkAssign} disabled={!selectedOfferingId || unassignedTeachers.length === 0}>
                            Assign All ({unassignedTeachers.length})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Form Master Dialog */}
            <Dialog open={formMasterDialogOpen} onOpenChange={setFormMasterDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" /> Assign Form Master
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Section</Label>
                            <Select value={selectedSectionId || undefined} onValueChange={setSelectedSectionId}>
                                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                                <SelectContent>
                                    {classes.flatMap(cls =>
                                        cls.sections.map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {cls.name} — {s.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Teacher</Label>
                            <Select value={selectedStaffId || undefined} onValueChange={setSelectedStaffId}>
                                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.first_name} {t.last_name} ({t.emp_id})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormMasterDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignFormMaster} disabled={!selectedSectionId || !selectedStaffId}>Assign</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
