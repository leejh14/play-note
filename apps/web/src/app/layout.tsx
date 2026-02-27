import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "PlayNote",
  description: "PlayNote UI mock (from pencil-new.pen)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pretendard@latest/dist/web/variable/pretendardvariable.css"
        />
      </head>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
