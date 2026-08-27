"use client";

import { useMemo, useState } from "react";
import { api, CATEGORY_LABELS, EvidenceReference, Requirement } from "@/lib/api";

export function RequirementsTable({
  requirements,
  status,
  onShowEvidence,
  onReviewed,
}: {
  requirements: Requirement[];
  status: string;
  onShowEvidence: (label: string, refs: EvidenceReference[]) => void;
  onReviewed: () => void;
}) {
  const [category, setCategory] = useState("");
  const [onlyReview, setOnlyReview] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(requirements.map((r) => r.category))).sort(),
    [requirements]
  );
  const reviewCount = requirements.filter((r) => r.needs_review).length;

  const visible = requirements.filter(
    (r) => (!category || r.category === category) && (!onlyReview || r.needs_review)
  );

  async function review(requirement: Requirement, review_status: "accepted" | "rejected") {
    setBusy(requirement.id);
    try {
      await api(`/api/requirements/${requirement.id}/review/`, {
        method: "POST",
        body: JSON.stringify({ review_status }),
      });
      onReviewed();
    } finally {
      setBusy(null);
    }
  }

  if (status === "processing" || status === "pending") {
    return (
      <p className="muted">
        {status === "processing"
          ? "Extracting requirements…"
          : "Requirements are extracted once documents finish ingesting."}
      </p>
    );
  }
  if (status === "failed") {
    return <p className="error">Requirement extraction failed. Re-upload or retry the document.</p>;
  }
  if (requirements.length === 0) {
    return <p className="muted">No requirements were found in these documents.</p>;
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 14, flexWrap: "wrap" }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ marginBottom: 0, maxWidth: 220 }}
        >
          <option value="">All categories ({requirements.length})</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c] ?? c} ({requirements.filter((r) => r.category === c).length})
            </option>
          ))}
        </select>
        <button
          className={`btn ${onlyReview ? "" : "secondary"}`}
          onClick={() => setOnlyReview((v) => !v)}
          disabled={reviewCount === 0 && !onlyReview}
        >
          Needs review ({reviewCount})
        </button>
        <span className="muted">
          {visible.length} shown · every requirement links to its source evidence
        </span>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Category</th>
              <th>Obligation</th>
              <th>Evidence</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className={r.needs_review ? "flagged" : ""}>
                <td>{r.text}</td>
                <td>
                  <span className="badge pending">{CATEGORY_LABELS[r.category] ?? r.category}</span>
                </td>
                <td>
                  {r.mandatory === true && <span className="badge failed">Mandatory</span>}
                  {r.mandatory === false && <span className="badge pending">Optional</span>}
                  {r.mandatory === null && <span className="muted">Unclear</span>}
                </td>
                <td>
                  <a
                    className="evidence-link"
                    href="#evidence"
                    onClick={(e) => {
                      e.preventDefault();
                      onShowEvidence(r.text.slice(0, 60), r.evidence);
                    }}
                  >
                    {r.evidence[0]?.clause
                      ? `Clause ${r.evidence[0].clause}`
                      : r.evidence[0]?.page
                        ? `Page ${r.evidence[0].page}`
                        : "View source"}
                    {r.evidence[0]?.verified ? " ✓" : " ⚠"}
                  </a>
                </td>
                <td>
                  {r.review_status === "pending" ? (
                    <div className="row">
                      <button
                        className="btn"
                        style={{ padding: "4px 10px" }}
                        disabled={busy === r.id}
                        onClick={() => review(r, "accepted")}
                      >
                        Accept
                      </button>
                      <button
                        className="btn secondary"
                        style={{ padding: "4px 10px" }}
                        disabled={busy === r.id}
                        onClick={() => review(r, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className={`badge ${r.review_status === "accepted" ? "ingested" : "failed"}`}>
                      {r.review_status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
