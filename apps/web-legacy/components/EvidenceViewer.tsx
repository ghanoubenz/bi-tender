"use client";

import { useEffect, useState } from "react";
import { api, DocumentBlock, EvidenceReference, Tender } from "@/lib/api";

/**
 * Evidence viewer: resolves a citation back to the parsed source document and
 * highlights the exact quoted span in its block, with surrounding context.
 *
 * PRODUCT_CONTRACT rule 2 made visible: the user can always inspect the source
 * behind any AI statement, and unverified quotes are flagged as such.
 */
export function EvidenceViewer({
  evidence,
  tender,
  onClose,
}: {
  evidence: { label: string; refs: EvidenceReference[] };
  tender: Tender;
  onClose: () => void;
}) {
  const [blocks, setBlocks] = useState<DocumentBlock[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = evidence.refs[0];

  useEffect(() => {
    setBlocks(null);
    setError(null);
    const doc = tender.documents.find((d) => d.engine_document_id === ref?.document_id);
    if (!doc) {
      setError("Source document is no longer available.");
      return;
    }
    api<DocumentBlock[]>(`/api/documents/blocks/${doc.id}/`)
      .then(setBlocks)
      .catch(() => setError("Could not load the source document."));
  }, [ref?.document_id, tender.documents]);

  const index = blocks?.findIndex((b) => b.id === ref?.block_id) ?? -1;
  const block = index >= 0 ? blocks![index] : null;
  const context = blocks ? blocks.slice(Math.max(0, index - 1), index + 2) : [];

  return (
    <aside className="evidence-viewer">
      <div className="evidence-viewer-head">
        <div>
          <div className="name">Evidence</div>
          <strong>{evidence.label}</strong>
        </div>
        <button className="btn secondary" onClick={onClose}>
          Close
        </button>
      </div>

      {evidence.refs.map((r, i) => (
        <div key={i} className="evidence-panel">
          <p className="quote">“{r.quote}”</p>
          <p className="src">
            {r.filename ?? "Source document"}
            {r.page && ` · page ${r.page}`}
            {r.clause && ` · clause ${r.clause}`}
            {r.section_path && ` · ${r.section_path}`}
          </p>
          <p className="src">
            {r.method} · confidence {(r.confidence * 100).toFixed(0)}% ·{" "}
            {r.verified ? (
              <span className="verified">quote verified against source ✓</span>
            ) : (
              <span className="unverified">quote NOT verified — needs human review ⚠</span>
            )}
          </p>
        </div>
      ))}

      <h2 style={{ marginTop: 18 }}>Source document</h2>
      {error && <p className="error">{error}</p>}
      {!blocks && !error && <p className="muted">Loading source…</p>}
      {blocks && !block && <p className="muted">The cited block could not be located.</p>}
      {context.map((b) => (
        <div key={b.id} className={`source-block ${b.id === block?.id ? "cited" : ""}`}>
          <div className="src">
            {b.block_type}
            {b.page && ` · page ${b.page}`}
            {b.section_path && ` · ${b.section_path}`}
          </div>
          {b.table_data ? (
            <div className="table-scroll">
              <table>
                <tbody>
                  {b.table_data.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci}>{highlight(cell, b.id === block?.id ? ref.quote : "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>{highlight(b.text, b.id === block?.id ? ref.quote : "")}</p>
          )}
        </div>
      ))}
    </aside>
  );
}

/** Highlight the quoted span inside its source text (whitespace-insensitive). */
function highlight(text: string, quote: string) {
  if (!quote) return text;
  const needle = quote.replace(/\s+/g, " ").trim().toLowerCase();
  const haystack = text.replace(/\s+/g, " ").toLowerCase();
  const at = haystack.indexOf(needle);
  if (at < 0) return text;
  const normalized = text.replace(/\s+/g, " ");
  return (
    <>
      {normalized.slice(0, at)}
      <mark>{normalized.slice(at, at + needle.length)}</mark>
      {normalized.slice(at + needle.length)}
    </>
  );
}
