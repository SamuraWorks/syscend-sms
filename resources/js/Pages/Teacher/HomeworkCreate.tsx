import AppLayout from '@/Layouts/AppLayout';
import { router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface ClassRow { id: number; name: string; }
interface SectionRow { id: number; name: string; class_id: number; }
interface Subject { id: number; name: string; class_id: number; }
interface Props {
    linked: boolean; teacher: { full_name: string };
    classes: ClassRow[]; sections: SectionRow[]; subjects: Subject[];
}

export default function HomeworkCreate({ linked, teacher, classes, sections, subjects }: Props) {
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        class_id: '',
        subject_id: '',
        section_id: '',
        due_date: '',
        attachment: null as File | null,
    });

    if (!linked) {
        return (
            <AppLayout title="Create Homework">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">Please contact the school administrator to link your teacher account.</p>
                </div>
            </AppLayout>
        );
    }

    const filteredSubjects = selectedClassId
        ? subjects.filter(s => s.class_id === selectedClassId)
        : [];
    const filteredSections = selectedClassId
        ? sections.filter(s => s.class_id === selectedClassId)
        : [];

    function handleClassChange(value: string) {
        setData('class_id', value);
        setData('subject_id', '');
        setData('section_id', '');
        setSelectedClassId(value ? Number(value) : null);
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        post('/school/teacher/homework/store');
    }

    return (
        <AppLayout title="Create Homework">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => router.visit('/school/teacher/homework')} className="gap-1">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Homework</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Assign new homework as {teacher.full_name}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Homework Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Title *</label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    placeholder="e.g. Chapter 5 Exercise"
                                />
                                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    placeholder="Instructions for students..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Class *</label>
                                    <select
                                        value={data.class_id}
                                        onChange={e => handleClassChange(e.target.value)}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">Select class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {errors.class_id && <p className="text-xs text-red-500 mt-1">{errors.class_id}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Subject *</label>
                                    <select
                                        value={data.subject_id}
                                        onChange={e => setData('subject_id', e.target.value)}
                                        disabled={!selectedClassId}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">{selectedClassId ? 'Select subject' : 'Select class first'}</option>
                                        {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    {errors.subject_id && <p className="text-xs text-red-500 mt-1">{errors.subject_id}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Section (optional)</label>
                                    <select
                                        value={data.section_id}
                                        onChange={e => setData('section_id', e.target.value)}
                                        disabled={!selectedClassId}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    >
                                        <option value="">Select section</option>
                                        {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Due Date *</label>
                                    <input
                                        type="date"
                                        value={data.due_date}
                                        onChange={e => setData('due_date', e.target.value)}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                    {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date}</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Attachment</label>
                                    <input
                                        type="file"
                                        onChange={e => setData('attachment', e.target.files?.[0] ?? null)}
                                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => router.visit('/school/teacher/homework')}>Cancel</Button>
                                <Button type="submit" disabled={processing}>Create Homework</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
