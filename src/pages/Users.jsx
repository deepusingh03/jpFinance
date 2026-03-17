import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { helperMethods } from "../utility/CMPhelper";
import { Form, Modal, Button, Spinner, InputGroup } from "react-bootstrap";
import { apiData } from "../utility/api";
import CustomNavbar from "../components/CustomNavbar";
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  User,
  Lock,
  AlertCircle,
  X,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    FirstName: "",
    LastName: "",
    Email: "",
    Phone: "",
    Password: "",
  });

  // -------------------------------
  // FETCH USERS
  // -------------------------------
  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${apiData.PORT}/api/get/users`);
      const data = await res.json();
      const userList = data.data || [];
      setUsers(userList);
      setFilteredUsers(userList);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // -------------------------------
  // SEARCH FILTER
  // -------------------------------
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.FirstName?.toLowerCase().includes(term) ||
        u.LastName?.toLowerCase().includes(term) ||
        u.Email?.toLowerCase().includes(term) ||
        u.Phone?.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // -------------------------------
  // VALIDATION
  // -------------------------------
  function validate() {
    const newErrors = {};

    if (!form.FirstName.trim()) newErrors.FirstName = "First name is required";
    if (!form.LastName.trim()) newErrors.LastName = "Last name is required";
    if (!form.Email.trim()) newErrors.Email = "Email is required";
    if (!form.Phone.trim()) newErrors.Phone = "Phone is required";
    if (!form.Password.trim()) newErrors.Password = "Password is required";

    if (form.Email && !emailRegex.test(form.Email)) {
      newErrors.Email = "Invalid email format";
    }

    // Duplicate email check
    const duplicate = users.find(
      (u) => u.Email.toLowerCase() === form.Email.toLowerCase()
    );
    if (duplicate) {
      newErrors.Email = "Email already exists";
    }

    if (form.Phone && !phoneRegex.test(form.Phone)) {
      newErrors.Phone = "Invalid phone format (8-20 digits)";
    }

    if (form.Password && !strongPasswordRegex.test(form.Password)) {
      newErrors.Password =
        "Password must be 8+ characters with uppercase, lowercase, number & special character";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // -------------------------------
  // OPEN ADD MODAL
  // -------------------------------
  function openAdd() {
    setErrors({});
    setForm({
      FirstName: "",
      LastName: "",
      Email: "",
      Phone: "",
      Password: "",
    });
    setShowPassword(false);
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
  // SAVE NEW USER
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

      const res = await fetch(`${apiData.PORT}/api/users/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to add user");
        return;
      }

      toast.success(
        `${form.FirstName} ${form.LastName} was added successfully`
      );
      setShowModal(false);
      fetchUsers();
    } catch {
      toast.error("Failed to save user");
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

    .password-toggle {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      transition: color 0.2s;
    }

    .password-toggle:hover {
      color: #374151;
    }

    .form-error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #ef4444;
      font-size: 13px;
      margin-top: 6px;
    }

    .password-hint {
      font-size: 12px;
      color: #6b7280;
      margin-top: 6px;
      line-height: 1.5;
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
            <User size={36} />
            Users
          </h1>
          <Button className="add-user-btn" onClick={openAdd}>
            <UserPlus size={20} />
            Add User
          </Button>
        </div>

        {/* Search Bar */}
        <div className="search-bar-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-bar"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="users-card">
          {loading ? (
            <div className="loading-state">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <User size={36} color="#9ca3af" />
              </div>
              <h4>{searchTerm ? "No users found" : "No users yet"}</h4>
              <p>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by adding your first user"}
              </p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.Id}>
                    <td>
                      <button
                        className="user-name-link"
                        onClick={() => navigate(`/users/detail/${u.Id}/view`)}
                      >
                        {u.FirstName} {u.LastName}
                      </button>
                    </td>
                    <td>{u.Email}</td>
                    <td>{u.Phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add User Modal */}
        <Modal
          show={showModal}
          centered
          onHide={() => setShowModal(false)}
          backdrop="static"
          keyboard={false}
          className="user-modal"
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <UserPlus size={24} />
              Add New User
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form onSubmit={handleSave}>
              <div className="row">
                {/* First Name */}
                <div className="col-md-6">
                  <div className="form-field-wrapper">
                    <label className="form-field-label">
                      <span className="required-star">*</span>
                      First Name
                    </label>
                    <div className="form-input-group">
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        className={`form-input ${
                          errors.FirstName ? "is-invalid" : ""
                        }`}
                        value={form.FirstName}
                        onChange={(e) =>
                          handleFormChange("FirstName", e.target.value)
                        }
                        placeholder="Enter first name"
                      />
                    </div>
                    {errors.FirstName && (
                      <div className="form-error">
                        <AlertCircle size={14} />
                        {errors.FirstName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Last Name */}
                <div className="col-md-6">
                  <div className="form-field-wrapper">
                    <label className="form-field-label">
                      <span className="required-star">*</span>
                      Last Name
                    </label>
                    <div className="form-input-group">
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        className={`form-input ${
                          errors.LastName ? "is-invalid" : ""
                        }`}
                        value={form.LastName}
                        onChange={(e) =>
                          handleFormChange("LastName", e.target.value)
                        }
                        placeholder="Enter last name"
                      />
                    </div>
                    {errors.LastName && (
                      <div className="form-error">
                        <AlertCircle size={14} />
                        {errors.LastName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <div className="form-field-wrapper">
                    <label className="form-field-label">
                      <span className="required-star">*</span>
                      Email
                    </label>
                    <div className="form-input-group">
                      <Mail size={18} className="input-icon" />
                      <input
                        type="email"
                        className={`form-input ${
                          errors.Email ? "is-invalid" : ""
                        }`}
                        value={form.Email}
                        onChange={(e) =>
                          handleFormChange("Email", e.target.value)
                        }
                        placeholder="user@example.com"
                      />
                    </div>
                    {errors.Email && (
                      <div className="form-error">
                        <AlertCircle size={14} />
                        {errors.Email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="col-md-6">
                  <div className="form-field-wrapper">
                    <label className="form-field-label">
                      <span className="required-star">*</span>
                      Phone
                    </label>
                    <div className="form-input-group">
                      <Phone size={18} className="input-icon" />
                      <input
                        type="tel"
                        className={`form-input ${
                          errors.Phone ? "is-invalid" : ""
                        }`}
                        value={form.Phone}
                        onChange={(e) =>
                          handleFormChange("Phone", e.target.value)
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    {errors.Phone && (
                      <div className="form-error">
                        <AlertCircle size={14} />
                        {errors.Phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div className="col-12">
                  <div className="form-field-wrapper">
                    <label className="form-field-label">
                      <span className="required-star">*</span>
                      Password
                    </label>
                    <div className="form-input-group">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`form-input ${
                          errors.Password ? "is-invalid" : ""
                        }`}
                        value={form.Password}
                        onChange={(e) =>
                          handleFormChange("Password", e.target.value)
                        }
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {errors.Password ? (
                      <div className="form-error">
                        <AlertCircle size={14} />
                        {errors.Password}
                      </div>
                    ) : (
                      <div className="password-hint">
                        Must be 8+ characters with uppercase, lowercase, number
                        & special character
                      </div>
                    )}
                  </div>
                </div>
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
                  Save User
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}
