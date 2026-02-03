import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileCheck, AlertCircle, Clock } from 'lucide-react';
import { useScannedUpload } from '@/hooks/useScannedUpload';

interface ScannedUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  signatureId: string;
  documentName: string;
  deadline?: string;
}

export function ScannedUploadDialog({
  isOpen,
  onClose,
  documentId,
  signatureId,
  documentName,
  deadline,
}: ScannedUploadDialogProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const { uploadFile, isLoading, progress } = useScannedUpload();

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: `Only PDF, JPG, and PNG files are allowed. Got: ${file.type}`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: `Maximum file size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    toast({
      title: 'File selected',
      description: `${file.name} (${(file.size / 1024).toFixed(2)}KB)`,
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('🔵 [ScannedUpload] Starting upload:', {
        documentId,
        signatureId,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      });

      await uploadFile({
        file: selectedFile,
        documentId,
        signatureId,
        documentName,
      });

      toast({
        title: 'Upload successful',
        description: 'Scanned document has been uploaded for verification',
      });

      // Reset state
      setSelectedFile(null);
      setPreview(null);
      onClose();
    } catch (error) {
      console.error('❌ [ScannedUpload] Upload failed:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const isDeadlineApproaching =
    deadline && new Date(deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Scanned Original
          </DialogTitle>
          <DialogDescription>
            Upload a scanned copy of the physically signed document for verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Document: {documentName}
            </p>
            {deadline && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className={isDeadlineApproaching ? 'text-orange-600 font-medium' : 'text-slate-600'}>
                  Deadline: {new Date(deadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Requirements Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Requirements:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Must be a scanned copy of the physically signed document</li>
                <li>Accepted formats: PDF, JPG, PNG (max 50MB)</li>
                <li>All signatures must be clearly visible</li>
                <li>Please ensure good image quality for verification</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* File Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-slate-400 transition cursor-pointer bg-slate-50 dark:bg-slate-900/50"
          >
            <input
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              id="scanned-file-input"
              disabled={isLoading}
            />
            <label htmlFor="scanned-file-input" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-8 w-8 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    Drop your scanned document here
                  </p>
                  <p className="text-sm text-slate-500">or click to browse</p>
                </div>
                <p className="text-xs text-slate-400">PDF, JPG, or PNG • Max 50MB</p>
              </div>
            </label>
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              </div>

              {/* Image Preview */}
              {preview && (
                <div className="relative bg-slate-900 rounded-lg overflow-hidden max-h-[300px]">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Uploading...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? `Uploading (${progress}%)...` : 'Upload Scanned Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
