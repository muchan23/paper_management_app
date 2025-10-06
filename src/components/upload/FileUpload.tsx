"use client";

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // MB
  acceptedTypes?: string[];
  className?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 10,
  maxSize = 50,
  acceptedTypes = ['application/pdf'],
  className = '',
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // ファイルサイズチェック
    if (file.size > maxSize * 1024 * 1024) {
      return `ファイルサイズが${maxSize}MBを超えています`;
    }

    // ファイル形式チェック
    if (!acceptedTypes.includes(file.type)) {
      return '対応していないファイル形式です';
    }

    return null;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: 'pending',
        });
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setFiles(prev => {
        const updated = [...prev, ...validFiles];
        // 最大ファイル数制限
        if (updated.length > maxFiles) {
          alert(`最大${maxFiles}ファイルまでアップロード可能です`);
          return updated.slice(0, maxFiles);
        }
        return updated;
      });
    }
  }, [maxFiles, maxSize, acceptedTypes]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
  };

  const handleUpload = () => {
    const fileList = files.map(f => f.file);
    onFilesSelected(fileList);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ドラッグ&ドロップエリア */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragOver ? 'ファイルをドロップしてください' : 'ファイルをドラッグ&ドロップ'}
        </p>
        <p className="text-gray-500 mb-4">または</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
        >
          ファイルを選択
        </Button>
        <p className="text-sm text-gray-500 mt-4">
          最大{maxSize}MB、{acceptedTypes.map(type => type.split('/')[1]).join(', ')}形式のみ対応
        </p>
      </div>

      {/* 選択されたファイル一覧 */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {files.map((fileInfo) => (
                <div
                  key={fileInfo.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="font-medium">{fileInfo.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(fileInfo.file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {fileInfo.status === 'uploading' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${fileInfo.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {fileInfo.progress || 0}%
                        </span>
                      </div>
                    )}
                    {fileInfo.status === 'error' && (
                      <div className="flex items-center text-red-500">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">{fileInfo.error}</span>
                      </div>
                    )}
                    {fileInfo.status === 'success' && (
                      <div className="text-green-500 text-sm">
                        ✓ 完了
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(fileInfo.id)}
                      disabled={fileInfo.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setFiles([])}
              >
                すべてクリア
              </Button>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                アップロード開始 ({files.length}ファイル)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
