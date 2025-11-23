import "./globals.css";
import React from "react";
import Navbar from './components/Navbar';

export const metadata = {
  title: "ScribeAI - AI-Powered Transcription & Summary",
  description: "Transform your conversations into intelligent transcripts with real-time speech recognition and AI-powered summaries",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: '/apple-touch-icon.png'
  },
  manifest: '/manifest.json',
  themeColor: '#FFE500'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Poppins:wght@700;800;900&family=Rubik:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen" style={{ fontFamily: 'Rubik, system-ui, sans-serif' }}>
        <div className="app-container min-h-screen">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
