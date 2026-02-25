import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { helperMethods } from "../utility/CMPhelper";
import RecordLinkField from "../components/RecordLinkField";
import { toast } from "react-toastify";
import { apiData } from "../utility/api";

export default function BrandDetail({ isEdit, resetButton }) {
  const { id } = useParams();
  // const navigate = useNavigate();

  const [brand, setBrand] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setEditMode(isEdit);
    if (isEdit) {
      fetchBrand();
    }
  }, [isEdit]);
  // ----------------------------
  // FETCH DEALER BY ID
  // ----------------------------
  async function fetchBrand() {
    try {
      setLoading(true);
      const res = await fetch(`${apiData.PORT}/api/get/brands?Id=${id}`);

      const data = await res.json();

      if (!res.ok || !data.data || data.data.length === 0) {
        toast.error("Failed to load brand details.");
        setBrand(null);
        return;
      }

      const record = data.data[0];
      setBrand(record);
      setForm(record);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load brand details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBrand();
  }, [id]);

  // ----------------------------
  // VALIDATION
  // ----------------------------
  function validate() {
    const newErrors = {};

    // Required
    ["Name"].forEach((f) => {
      if (!form[f] || !form[f].toString().trim()) {
        newErrors[f] = "This field is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ----------------------------
  // SAVE DEALER
  // ----------------------------
  async function handleSave() {
    if (!validate()) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString(),
      };
      const res = await fetch(`${apiData.PORT}/api/brands/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Update failed.");
        return;
      }

      toast.success(payload.Name+" was updated successfully.");
      setEditMode(false);
      resetButton()
      fetchBrand();
    } catch (e) {
      console.error(e);
      toast.error("Unexpected error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading brand details…</div>;
  if (!brand) return <div>No brand found.</div>;

  // ----------------------------
  // FIELD RENDER HELPERS
  // ----------------------------
  const renderField = (label, name, options = {}) => {
    const { editable = true, textarea = false,required = false  } = options;
    const value = editMode ? form[name] : brand[name];

    return (
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold"> 
          {required && (
            <span className="text-danger">* </span> 
          )} 
          {label}</Form.Label>

        {editMode && editable ? (
          <>
            {textarea ? (
              <Form.Control
                as="textarea"
                rows={4}
                value={value || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({ ...prev, [name]: val }));
                  setErrors((prev) => ({ ...prev, [name]: "" }));
                }}
                isInvalid={!!errors[name]}
              />
            ) : (
              <Form.Control
                value={value || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({ ...prev, [name]: val }));
                  setErrors((prev) => ({ ...prev, [name]: "" }));
                }}
                isInvalid={!!errors[name]}
              />
            )}

            <Form.Control.Feedback type="invalid">
              {errors[name]}
            </Form.Control.Feedback>
          </>
        ) : (
          <div
            className="p-2 bg-light rounded"
            style={{ whiteSpace: "pre-wrap" }}
          >
            {value || "—"}
          </div>
        )}
      </Form.Group>
    );
  };

  return (
    <div>
      <div className="card p-4 shadow-sm rounded-4">
        {/* HEADER */}
        <div className="d-flex justify-content-between mb-3">

          <h2 className="fw-bold">Brand Details</h2>
        </div>

        {/* ================= Brand INFO ================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-tag me-2"></i>Brand Information
          </h4>

          <div className="row">
            <div className="col-md-6">{renderField("Name", "Name",{required:true})}</div>
            <div className="col-md-6">
              {renderField("Description", "Description", { textarea: true })}
            </div>
          </div>
        </section>

        {/* ================= SYSTEM INFO (READ-ONLY + LINKS) ================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-clock-history me-2"></i>System Information
          </h4>

          <div className="row">
            <div className="col-md-6">
              <RecordLinkField
                label="Created By"
                id={brand.createdby_id}
                firstName={brand.createdby_firstname}
                lastName={brand.createdby_lastname}
                table="user"
              />
            </div>

            <div className="col-md-6">
              <RecordLinkField
                label="Modified By"
                id={brand.modifiedby_id}
                firstName={brand.modifiedby_firstname}
                lastName={brand.modifiedby_lastname}
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

            <Button variant="dark" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
