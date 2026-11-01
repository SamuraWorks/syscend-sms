import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ChevronRight, FileText, Image, FileSpreadsheet } from 'lucide-react';

interface StaffDocument { id: number; title: string; file_type: string; file_size: string; file_url: string; staff_id: number; date: string; }
interface Props { linked: boolean; principal: { full_name: string }; staffDocuments: StaffDocument[]; }

const fileIcons: Record<string, any> = { pdf: FileText, doc: FileText, docx: FileText, xls: FileSpreadsheet, xlsx: FileSpreadsheet, jpg: Image, png: Image, zip: FileText };

export default function Downloads({ linked, staffDocuments }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Downloads">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Download className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Downloads">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Downloads</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Download className="w-5 h-5 text-emerald-500" /> Downloads
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Downloadable resources and documents</p>
                </div>

                {staffDocuments.length === 0 ? (
                    <Card><CardContent className="py-16 text-center"><Download className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-400">No downloads available.</p></CardContent></Card>
                ) : (
                    <div className="space-y-3">
                        {staffDocuments.map(d => {
                            const ext = d.file_type.toLowerCase();
                            const Icon = fileIcons[ext] || FileText;
                            return (
                                <Card key={d.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                            <Icon className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">{d.title}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                                <Badge variant="outline" className="text-[9px] uppercase">{d.file_type}</Badge>
                                                <span>{d.file_size}</span>
                                                <span>·</span>
                                                <span>{d.date}</span>
                                            </div>
                                        </div>
                                        <a href={d.file_url} className="shrink-0 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label={`Download ${d.title}`}>
                                            <Download className="w-4 h-4 text-slate-400 hover:text-emerald-500 transition-colors" />
                                        </a>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
