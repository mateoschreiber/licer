import { Upload } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  onFiles: (files: FileList) => void;
}

export function FileUploader({ label, onFiles }: FileUploaderProps) {
  return (
    <label className="file-uploader">
      <Upload size={18} />
      <span>{label} (max. 2 MB por archivo)</span>
      <input
        type="file"
        multiple
        onChange={(event) => {
          if (event.target.files) {
            onFiles(event.target.files);
          }
        }}
      />
    </label>
  );
}
