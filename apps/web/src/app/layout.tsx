'use client';

import './globals.css';
import { LanguageProvider } from '../lib/i18n/context';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Jenosize Affiliate Platform</title>
        <meta
          name="description"
          content="Compare prices across Lazada &amp; Shopee. Find the best deals with affiliate tracking."
        />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
