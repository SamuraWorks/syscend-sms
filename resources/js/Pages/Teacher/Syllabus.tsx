import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, BookOpen, BarChart3 } from 'lucide-react';

interface SyllabusItem {
    id: number; title: string; class: string | null; subject: string | null;
    academic_year: string | null; completion_percent: number;
    topics: { name: string; covered: boolean }[] | null;
}
interface Props { linked: boolean; teacher: { full_name: string }; syllabi: SyllabusItem[]; }

export default function Syllabus({ linked, teacher, syllabi }: Props) {
    const [expanded, setExpanded] = useState<number | null>(null);

    if (!linked) {
        return (
            <AppLayout title="Syllabus">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">Please contact the school administrator to link your teacher account.</p>
                </div>
            </AppLayout>
        );
    }

    function completionColor(pct: number) {
        if (pct >= 80) return 'bg-green-500';
        if (pct >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    }

    function toggle(id: number) {
        setExpanded(prev => prev === id ? null : id);
    }

    return (
        <AppLayout title="Syllabus">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Syllabus</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Track syllabus completion for {teacher.full_name}</p>
                </div>

                {syllabi.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center text-slate-400">No syllabus items found.</CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {syllabi.map(item => (
                            <Card key={item.id}>
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {item.class && <Badge variant="secondary" className="text-xs">{item.class}</Badge>}
                                                {item.subject && <Badge variant="outline" className="text-xs">{item.subject}</Badge>}
                                                {item.academic_year && <Badge variant="outline" className="text-xs">{item.academic_year}</Badge>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 ml-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn('h-full rounded-full transition-all', completionColor(item.completion_percent))}
                                                        style={{ width: `${item.completion_percent}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-slate-500 w-10 text-right">
                                                    {Number(item.completion_percent).toFixed(0)}%
                                                </span>
                                            </div>
                                            {item.topics && item.topics.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggle(item.id)}
                                                    className="gap-1 text-slate-500"
                                                >
                                                    {expanded === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {expanded === item.id && item.topics && (
                                        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                Topics ({item.topics.filter(t => t.covered).length}/{item.topics.length} covered)
                                            </p>
                                            <div className="space-y-1.5">
                                                {item.topics.map((topic, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm">
                                                        {topic.covered ? (
                                                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                                                        )}
                                                        <span className={cn(
                                                            'flex-1',
                                                            topic.covered
                                                                ? 'text-slate-500 line-through'
                                                                : 'text-slate-700 dark:text-slate-300'
                                                        )}>
                                                            {topic.name}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
