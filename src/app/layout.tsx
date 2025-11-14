// ABOUTME: Root Layout Component - Provides consistent structure for EIP app
// ABOUTME: Includes Tailwind CSS styling and Next.js app router setup

import './globals.css';

export const metadata = {
  title: 'EIP Content Runtime',
  description: 'AI-powered content generation framework with compliance control',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}