import MinistryLayout from '@/Layouts/MinistryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, File, Presentation, BookOpen } from 'lucide-react';

interface DownloadData {
    id: number;
    title: string;
    description?: string;
    category: string;
    file_size: number;
    download_count: number;
    created_at: string;
}

interface Props {
    downloads: DownloadData[];
}

const CATEGORY_ICONS: Record<string, typeof FileText> = {
    policy: FileText,
    curriculum: BookOpen,
    teacher_guide: FileText,
    inspection_form: File,
    template: Presentation,
    circular: FileText,
    report: FileText,
    publication: BookOpen,
};

const CATEGORY_COLORS: Record<string, string> = {
    policy: 'text-primary bg-primary/10',
    curriculum: 'text-emerald-600 bg-emerald-50',
    teacher_guide: 'text-blue-600 bg-blue-50',
    inspection_form: 'text-amber-600 bg-amber-50',
    template: 'text-violet-600 bg-violet-50',
    circular: 'text-sky-600 bg-sky-50',
    report: 'text-rose-600 bg-rose-50',
    publication: 'text-teal-600 bg-teal-50',
};

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function MinistryDownloads({ downloads }: Props) {
    return (
        <MinistryLayout title="Ministry Downloads">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
                        <Download className="w-6 h-6 text-primary" />
                        Documents & Downloads
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Official ministry documents, policies, and resources
                    </p>
                </div>

                {downloads.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Download className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
                            <p className="text-muted-foreground">No documents available yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {downloads.map((dl) => {
                            const Icon = CATEGORY_ICONS[dl.category] ?? FileText;
                            const colorClass = CATEGORY_COLORS[dl.category] ?? 'text-muted-foreground bg-muted';
                            return (
                                <Card key={dl.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2.5 rounded-lg shrink-0 ${colorClass}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-serif font-semibold text-foreground text-sm mb-1">{dl.title}</h3>
                                                {dl.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{dl.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className="text-[10px] capitalize">
                                                        {dl.category.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground">{formatFileSize(dl.file_size)}</span>
                                                    <span className="text-[10px] text-muted-foreground">{dl.download_count} downloads</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </MinistryLayout>
    );
}
