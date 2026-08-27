"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { EvidenceViewer } from "@/components/EvidenceViewer";
import { RequirementsTable } from "@/components/RequirementsTable";
import { api, EvidenceReference, MetadataField, Requirement, Tender } from "@/lib/api";

const FIELD_LABELS: Record<string, string> = {
  client: "Client",
  project_title: "Project title",
  tender_reference: "Tender reference",
  country: "Country",
  submission_deadline: "Submission deadline",
  scope_summary: "Scope",
  bid_validity: "Bid validity",
  bid_bond: "Bid bond / security",
  submission_method: "Submission method",
  contact: "Contact",
};

type Selection = { label: string; refs: EvidenceReference[] };

export default function TenderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tender, setTender] = useState<Tender | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [uploading, setUploading] = useState(false);
  const [evidence, setEvidence] = useState<Selection | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadRequirements = useCallback(async () => {
    try {
      setRequirements(await api<Requirement[]>(`/api/tenders/${id}/requirements/`));
    } catch {
      setRequirements([]);
    }
  }, [id]);

  const load = useCallback(async () => {
    const data = await api<Tender>(`/api/tenders/${id}/`);
    setTender(data);
    if (data.requirements_status === "ready") await loadRequirements();
  }, [id, loadRequirements]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll while the AI pipeline is still advancing (ingestion, then extraction).
  const ingesting = tender?.documents.some((d) => d.ingestion_status === "processing") ?? false;
  const extracting =
    (tender?.documents.length ?? 0) > 0 &&
    ["pending", "processing"].includes(tender?.requirements_status ?? "");
  const pipelineRunning = ingesting || extracting;

  useEffect(() => {
    if (!pipelineRunning) return;
    const timer = setInterval(async () => {
      const data = await api<Tender>(`/api/tenders/${id}/refresh/`, { method: "POST" });
      setTender(data);
      if (data.requirements_status === "ready") await loadRequirements();
    }, 2500);
    return () => clearInterval(timer);
  }, [pipelineRunning, id, loadRequirements]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api(`/api/tenders/${id}/documents/`, { method: "POST", body: form });
      await load();
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function decide(decision: string) {
    const reason = window.prompt(`Reason for "${decision.replace("_", " ")}" decision:`);
    if (!reason) return;
    setTender(
      await api<Tender>(`/api/tenders/${id}/decision/`, {
        method: "POST",
        body: JSON.stringify({ decision, reason }),
      })
    );
  }

  if (!tender) return <p className="muted">Loading…</p>;
  const meta = tender.ai_metadata;

  return (
    <div className={`workspace ${evidence ? "with-evidence" : ""}`}>
      <div>
        <h1>
          {tender.title}{" "}
          <span className={`badge ${tender.status}`}>{tender.status.replace("_", " ")}</span>{" "}
          {tender.decision && (
            <span className={`badge ${tender.decision}`}>{tender.decision.replace("_", " ")}</span>
          )}
        </h1>

        <div className="card">
          <h2>Tender documents</h2>
          <table>
            <tbody>
              {tender.documents.map((d) => (
                <tr key={d.id}>
                  <td>{d.filename}</td>
                  <td className="muted">{(d.size / 1024).toFixed(0)} KB</td>
                  <td>
                    <span className={`badge ${d.ingestion_status}`}>{d.ingestion_status}</span>
                    {d.ingestion_error && <div className="error">{d.ingestion_error}</div>}
                  </td>
                </tr>
              ))}
              {tender.documents.length === 0 && (
                <tr>
                  <td className="muted">No documents uploaded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ marginTop: 12 }}>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.docx,.xlsx,.zip"
              onChange={upload}
              disabled={uploading}
              style={{ maxWidth: 340, marginBottom: 0 }}
            />
            {pipelineRunning && (
              <p className="muted">Processing… parsing documents and extracting requirements.</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Extracted tender metadata</h2>
          {!meta && <p className="muted">Upload a tender document to extract metadata.</p>}
          {meta && (
            <div className="meta-grid">
              {Object.entries(FIELD_LABELS).map(([key, label]) => {
                const field = meta[key] as MetadataField | undefined;
                const hasValue = field?.value != null;
                return (
                  <div className="meta-field" key={key}>
                    <div className="name">
                      {label}
                      {field?.needs_review && " · needs review"}
                    </div>
                    <div className={`value ${hasValue ? "" : "unknown"}`}>
                      {hasValue ? field!.value : "Unknown — flagged for review"}
                    </div>
                    {hasValue && field!.evidence.length > 0 && (
                      <a
                        className="evidence-link"
                        href="#evidence"
                        onClick={(e) => {
                          e.preventDefault();
                          setEvidence({ label, refs: field!.evidence });
                        }}
                      >
                        View evidence{field!.evidence[0].page ? ` (p. ${field!.evidence[0].page})` : ""}
                        {field!.evidence[0].verified ? " ✓" : " ⚠ unverified"}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Requirements</h2>
          <RequirementsTable
            requirements={requirements}
            status={tender.requirements_status}
            onShowEvidence={(label, refs) => setEvidence({ label, refs })}
            onReviewed={loadRequirements}
          />
        </div>

        <div className="card">
          <h2>Bid / No-Bid decision</h2>
          {tender.decision ? (
            <p>
              Decision:{" "}
              <span className={`badge ${tender.decision}`}>{tender.decision.replace("_", " ")}</span> —{" "}
              {tender.decision_reason}
            </p>
          ) : (
            <div className="row">
              <button className="btn" onClick={() => decide("bid")}>
                Bid
              </button>
              <button className="btn secondary" onClick={() => decide("hold")}>
                Hold
              </button>
              <button className="btn secondary" onClick={() => decide("no_bid")}>
                No-Bid
              </button>
              <span className="muted">The decision is always made by a human and is audited.</span>
            </div>
          )}
        </div>
      </div>

      {evidence && (
        <EvidenceViewer evidence={evidence} tender={tender} onClose={() => setEvidence(null)} />
      )}
    </div>
  );
}
