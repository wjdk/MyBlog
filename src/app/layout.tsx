import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "池鱼的个人博客",
  description: "记录想法、项目和长期积累的个人博客",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
