import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Form, Modal, Button, Spinner } from "react-bootstrap";
import { helperMethods } from "../utility/CMPhelper";
import { apiData } from "../utility/api";
import CustomNavbar from "../components/CustomNavbar";
import {
  Search,
  AlertCircle,
  X,
  Save,
  FileText,
  Plus,
  Pencil,
} from "lucide-react";

export default function LoanDefaultValues() {
  const [loanDefaults, setLoanDefaults] = useState([]);
  const [filteredDefaults, setFilteredDefaults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    Type: "",
    Value: "",
  });

  const loanTypes = [
    "Rate Interest Rate",
    "EMI Bounce Charge",
    "OD Charge Rate",
    "File Charge",
    "Processing Fee",
    "Tenure",
  ];

  // -------------------------------
  // FETCH
  // -------------------------------
  async function fetchLoanDefaultValues() {
    setLoading(true);
    try {
      const res = await fetch(`${apiData.PORT}/api/get/loandefaultvalue`);
      const data = await res.json();
      const list = data.data || [];
      setLoanDefaults(list);
      setFilteredDefaults(list);
    } catch {
      toast.error("Failed to load loan default values");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLoanDefaultValues();
  }, []);

  // -------------------------------
  // SEARCH
  // -------------------------------
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDefaults(loanDefaults);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = loanDefaults.filter(
      (d) =>
        d.Type?.toLowerCase().includes(term) ||
        d.Value?.toLowerCase().includes(term)
    );
    setFilteredDefaults(filtered);
  }, [searchTerm, loanDefaults]);

  // -------------------------------
  // VALIDATION
  // -------------------------------
  function validate() {
    const newErrors = {};

    if (!form.Type) newErrors.Type = "Type is required";
    if (!form.Value.trim()) newErrors.Value = "Value is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // -------------------------------
  // OPEN ADD
  // -------------------------------
  function openAdd() {
    setEditingId(null);
    setErrors({});
    setForm({
      Type: "",
      Value: "",
    });
    setShowModal(true);
  }

  // -------------------------------
  // OPEN EDIT
  // -------------------------------
  function openEdit(record) {
    setEditingId(record.Id);
    setErrors({});
    setForm({
      Type: record.Type || "",
      Value: record.Value || "",
    });
    setShowModal(true);
  }

  // -------------------------------
  // HANDLE CHANGE
  // -------------------------------
  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  // -------------------------------
  // SAVE (ADD / EDIT)
  // -------------------------------
  async function handleSave(e) {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    // ✅ UNIQUE TYPE CHECK (ONLY WHEN ADDING)
    if (!editingId) {
      const exists = loanDefaults.some(
        (d) => d.Type.toLowerCase() === form.Type.toLowerCase()
      );

      if (exists) {
        toast.error("This Type already exists");
        return;
      }
    }

    setSubmitting(true);

    try {
      if (editingId) {
        // -------- EDIT --------
        const payload = {
          Id: editingId,
          Type: form.Type,
          Value: form.Value,
          ModifiedBy: helperMethods.fetchUser(),
          ModifiedDate: helperMethods.dateToString(),
        };

        const res = await fetch(`${apiData.PORT}/api/loandefaultvalue/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!data.success) {
          toast.error(data.error || "Failed to update");
          return;
        }

        toast.success("Record updated successfully");
      } else {
        // -------- ADD --------
        const payload = {
          Id: helperMethods.generateId(),
          Type: form.Type,
          Value: form.Value,
          CreatedBy: helperMethods.fetchUser(),
          CreatedDate: helperMethods.dateToString(),
          ModifiedBy: helperMethods.fetchUser(),
          ModifiedDate: helperMethods.dateToString(),
        };

        const res = await fetch(`${apiData.PORT}/api/loandefaultvalue/insert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!data.success) {
          toast.error(data.error || "Failed to add");
          return;
        }

        toast.success("Loan default value added successfully");
      }

      setShowModal(false);
      fetchLoanDefaultValues();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }
  const styles = `.users-container { max-width: 1400px; margin: 0 auto; padding: 32px 20px; min-height: calc(100vh - 80px); } .users-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; } .users-title { font-size: 32px; font-weight: 700; color: #1a1a1a; display: flex; align-items: center; gap: 12px; margin: 0; } .add-user-btn { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; border-radius: 12px; padding: 12px 24px; font-weight: 600; color: white; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.3s ease; } .add-user-btn:hover { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); transform: translateY(-2px); } .add-user-btn:active { transform: translateY(0); } .search-bar-wrapper { position: relative; margin-bottom: 24px; } .search-bar { border: 2px solid #e5e7eb; border-radius: 12px; padding: 12px 16px 12px 44px; width: 100%; max-width: 400px; font-size: 15px; transition: all 0.3s ease; outline: none; } .search-bar:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); } .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #6b7280; pointer-events: none; } .users-card { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); overflow: hidden; } .users-table { width: 100%; border-collapse: collapse; } .users-table thead { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); } .users-table th { padding: 16px 20px; text-align: left; font-weight: 600; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; } .users-table td { padding: 16px 20px; border-bottom: 1px solid #f3f4f6; color: #1e293b; font-size: 15px; } .users-table tbody tr { transition: background-color 0.2s ease; } .users-table tbody tr:hover { background-color: #f8fafc; } .users-table tbody tr:last-child td { border-bottom: none; } .edit-btn { background: none; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 7px; color: #3b82f6; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease; line-height: 1; } .edit-btn:hover { background-color: #eff6ff; border-color: #3b82f6; color: #2563eb; } .loading-state, .empty-state { text-align: center; padding: 60px 20px; color: #64748b; } .loading-state .spinner-border { color: #3b82f6; } .empty-state p { font-size: 16px; margin: 0; } /* Modal Improvements */ .modal-content { border-radius: 16px; border: none; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); } .modal-header { border-bottom: 1px solid #f3f4f6; padding: 20px 24px; } .modal-title { font-weight: 600; color: #1a1a1a; font-size: 20px; } .modal-body { padding: 24px; } .modal-footer { border-top: 1px solid #f3f4f6; padding: 16px 24px; gap: 12px; } .modal-footer .btn { border-radius: 8px; padding: 10px 20px; font-weight: 500; display: flex; align-items: center; gap: 8px; } .modal-footer .btn-secondary { background-color: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; } .modal-footer .btn-secondary:hover { background-color: #e2e8f0; border-color: #cbd5e1; } .modal-footer .btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; } .modal-footer .btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); } .modal-footer .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; } /* Form Improvements */ .form-label { font-weight: 500; color: #374151; margin-bottom: 8px; font-size: 14px; } .form-control, .form-select { border-radius: 8px; border: 2px solid #e5e7eb; padding: 10px 14px; font-size: 15px; transition: all 0.2s ease; } .form-control:focus, .form-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); outline: none; } .form-control.is-invalid, .form-select.is-invalid { border-color: #ef4444; } .invalid-feedback { font-size: 13px; margin-top: 6px; } /* Responsive Design */ @media (max-width: 768px) { .users-container { padding: 20px 16px; } .users-title { font-size: 24px; } .users-header { flex-direction: column; align-items: flex-start; } .add-user-btn { width: 100%; justify-content: center; } .search-bar { max-width: 100%; } .users-table { font-size: 14px; } .users-table th, .users-table td { padding: 12px 16px; } } `;
  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <>
    <style>{styles}</style>
      <CustomNavbar />

      <div className="users-container">
        <div className="users-header">
          <h1 className="users-title">
            <FileText size={36} />
            Loan Default Values
          </h1>

          <Button className="add-user-btn" onClick={openAdd}>
            <Plus size={20} />
            Add Default Value
          </Button>
        </div>

        <div className="search-bar-wrapper">
          <Search size={20} className="search-icon" />
          <input
            className="search-bar"
            placeholder="Search by type or value..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="users-card">
          {loading ? (
            <div className="loading-state">
              <Spinner animation="border" />
              <p style={{ marginTop: "16px" }}>Loading...</p>
            </div>
          ) : filteredDefaults.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} />
              <p>No loan default values found</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Value</th>
                  <th style={{ width: "60px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDefaults.map((d) => (
                  <tr key={d.Id}>
                    <td>{d.Type}</td>
                    <td>{d.Value}</td>
                    <td>
                      <button className="edit-btn" onClick={() => openEdit(d)}>
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL */}
        <Modal
          show={showModal}
          centered
          backdrop="static"
          onHide={() => setShowModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {editingId ? "Edit Loan Default Value" : "Add Loan Default Value"}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form onSubmit={handleSave}>
              {/* TYPE */}
              <Form.Group className="mb-3">
                <Form.Label>
                  Type {editingId && "(Cannot be changed)"}
                </Form.Label>

                <Form.Select
                  value={form.Type}
                  disabled={!!editingId} // ✅ LOCK IN EDIT MODE
                  isInvalid={!!errors.Type}
                  onChange={(e) => handleFormChange("Type", e.target.value)}
                >
                  <option value="">Select Type</option>
                  {loanTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Form.Select>

                <Form.Control.Feedback type="invalid">
                  {errors.Type}
                </Form.Control.Feedback>
              </Form.Group>

              {/* VALUE */}
              <Form.Group>
                <Form.Label>Value *</Form.Label>
                <Form.Control
                  value={form.Value}
                  isInvalid={!!errors.Value}
                  onChange={(e) => handleFormChange("Value", e.target.value)}
                  placeholder="Enter value"
                />

                <Form.Control.Feedback type="invalid">
                  {errors.Value}
                </Form.Control.Feedback>
              </Form.Group>
            </Form>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              <X size={16} /> Cancel
            </Button>

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> {editingId ? "Update" : "Save"}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}
