import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import OpenAI from "openai";

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function rnd(n=5){ return Math.random().toString(36).slice(2,2+n); }

export async function POST(req) {
  const { document_id, max_cards = 16 } = await req.json();
  if (!document_id) return NextResponse.json({ error: "document_id required" }, { status: 400 });

  const sb = supabaseAdmin();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const qEmb = await openai.embeddings.create({
    model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
    input: "Create a concise study guide and flashcards for this document."
  });

  const { data: matches, error: me } = await sb.rpc("match_chunks", {
    query_embedding: qEmb.data[0].embedding,
    match_count: 20,
    _document_id: document_id
  });
  if (me) return NextResponse.json({ error: me.message }, { status: 500 });

  const context = (matches || []).map((m)=>m.content).join("\n\n").slice(0, 12000);

  const prompt = `
You are an expert study guide generator.
CONTEXT:
${context}

TASKS:
1) Produce 6-10 distilled bullet points as the study summary.
2) Produce up to ${max_cards} flashcards in JSON array with { "question": "...", "answer": "..." }.
Return valid JSON as:
{"summary_bullets": ["..."], "flashcards": [{"question":"...","answer":"..."}]}
`;

  const chat = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }]
  });

  const text = chat.choices[0]?.message?.content?.trim() || "{}";
  let parsed; try { parsed = JSON.parse(text); } catch { parsed = { summary_bullets: [], flashcards: [] }; }

  const { data: doc } = await sb.from("documents").select().eq("id", document_id).single();
  const title = doc?.filename?.replace(/\.[^.]+$/, "") || "Study Set";
  const slug = `${slugify(title)}-${rnd()}`;

  const { data: set, error: se } = await sb.from("study_sets")
    .insert({ document_id, title, summary: (parsed.summary_bullets||[]).join("\n"), is_public: true, slug })
    .select().single();
  if (se) return NextResponse.json({ error: se.message }, { status: 500 });

  const cards = (parsed.flashcards||[]).slice(0, max_cards).map((c)=>({
    study_set_id: set.id, question: c.question, answer: c.answer
  }));
  if (cards.length) await sb.from("flashcards").insert(cards);

  return NextResponse.json({ ok: true, slug: set.slug, cards: cards.length });
}
