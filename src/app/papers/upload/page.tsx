"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, FileText, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/login');
    return null;
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const pdfFiles = Array.from(files).filter(file => 
      file.type === 'application/pdf'
    );

    if (pdfFiles.length !== files.length) {
      alert('PDFファイルのみアップロード可能です');
      return;
    }

    setUploadedFiles(prev => [...prev, ...pdfFiles]);
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/papers', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('アップロードに失敗しました');
        }

        setUploadProgress(((i + 1) / uploadedFiles.length) * 100);
      }

      // アップロード完了後、論文一覧ページにリダイレクト
      router.push('/papers');
    } catch (error) {
      console.error('Upload error:', error);
      alert('アップロード中にエラーが発生しました');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadedFiles([]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            論文アップロード
          </h1>
          <p className="text-gray-600">
            PDFファイルをアップロードして、論文情報を自動抽出します
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* アップロードエリア */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                ファイルアップロード
              </CardTitle>
              <CardDescription>
                PDFファイルをドラッグ&ドロップまたはクリックして選択してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  ファイルをドラッグ&ドロップ
                </p>
                <p className="text-gray-500 mb-4">
                  または
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  ファイルを選択
                </label>
                <p className="text-sm text-gray-500 mt-4">
                  最大50MB、PDF形式のみ対応
                </p>
              </div>
            </CardContent>
          </Card>

          {/* アップロード設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                アップロード設定
              </CardTitle>
              <CardDescription>
                アップロード時の処理設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-extract"
                  defaultChecked
                  className="rounded"
                />
                <label htmlFor="auto-extract" className="text-sm">
                  基本情報を自動抽出
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ai-analysis"
                  defaultChecked
                  className="rounded"
                />
                <label htmlFor="ai-analysis" className="text-sm">
                  AIによる詳細分析
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="doi-resolve"
                  defaultChecked
                  className="rounded"
                />
                <label htmlFor="doi-resolve" className="text-sm">
                  DOI情報の取得
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 選択されたファイル一覧 */}
        {uploadedFiles.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>選択されたファイル</CardTitle>
              <CardDescription>
                {uploadedFiles.length}個のファイルが選択されています
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-red-500 mr-3" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      削除
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setUploadedFiles([])}
                >
                  すべてクリア
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUploading ? 'アップロード中...' : 'アップロード開始'}
                </Button>
              </div>

              {/* 進捗表示 */}
              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">アップロード進捗</span>
                    <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 注意事項 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              注意事項
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• PDFファイルのみアップロード可能です</li>
              <li>• 1ファイルあたり最大50MBまで</li>
              <li>• アップロードには時間がかかる場合があります</li>
              <li>• 著作権のある論文のアップロードは適切な権限がある場合のみ行ってください</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
