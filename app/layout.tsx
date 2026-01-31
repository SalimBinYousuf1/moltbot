import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Moltbot WebAI - Personal AI Assistant',
  description: 'A web-based AI assistant with real tool functions. Chat, search, analyze, and visualize data.',
  keywords: [
    'AI Assistant',
    'Web Chat',
    'Tool Calling',
    'Search',
    'Claude',
    'GPT',
    'Personal Assistant',
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
