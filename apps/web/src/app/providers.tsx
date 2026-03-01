"use client";

import { useMemo } from "react";
import { ApolloProvider } from "@apollo/client";
import { createApolloClient } from "@/lib/graphql/apollo-client";
import { ToastProvider } from "@/components/ui/toast";
import type { ReactNode } from "react";

export function Providers({
  children,
}: {
  readonly children: ReactNode;
}) {
  const client = useMemo(() => createApolloClient(), []);
  return (
    <ApolloProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </ApolloProvider>
  );
}
