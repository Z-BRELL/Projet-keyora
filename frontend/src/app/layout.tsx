import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

export const metadata: Metadata = {
  title: { default: 'Keyora — Immobilier', template: '%s | Keyora' },
  description: 'Keyora : la plateforme immobilière qui met en relation vendeurs, acheteurs et agents.',
  keywords: ['immobilier', 'achat', 'vente', 'location', 'Cameroun', 'Yaoundé', 'Douala'],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://keyora.cm',
    siteName: 'Keyora',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
