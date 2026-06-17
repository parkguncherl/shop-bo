import { NextRequest, NextResponse } from 'next/server';

const GRAPH_API = 'https://graph.facebook.com/v19.0';
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN!;
const USER_ID = process.env.INSTAGRAM_USER_ID!;

interface PostBody {
  imageUrls: string[]; // 공개 접근 가능한 이미지 URL 목록
  caption: string;
}

/** 단일 이미지 미디어 컨테이너 생성 */
async function createMediaContainer(imageUrl: string, caption?: string): Promise<string> {
  const params = new URLSearchParams({
    image_url: imageUrl,
    access_token: ACCESS_TOKEN,
    ...(caption ? { caption } : {}),
  });

  const res = await fetch(`${GRAPH_API}/${USER_ID}/media`, {
    method: 'POST',
    body: params,
  });
  const data = await res.json();
  if (!data.id) throw new Error(data.error?.message || '미디어 컨테이너 생성 실패');
  return data.id;
}

/** 캐러셀 컨테이너 생성 */
async function createCarouselContainer(itemIds: string[], caption: string): Promise<string> {
  const params = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: itemIds.join(','),
    caption,
    access_token: ACCESS_TOKEN,
  });

  const res = await fetch(`${GRAPH_API}/${USER_ID}/media`, {
    method: 'POST',
    body: params,
  });
  const data = await res.json();
  if (!data.id) throw new Error(data.error?.message || '캐러셀 컨테이너 생성 실패');
  return data.id;
}

/** 미디어 게시 */
async function publishMedia(creationId: string): Promise<string> {
  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: ACCESS_TOKEN,
  });

  const res = await fetch(`${GRAPH_API}/${USER_ID}/media_publish`, {
    method: 'POST',
    body: params,
  });
  const data = await res.json();
  if (!data.id) throw new Error(data.error?.message || '게시 실패');
  return data.id;
}

export async function POST(req: NextRequest) {
  try {
    if (!ACCESS_TOKEN || !USER_ID) {
      return NextResponse.json({ error: 'Instagram 환경변수가 설정되지 않았습니다.' }, { status: 500 });
    }

    const body: PostBody = await req.json();
    const { imageUrls, caption } = body;

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({ error: '게시할 이미지가 없습니다.' }, { status: 400 });
    }

    let creationId: string;

    if (imageUrls.length === 1) {
      // 단일 이미지
      creationId = await createMediaContainer(imageUrls[0], caption);
    } else {
      // 캐러셀 (최대 10장)
      const sliced = imageUrls.slice(0, 10);
      const itemIds = await Promise.all(sliced.map((url) => createMediaContainer(url)));
      creationId = await createCarouselContainer(itemIds, caption);
    }

    const postId = await publishMedia(creationId);
    return NextResponse.json({ success: true, postId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '알 수 없는 오류' }, { status: 500 });
  }
}
