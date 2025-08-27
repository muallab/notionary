"use client";
import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [studyUrl, setStudyUrl] = useState("");

  async function handleUpload() {
    try {
      if (!file) return setStatus("Pick a file first (.pdf, .txt, .md)");
      setStatus("Uploading file...");
      const fd = new FormData();
      fd.append("file", file);

      const up = await fetch("/api/upload", { method: "POST", body: fd });
      if (!up.ok) throw new Error("Upload failed");
      const { document_id } = await up.json();

      setStatus("Ingesting (parse → chunks → embeddings)...");
      const ing = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id })
      });
      if (!ing.ok) throw new Error("Ingest failed");

      setStatus("Generating study guide + flashcards...");
      const sg = await fetch("/api/study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id })
      });
      const out = await sg.json();
      if (!sg.ok || !out.ok) throw new Error("Study guide failed");

      setStudyUrl(`/s/${out.slug}`);
      setStatus("Done!");
    } catch (e) {
      setStatus(e.message || "Something went wrong");
    }
  }

  return (
    <main className="space-y-4">
      <h2 className="text-xl font-semibold">Upload Notes</h2>
      <input type="file" accept=".pdf,.txt,.md" onChange={e=>setFile(e.target.files?.[0]||null)} />
      <button onClick={handleUpload} className="px-4 py-2 rounded bg-black text-white">
        Process
      </button>
      <p className="text-sm">{status}</p>
      {studyUrl && <a className="underline text-blue-600" href={studyUrl}>Open study set</a>}
    </main>
  );
}
