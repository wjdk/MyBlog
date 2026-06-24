import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "我的博客",
  description: "一个自己掌控内容与数据的动态博客",
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
