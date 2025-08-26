export const metadata = { title: "Notionary", description: "AI-Powered Study Buddy" };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <header className="mb-6">
            <h1 className="text-3xl font-semibold">Notionary</h1>
            <p className="text-sm text-gray-600">Upload notes → AI summary & flashcards → share</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
