import { FileUpload } from '@/components/ui/file-upload';

interface UploadSectionProps {
  file: File | undefined;
  onFileChange: (file: File | undefined) => void;
}

export default function UploadSection({ file, onFileChange }: UploadSectionProps) {
  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      onFileChange(files[0]);
    } else {
      onFileChange(undefined);
    }
  };

  return (
    <div className="space-y-4">
      <div className="font-heading mx-auto min-h-96 w-full max-w-4xl rounded-lg border border-dashed border-border bg-card">
        <FileUpload onChange={handleFileUpload} />
      </div>
      <div className="flex items-center justify-end gap-3">
        <p className="text-sm text-muted-foreground">
          {file ? `1 file selected: ${file.name}` : 'No file selected yet'}
        </p>
      </div>
    </div>
  );
}
