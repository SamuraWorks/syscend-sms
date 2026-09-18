import { useState, useRef } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Upload, Loader2, GraduationCap, Users, BookOpen, FileSpreadsheet, Download, AlertCircle } from 'lucide-react';
import type { PageProps } from '@/Types';

interface Props {
    importType?: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof GraduationCap; color: string; desc: string; bg: string }> = {
    students: { label: 'Students', icon: GraduationCap, color: 'text-blue-600', bg: 'hover:border-blue-400 dark:hover:border-blue-600', desc: 'Import student records from CSV or Excel' },
    parents: { label: 'Parents', icon: Users, color: 'text-green-600', bg: 'hover:border-green-400 dark:hover:border-green-600', desc: 'Import parent/guardian records' },
    staff: { label: 'Staff', icon: Users, color: 'text-purple-600', bg: 'hover:border-purple-400 dark:hover:border-purple-600', desc: 'Import teacher and staff records' },
    curriculum: { label: 'Curriculum', icon: BookOpen, color: 'text-orange-600', bg: 'hover:border-orange-400 dark:hover:border-orange-600', desc: 'Import classes, subjects, and assignments' },
    timetables: { label: 'Timetables', icon: FileSpreadsheet, color: 'text-amber-600', bg: 'hover:border-amber-400 dark:hover:border-amber-600', desc: 'Import timetable schedules' },
};

export default function BulkImportCreate({ importType }: Props) {
    const { flash } = usePage<PageProps>().props;
    const fileRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            setError(null);
            if (fileRef.current) fileRef.current.files = e.dataTransfer.files;
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files?.[0]) {
            setSelectedFile(e.target.files[0]);
            setError(null);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedFile || !importType) return;

        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File must be under 10MB');
            return;
        }
        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
            setError('Unsupported file type. Please upload CSV or Excel (.xlsx).');
            return;
        }

        setUploading(true);
        setError(null);
        const form = new FormData();
        form.append('file', selectedFile);
        router.post(`/school-admin/imports/upload/${importType}`, form, {
            forceFormData: true,
            onError: (errors) => {
                const first = errors.file || errors.message || Object.values(errors)[0];
                setError(typeof first === 'string' ? first : 'Upload failed. Please check the file and try again.');
            },
            onFinish: () => { setUploading(false); },
        });
    }

    if (!importType) {
        return (
            <AppLayout title="New Bulk Import">
                <Head title="New Bulk Import" />
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Link href="/school-admin/imports" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <ArrowLeft className="w-4 h-4" /> Imports
                        </Link>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Select Import Type</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Choose what you want to import</p>
                    </div>

                    {flash?.error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">{flash.error}</div>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                            const Icon = config.icon;
                            return (
                                <Link key={key} href={`/school-admin/imports/create/${key}`}>
                                    <Card className={`border-2 border-slate-200 dark:border-slate-800 cursor-pointer transition-all ${config.bg}`}>
                                        <CardContent className="p-6 flex items-start gap-4">
                                            <div className={`p-3 rounded-lg bg-slate-100 dark:bg-slate-800 ${config.color}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white">{config.label}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{config.desc}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </AppLayout>
        );
    }

    const config = TYPE_CONFIG[importType] ?? { label: importType, icon: FileSpreadsheet, color: 'text-slate-600', bg: '', desc: '' };

    return (
        <AppLayout title={`Import ${config.label}`}>
            <Head title={`Import ${config.label}`} />
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/school-admin/imports/create" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Import {config.label}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Upload a CSV or Excel file</p>
                    </div>
                </div>

                {flash?.error && <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">{flash.error}</div>}

                <div className="flex items-center gap-3">
                    <a
                        href={`/school-admin/imports/template/${importType}`}
                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                        <Download className="w-4 h-4" />
                        Download {config.label} Template
                    </a>
                    <span className="text-slate-300 dark:text-slate-600">—</span>
                    <span className="text-xs text-slate-400">Get a sample CSV with the correct column headers</span>
                </div>

                <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit}>
                            <div
                                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragOver ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                            >
                                <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-indigo-500' : 'text-slate-400'}`} />
                                {selectedFile ? (
                                    <>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedFile.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB — Ready to upload</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {dragOver ? 'Drop file here' : 'Click to browse or drag and drop'}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">.xlsx or .csv — max 10MB</p>
                                    </>
                                )}
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-3 mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="mt-5 flex justify-end">
                                <Button type="submit" disabled={uploading || !selectedFile} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {uploading ? 'Uploading...' : 'Upload & Validate'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
