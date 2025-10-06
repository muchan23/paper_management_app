import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import pdf from 'pdf-parse';

// ファイルサイズ制限（50MB）
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// アップロードディレクトリの作成
async function ensureUploadDir() {
  const uploadDir = join(process.cwd(), 'uploads', 'papers');
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
}

// PDFから基本情報を抽出
async function extractBasicInfo(pdfBuffer: Buffer): Promise<{
  title: string;
  authors: string[];
  abstract?: string;
  doi?: string;
  publicationDate?: Date;
  journal?: string;
}> {
  try {
    const data = await pdf(pdfBuffer);
    const text = data.text;

    // 基本的な情報抽出（正規表現ベース）
    const title = extractTitle(text);
    const authors = extractAuthors(text);
    const abstract = extractAbstract(text);
    const doi = extractDOI(text);
    const publicationDate = extractPublicationDate(text);
    const journal = extractJournal(text);

    return {
      title: title || 'タイトル不明',
      authors,
      abstract,
      doi,
      publicationDate,
      journal,
    };
  } catch (error) {
    console.error('PDF解析エラー:', error);
    return {
      title: 'タイトル不明',
      authors: [],
    };
  }
}

// タイトル抽出
function extractTitle(text: string): string | null {
  // 最初の数行からタイトルを抽出
  const lines = text.split('\n').slice(0, 10);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 10 && trimmed.length < 200) {
      // 一般的なタイトルパターンをチェック
      if (!trimmed.match(/^\d+\./) && // 番号付きリストでない
          !trimmed.match(/^(abstract|introduction|conclusion)/i) && // セクション名でない
          !trimmed.match(/^[A-Z\s]+$/) && // すべて大文字でない
          trimmed.includes(' ')) { // スペースが含まれている
        return trimmed;
      }
    }
  }
  return null;
}

// 著者抽出
function extractAuthors(text: string): string[] {
  const lines = text.split('\n').slice(0, 20);
  const authors: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // 著者名のパターンを検索
    if (trimmed.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+/) && 
        !trimmed.match(/^(Abstract|Introduction|Conclusion)/i)) {
      authors.push(trimmed);
    }
  }
  
  return authors.slice(0, 5); // 最大5名まで
}

// アブストラクト抽出
function extractAbstract(text: string): string | null {
  const abstractMatch = text.match(/abstract\s*:?\s*(.*?)(?=introduction|1\.|keywords|key\s*words)/is);
  if (abstractMatch) {
    return abstractMatch[1].trim().substring(0, 1000); // 最大1000文字
  }
  return null;
}

// DOI抽出
function extractDOI(text: string): string | null {
  const doiMatch = text.match(/doi\s*:?\s*10\.\d+\/[^\s]+/i);
  return doiMatch ? doiMatch[0].replace(/doi\s*:?\s*/i, '') : null;
}

// 発表日抽出
function extractPublicationDate(text: string): Date | null {
  const datePatterns = [
    /(\d{4})\s*年\s*(\d{1,2})\s*月/,
    /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,
    /(\d{4})\s+(\d{1,2})\s+(\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) || 1;
      const day = parseInt(match[3]) || 1;
      return new Date(year, month - 1, day);
    }
  }
  return null;
}

// ジャーナル名抽出
function extractJournal(text: string): string | null {
  const journalPatterns = [
    /published\s+in\s+([^,]+)/i,
    /journal\s+of\s+([^,]+)/i,
    /proceedings\s+of\s+([^,]+)/i,
  ];

  for (const pattern of journalPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
    }

    // ファイル形式チェック
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDFファイルのみアップロード可能です' }, { status: 400 });
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'ファイルサイズが50MBを超えています' }, { status: 400 });
    }

    // ファイルをバッファに変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // アップロードディレクトリの確保
    const uploadDir = await ensureUploadDir();
    
    // ファイル名の生成（ユニークなID + 元のファイル名）
    const fileId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const fileName = `${fileId}_${file.name}`;
    const filePath = join(uploadDir, fileName);

    // ファイル保存
    await writeFile(filePath, buffer);

    // PDFから基本情報を抽出
    const extractedInfo = await extractBasicInfo(buffer);

    // データベースに保存
    const paper = await prisma.paper.create({
      data: {
        title: extractedInfo.title,
        authors: extractedInfo.authors,
        abstract: extractedInfo.abstract,
        doi: extractedInfo.doi,
        publicationDate: extractedInfo.publicationDate,
        journal: extractedInfo.journal,
        pdfPath: filePath,
        pdfUrl: `/uploads/papers/${fileName}`,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      paper: {
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        doi: paper.doi,
        publicationDate: paper.publicationDate,
        journal: paper.journal,
        pdfUrl: paper.pdfUrl,
        createdAt: paper.createdAt,
      },
    });

  } catch (error) {
    console.error('アップロードエラー:', error);
    return NextResponse.json(
      { error: 'アップロード中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // 検索条件の構築
    const where: any = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { authors: { has: search } },
        { abstract: { contains: search, mode: 'insensitive' } },
        { journal: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 論文一覧を取得
    const papers = await prisma.paper.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        details: true,
      },
    });

    // 総数を取得
    const total = await prisma.paper.count({ where });

    return NextResponse.json({
      papers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('論文一覧取得エラー:', error);
    return NextResponse.json(
      { error: '論文一覧の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
