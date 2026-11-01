import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Archive, Copy, RotateCcw, Eye, Calendar, User, Brain } from 'lucide-react';
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
    front_image_path: string | null;
    back_image_path: string | null;
    ai_confidence_score: number | null;
    ai_extracted_data: Record<string, any> | null;
    template_config: Record<string, any> | null;
    created_at: string;
    approved_at: string | null;
    creator: { name: string } | null;
    approver: { name: string } | null;
    previous_version: { id: number; name: string; version: number } | null;
}

interface Version {
    id: number;
    name: string;
    version: number;
    status: string;
    created_at: string;
    approved_at: string | null;
}

interface Props extends PageProps {
    template: Template;
    versions: Version[];
}

const STATUS_STYLE: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    archived: 'bg-slate-100 text-slate-600',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</span>
            <span className="text-sm text-slate-900 dark:text-white">{value ?? '—'}</span>
        </div>
    );
}

export default function ShowReportCardTemplate({ template, versions }: Props) {
    function handleApprove() {
        router.patch(`/school/report-card-templates/${template.id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Template approved successfully'),
        });
    }

    function handleArchive() {
        router.patch(`/school/report-card-templates/${template.id}/archive`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Template archived successfully'),
        });
    }

    function handleRestore() {
        router.post(`/school/report-card-templates/${template.id}/restore`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Template restored to draft'),
        });
    }

    function handleDuplicate() {
        router.post(`/school/report-card-templates/${template.id}/duplicate`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Template duplicated successfully'),
        });
    }

    const confidenceColor = template.ai_confidence_score != null
        ? template.ai_confidence_score > 0.8 ? 'text-green-600'
            : template.ai_confidence_score > 0.5 ? 'text-yellow-600'
                : 'text-red-600'
        : null;

    const extractedSections = template.ai_extracted_data
        ? Object.keys(template.ai_extracted_data).filter(k => ['layout', 'colors', 'table_structure', 'sections'].includes(k))
        : [];

    return (
        <AppLayout title={`Template — ${template.name}`} breadcrumbs={[
            { label: 'Report Card Templates', href: '/school/report-card-templates' },
            { label: template.name },
        ]}>
            <Head title={`Template — ${template.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/school/report-card-templates" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{template.name}</h1>
                                <Badge className={STATUS_STYLE[template.status] ?? ''}>{template.status}</Badge>
                                {template.is_default && (
                                    <Badge className="bg-indigo-100 text-indigo-700 text-xs">Default Template</Badge>
                                )}
                            </div>
                            {template.description && (
                                <p className="text-sm text-slate-500 mt-0.5">{template.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {template.status === 'draft' && (
                        <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white inline-flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Approve & Activate
                        </Button>
                    )}
                    {template.status === 'active' && (
                        <Button onClick={handleArchive} variant="outline" className="inline-flex items-center gap-2">
                            <Archive className="w-4 h-4" /> Archive
                        </Button>
                    )}
                    {template.status === 'archived' && (
                        <Button onClick={handleRestore} variant="outline" className="inline-flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" /> Restore to Draft
                        </Button>
                    )}
                    <Button onClick={handleDuplicate} variant="outline" className="inline-flex items-center gap-2">
                        <Copy className="w-4 h-4" /> Duplicate
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Eye className="w-4 h-4" /> Template Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {template.front_image_path || template.back_image_path ? (
                                    <div className="space-y-4">
                                        {template.front_image_path && (
                                            <div>
                                                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Front</p>
                                                <img
                                                    src={`/storage/${template.front_image_path}`}
                                                    alt="Template front"
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800"
                                                />
                                            </div>
                                        )}
                                        {template.back_image_path && (
                                            <div>
                                                <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Back</p>
                                                <img
                                                    src={`/storage/${template.back_image_path}`}
                                                    alt="Template back"
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center text-slate-400">
                                        <Eye className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No preview available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">Details</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                                <InfoRow label="Created by" value={template.creator?.name} />
                                <InfoRow
                                    label="Created"
                                    value={new Date(template.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                />
                                <InfoRow label="Version" value={`v${template.version}`} />
                                <InfoRow label="Status" value={template.status} />
                                {template.approved_at && (
                                    <>
                                        <InfoRow label="Approved by" value={template.approver?.name} />
                                        <InfoRow
                                            label="Approved"
                                            value={new Date(template.approved_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        />
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {template.ai_confidence_score != null && (
                            <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Brain className="w-4 h-4" /> AI Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Confidence</span>
                                        <span className={`font-semibold ${confidenceColor}`}>
                                            {template.ai_confidence_score}%
                                        </span>
                                    </div>
                                    {extractedSections.length > 0 && (
                                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            {extractedSections.map((section) => {
                                                const data = template.ai_extracted_data![section];
                                                return (
                                                    <div key={section}>
                                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{section.replace(/_/g, ' ')}</p>
                                                        {typeof data === 'object' && data !== null ? (
                                                            <div className="space-y-1">
                                                                {Object.entries(data).map(([k, v]) => (
                                                                    <div key={k} className="flex justify-between text-xs">
                                                                        <span className="text-slate-500">{k.replace(/_/g, ' ')}</span>
                                                                        <span className="text-slate-900 dark:text-white">{String(v)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-slate-700 dark:text-slate-300">{String(data)}</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">Version History</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm">
                                {versions.length === 0 ? (
                                    <p className="text-xs text-slate-400 py-4 text-center">No versions yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {versions.map((v) => (
                                            <div
                                                key={v.id}
                                                className={`flex items-center justify-between p-2 rounded-lg ${
                                                    v.version === template.version
                                                        ? 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800'
                                                        : 'bg-slate-50 dark:bg-slate-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-900 dark:text-white">v{v.version}</span>
                                                    <Badge className={`${STATUS_STYLE[v.status] ?? ''} text-[10px]`}>{v.status}</Badge>
                                                    {v.version === template.version && (
                                                        <Badge className="bg-indigo-100 text-indigo-700 text-[10px]">Current</Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(v.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {template.template_config && (
                            <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold">Template Configuration</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3">
                                    {template.template_config.colors && (
                                        <div>
                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Colors</p>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(template.template_config.colors).map(([name, hex]) => (
                                                    <div key={name} className="flex items-center gap-1.5 text-xs">
                                                        <span
                                                            className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700"
                                                            style={{ backgroundColor: String(hex) }}
                                                        />
                                                        <span className="text-slate-600 dark:text-slate-400">{name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {template.template_config.layout && (
                                        <InfoRow label="Layout" value={String(template.template_config.layout)} />
                                    )}
                                    {template.template_config.orientation && (
                                        <InfoRow label="Orientation" value={String(template.template_config.orientation)} />
                                    )}
                                    {template.template_config.sections && Array.isArray(template.template_config.sections) && (
                                        <div>
                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Sections</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {template.template_config.sections.map((s: string, i: number) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
