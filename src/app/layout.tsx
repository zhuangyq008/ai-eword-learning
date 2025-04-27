import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '智能背单词应用',
  description: '使用AI技术辅助英语单词学习的应用',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen pt-4">
          {children}
        </main>
      </body>
    </html>
  )
}
