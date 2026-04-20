import React, { useEffect, useState, useMemo } from "react";
import { Badge, Tabs, Tab } from "react-bootstrap";
import RecordRelatedList from "./RecordRelatedList";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import DealerDetail from "../DetailPage/DealerDetail";
import LoanDetail from "../DetailPage/LoanDetail";
import CustomerDetail from "../DetailPage/CustomerDetail";
import BrandDetail from "../DetailPage/BrandDetail";
import ProductDetail from "../DetailPage/ProductDetail";
import PricebookDetail from "../DetailPage/PriceBookDetail";
import PricebookEntryDetail from "../DetailPage/PriceBookEntryDetail";
import UserDetail from "../DetailPage/UserDetail";
import LoanItemDetail from "../DetailPage/LoanItemDetail";
import DocumentPreview from "../DetailPage/DocumentPreview";

// ── Constants ─────────────────────────────────────────────────────────────────
const NON_EDITABLE_ENTITIES = ["users", "documents"];

const STATUS_STYLES = {
  due:       { background: "#fef9c3", color: "#854d0e" },
  success:   { background: "#dcfce7", color: "#166534" },
  "over due":{ background: "#fee2e2", color: "#991b1b" },
};

const ENTITY_DETAIL_MAP = {
  dealers:        DealerDetail,
  customers:      CustomerDetail,
  brands:         BrandDetail,
  products:       ProductDetail,
  pricebook:      PricebookDetail,
  pricebookentry: PricebookEntryDetail,
  users:          UserDetail,
  loans:          LoanDetail,
  loanitems:      LoanItemDetail,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDisplayName(data, entityName) {
  if (entityName?.toLowerCase() === "pricebook") return data.PricebookName;
  if (data?.Name) return data.Name;
  if (data?.FirstName || data?.LastName)
    return `${data.FirstName ?? ""} ${data.LastName ?? ""}`.trim();
  return "Record Details";
}

function StatusBadge({ status }) {
  if (!status) return null;
  const key = status.toLowerCase();
  const style = STATUS_STYLES[key] ?? { background: "#f3f4f6", color: "#374151" };
  return (
    <span style={{
      ...style,
      fontSize: 12, fontWeight: 600, padding: "3px 10px",
      borderRadius: 20, letterSpacing: "0.02em",
    }}>
      {status}
    </span>
  );
}

function IconBtn({ onClick, icon, label, variant = "default" }) {
  const variantStyles = {
    default: { background: "#fff",      color: "#374151", borderColor: "#e5e7eb" },
    danger:  { background: "#fff5f5",   color: "#dc2626", borderColor: "#fca5a5" },
  };
  const s = variantStyles[variant] ?? variantStyles.default;
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", fontSize: 13, fontWeight: 500,
        border: `1.5px solid ${s.borderColor}`,
        borderRadius: 8, cursor: "pointer",
        background: s.background, color: s.color,
        fontFamily: "inherit", transition: "opacity 0.15s",
      }}
      onMouseOver={e => e.currentTarget.style.opacity = "0.8"}
      onMouseOut={e => e.currentTarget.style.opacity = "1"}
    >
      <i className={`bi bi-${icon}`} style={{ fontSize: 13 }} />
      {label}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DetailsPage({ data, onBack, childs, refresh, entityName }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode]           = useState(false);
  const [activeTab, setActiveTab]             = useState("details");

  const isNonEditable = NON_EDITABLE_ENTITIES.includes(entityName);
  const displayName   = data ? getDisplayName(data, entityName) : "";

  useEffect(() => {
    if (displayName) document.title = `${displayName} | JP Finance`;
  }, [displayName]);

  const relatedChildren = useMemo(() =>
    childs?.map((item) => {
      const [entity, parentField] = item.split("-");
      return { entity, parentField };
    }) ?? [],
  [childs]);

  const DetailComponent = ENTITY_DETAIL_MAP[entityName] ?? null;

  if (!data) return (
    <div style={{ padding: "48px 24px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
      No record selected. Please choose a record to view details.
    </div>
  );

  return (
    <>
      <div className="container mt-4" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
        <div style={{
          background: "#fff",
          border: `1.5px solid ${isEditMode ? "#6366f1" : "#e5e7eb"}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
          transition: "border-color 0.2s",
        }}>

          {/* ── Header ── */}
          <div style={{
            background: "linear-gradient(135deg, #f8f7ff 0%, #f0f9ff 100%)",
            borderBottom: "1px solid #ede9fe",
            padding: "20px 24px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>

              {/* Title + status */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>
                    {displayName}
                  </h2>
                  <StatusBadge status={data.Status} />
                  {isEditMode && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 9px",
                      background: "#ede9fe", color: "#6366f1", borderRadius: 20,
                    }}>
                      Editing
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  View and manage record details
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {onBack && (
                  <IconBtn onClick={onBack} icon="arrow-left" label="Back" />
                )}
                {!isNonEditable && activeTab === "details" && (
                  isEditMode
                    ? <IconBtn onClick={() => setIsEditMode(false)} icon="x-lg" label="Cancel" />
                    : <IconBtn onClick={() => setIsEditMode(true)} icon="pencil" label="Edit" />
                )}
                {!isNonEditable && activeTab === "details" && (
                  <IconBtn
                    onClick={() => setShowDeleteModal(true)}
                    icon="trash"
                    label="Delete"
                    variant="danger"
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{ padding: "0 8px" }}>
            <Tabs
              activeKey={activeTab}
              onSelect={setActiveTab}
              className="px-3 pt-2"
              fill
            >
              {/* Related tab — hidden for non-editable entities */}
              {!isNonEditable && (
                <Tab
                  eventKey="related"
                  title={
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <i className="bi bi-link-45deg" />
                      Related
                      {relatedChildren.length > 0 && (
                        <Badge bg="primary" pill style={{ fontSize: 10 }}>
                          {relatedChildren.length}
                        </Badge>
                      )}
                    </span>
                  }
                >
                  <div style={{ padding: "16px 8px" }}>
                    {relatedChildren.length > 0 ? (
                      relatedChildren.map((child, idx) => (
                        <div key={idx} style={{ marginBottom: 12 }}>
                          <RecordRelatedList details={{ ...child, Id: data.Id, data }} />
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                        <i className="bi bi-link-45deg" style={{ fontSize: 32, display: "block", marginBottom: 8 }} />
                        <span style={{ fontSize: 14 }}>No related records</span>
                      </div>
                    )}
                  </div>
                </Tab>
              )}

              {/* Details tab */}
              <Tab
                eventKey="details"
                title={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <i className="bi bi-info-circle" />
                    Details
                  </span>
                }
              >
                <div style={{ padding: "20px 8px" }}>
                  {entityName === "documents"
                    ? <DocumentPreview data={data} />
                    : DetailComponent
                      ? <DetailComponent isEdit={isEditMode} resetButton={() => setIsEditMode(false)} />
                      : <p style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", padding: 32 }}>
                          No detail view available for this record type.
                        </p>
                  }
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirmBack={() => { onBack?.(); refresh?.(); }}
        record={data}
        entityName={entityName}
      />
    </>
  );
}