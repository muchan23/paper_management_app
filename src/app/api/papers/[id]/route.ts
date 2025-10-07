import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 論文を取得
    const paper = await prisma.paper.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        details: true,
      },
    });

    if (!paper) {
      return NextResponse.json({ error: '論文が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      paper: {
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        doi: paper.doi,
        publicationDate: paper.publicationDate,
        journal: paper.journal,
        volume: paper.volume,
        issue: paper.issue,
        pages: paper.pages,
        pdfUrl: paper.pdfUrl,
        createdAt: paper.createdAt,
        updatedAt: paper.updatedAt,
        details: paper.details,
      },
    });

  } catch (error) {
    console.error('論文取得エラー:', error);
    return NextResponse.json(
      { error: '論文の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      authors,
      abstract,
      doi,
      publicationDate,
      journal,
      volume,
      issue,
      pages,
      details,
    } = body;

    // 論文の存在確認
    const existingPaper = await prisma.paper.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingPaper) {
      return NextResponse.json({ error: '論文が見つかりません' }, { status: 404 });
    }

    // 論文情報を更新
    const updatedPaper = await prisma.paper.update({
      where: { id: params.id },
      data: {
        title,
        authors,
        abstract,
        doi,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        journal,
        volume,
        issue,
        pages,
      },
    });

    // 詳細情報も更新（存在する場合）
    if (details) {
      await prisma.paperDetails.upsert({
        where: { paperId: params.id },
        update: {
          summary: details.summary,
          methodology: details.methodology,
          benefits: details.benefits,
          verification: details.verification,
          discussion: details.discussion,
          tags: details.tags || [],
        },
        create: {
          paperId: params.id,
          summary: details.summary,
          methodology: details.methodology,
          benefits: details.benefits,
          verification: details.verification,
          discussion: details.discussion,
          tags: details.tags || [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      paper: updatedPaper,
    });

  } catch (error) {
    console.error('論文更新エラー:', error);
    return NextResponse.json(
      { error: '論文の更新中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 論文の存在確認
    const paper = await prisma.paper.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!paper) {
      return NextResponse.json({ error: '論文が見つかりません' }, { status: 404 });
    }

    // PDFファイルを削除
    if (paper.pdfPath) {
      try {
        await unlink(paper.pdfPath);
      } catch (error) {
        console.error('PDFファイル削除エラー:', error);
        // ファイル削除に失敗してもデータベースからは削除を続行
      }
    }

    // データベースから削除（CASCADEで詳細情報も削除される）
    await prisma.paper.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: '論文が削除されました',
    });

  } catch (error) {
    console.error('論文削除エラー:', error);
    return NextResponse.json(
      { error: '論文の削除中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

