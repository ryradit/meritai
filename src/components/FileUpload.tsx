"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Not directly used for dropzone, but good for context
import { UploadCloud, FileText, XCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUpload: (fileName: string, dataUri: string) => void;
  acceptedMimeTypes?: string[]; // e.g., ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  maxFileSize?: number; // in bytes
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload,
  acceptedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  maxFileSize = 5 * 1024 * 1024 // 5MB default
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);
    setUploadedFile(null);
    setFilePreview(null);

    if (fileRejections.length > 0) {
      const firstRejection = fileRejections[0];
      const firstError = firstRejection.errors[0];
      let errorMessage = "File upload failed.";
      if (firstError.code === 'file-too-large') {
        errorMessage = `File is too large. Max size is ${maxFileSize / (1024*1024)}MB.`;
      } else if (firstError.code === 'file-invalid-type') {
        errorMessage = `Invalid file type. Accepted types: ${acceptedMimeTypes.join(', ')}.`;
      }
      setError(errorMessage);
      toast({ variant: "destructive", title: "Upload Error", description: errorMessage });
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUri = loadEvent.target?.result as string;
        setFilePreview(dataUri); // Can be used for image previews, not directly for docs
        onFileUpload(file.name, dataUri);
        toast({ title: "File Uploaded", description: `${file.name} has been successfully uploaded.`});
      };
      reader.onerror = () => {
        const loadError = "Failed to read file.";
        setError(loadError);
        toast({ variant: "destructive", title: "Read Error", description: loadError });
      }
      reader.readAsDataURL(file);
    }
  }, [onFileUpload, acceptedMimeTypes, maxFileSize, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}), // Format for react-dropzone
    maxSize: maxFileSize,
    multiple: false,
  });

  const removeFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setError(null);
    onFileUpload("", ""); // Notify parent that file is removed
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/50"}
          ${error ? "border-destructive bg-destructive/10" : ""}
          ${uploadedFile ? "border-green-500 bg-green-500/10" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          {uploadedFile ? (
            <>
              <FileText className="w-12 h-12 text-green-600" />
              <p className="text-sm font-medium text-green-700">File: {uploadedFile.name}</p>
              <p className="text-xs text-muted-foreground">Size: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); removeFile(); }} className="mt-2">
                <XCircle className="mr-2 h-4 w-4" /> Remove File
              </Button>
            </>
          ) : isDragActive ? (
            <>
              <UploadCloud className="w-12 h-12 text-primary animate-pulse" />
              <p className="text-lg font-medium text-primary">Drop your CV here</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop your CV
              </p>
              <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, TXT (Max {maxFileSize / (1024*1024)}MB)</p>
            </>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-destructive flex items-center">
          <XCircle className="mr-1 h-4 w-4" /> {error}
        </p>
      )}
       {!error && uploadedFile && (
        <p className="mt-2 text-sm text-green-600 flex items-center">
          <CheckCircle className="mr-1 h-4 w-4" /> CV ready for submission.
        </p>
      )}
    </div>
  );
};

export default FileUpload;
