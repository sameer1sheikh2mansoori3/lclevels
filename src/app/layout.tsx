import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LC Levels - LeetCode Contest Problem Ladders & Filters',
  description: 'Practice LeetCode Contest problems sorted by rating and difficulty ladders like CF Levels. Filter by Biweekly, Weekly, Q1, Q2, Q3, Q4.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f19] text-slate-100 antialiased min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
