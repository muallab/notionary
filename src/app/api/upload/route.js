import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const sb = supabaseAdmin();
  const path = `${Date.now()}-${file.name}`.replace(/\s+/g, "_");
  const arrayBuf = await file.arrayBuffer();

  const { error: upErr } = await sb.storage.from(process.env.SUPABASE_BUCKET).upload(
    path,
    Buffer.from(arrayBuf),
    { upsert: false, contentType: file.type || "application/octet-stream" }
  );
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data, error } = await sb.from("documents").insert({
    filename: file.name, storage_path: path
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document_id: data.id });
}
