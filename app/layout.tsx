import type {Metadata} from 'next';
import { Manrope, Work_Sans } from 'next/font/google';
import './globals.css'; // Global styles

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-headline',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: '三谋配将助手',
  description: '高级策略顾问 - 阵容搭配与分析',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="zh-CN" className={`${manrope.variable} ${workSans.variable}`}>
      <body className="font-body antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
