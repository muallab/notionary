// src/app/layout.js
import "./globals.css";

export const metadata = {
  title: "Notionary",
  description: "AI-Powered Study Buddy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <div className="max-w-4xl mx-auto p-6">
          <header className="mb-6">
            <h1 className="text-3xl font-semibold">Notionary</h1>
            <p className="text-sm text-gray-600">
              Upload notes → AI summary & flashcards → share
            </p>
            <nav className="mt-3 flex gap-4 text-sm">
              <a className="underline" href="/">Home</a>
              <a className="underline" href="/upload">Upload</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
