import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, Download, Loader2, AlertCircle } from 'lucide-react';

interface ImportUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: string;
    label: string;
}

export default function ImportUploadDialog({ open, onOpenChange, type, label }: ImportUploadDialogProps) {
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
            if (fileRef.current) {
                fileRef.current.files = e.dataTransfer.files;
            }
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
        if (!selectedFile) return;

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

        router.post(`/school-admin/imports/upload/${type}`, form, {
            forceFormData: true,
            onSuccess: () => {
                onOpenChange(false);
                setSelectedFile(null);
            },
            onError: (errors) => {
                const first = errors.file || errors.message || Object.values(errors)[0];
                setError(typeof first === 'string' ? first : 'Upload failed. Please check the file and try again.');
            },
            onFinish: () => {
                setUploading(false);
            },
        });
    }

    function handleClose() {
        setSelectedFile(null);
        setError(null);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Import {label}</DialogTitle>
                </DialogHeader>

                <a
                    href={`/school-admin/imports/template/${type}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                    <Download className="w-4 h-4" />
                    Download {label} Template
                </a>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragOver ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                    >
                        <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-indigo-500' : 'text-slate-400'}`} />
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
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button type="submit" disabled={uploading || !selectedFile} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploading ? 'Uploading...' : 'Upload & Validate'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
