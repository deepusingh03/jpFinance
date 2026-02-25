import React, { useState } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { apiData } from "../utility/api";
import { toast } from "react-toastify";
import { Trash2, AlertTriangle } from "lucide-react";

function DeleteConfirmationModal({ show, onHide, record, entityName, onConfirmBack }) {
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    if (!record?.Id) {
      toast.error("Invalid record. Cannot delete.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiData.PORT}/api/delete/${entityName}/${record.Id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed");
      }

      toast.success(`${record.Name || record.FirstName || "Record"} was deleted successfully.`);
      
      onConfirmBack && onConfirmBack();
      onHide();
      
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete the record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered
      className="delete-modal"
    >
      <style>{`
        .delete-modal .modal-content {
          border: none;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }
        
        .delete-modal .modal-header {
          border: none;
          padding: 32px 32px 0;
          background: transparent;
        }
        
        .delete-modal .btn-close {
          position: absolute;
          right: 20px;
          top: 20px;
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        
        .delete-modal .btn-close:hover {
          opacity: 1;
        }
        
        .delete-modal .modal-body {
          padding: 0 32px 32px;
        }
        
        .delete-modal .modal-footer {
          border: none;
          padding: 0 32px 32px;
          gap: 12px;
        }
        
        .delete-icon-wrapper {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          animation: scaleIn 0.3s ease-out;
        }
        
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .delete-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          text-align: center;
          margin-bottom: 12px;
        }
        
        .delete-message {
          font-size: 15px;
          color: #6b7280;
          text-align: center;
          line-height: 1.6;
          margin-bottom: 0;
        }
        
        .delete-record-name {
          display: block;
          font-weight: 600;
          color: #dc2626;
          margin-top: 8px;
          font-size: 16px;
        }
        
        .warning-box {
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 12px;
          padding: 16px;
          margin-top: 20px;
          display: flex;
          gap: 12px;
          align-items: start;
        }
        
        .warning-box-icon {
          flex-shrink: 0;
          color: #d97706;
          margin-top: 2px;
        }
        
        .warning-box-text {
          font-size: 13px;
          color: #92400e;
          line-height: 1.5;
          margin: 0;
        }
        
        .delete-modal .btn {
          border-radius: 10px;
          font-weight: 600;
          padding: 12px 24px;
          font-size: 15px;
          border: none;
          transition: all 0.2s;
          flex: 1;
        }
        
        .delete-modal .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }
        
        .delete-modal .btn-secondary:hover:not(:disabled) {
          background: #e5e7eb;
          transform: translateY(-1px);
        }
        
        .delete-modal .btn-danger {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }
        
        .delete-modal .btn-danger:hover:not(:disabled) {
          background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
          box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
          transform: translateY(-1px);
        }
        
        .delete-modal .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .delete-spinner {
          margin-right: 8px;
        }
      `}</style>

      <Modal.Header closeButton>
        <div style={{ width: '100%' }}>
          <div className="delete-icon-wrapper">
            <Trash2 size={28} color="#dc2626" strokeWidth={2.5} />
          </div>
          <h2 className="delete-title">Delete {entityName}?</h2>
        </div>
      </Modal.Header>

      <Modal.Body>
        <p className="delete-message">
          {record ? (
            <>
              You are about to permanently delete
              <span className="delete-record-name">
                {record.Name || record.FirstName || "this record"}
              </span>
            </>
          ) : (
            "You are about to permanently delete this record."
          )}
        </p>
        
        <div className="warning-box">
          <AlertTriangle size={20} className="warning-box-icon" />
          <p className="warning-box-text">
            This action cannot be undone. All data associated with this {entityName?.toLowerCase() || "record"} will be permanently removed.
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading && <Spinner size="sm" animation="border" className="delete-spinner" />}
          {loading ? "Deleting..." : "Delete Permanently"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default DeleteConfirmationModal;