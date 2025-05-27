import type {Metadata} from 'next';
import { Geist_Mono } from 'next/font/google'; // Using only Geist Mono as per spec
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TypeCraft',
  description: 'Craft your typing skills with adaptive text generation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistMono.variable}>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
