import { useState } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Loader2, AlertTriangle, XCircle, FileText, Sparkles } from 'lucide-react';
import type { PageProps } from '@/Types';

interface ImportJob {
    id: number;
    import_type: string;
    file_name: string;
    status: string;
    total_rows: number;
    valid_rows: number;
    error_rows: number;
    imported_rows?: number;
    validation_errors: Record<string, any>;
}

interface PreviewRow {
    [key: string]: any;
}

interface ColumnMapping {
    source_column: string;
    target_field: string | null;
    confidence: number;
    reason: string;
}

interface AiMapping {
    import_type: string;
    columns: string[];
    mappings: ColumnMapping[];
    unmatched_columns: string[];
    missing_required_fields: string[];
    summary: string;
    meta?: Record<string, any>;
}

interface AiStatus {
    feature: string;
    label: string | null;
    enabled: boolean;
    has_credentials: boolean;
    allowed: boolean;
}

interface Props {
    job: ImportJob;
    preview: {
        rows: PreviewRow[];
        summary: Record<string, any>;
        errors: string[];
        grouped: Record<string, any>;
    };
    aiMapping?: AiMapping | null;
    aiStatus?: AiStatus | null;
}

const TYPE_STYLE: Record<string, string> = {
    students: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    parents: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    staff: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
    subjects: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
    curriculum: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
};

export default function BulkImportPreview({ job, preview, aiMapping, aiStatus }: Props) {
    const rows = preview?.rows ?? [];
    const errors = preview?.errors ?? [];
    const grouped = preview?.grouped ?? {};
    const { flash } = usePage<PageProps>().props;
    const [executing, setExecuting] = useState(false);
    const [mapping, setMapping] = useState<AiMapping | null>(aiMapping ?? null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const aiAvailable = !!aiStatus?.enabled && !!aiStatus?.has_credentials && !!aiStatus?.allowed;

    async function suggestMapping() {
        setAiLoading(true);
        setAiError(null);
        try {
            const { data } = await axios.post(`/school-admin/imports/${job.id}/analyze`);
            setMapping(data as AiMapping);
        } catch (err: any) {
            setAiError(err?.response?.data?.error ?? 'Could not analyse this file. Please try again.');
        } finally {
            setAiLoading(false);
        }
    }

    function handleConfirm() {
        if (confirm(`Import ${job.valid_rows} rows? This cannot be undone.`)) {
            setExecuting(true);
            router.post(`/school-admin/imports/execute/${job.id}`, {}, {
                onFinish: () => setExecuting(false),
            });
        }
    }

    const hasErrors = job.error_rows > 0;
    const pct = job.total_rows > 0 ? Math.round((job.imported_rows ?? job.valid_rows) / job.total_rows * 100) : 0;
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    return (
        <AppLayout title="Preview Import">
            <Head title="Preview Import" />
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/school-admin/imports" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <ArrowLeft className="w-4 h-4" /> Imports
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{job.file_name}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                <Badge className={`border-0 text-xs mr-2 ${TYPE_STYLE[job.import_type] ?? ''}`}>
                                    {job.import_type.charAt(0).toUpperCase() + job.import_type.slice(1)}
                                </Badge>
                                Preview & Validation
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/school-admin/imports">
                            <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5">
                                <XCircle className="w-4 h-4" /> Cancel
                            </Button>
                        </Link>
                        {!hasErrors && (
                            <Button onClick={handleConfirm} disabled={executing || job.valid_rows === 0} className="bg-green-600 hover:bg-green-700 text-white inline-flex items-center gap-2">
                                {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                {executing ? 'Importing...' : `Confirm Import (${job.valid_rows})`}
                            </Button>
                        )}
                    </div>
                </div>

                {flash?.success && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400">{flash.success}</div>}
                {flash?.error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">{flash.error}</div>}

                {/* Summary Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{job.valid_rows}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Valid Rows</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{job.error_rows}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Errors</p>
                        </CardContent>
                    </Card>
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{job.total_rows}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Total Rows</p>
                        </CardContent>
                    </Card>
                </div>

                {/* AI Column Mapping */}
                {aiStatus && (
                    <Card className="border-indigo-200 dark:border-indigo-900">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">AI column mapping</p>
                                        <p className="text-xs text-slate-500">Let AI match your file's columns to the import fields.</p>
                                    </div>
                                </div>
                                {aiStatus.allowed && aiStatus.enabled && aiStatus.has_credentials ? (
                                    <Button size="sm" variant="outline" onClick={suggestMapping} disabled={aiLoading} className="inline-flex items-center gap-1.5">
                                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {aiLoading ? 'Analyzing…' : mapping ? 'Re-analyze' : 'Suggest mapping'}
                                    </Button>
                                ) : (
                                    <span className="text-xs text-slate-400">
                                        {!aiStatus.enabled
                                            ? 'AI features are disabled.'
                                            : !aiStatus.has_credentials
                                              ? 'AI is not configured.'
                                              : 'Not available for your role.'}
                                    </span>
                                )}
                            </div>

                            {aiError && (
                                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">{aiError}</div>
                            )}

                            {mapping && (
                                <div className="space-y-2">
                                    {mapping.summary && <p className="text-xs text-slate-500">{mapping.summary}</p>}
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                                    <TableHead className="text-xs">Your column</TableHead>
                                                    <TableHead className="text-xs">Maps to</TableHead>
                                                    <TableHead className="text-xs">Confidence</TableHead>
                                                    <TableHead className="text-xs">Why</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {mapping.mappings.map((m, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300">{m.source_column}</TableCell>
                                                        <TableCell className="text-xs">
                                                            {m.target_field ? (
                                                                <Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400">{m.target_field}</Badge>
                                                            ) : (
                                                                <span className="text-slate-400">Unmatched</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-slate-500">{Math.round((m.confidence ?? 0) * 100)}%</TableCell>
                                                        <TableCell className="text-xs text-slate-500">{m.reason}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {mapping.missing_required_fields?.length > 0 && (
                                        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400">
                                            Required fields not matched: {mapping.missing_required_fields.join(', ')}
                                        </div>
                                    )}
                                    <p className="text-[11px] text-slate-400">Suggestions are saved for review and do not change the import.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5">
                    <div
                        className={`h-2.5 rounded-full transition-all ${hasErrors ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>

                {/* Validation Errors */}
                {hasErrors && errors.length > 0 && (
                    <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 dark:bg-red-950/30 dark:border-red-900">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">Validation Errors ({job.error_rows})</p>
                        </div>
                        <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-500 space-y-0.5 max-h-40 overflow-y-auto">
                            {errors.map((err: string, i: number) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Grouped Preview (Curriculum) */}
                {job.import_type === 'curriculum' && Object.keys(grouped).length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Grouped by Class</h2>
                        {Object.entries(grouped).map(([className, rows]: [string, any]) => (
                            <Card key={className} className="border-slate-200 dark:border-slate-800">
                                <CardContent className="p-4">
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{className}</h3>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                                    {headers.map(h => (
                                                        <TableHead key={h} className="text-xs">{h.replace(/_/g, ' ')}</TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(Array.isArray(rows) ? rows : []).slice(0, 20).map((row: PreviewRow, ri: number) => (
                                                    <TableRow key={ri}>
                                                        {headers.map(h => (
                                                            <TableCell key={h} className="text-xs text-slate-600 dark:text-slate-400">{row[h] ?? '—'}</TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Preview Table */}
                {rows.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Preview (first {Math.min(rows.length, 50)} rows)</h2>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900">
                                        <TableHead className="w-10 text-xs">#</TableHead>
                                        {headers.map(h => (
                                            <TableHead key={h} className="text-xs">{h.replace(/_/g, ' ')}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.slice(0, 50).map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                                            {headers.map(h => (
                                                <TableCell key={h} className="text-xs text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                                                    {row[h] !== null && row[h] !== undefined ? String(row[h]) : <span className="text-slate-300">—</span>}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {rows.length === 0 && (
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="py-16 text-center">
                            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                            <p className="text-sm text-slate-500">No preview data available.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
