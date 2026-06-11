import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/AuthContext';

export const metadata: Metadata = {
  title: 'MAGELANGVERSE.ID',
  description: 'Smart Tourism & Digital City Portal Magelang',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
