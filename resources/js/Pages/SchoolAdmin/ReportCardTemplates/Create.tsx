import { useState, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Link } from '@inertiajs/react';
import { toast } from 'sonner';
import { Upload, FileText, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
    existingTemplates: { id: number; name: string; status: string; version: number }[];
}

function FileDropZone({
    label,
    required,
    accept,
    file,
    onFile,
    error,
}: {
    label: string;
    required?: boolean;
    accept: string;
    file: File | null;
    onFile: (file: File) => void;
    error?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) onFile(dropped);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0];
        if (selected) onFile(selected);
    }

    const isImage = file?.type.startsWith('image/');

    return (
        <div className="space-y-1.5">
            <Label>
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
                    dragOver
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleChange}
                    className="hidden"
                />
                {file ? (
                    <>
                        {isImage && (
                            <img
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                className="max-h-32 rounded-md object-contain"
                            />
                        )}
                        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <FileText className="w-4 h-4" />
                            {file.name}
                        </div>
                    </>
                ) : (
                    <>
                        <Upload className="w-8 h-8 text-slate-400" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            JPEG, PNG or PDF
                        </p>
                    </>
                )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

export default function CreateReportCardTemplate({ existingTemplates }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        front_image: null as File | null,
        back_image: null as File | null,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/school/report-card-templates', {
            forceFormData: true,
            onSuccess: () => toast.success('Template uploaded!'),
        });
    }

    return (
        <AppLayout title="Upload Report Card Template">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/school/report-card-templates">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Upload Report Card Template
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Upload front and back images or PDFs of your report card template for AI analysis
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1.5">
                                <Label>
                                    Template Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Primary School Report Card"
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-500">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Description</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    placeholder="Optional description or notes about this template"
                                />
                            </div>

                            <FileDropZone
                                label="Front Image / PDF"
                                required
                                accept="image/jpeg,image/png,application/pdf"
                                file={data.front_image}
                                onFile={(file) => setData('front_image', file)}
                                error={errors.front_image}
                            />

                            <FileDropZone
                                label="Back Image / PDF"
                                accept="image/jpeg,image/png,application/pdf"
                                file={data.back_image}
                                onFile={(file) => setData('back_image', file)}
                                error={errors.back_image}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end mt-6">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload & Analyze
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                {existingTemplates.length > 0 && (
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle>Previously Uploaded Templates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800">
                                            <th className="text-left px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">
                                                Name
                                            </th>
                                            <th className="text-left px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">
                                                Status
                                            </th>
                                            <th className="text-left px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">
                                                Version
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {existingTemplates.map((tpl) => (
                                            <tr
                                                key={tpl.id}
                                                className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                                            >
                                                <td className="px-4 py-2.5 text-slate-900 dark:text-white font-medium">
                                                    {tpl.name}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            tpl.status === 'active'
                                                                ? 'bg-green-100 text-green-700'
                                                                : tpl.status === 'draft'
                                                                ? 'bg-slate-100 text-slate-600'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        {tpl.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                                                    v{tpl.version}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    </table>
                                </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
