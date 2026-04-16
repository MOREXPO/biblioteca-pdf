"use client";

import { useEffect, useMemo, useState } from "react";

type Book = {
  id: string;
  title: string;
  author: string;
  filename: string;
  url: string;
  uploadedAt: string;
};

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function loadBooks() {
    const r = await fetch("/api/books", { cache: "no-store" });
    if (!r.ok) return;
    const data = await r.json();
    setBooks(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadBooks();
  }, []);

  const sorted = useMemo(() => [...books].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)), [books]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!title || !author || !file) {
      setMessage("Completa título, autor y PDF.");
      return;
    }

    const form = new FormData();
    form.set("title", title);
    form.set("author", author);
    form.set("file", file);

    const r = await fetch("/api/books", { method: "POST", body: form });
    const data = await r.json();
    if (!r.ok) {
      setMessage(data?.error || "No se pudo subir el libro");
      return;
    }

    setTitle("");
    setAuthor("");
    setFile(null);
    await loadBooks();
    setMessage("Libro subido correctamente 📚");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0d1b2a,#0b1320_55%,#070b14)] text-slate-100">
      <div className="max-w-6xl mx-auto px-5 py-10">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Biblioteca Online</h1>
          <p className="text-slate-300 mt-2">Sube libros en PDF para que otros puedan leerlos o descargarlos.</p>
        </header>

        <section className="grid lg:grid-cols-[1fr_2fr] gap-6">
          <form onSubmit={onSubmit} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 space-y-3 h-fit shadow-2xl">
            <h2 className="text-xl font-semibold">Subir libro</h2>
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              placeholder="Autor"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <input
              className="w-full text-sm"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button className="w-full rounded-lg bg-cyan-400 text-slate-950 font-semibold py-2 hover:bg-cyan-300 transition">Subir PDF</button>
            {message && <p className="text-sm text-cyan-200">{message}</p>}
          </form>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Estantería</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {sorted.length === 0 ? (
                <p className="text-slate-300">Todavía no hay libros en la biblioteca.</p>
              ) : (
                sorted.map((book) => (
                  <article key={book.id} className="rounded-2xl border border-amber-200/20 bg-gradient-to-b from-[#1b263b] to-[#111827] p-4 shadow-lg hover:-translate-y-0.5 transition">
                    <div className="h-2 w-16 rounded-full bg-amber-300/80 mb-3" />
                    <h3 className="text-lg font-bold leading-tight">{book.title}</h3>
                    <p className="text-slate-300 text-sm mt-1">{book.author}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(book.uploadedAt).toLocaleString("es-ES")}</p>

                    <div className="mt-4 flex gap-2 flex-wrap">
                      <a
                        href={book.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition"
                      >
                        Leer
                      </a>
                      <a
                        href={book.url}
                        download={book.filename}
                        className="px-3 py-2 rounded-lg border border-slate-500 text-sm font-semibold hover:bg-slate-800 transition"
                      >
                        Descargar
                      </a>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
