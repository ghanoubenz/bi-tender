"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Tender } from "@/lib/api";

export default function TendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [title, setTitle] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    try {
      const data = await api<{ results: Tender[] }>("/api/tenders/");
      setTenders(data.results);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const tender = await api<Tender>("/api/tenders/", {
      method: "POST",
      body: JSON.stringify({ title, reference }),
    });
    router.push(`/tenders/${tender.id}`);
  }

  return (
    <div>
      <h1>Tenders</h1>
      <div className="card">
        <h2>New tender</h2>
        <form onSubmit={create} className="row">
          <input
            placeholder="Tender title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ marginBottom: 0 }}
          />
          <input
            placeholder="Reference (optional)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            style={{ marginBottom: 0, maxWidth: 220 }}
          />
          <button className="btn" type="submit">
            Create
          </button>
        </form>
      </div>
      <div className="card">
        {error && <p className="error">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Documents</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((t) => (
              <tr key={t.id} className="clickable" onClick={() => router.push(`/tenders/${t.id}`)}>
                <td>{t.title}</td>
                <td>{t.reference || "—"}</td>
                <td>
                  <span className={`badge ${t.status}`}>{t.status.replace("_", " ")}</span>
                </td>
                <td>{t.documents.length}</td>
                <td className="muted">{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {tenders.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="muted">
                  No tenders yet — create the first one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
