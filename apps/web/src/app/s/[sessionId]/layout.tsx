import type { Metadata } from "next";
import type { ReactNode } from "react";

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

type SessionPreviewResponse = {
  readonly data?: {
    readonly sessionPreview?: {
      readonly contentType: "LOL" | "FUTSAL";
      readonly title: string | null;
      readonly startsAt: string;
    };
  };
};

function formatDateLabel(startsAt: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(startsAt));
}

function formatTimeLabel(startsAt: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(startsAt));
}

function contentLabel(contentType: "LOL" | "FUTSAL"): string {
  return contentType === "LOL" ? "롤 내전" : "풋살";
}

function thumbnailPath(contentType: "LOL" | "FUTSAL"): string {
  return contentType === "LOL" ? "/images/og-lol.png" : "/images/og-futsal.png";
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;
  const decodedSessionId = decodeURIComponent(sessionId);

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query SessionPreview($sessionId: ID!) {
          sessionPreview(sessionId: $sessionId) {
            contentType
            title
            startsAt
          }
        }
      `,
      variables: {
        sessionId: decodedSessionId,
      },
    }),
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    return {
      title: "PlayNote",
      description: "PlayNote session",
    };
  }

  const result = (await response.json()) as SessionPreviewResponse;
  const preview = result.data?.sessionPreview;
  if (!preview) {
    return {
      title: "PlayNote",
      description: "PlayNote session",
    };
  }

  const title = preview.title || `${contentLabel(preview.contentType)} — ${formatDateLabel(preview.startsAt)}`;
  const description = `${formatTimeLabel(preview.startsAt)} · PlayNote`;
  const imageUrl = thumbnailPath(preview.contentType);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function SessionLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
