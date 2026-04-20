import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { helperMethods } from "../utility/CMPhelper";
import { Form, Modal, Button, Spinner } from "react-bootstrap";
import { apiData } from "../utility/api";
import CustomNavbar from "../components/CustomNavbar";
import {
  UserPlus,
  Search,
  User,
  AlertCircle,
  X,
  Save,
  Building2,
  FileText,
} from "lucide-react";

export default function CustomerBanks() {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    Name: "",
    Description: "",
  });

  // -------------------------------
  // FETCH BANKS
  // -------------------------------
  async function fetchBanks() {
    setLoading(true);
    try {
      const data = await helperMethods.getEntityDetails(`banks`);
      const bankList = data;
      setBanks(bankList);
      setFilteredBanks(bankList);
    } catch {
      toast.error("Failed to load banks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBanks();
  }, []);

  // -------------------------------
  // SEARCH FILTER
  // -------------------------------
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBanks(banks);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = banks.filter(
      (b) =>
        b.Name?.toLowerCase().includes(term) ||
        b.Description?.toLowerCase().includes(term)
    );
    setFilteredBanks(filtered);
  }, [searchTerm, banks]);

  // -------------------------------
  // VALIDATION
  // -------------------------------
  function validate() {
    const newErrors = {};

    if (!form.Name.trim()) newErrors.Name = "Name is required";
    if (!form.Description.trim())
      newErrors.Description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // -------------------------------
  // OPEN ADD MODAL
  // -------------------------------
  function openAdd() {
    setErrors({});
    setForm({
      Name: "",
      Description: "",
    });
    setShowModal(true);
  }

  // -------------------------------
  // HANDLE FORM CHANGE
  // -------------------------------
  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  // -------------------------------
  // SAVE NEW BANK
  // -------------------------------
  async function handleSave(e) {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        Id: helperMethods.generateId(),
        CreatedBy: helperMethods.fetchUser(),
        CreatedDate: helperMethods.dateToString(),
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString(),
      };

      const res = await fetch(`${apiData.PORT}/api/banks/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to add bank");
        return;
      }

      toast.success(`${form.Name} was added successfully`);
      setShowModal(false);
      fetchBanks();
    } catch {
      toast.error("Failed to save bank");
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------
  // STYLES
  // -------------------------------
  const styles = `
    .users-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px 20px;
    }

    .users-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .users-title {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .add-user-btn {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      border-radius: 12px;
      padding: 12px 24px;
      font-weight: 600;
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .add-user-btn:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }

    .search-bar-wrapper {
      position: relative;
      margin-bottom: 24px;
    }

    .search-bar {
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px 16px 12px 44px;
      font-size: 15px;
      transition: all 0.2s;
      width: 100%;
      max-width: 400px;
    }

    .search-bar:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      outline: none;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      pointer-events: none;
    }

    .users-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .users-table {
      margin: 0;
      width: 100%;
    }

    .users-table thead {
      background: #f9fafb;
    }

    .users-table th {
      padding: 16px 20px;
      font-weight: 600;
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: none;
    }

    .users-table td {
      padding: 16px 20px;
      font-size: 15px;
      color: #1f2937;
      border-top: 1px solid #f3f4f6;
      vertical-align: middle;
    }

    .users-table tbody tr {
      transition: background-color 0.2s;
    }

    .users-table tbody tr:hover {
      background-color: #f9fafb;
    }

    .user-name-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
      border: none;
      background: none;
      padding: 0;
      cursor: pointer;
    }

    .user-name-link:hover {
      color: #2563eb;
      text-decoration: underline;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-state-icon {
      width: 80px;
      height: 80px;
      background: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .empty-state h4 {
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .empty-state p {
      color: #6b7280;
      margin: 0;
    }

    .loading-state {
      text-align: center;
      padding: 60px 20px;
    }

    /* Modal Styles */
    .user-modal .modal-content {
      border: none;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }

    .user-modal .modal-header {
      border: none;
      padding: 28px 28px 0;
      background: transparent;
    }

    .user-modal .modal-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-modal .btn-close {
      opacity: 0.5;
      transition: opacity 0.2s;
    }

    .user-modal .btn-close:hover {
      opacity: 1;
    }

    .user-modal .modal-body {
      padding: 24px 28px;
    }

    .user-modal .modal-footer {
      border: none;
      padding: 0 28px 28px;
      gap: 12px;
    }

    .form-field-wrapper {
      margin-bottom: 20px;
    }

    .form-field-label {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .required-star {
      color: #ef4444;
      font-size: 16px;
    }

    .form-input-group {
      position: relative;
    }

    .form-input {
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px 16px 12px 44px;
      font-size: 15px;
      transition: all 0.2s;
      width: 100%;
    }

    .form-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
      outline: none;
    }

    .form-input.is-invalid {
      border-color: #ef4444;
      padding-right: 44px;
    }

    .form-input.is-invalid:focus {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
    }

    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      pointer-events: none;
    }

    .form-error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #ef4444;
      font-size: 13px;
      margin-top: 6px;
    }

    .modal-btn {
      border-radius: 10px;
      padding: 12px 24px;
      font-weight: 600;
      font-size: 15px;
      border: none;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      min-width: 120px;
    }

    .modal-btn-cancel {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-btn-cancel:hover:not(:disabled) {
      background: #e5e7eb;
      transform: translateY(-1px);
    }

    .modal-btn-save {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .modal-btn-save:hover:not(:disabled) {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }

    .modal-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    @media (max-width: 768px) {
      .users-container {
        padding: 20px 16px;
      }

      .users-header {
        flex-direction: column;
        align-items: stretch;
      }

      .add-user-btn {
        width: 100%;
        justify-content: center;
      }

      .search-bar {
        max-width: 100%;
      }

      .users-table {
        font-size: 14px;
      }

      .users-table th,
      .users-table td {
        padding: 12px;
      }

      .user-modal .modal-body {
        padding: 20px;
      }

      .modal-btn {
        width: 100%;
      }
    }
  `;

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <>
      <style>{styles}</style>
      <CustomNavbar />

      <div className="users-container">
        {/* Header */}
        <div className="users-header">
          <h1 className="users-title">
            <Building2 size={36} />
            Customer Banks
          </h1>
          <Button className="add-user-btn" onClick={openAdd}>
            <Building2 size={20} />
            Add Bank
          </Button>
        </div>

        {/* Search Bar */}
        <div className="search-bar-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-bar"
            placeholder="Search banks by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Banks Table */}
        <div className="users-card">
          {loading ? (
            <div className="loading-state">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading banks...</p>
            </div>
          ) : filteredBanks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Building2 size={36} color="#9ca3af" />
              </div>
              <h4>{searchTerm ? "No banks found" : "No banks yet"}</h4>
              <p>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by adding your first bank"}
              </p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanks.map((b) => (
                  <tr key={b.Id}>
                    <td>
                      <button
                        className="user-name-link"
                        onClick={() => navigate(`/banks/detail/${b.Id}/view`)}
                      >
                        {b.Name}
                      </button>
                    </td>
                    <td>{b.Description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Bank Modal */}
        <Modal
          show={showModal}
          centered
          onHide={() => setShowModal(false)}
          backdrop="static"
          keyboard={false}
          className="user-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <Building2 size={24} />
              Add New Bank
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form onSubmit={handleSave}>
              {/* Name */}
              <div className="form-field-wrapper">
                <label className="form-field-label">
                  <span className="required-star">*</span>
                  Bank Name
                </label>
                <div className="form-input-group">
                  <Building2 size={18} className="input-icon" />
                  <input
                    type="text"
                    className={`form-input ${errors.Name ? "is-invalid" : ""}`}
                    value={form.Name}
                    onChange={(e) => handleFormChange("Name", e.target.value)}
                    placeholder="Enter bank name"
                  />
                </div>
                {errors.Name && (
                  <div className="form-error">
                    <AlertCircle size={14} />
                    {errors.Name}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="form-field-wrapper">
                <label className="form-field-label">
                  <span className="required-star">*</span>
                  Description
                </label>
                <div className="form-input-group">
                  <FileText size={18} className="input-icon" />
                  <input
                    type="text"
                    className={`form-input ${
                      errors.Description ? "is-invalid" : ""
                    }`}
                    value={form.Description}
                    onChange={(e) =>
                      handleFormChange("Description", e.target.value)
                    }
                    placeholder="Enter description"
                  />
                </div>
                {errors.Description && (
                  <div className="form-error">
                    <AlertCircle size={14} />
                    {errors.Description}
                  </div>
                )}
              </div>
            </Form>
          </Modal.Body>

          <Modal.Footer>
            <Button
              className="modal-btn modal-btn-cancel"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              <X size={18} />
              Cancel
            </Button>
            <Button
              className="modal-btn modal-btn-save"
              onClick={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Bank
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}
