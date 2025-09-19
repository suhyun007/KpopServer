import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'K-pop Call Server',
  description: 'K-pop concert and tour schedule API server',
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
