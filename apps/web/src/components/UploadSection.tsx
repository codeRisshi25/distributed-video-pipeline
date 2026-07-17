import { FileUpload } from '@/components/ui/file-upload';
import { useState } from 'react';

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileUpload = (files: File[]) => {
    // TODO: keep this file list in shared form state so the submit handler can read it.
    setFiles(files);
  };

  return (
    <div className="space-y-4">
      <div className="font-heading mx-auto min-h-96 w-full max-w-4xl rounded-lg border border-dashed border-border bg-card">
        <FileUpload onChange={handleFileUpload} />
      </div>
      <div className="flex items-center justify-end gap-3">
        {/* TODO: surface selected file metadata and validation state here. */}
        <p className="text-sm text-muted-foreground">
          {files.length ? `${files.length} file selected` : 'No file selected yet'}
        </p>
      </div>
    </div>
  );
}
