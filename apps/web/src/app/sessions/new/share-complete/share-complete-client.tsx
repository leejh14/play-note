"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { PageHeader } from "@/components/layout/page-header";
import { ShareComplete } from "@/components/share/share-complete";
import { TokenRequiredState } from "@/components/auth/token-required-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SESSION_QUERY } from "@/lib/graphql/operations";
import { getGraphqlErrorMessage } from "@/lib/error-messages";
import { tryDecodeSessionId } from "@/lib/relay-id";
import { getShareToken, getToken } from "@/lib/token";
import type { ReactNode } from "react";

type SessionForShareData = {
  readonly session: {
    readonly id: string;
    readonly title: string | null;
    readonly contentType: "LOL" | "FUTSAL";
    readonly startsAt: string;
    readonly status: "SCHEDULED" | "CONFIRMED" | "DONE";
    readonly attendances: Array<{
      readonly status: "ATTENDING" | "UNDECIDED" | "NOT_ATTENDING";
    }>;
  };
};

function ShareCompleteShell({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <PhoneFrame>
      <div className="flex min-h-screen w-full">
        <BottomTabBar mode="side" />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col">
            <PageHeader title="Share Session" backHref="/sessions/new" />
            {children}
          </div>
          <BottomTabBar mode="bottom" />
        </div>
      </div>
    </PhoneFrame>
  );
}

export function ShareCompleteClientPage({
  sessionGlobalId,
}: {
  readonly sessionGlobalId: string | null;
}) {
  const localSessionId = sessionGlobalId ? tryDecodeSessionId(sessionGlobalId) : null;
  const hasToken = Boolean(localSessionId && getToken(localSessionId));
  const shareToken = localSessionId ? getShareToken(localSessionId) : null;

  const sessionQuery = useQuery<SessionForShareData>(SESSION_QUERY, {
    variables: {
      sessionId: sessionGlobalId,
    },
    skip: !sessionGlobalId || !hasToken,
  });

  if (!sessionGlobalId || !localSessionId) {
    return (
      <ShareCompleteShell>
        <div className="flex flex-1 items-center px-[16px] sm:px-[20px] lg:px-[28px]">
          <Card className="w-full border-[var(--pn-border)] px-[16px] py-[18px] text-center">
            <div className="text-[15px] font-[800] text-[var(--pn-text-primary)]">
              세션 정보가 없습니다
            </div>
            <div className="mt-[6px] text-[12px] font-[600] text-[var(--pn-text-muted)]">
              세션 생성 후 다시 시도해주세요.
            </div>
            <Link href="/sessions/new" className="mt-[12px] inline-block">
              <Button className="h-[38px] rounded-[10px] px-[12px] text-[12px]">
                세션 생성으로 이동
              </Button>
            </Link>
          </Card>
        </div>
      </ShareCompleteShell>
    );
  }

  if (!hasToken || !shareToken) {
    return (
      <ShareCompleteShell>
        <div className="flex flex-1 items-center px-[16px] sm:px-[20px] lg:px-[28px]">
          <TokenRequiredState
            title="토큰이 없습니다"
            description="세션을 다시 생성하거나 공유 링크로 입장해주세요."
          />
        </div>
      </ShareCompleteShell>
    );
  }

  if (sessionQuery.error) {
    return (
      <ShareCompleteShell>
        <div className="flex-1 px-[16px] pt-[16px] sm:px-[20px] lg:px-[28px]">
          <div className="rounded-[12px] bg-[var(--pn-bg-card)] px-[12px] py-[12px] text-[12px] font-[600] text-[var(--pn-text-secondary)]">
            {getGraphqlErrorMessage(
              sessionQuery.error.graphQLErrors[0]?.extensions?.code as string | undefined,
            )}
          </div>
        </div>
      </ShareCompleteShell>
    );
  }

  const session = sessionQuery.data?.session;
  if (sessionQuery.loading || !session) {
    return (
      <ShareCompleteShell>
        <div className="flex flex-1 items-center justify-center px-[16px] text-[12px] font-[600] text-[var(--pn-text-muted)] sm:px-[20px] lg:px-[28px]">
          불러오는 중...
        </div>
      </ShareCompleteShell>
    );
  }

  const attendingCount = session.attendances.filter((item) => item.status === "ATTENDING").length;
  const continueHref =
    session.status === "SCHEDULED"
      ? `/s/${encodeURIComponent(session.id)}/setup`
      : `/s/${encodeURIComponent(session.id)}/detail`;

  return (
    <ShareCompleteShell>
      <div className="flex-1 px-[16px] pb-[16px] pt-[10px] sm:px-[20px] lg:px-[28px]">
        <ShareComplete
          sessionId={session.id}
          token={shareToken}
          title={session.title}
          contentType={session.contentType}
          startsAt={session.startsAt}
          attendingCount={attendingCount}
          totalCount={session.attendances.length}
          continueHref={continueHref}
        />
      </div>
    </ShareCompleteShell>
  );
}
