"use client";
import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [studyUrl, setStudyUrl] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setStatus("Uploading file...");
    const fd = new FormData();
    fd.append("file", file);

    const up = await fetch("/api/upload", { method: "POST", body: fd });
    if (!up.ok) { setStatus("Upload failed"); return; }
    const { document_id } = await up.json();

    setStatus("Ingesting & indexing (chunks + embeddings)...");
    await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id })
    });

    setStatus("Generating study guide & flashcards...");
    const sg = await fetch("/api/study-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id })
    });
    const out = await sg.json();
    if (out.ok) {
      setStudyUrl(`/s/${out.slug}`);
      setStatus("Done! Study set created.");
    } else {
      setStatus("Study guide failed.");
    }
  };

  return (
    <main className="space-y-4">
      <input type="file" accept=".pdf,.txt,.md" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
      <button onClick={handleUpload} className="px-4 py-2 rounded bg-black text-white">Process</button>
      <p className="text-sm">{status}</p>
      {studyUrl && <a href={studyUrl} className="underline text-blue-600">Open study set</a>}
    </main>
  );
}
