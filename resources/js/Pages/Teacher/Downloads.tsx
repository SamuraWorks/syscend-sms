import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, FolderOpen } from 'lucide-react';

interface Document { id: number; title: string; file_type: string | null; file_size: number | null; file_url: string; date: string; }
interface Props { linked: boolean; teacher: { full_name: string }; documents: Document[]; }

function formatSize(bytes: number | null) {
    if (bytes === null || bytes === undefined) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function typeBadge(type: string | null) {
    if (!type) return null;
    const t = type.toLowerCase();
    if (t === 'pdf') return <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">PDF</Badge>;
    if (['doc', 'docx'].includes(t)) return <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">DOC</Badge>;
    if (['xls', 'xlsx'].includes(t)) return <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">XLS</Badge>;
    if (t === 'jpg' || t === 'jpeg' || t === 'png') return <Badge className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">IMG</Badge>;
    return <Badge className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{type.toUpperCase()}</Badge>;
}

export default function TeacherDownloads({ linked, documents }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Downloads">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <FolderOpen className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Downloads">
            <div className="space-y-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Downloads</h1>

                {documents.length === 0 ? (
                    <Card><CardContent className="py-16 text-center text-slate-400">No documents available.</CardContent></Card>
                ) : (
                    <div className="space-y-3">
                        {documents.map(doc => (
                            <Card key={doc.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                            <FileText className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                                                {typeBadge(doc.file_type)}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                                <span>{formatSize(doc.file_size)}</span>
                                                <span>{doc.date}</span>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
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
