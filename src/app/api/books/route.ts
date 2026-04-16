import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

type Book = {
  id: string;
  title: string;
  author: string;
  genre?: string;
  status?: "LEIDO" | "PENDIENTE";
  filename: string;
  url: string;
  uploadedAt: string;
};

const DATA_FILE = path.join(process.cwd(), "data", "books.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function readBooks(): Promise<Book[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBooks(books: Book[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2), "utf8");
}

export async function GET() {
  const books = await readBooks();
  return NextResponse.json(books);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const author = String(form.get("author") || "").trim();
  const genre = String(form.get("genre") || "General").trim();
  const rawStatus = String(form.get("status") || "PENDIENTE").trim().toUpperCase();
  const status: "LEIDO" | "PENDIENTE" = rawStatus === "LEIDO" ? "LEIDO" : "PENDIENTE";
  const file = form.get("file") as File | null;

  if (!title || !author || !file || !file.name) {
    return NextResponse.json({ ok: false, error: "Faltan campos" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ ok: false, error: "Solo se permiten PDFs" }, { status: 400 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}_${safeName}`;
  const fullPath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  const book: Book = {
    id: crypto.randomUUID(),
    title,
    author,
    genre,
    status,
    filename,
    url: `/uploads/${filename}`,
    uploadedAt: new Date().toISOString(),
  };

  const books = await readBooks();
  const next = [book, ...books];
  await writeBooks(next);

  return NextResponse.json({ ok: true, book });
}
