import { Noto_Sans_SC } from 'next/font/google'
import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-sc',
})

export const metadata: Metadata = {
  title: 'DassoShu',
  description: 'Your EPUB reader app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${notoSansSC.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}