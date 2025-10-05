'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileText, Upload, Search, BarChart3, Users, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center py-20">
          <div className="flex justify-center mb-8">
            <FileText className="h-20 w-20 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            論文管理アプリ
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            学術論文を効率的に管理・分析し、研究の生産性を向上させましょう。
            AIを活用した自動情報抽出と高度な検索機能で、論文管理を革新します。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">
                無料で始める
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                ログイン
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            主な機能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Upload className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>PDFアップロード</CardTitle>
                <CardDescription>
                  論文PDFを簡単にアップロードし、自動で基本情報を抽出します
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Search className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>高度な検索</CardTitle>
                <CardDescription>
                  キーワード、著者、分野などで論文を効率的に検索できます
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>AI分析</CardTitle>
                <CardDescription>
                  AIが論文の内容を分析し、概要や技術を自動抽出します
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>論文管理</CardTitle>
                <CardDescription>
                  論文を整理し、タグ付けや分類で効率的に管理できます
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>DOI解決</CardTitle>
                <CardDescription>
                  DOIから論文の詳細情報を自動取得し、被引用数も確認できます
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>エクスポート</CardTitle>
                <CardDescription>
                  BibTeXやCSV形式で論文情報をエクスポートできます
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            今すぐ始めましょう
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            無料でアカウントを作成し、論文管理を効率化しましょう
          </p>
          <Link href="/auth/register">
            <Button size="lg">
              無料アカウントを作成
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
