import Script from "next/script";
import type { Metadata, Viewport } from "next";
import { KAKAO_SDK_URL } from "@/lib/kakao";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlayNote",
  description: "Track your gaming sessions and stats",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <Script src={KAKAO_SDK_URL} strategy="afterInteractive" crossOrigin="anonymous" />
      </head>
      <body className="h-full font-pretendard bg-[var(--bg-page)] text-[var(--text-primary)] antialiased">
        <div className="mx-auto h-full max-w-[430px]">{children}</div>
      </body>
    </html>
  );
}
