import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Eye, CheckCircle2, Loader2, AlertTriangle, FileText, Sparkles, Pencil, Save } from 'lucide-react';
import { Link } from '@inertiajs/react';
import type { PageProps } from '@/Types';

interface DocumentImport {
    id: number; document_type: string; status: string; file_name: string | null;
    file_type: string | null; file_size: number | null; file_path: string;
    extracted_data: Record<string, any> | null;
    extraction_metadata: { model?: string; confidence?: number; field_scores?: Record<string, number>; extracted_at?: string } | null;
    import_results: { imported?: number; skipped?: number; errors?: string[] } | null;
    records_imported: number | null; records_skipped: number | null;
    admin_notes: string | null;
    created_at: string; processed_at: string | null; imported_at: string | null;
    user?: { name: string };
}

interface Props { import: DocumentImport; }

const STATUS_STYLE: Record<string, string> = {
    uploaded: 'bg-blue-100 text-blue-700', processing: 'bg-amber-100 text-amber-700',
    extracted: 'bg-purple-100 text-purple-700', reviewed: 'bg-indigo-100 text-indigo-700',
    imported: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700',
};

const DOC_TYPE_LABELS: Record<string, string> = {
    report_card: 'Report Card', admission_form: 'Admission Form', attendance_register: 'Attendance Register',
    fee_receipt: 'Fee Receipt', certificate: 'Certificate', staff_record: 'Staff Record',
};

function ConfidenceBadge({ score }: { score: number }) {
    if (score >= 0.9) return <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">High ({(score * 100).toFixed(0)}%)</Badge>;
    if (score >= 0.7) return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Medium ({(score * 100).toFixed(0)}%)</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">Low ({(score * 100).toFixed(0)}%)</Badge>;
}

function JsonValueRenderer({ value, path, onEdit }: { value: any; path: string; onEdit: (path: string, value: any) => void }) {
    if (value === null || value === undefined) return <span className="text-slate-300 italic">null</span>;
    if (typeof value === 'boolean') return <span className={value ? 'text-green-600' : 'text-red-500'}>{value ? 'Yes' : 'No'}</span>;
    if (typeof value === 'number') return <span className="font-mono">{value}</span>;
    if (typeof value === 'string') {
        const fieldScore = 0;
        return (
            <div className="flex items-center gap-2">
                <Input value={value} onChange={e => onEdit(path, e.target.value)} className="h-7 text-xs flex-1" />
            </div>
        );
    }
    if (Array.isArray(value)) {
        return (
            <div className="space-y-2 mt-1">
                {value.map((item, idx) => (
                    <div key={idx} className="rounded border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-900">
                        <p className="text-[10px] text-slate-400 mb-1">[{idx}]</p>
                        <JsonValueRenderer value={item} path={`${path}[${idx}]`} onEdit={onEdit} />
                    </div>
                ))}
            </div>
        );
    }
    if (typeof value === 'object') {
        return (
            <div className="space-y-2 mt-1">
                {Object.entries(value).map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-0.5">
                        <p className="text-[10px] text-slate-500 font-medium">{k.replace(/_/g, ' ')}</p>
                        <JsonValueRenderer value={v} path={`${path}.${k}`} onEdit={onEdit} />
                    </div>
                ))}
            </div>
        );
    }
    return <span className="text-xs">{String(value)}</span>;
}

export default function ImportShow({ import: imp }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [editableData, setEditableData] = useState<Record<string, any>>(imp.extracted_data ?? {});
    const [adminNotes, setAdminNotes] = useState(imp.admin_notes ?? '');
    const [editing, setEditing] = useState(false);

    function handleExtract() {
        if (confirm('Run AI extraction on this document?')) {
            router.post(`/school/imports/${imp.id}/extract`);
        }
    }

    function handleSaveEdits() {
        router.put(`/school/imports/${imp.id}/data`, { extracted_data: editableData, admin_notes: adminNotes }, {
            onSuccess: () => setEditing(false),
        });
    }

    function handleImport() {
        if (confirm('Import the reviewed data into the database? This will create/update records.')) {
            router.post(`/school/imports/${imp.id}/import`);
        }
    }

    function handleEdit(path: string, value: any) {
        const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
        setEditableData(prev => {
            const clone = JSON.parse(JSON.stringify(prev));
            let obj = clone;
            for (let i = 0; i < keys.length - 1; i++) {
                if (obj[keys[i]] === undefined) obj[keys[i]] = {};
                obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = value;
            return clone;
        });
    }

    const isUploaded = imp.status === 'uploaded';
    const isExtracted = imp.status === 'extracted' || imp.status === 'reviewed';
    const isImported = imp.status === 'imported';
    const isFailed = imp.status === 'failed';
    const confidence = imp.extraction_metadata?.confidence ?? 0;
    const fieldScores = imp.extraction_metadata?.field_scores ?? {};

    return (
        <AppLayout title={`Import — ${imp.file_name ?? 'Document'}`}>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/school/imports" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <ArrowLeft className="w-4 h-4" /> Imports
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{imp.file_name ?? 'Unknown Document'}</h1>
                            <p className="text-sm text-slate-500">{DOC_TYPE_LABELS[imp.document_type] ?? imp.document_type} · Uploaded by {imp.user?.name ?? 'Unknown'}</p>
                        </div>
                    </div>
                    <Badge className={`border-0 text-sm ${STATUS_STYLE[imp.status] ?? ''}`}>
                        {imp.status.charAt(0).toUpperCase() + imp.status.slice(1)}
                    </Badge>
                </div>

                {flash?.success && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>}
                {flash?.error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{flash.error}</div>}

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                    {isUploaded && (
                        <Button onClick={handleExtract} className="bg-purple-600 hover:bg-purple-700 text-white inline-flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Extract with AI
                        </Button>
                    )}
                    {isExtracted && !editing && (
                        <Button onClick={() => setEditing(true)} variant="outline" className="inline-flex items-center gap-2">
                            <Pencil className="w-4 h-4" /> Edit Extracted Data
                        </Button>
                    )}
                    {editing && (
                        <Button onClick={handleSaveEdits} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save Edits
                        </Button>
                    )}
                    {(isExtracted || imp.status === 'reviewed') && !isImported && (
                        <Button onClick={handleImport} className="bg-green-600 hover:bg-green-700 text-white inline-flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Import Data
                        </Button>
                    )}
                </div>

                {/* Metadata Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-3 text-center">
                            <p className="text-xs text-slate-500">File Type</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{imp.file_type ?? '—'}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-3 text-center">
                            <p className="text-xs text-slate-500">File Size</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{imp.file_size ? `${(imp.file_size / 1024).toFixed(1)} KB` : '—'}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-3 text-center">
                            <p className="text-xs text-slate-500">AI Model</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{imp.extraction_metadata?.model ?? '—'}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-3 text-center">
                            <p className="text-xs text-slate-500">Confidence</p>
                            <div className="mt-1">{confidence > 0 ? <ConfidenceBadge score={confidence} /> : <span className="text-xs text-slate-400">—</span>}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Import Results */}
                {imp.import_results && (
                    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                        <CardContent className="p-4">
                            <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">Import Results</p>
                            <div className="flex gap-4 text-sm">
                                <span className="text-green-700 dark:text-green-400">Imported: <strong>{imp.import_results.imported ?? 0}</strong></span>
                                <span className="text-amber-700 dark:text-amber-400">Skipped: <strong>{imp.import_results.skipped ?? 0}</strong></span>
                                {imp.import_results.errors && imp.import_results.errors.length > 0 && (
                                    <span className="text-red-700 dark:text-red-400">Errors: <strong>{imp.import_results.errors.length}</strong></span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Extraction Preview */}
                {isUploaded && !imp.extracted_data && !isFailed && (
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="py-20 text-center">
                            <Sparkles className="w-12 h-12 mx-auto text-purple-300 mb-3" />
                            <p className="text-slate-500">Click <strong>Extract with AI</strong> to analyze this document.</p>
                        </CardContent>
                    </Card>
                )}

                {isFailed && (
                    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                        <CardContent className="p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Extraction Failed</p>
                                <p className="text-xs text-red-600 dark:text-red-500 mt-1">{imp.admin_notes ?? 'Unknown error occurred.'}</p>
                                <Button size="sm" onClick={handleExtract} className="mt-3 bg-red-600 hover:bg-red-700 text-white text-xs">Retry Extraction</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Extracted Data */}
                {imp.extracted_data && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Extracted Data</h2>
                            {Object.keys(fieldScores).length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {Object.entries(fieldScores).slice(0, 4).map(([field, score]) => (
                                        <div key={field} className="flex items-center gap-1 text-[10px] text-slate-500">
                                            <span>{field.split('.').pop()}</span>
                                            <ConfidenceBadge score={score as number} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardContent className="p-5">
                                <div className="space-y-4">
                                    {Object.entries(editableData).map(([section, data]) => (
                                        <div key={section}>
                                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize mb-2">{section.replace(/_/g, ' ')}</h3>
                                            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900">
                                                <JsonValueRenderer value={data} path={section} onEdit={handleEdit} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Admin Notes */}
                        <div className="space-y-1.5">
                            <Label>Admin Notes</Label>
                            <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} placeholder="Notes about this import (internal only)" />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
