import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Form, Button, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { helperMethods } from "../utility/CMPhelper";
import RecordLinkField from "../components/RecordLinkField";
import { apiData } from "../utility/api";

// const API = 'https://jpfincorp.com';
const phoneRegex = /^[0-9+\-\s()]{8,20}$/;

export default function UserDetail({ isEdit, resetButton }) {
  const { id } = useParams();
  // const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setEditMode(isEdit);
    if (isEdit) {
      fetchUser();
    }
  }, [isEdit]);
  // ---------------------------
  // Fetch User
  // ---------------------------
  async function fetchUser() {
    try {
      setLoading(true);
      const res = await fetch(`${apiData.PORT}/api/get/users?Id=${id}`);
      const data = await res.json();

      if (!res.ok || !data.data) {
        toast.error("Failed to load user");
        setUser(null);
        return;
      }

      setUser(data.data[0]);
    } catch (err) {
      console.error(err);
      toast.error("Server error loading user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, [id]);

  // ---------------------------
  // Helpers
  // ---------------------------
  const updateField = (name, value) => {
    if (!editMode) return;
    setUser((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const renderField = (label, name, options = {}) => {
    const { type = "text", as = "input", editable = true ,required = false} = options;
    const value = user?.[name] ?? "";

    return (
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">
        {required && (
            <span className="text-danger">* </span> 
          )} 
          {label}</Form.Label>
        {editMode && editable ? (
          <>
            <Form.Control
              type={type}
              as={as === "textarea" ? "textarea" : "input"}
              rows={as === "textarea" ? 3 : undefined}
              value={value}
              onChange={(e) => updateField(name, e.target.value)}
              isInvalid={!!errors[name]}
            />
            <Form.Control.Feedback type="invalid">
              {errors[name]}
            </Form.Control.Feedback>
          </>
        ) : (
          <div className="p-2 bg-light rounded">{value || "—"}</div>
        )}
      </Form.Group>
    );
  };

  // ---------------------------
  // Validation
  // ---------------------------
  const validateFields = () => {
    const newErrors = {};
    if (!user.FirstName) newErrors.FirstName = "This field is required";
    if (!user.LastName) newErrors.LastName = "This field is required";

    if (user.Phone && user.Phone.trim()) {
      if (!phoneRegex.test(user.Phone.trim())) {
        if (!newErrors.Phone) newErrors.Phone = "Invalid phone format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------
  // Save User
  // ---------------------------
  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;
    if (!validateFields()) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...user,
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString(),
      };

      const res = await fetch(`${apiData.PORT}/api/users/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Update failed");
        setSubmitting(false);
        return;
      }

      toast.success(payload.FirstName + " was updated successfully");

      setSubmitting(false);
      setEditMode(false);
      fetchUser();
    } catch (err) {
      setSubmitting(false);
      toast.error("Server error updating user", +err);
    }
  }

  if (loading) return <div>Loading user...</div>;
  if (!user) return <div>No user found.</div>;

  // ===========================
  //   UI START
  // ===========================
  return (
    <div className="card p-4 shadow-sm rounded-4">
      {/* Header */}
      <div className="d-flex justify-content-between mb-3">
        <h2 className="fw-bold">User Details</h2>
      </div>

      <Form onSubmit={handleSave}>
        {/* ================= USER INFORMATION ================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-person-circle me-2"></i>User Information
          </h4>

          <div className="row">
            <div className="col-md-6">
              {renderField("First Name", "FirstName",{required :true})}
            </div>
            <div className="col-md-6">
              {renderField("Last Name", "LastName",{required :true})}
            </div>
            <div className="col-md-6">
              {renderField("Email", "Email", { editable: false,required :true })}
            </div>
            <div className="col-md-6">{renderField("Phone", "Phone",{required :true})}</div>
          </div>
        </section>

        {/* ================= SYSTEM INFORMATION ================= */}
        <section className="mb-2">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-clock-history me-2"></i>System Information
          </h4>

          <div className="row">
            <div className="col-md-6">
              <RecordLinkField
                label="Created By"
                id={user.createdby_id}
                firstName={user.createdby_firstname}
                lastName={user.createdby_lastname}
                table="user"
              />
            </div>
            <div className="col-md-6">
              <RecordLinkField
                label="Modified By"
                id={user.modifiedby_id}
                firstName={user.modifiedby_firstname}
                lastName={user.modifiedby_lastname}
                table="user"
              />
            </div>

            <div className="col-md-6">
              {renderField("Created Date", "CreatedDate", { editable: false })}
            </div>
            <div className="col-md-6">
              {renderField("Modified Date", "ModifiedDate", {
                editable: false,
              })}
            </div>
          </div>
        </section>
        {editMode ? (
          <div className="d-flex justify-content-center gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                resetButton();
                setEditMode(false);
                setErrors({});
              }}
            >
              Cancel
            </Button>

            <Button variant="dark" onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : null}
      </Form>
    </div>
  );
}
