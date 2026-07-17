import { FileUpload } from '@/components/ui/file-upload';
import { useState } from 'react';

export default function Upload() {
  const [, setFile] = useState<File[]>([]);
  const handleFileUpload = (files: File[]) => {
    setFile(files);
  };
  return (
    <>
      <div className="font-heading w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-card dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
        <FileUpload onChange={handleFileUpload} />
      </div>
    </>
  );
}
