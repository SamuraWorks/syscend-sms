import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, BookOpen, Calendar, Users } from 'lucide-react';

interface HWItem {
    id: number; title: string; description: string | null;
    subject: string | null; class: string | null; due_date: string | null;
    is_active: boolean; submissions: number; attachment: string | null;
}
interface ClassRow { id: number; name: string; }
interface Subject { id: number; name: string; class_id: number; }
interface Props {
    linked: boolean; teacher: { full_name: string };
    homework: HWItem[]; classes: ClassRow[]; subjects: Subject[];
}

export default function Homework({ linked, teacher, homework, classes }: Props) {
    const [filterClass, setFilterClass] = useState('all');

    if (!linked) {
        return (
            <AppLayout title="Homework">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">Please contact the school administrator to link your teacher account.</p>
                </div>
            </AppLayout>
        );
    }

    const filtered = filterClass === 'all'
        ? homework
        : homework.filter(h => h.class === classes.find(c => c.id === Number(filterClass))?.name);

    function destroy(id: number) {
        if (confirm('Delete this homework?')) {
            router.delete(`/school/teacher/homework/${id}`);
        }
    }

    return (
        <AppLayout title="Homework">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Homework</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Manage homework assignments for {teacher.full_name}</p>
                    </div>
                    <Button onClick={() => router.visit('/school/teacher/homework/create')} className="gap-2">
                        <Plus className="w-4 h-4" /> Create Homework
                    </Button>
                </div>

                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="w-48">
                                <label className="text-xs font-medium text-slate-500 mb-1 block">Filter by Class</label>
                                <Select value={filterClass} onValueChange={setFilterClass}>
                                    <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All classes</SelectItem>
                                        {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {filtered.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center text-slate-400">No homework found.</CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map(hw => (
                            <Card key={hw.id} className="relative">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base">{hw.title}</CardTitle>
                                        <Badge variant={hw.is_active ? 'default' : 'secondary'} className="shrink-0 ml-2">
                                            {hw.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {hw.subject && (
                                            <Badge variant="outline" className="text-xs">
                                                <BookOpen className="w-3 h-3 mr-1" /> {hw.subject}
                                            </Badge>
                                        )}
                                        {hw.class && (
                                            <Badge variant="secondary" className="text-xs">
                                                <Users className="w-3 h-3 mr-1" /> {hw.class}
                                            </Badge>
                                        )}
                                    </div>
                                    {hw.description && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{hw.description}</p>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'No due date'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" /> {hw.submissions} submission{hw.submissions !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-end pt-1">
                                        <Button size="sm" variant="destructive" onClick={() => destroy(hw.id)} className="gap-1">
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
