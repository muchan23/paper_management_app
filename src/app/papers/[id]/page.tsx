"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Calendar, User, BookOpen, ExternalLink, Edit, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  doi?: string;
  publicationDate?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
  details?: {
    summary?: string;
    methodology?: string;
    benefits?: string;
    verification?: string;
    discussion?: string;
    tags: string[];
  };
}

interface PaperDetailsPageProps {
  params: {
    id: string;
  };
}

export default function PaperDetailsPage({ params }: PaperDetailsPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPaper();
    }
  }, [status, params.id]);

  const fetchPaper = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/papers/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('論文が見つかりません');
        } else {
          setError('論文の取得に失敗しました');
        }
        return;
      }

      const data = await response.json();
      setPaper(data.paper);
    } catch (error) {
      console.error('Error fetching paper:', error);
      setError('論文の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('この論文を削除しますか？この操作は元に戻せません。')) {
      return;
    }

    try {
      const response = await fetch(`/api/papers/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }

      router.push('/papers');
    } catch (error) {
      console.error('Delete error:', error);
      alert('削除中にエラーが発生しました');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error}
              </h3>
              <Link href="/papers">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  論文一覧に戻る
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!paper) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/papers">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                論文一覧に戻る
              </Button>
            </Link>
            <div className="flex space-x-2">
              <Link href={`/papers/${paper.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </Button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {paper.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>{paper.authors.join(', ')}</span>
            </div>
            {paper.journal && (
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                <span>{paper.journal}</span>
              </div>
            )}
            {paper.publicationDate && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(paper.publicationDate)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paper.abstract && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">概要</h4>
                    <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paper.doi && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">DOI</h4>
                      <p className="text-gray-700">{paper.doi}</p>
                    </div>
                  )}
                  {paper.volume && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">巻</h4>
                      <p className="text-gray-700">{paper.volume}</p>
                    </div>
                  )}
                  {paper.issue && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">号</h4>
                      <p className="text-gray-700">{paper.issue}</p>
                    </div>
                  )}
                  {paper.pages && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">ページ</h4>
                      <p className="text-gray-700">{paper.pages}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI分析結果 */}
            {paper.details && (
              <Card>
                <CardHeader>
                  <CardTitle>AI分析結果</CardTitle>
                  <CardDescription>
                    AIが自動抽出した詳細情報
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paper.details.summary && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">要約</h4>
                      <p className="text-gray-700 leading-relaxed">{paper.details.summary}</p>
                    </div>
                  )}

                  {paper.details.methodology && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">手法・技術</h4>
                      <p className="text-gray-700 leading-relaxed">{paper.details.methodology}</p>
                    </div>
                  )}

                  {paper.details.benefits && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">メリット・利点</h4>
                      <p className="text-gray-700 leading-relaxed">{paper.details.benefits}</p>
                    </div>
                  )}

                  {paper.details.verification && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">検証方法</h4>
                      <p className="text-gray-700 leading-relaxed">{paper.details.verification}</p>
                    </div>
                  )}

                  {paper.details.discussion && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">議論・課題</h4>
                      <p className="text-gray-700 leading-relaxed">{paper.details.discussion}</p>
                    </div>
                  )}

                  {paper.details.tags && paper.details.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">タグ</h4>
                      <div className="flex flex-wrap gap-2">
                        {paper.details.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* PDF表示 */}
            {paper.pdfUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>PDFファイル</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => window.open(paper.pdfUrl, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    PDFを開く
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* メタデータ */}
            <Card>
              <CardHeader>
                <CardTitle>メタデータ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-600">登録日</h4>
                  <p className="text-sm text-gray-900">{formatDate(paper.createdAt)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600">更新日</h4>
                  <p className="text-sm text-gray-900">{formatDate(paper.updatedAt)}</p>
                </div>
                {paper.doi && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600">DOI</h4>
                    <p className="text-sm text-gray-900 break-all">{paper.doi}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* クイックアクション */}
            <Card>
              <CardHeader>
                <CardTitle>クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/papers/${paper.id}/edit`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    情報を編集
                  </Button>
                </Link>
                {paper.pdfUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(paper.pdfUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    PDFを表示
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  論文を削除
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

