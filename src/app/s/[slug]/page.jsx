async function getData(slug) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const res = await fetch(`${base}/api/public-set?slug=${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function PublicSetPage({ params }) {
  const data = await getData(params.slug);
  if (!data) return <div>Not found</div>;
  const { set, cards } = data;

  return (
    <main className="space-y-6">
      <h2 className="text-2xl font-semibold">{set.title}</h2>
      <div>
        <h3 className="font-medium mb-2">Summary</h3>
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">{set.summary}</pre>
      </div>
      <div>
        <h3 className="font-medium mb-2">Flashcards ({cards.length})</h3>
        <ul className="space-y-3">
          {cards.map((c) => (
            <li key={c.id} className="border rounded p-3">
              <p className="font-medium">Q: {c.question}</p>
              <p className="text-sm mt-1">A: {c.answer}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
