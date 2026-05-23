import './globals.css'

export const metadata = {
  title: 'Bible MCP Server',
  description: 'A remote MCP server that gives AI assistants direct access to the KJV Bible.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
