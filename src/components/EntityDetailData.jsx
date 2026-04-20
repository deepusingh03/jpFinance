import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DetailsPage from "../components/DetailsPage";
import CustomNavbar from "../components/CustomNavbar";
import { apiData } from "../utility/api";
import { helperMethods } from "../utility/CMPhelper";

// ── Constants ─────────────────────────────────────────────────────────────────
const EXCLUDED_CHILD_ENTITY_TYPES = ["users"];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchRecord(entityType, id) {
  const data = await helperMethods.getEntityDetails(`${entityType}?Id=${id}`);

  if (!data?.[0]) throw new Error("No record found for the specified ID.");
  return data[0];
}

async function fetchChildRelations(entityType) {
  if (EXCLUDED_CHILD_ENTITY_TYPES.includes(entityType)) return [];
  const res = await fetch(`${apiData.PORT}/api/related/childs/${entityType}`);
  if (!res.ok) throw new Error("Failed to fetch child records.");
  const { success, data } = await res.json();
  if (!success || !data?.length) return [];
  return data.map(({ child_table, child_column }) => `${child_table}-${child_column}`);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PageShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <CustomNavbar />
      {children}
    </div>
  );
}

function CenteredSpinner() {
  return (
    <PageShell>
      <div style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 12, color: "#6b7280",
      }}>
        <svg
          width="28" height="28" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ animation: "spin 0.75s linear infinite" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span style={{ fontSize: 14 }}>Loading record…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </PageShell>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <PageShell>
      <div style={{ padding: "32px 24px", maxWidth: 520, margin: "0 auto" }}>
        <div style={{
          background: "#fff5f5", border: "1.5px solid #fca5a5",
          borderRadius: 10, padding: "16px 20px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <strong style={{ fontSize: 14, color: "#b91c1c" }}>Something went wrong</strong>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                alignSelf: "flex-start", padding: "7px 18px",
                fontSize: 13, fontWeight: 500,
                background: "#fff", color: "#374151",
                border: "1.5px solid #e5e7eb", borderRadius: 7,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function EmptyState() {
  return (
    <PageShell>
      <div style={{ padding: "48px 24px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
        No record found for the specified ID.
      </div>
    </PageShell>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EntityDetailPage() {
  const { entityType, id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord]           = useState(null);
  const [childRecords, setChildRecords] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  const loadData = useCallback(async () => {
    if (!entityType || !id) return;
    try {
      setLoading(true);
      setError(null);
      const [fetchedRecord, fetchedChildren] = await Promise.all([
        fetchRecord(entityType, id),
        fetchChildRelations(entityType),
      ]);
      setRecord(fetchedRecord);
      setChildRecords(fetchedChildren);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [entityType, id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Early returns ───────────────────────────────────────────────────────────
  if (loading) return <CenteredSpinner />;
  if (error)   return <ErrorBanner message={error} onRetry={loadData} />;
  if (!record) return <EmptyState />;

  // ── Happy path ──────────────────────────────────────────────────────────────
  return (
    <PageShell>
      <DetailsPage
        data={record}
        childs={childRecords}
        refresh={loadData}
        onBack={() => navigate(-1)}
        entityName={entityType}
        onEdit={() => navigate(`/details/${entityType}/${id}/edit`, { state: { record } })}
      />
    </PageShell>
  );
}