"use client";

import { useEffect, useMemo, useState } from "react";

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

const coverColors = ["from-amber-500 to-orange-700", "from-cyan-500 to-blue-700", "from-emerald-500 to-teal-700", "from-fuchsia-500 to-purple-700"];

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("Novela");
  const [status, setStatus] = useState<"LEIDO" | "PENDIENTE">("PENDIENTE");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [genresCatalog, setGenresCatalog] = useState<string[]>(["Novela"]);
  const [newGenre, setNewGenre] = useState("");

  const [q, setQ] = useState("");
  const [authorFilter, setAuthorFilter] = useState("TODOS");
  const [genreFilter, setGenreFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  async function loadBooks() {
    const r = await fetch("/api/books", { cache: "no-store" });
    if (!r.ok) return;
    const data = await r.json();
    setBooks(Array.isArray(data) ? data : []);
  }

  async function loadGenres() {
    const r = await fetch("/api/genres", { cache: "no-store" });
    if (!r.ok) return;
    const data = await r.json();
    const list = Array.isArray(data) && data.length ? data : ["Novela"];
    setGenresCatalog(list);
    if (!list.includes(genre)) setGenre(list[0]);
  }

  useEffect(() => {
    loadBooks();
    loadGenres();
  }, []);

  const authors = useMemo(() => ["TODOS", ...Array.from(new Set(books.map((b) => b.author).filter(Boolean)))], [books]);
  const genres = useMemo(() => ["TODOS", ...Array.from(new Set(books.map((b) => b.genre || "General")))], [books]);

  const filtered = useMemo(() => {
    return [...books]
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      .filter((b) => (authorFilter === "TODOS" ? true : b.author === authorFilter))
      .filter((b) => (genreFilter === "TODOS" ? true : (b.genre || "General") === genreFilter))
      .filter((b) => (statusFilter === "TODOS" ? true : (b.status || "PENDIENTE") === statusFilter))
      .filter((b) => {
        const text = `${b.title} ${b.author} ${b.genre || ""}`.toLowerCase();
        return text.includes(q.toLowerCase());
      });
  }, [books, authorFilter, genreFilter, statusFilter, q]);

  async function createGenre() {
    const value = newGenre.trim();
    if (!value) return;

    const r = await fetch("/api/genres", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ genre: value }),
    });
    if (!r.ok) return;

    await loadGenres();
    setGenre(value);
    setNewGenre("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!title || !author || !file) {
      setMessage("Completa título, autor y PDF.");
      return;
    }

    try {
      const form = new FormData();
      form.set("title", title);
      form.set("author", author);
      form.set("genre", genre);
      form.set("status", status);
      form.set("file", file);

      const r = await fetch("/api/books", { method: "POST", body: form });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMessage(data?.error || "No se pudo subir el libro");
        return;
      }

      setTitle("");
      setAuthor("");
      setGenre(genresCatalog[0] || "Novela");
      setStatus("PENDIENTE");
      setFile(null);
      await loadBooks();
      setMessage("Libro subido correctamente 📚");
    } catch {
      setMessage("Error de conexión al subir el libro. Vuelve a intentarlo.");
    }
  }

  async function deleteBook(id: string) {
    if (!confirm("¿Seguro que quieres eliminar este libro?")) return;
    const r = await fetch(`/api/books?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMessage(data?.error || "No se pudo eliminar el libro");
      return;
    }
    await loadBooks();
    setMessage("Libro eliminado correctamente 🗑️");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a,#0b1320_55%,#070b14)] text-slate-100">
      <div className="max-w-7xl mx-auto px-5 py-10">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Biblioteca Online</h1>
          <p className="text-slate-300 mt-2">Sube libros en PDF y explora la estantería digital.</p>
        </header>

        <section className="grid xl:grid-cols-[340px_1fr] gap-6">
          <form onSubmit={onSubmit} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 space-y-3 h-fit shadow-2xl">
            <h2 className="text-xl font-semibold">Subir libro</h2>
            <input className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2" placeholder="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} />
            <select className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2" value={genre} onChange={(e) => setGenre(e.target.value)}>
              {genresCatalog.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2" placeholder="Nuevo género" value={newGenre} onChange={(e) => setNewGenre(e.target.value)} />
              <button type="button" onClick={createGenre} className="px-3 rounded-lg border border-cyan-400 text-cyan-300 hover:bg-cyan-400/10">Crear</button>
            </div>
            <select className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="PENDIENTE">Pendiente</option>
              <option value="LEIDO">Leído</option>
            </select>
            <input className="w-full text-sm" type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button type="submit" className="w-full rounded-lg bg-cyan-400 text-slate-950 font-semibold py-2 hover:bg-cyan-300 transition">Subir PDF</button>
            {message && <p className="text-sm text-cyan-200">{message}</p>}
          </form>

          <section>
            <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 mb-5 grid md:grid-cols-4 gap-3">
              <input className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 md:col-span-2" placeholder="Buscar por título, autor o género..." value={q} onChange={(e) => setQ(e.target.value)} />
              <select className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2" value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)}>{authors.map((a) => <option key={a}>{a}</option>)}</select>
              <select className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2" value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>{genres.map((g) => <option key={g}>{g}</option>)}</select>
              <select className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="TODOS">Estado: Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="LEIDO">Leído</option>
              </select>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Estantería ({filtered.length})</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.length === 0 ? (
                <p className="text-slate-300 col-span-full">No hay libros con esos filtros.</p>
              ) : (
                filtered.map((book, i) => (
                  <article key={book.id} className="rounded-2xl border border-slate-700 bg-[#0e1627] p-3 shadow-lg hover:-translate-y-1 transition">
                    <div className={`rounded-xl bg-gradient-to-b ${coverColors[i % coverColors.length]} h-52 p-4 flex flex-col justify-between`}>
                      <p className="text-xs uppercase tracking-wider text-white/80">{book.genre || "General"}</p>
                      <h3 className="text-white font-bold text-lg leading-tight line-clamp-4">{book.title}</h3>
                      <p className="text-white/90 text-sm">{book.author}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full ${book.status === "LEIDO" ? "bg-emerald-600/30 text-emerald-300" : "bg-amber-600/30 text-amber-300"}`}>{book.status === "LEIDO" ? "Leído" : "Pendiente"}</span>
                      <span className="text-slate-400">{new Date(book.uploadedAt).toLocaleDateString("es-ES")}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a href={book.url} target="_blank" rel="noreferrer" className="flex-1 text-center px-3 py-2 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition">Leer</a>
                      <a href={book.url} download={book.filename} className="flex-1 text-center px-3 py-2 rounded-lg border border-slate-500 text-sm font-semibold hover:bg-slate-800 transition">Descargar</a>
                    </div>
                    <button onClick={() => deleteBook(book.id)} className="mt-2 w-full px-3 py-2 rounded-lg border border-rose-500/60 text-rose-300 text-sm font-semibold hover:bg-rose-500/10 transition">
                      Eliminar
                    </button>
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
