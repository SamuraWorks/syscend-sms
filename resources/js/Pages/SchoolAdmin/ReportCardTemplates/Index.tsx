import { Head, Link, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { FileText, Plus, Eye, CheckCircle, Archive, Copy, Trash2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PageProps } from '@/Types';

interface Template {
    id: number;
    name: string;
    description: string | null;
    status: 'draft' | 'active' | 'archived';
    is_default: boolean;
    version: number;
    ai_confidence_score: number | null;
    front_image_path: string | null;
    created_at: string;
    creator: { name: string } | null;
    approver: { name: string } | null;
}

interface Props extends PageProps {
    templates: {
        data: Template[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

const STATUS_STYLE: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    archived: 'bg-slate-100 text-slate-600',
};

export default function ReportCardTemplatesIndex({ templates }: Props) {
    function handleApprove(id: number) {
        router.patch(`/school/report-card-templates/${id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Template approved successfully'),
        });
    }

    function handleArchive(id: number) {
        router.patch(`/school/report-card-templates/${id}/archive`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Template archived successfully'),
        });
    }

    function handleDuplicate(id: number) {
        router.post(`/school/report-card-templates/${id}/duplicate`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Template duplicated successfully'),
        });
    }

    return (
        <AppLayout breadcrumbs={[{ label: 'Report Card Templates' }]}>
            <Head title="Report Card Templates" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Report Card Templates</h1>
                        <p className="text-sm text-slate-500">Manage your school's report card templates</p>
                    </div>
                    <Link href="/school/report-card-templates/create">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Create Template
                        </Button>
                    </Link>
                </div>

                {templates.data.length === 0 ? (
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <FileText className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm">No templates yet. Create your first report card template.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.data.map((template) => (
                            <Card key={template.id} className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                                            {template.name}
                                            {template.is_default && (
                                                <Badge className="ml-2 bg-indigo-100 text-indigo-700 text-xs">Default</Badge>
                                            )}
                                        </CardTitle>
                                        <Badge className={STATUS_STYLE[template.status] ?? ''}>{template.status}</Badge>
                                    </div>
                                    {template.description && (
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Version</span>
                                            <span className="font-medium text-slate-900 dark:text-white">v{template.version}</span>
                                        </div>
                                        {template.ai_confidence_score != null && (
                                            <div className="flex justify-between">
                                                <span>AI Confidence</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{template.ai_confidence_score}%</span>
                                            </div>
                                        )}
                                        {template.creator && (
                                            <div className="flex justify-between">
                                                <span>Created by</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{template.creator.name}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Created</span>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                {new Date(template.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Link href={`/school/report-card-templates/${template.id}`}>
                                            <Button variant="ghost" size="sm" className="gap-1.5">
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </Button>
                                        </Link>
                                        {template.status === 'draft' && (
                                            <Button variant="ghost" size="sm" className="gap-1.5 text-green-600 hover:text-green-700" onClick={() => handleApprove(template.id)}>
                                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                                            </Button>
                                        )}
                                        {template.status === 'active' && (
                                            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 hover:text-slate-700" onClick={() => handleArchive(template.id)}>
                                                <Archive className="w-3.5 h-3.5" /> Archive
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 hover:text-slate-700" onClick={() => handleDuplicate(template.id)}>
                                            <Copy className="w-3.5 h-3.5" /> Duplicate
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
