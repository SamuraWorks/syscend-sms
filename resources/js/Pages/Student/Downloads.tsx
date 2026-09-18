import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, FileImage, FileSpreadsheet, File } from 'lucide-react';

interface Document { id: number; title: string; file_type: string | null; file_size: number | null; file_url: string; date: string; }
interface Props {
    linked: boolean; student: { full_name: string; class: string | null } | null;
    documents: Document[];
}

function formatSize(bytes: number | null) {
    if (bytes == null) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fileIcon(type: string | null) {
    if (!type) return <File className="w-4 h-4 text-slate-500" />;
    const t = type.toLowerCase();
    if (t.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg')) return <FileImage className="w-4 h-4 text-violet-500" />;
    if (t.includes('sheet') || t.includes('excel') || t.includes('csv')) return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
    if (t.includes('word') || t.includes('doc')) return <FileText className="w-4 h-4 text-blue-500" />;
    return <File className="w-4 h-4 text-slate-500" />;
}

export default function Downloads({ linked, student, documents }: Props) {
    if (!linked) {
        return (
            <AppLayout title="My Downloads">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Download className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Downloads">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Downloads</h1>
                    <p className="text-sm text-slate-500">{student?.class}</p>
                </div>

                {documents.length === 0 ? (
                    <Card><CardContent className="py-16 text-center text-slate-400">No documents available for download.</CardContent></Card>
                ) : (
                    <div className="space-y-3">
                        {documents.map(doc => (
                            <Card key={doc.id}>
                                <CardContent className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                            {fileIcon(doc.file_type)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {doc.file_type && <Badge variant="secondary" className="text-[10px] h-4">{doc.file_type}</Badge>}
                                                <span className="text-xs text-slate-400">{formatSize(doc.file_size)}</span>
                                                <span className="text-xs text-slate-400">{doc.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0"
                                    >
                                        <Download className="w-3 h-3" />
                                        Download
                                    </a>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
