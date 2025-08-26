import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: set, error: se } = await sb.from("study_sets")
    .select().eq("slug", slug).eq("is_public", true).single();
  if (se || !set) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: cards } = await sb.from("flashcards").select().eq("study_set_id", set.id).order("id");
  return NextResponse.json({ set, cards: cards || [] });
}
