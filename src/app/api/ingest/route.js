import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import OpenAI from "openai";
import pdf from "pdf-parse";

const EMBED_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

function splitIntoChunks(text, approxSize = 1600) {
  const parts = [];
  let buf = "";
  for (const line of text.split(/\r?\n/)) {
    if ((buf + "\n" + line).length > approxSize) { parts.push(buf); buf = ""; }
    buf += (buf ? "\n" : "") + line;
  }
  if (buf.trim()) parts.push(buf);
  return parts.map(p => p.trim()).filter(Boolean);
}

export async function POST(req) {
  const { document_id } = await req.json();
  if (!document_id) return NextResponse.json({ error: "document_id required" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: doc, error: de } = await sb.from("documents").select().eq("id", document_id).single();
  if (de || !doc) return NextResponse.json({ error: "document not found" }, { status: 404 });

  const dl = await sb.storage.from(process.env.SUPABASE_BUCKET).download(doc.storage_path);
  if (!dl.data) return NextResponse.json({ error: "download failed" }, { status: 500 });
  const buffer = Buffer.from(await dl.data.arrayBuffer());

  let text = "";
  if (doc.filename.toLowerCase().endsWith(".pdf")) {
    const parsed = await pdf(buffer);
    text = parsed.text || "";
  } else {
    text = buffer.toString("utf-8");
  }

  await sb.from("documents").update({ text_content: text }).eq("id", document_id);

  const chunks = splitIntoChunks(text);
  if (!chunks.length) return NextResponse.json({ ok: true, chunks: 0 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const emb = await openai.embeddings.create({ model: EMBED_MODEL, input: chunks });

  const rows = chunks.map((c, i) => ({ document_id, content: c, embedding: emb.data[i].embedding }));
  const { error: ie } = await sb.from("chunks").insert(rows);
  if (ie) return NextResponse.json({ error: ie.message }, { status: 500 });

  return NextResponse.json({ ok: true, chunks: rows.length });
}
