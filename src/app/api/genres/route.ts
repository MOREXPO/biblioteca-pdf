import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_FILE = path.join(process.cwd(), "data", "genres.json");
const DEFAULT_GENRES = ["Novela", "Fantasía", "Ciencia ficción", "Historia", "Negocios"];

async function readGenres(): Promise<string[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return Array.from(new Set(parsed.map(String)));
    return DEFAULT_GENRES;
  } catch {
    return DEFAULT_GENRES;
  }
}

async function writeGenres(genres: string[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(Array.from(new Set(genres)), null, 2), "utf8");
}

export async function GET() {
  const genres = await readGenres();
  return NextResponse.json(genres);
}

export async function POST(req: Request) {
  const body = await req.json();
  const genre = String(body?.genre || "").trim();
  if (!genre) return NextResponse.json({ ok: false, error: "Género vacío" }, { status: 400 });

  const genres = await readGenres();
  if (!genres.includes(genre)) {
    genres.push(genre);
    await writeGenres(genres);
  }

  return NextResponse.json({ ok: true, genres });
}
