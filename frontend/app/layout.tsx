import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "소명 | 우리 아이 사주로 숨겨진 재능 발견하기",
  description: "밤새 고민하지 마세요. 10,000명 이상의 엄마들이 선택한 프라이빗 사주 분석으로 아이의 타고난 기질과 학습 스타일을 알아보세요. 정통 만세력 기반 사주명리.",
  keywords: ["사주", "아이 사주", "자녀 사주", "사주풀이", "운세", "학부모", "아이 재능", "사주 분석", "명리학"],
  authors: [{ name: "소명" }],
  openGraph: {
    title: "소명 | 나와 아이를 위한 프라이빗 운세 라운지",
    description: "우리 아이, 어떤 사람이 될까요? 천년의 지혜로 발견하는 숨겨진 가능성. 10,000명 이상의 엄마들이 선택했습니다.",
    url: "https://somyung.kr",
    siteName: "소명",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "소명 - 프라이빗 사주 분석",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "소명 | 우리 아이 사주로 숨겨진 재능 발견하기",
    description: "밤새 고민하지 마세요. 천년의 지혜가 당신 곁에 있습니다.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://somyung.kr",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="naver-site-verification" content="placeholder" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
