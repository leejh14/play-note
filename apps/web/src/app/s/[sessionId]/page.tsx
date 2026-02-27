import { redirect } from "next/navigation";

export default async function SessionEntryPage({
  params,
}: {
  readonly params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  redirect(`/s/${sessionId}/detail`);
}
