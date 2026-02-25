import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import RecordLinkField from "../components/RecordLinkField";
import { helperMethods } from "../utility/CMPhelper";
import { toast } from "react-toastify";
import { apiData } from "../utility/api";

// const API = 'https://jpfincorp.com';

export default function PricebookEntryDetail({ isEdit, resetButton }) {
  const { id } = useParams();
  // const navigate = useNavigate();

  const [entry, setEntry] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});


  useEffect(() => {
    setEditMode(isEdit);
    if (isEdit) {
      fetchEntry();
    }
  }, [isEdit]);
  // -------------------------------------------------
  // FETCH PRICEBOOK ENTRY
  // -------------------------------------------------
  async function fetchEntry() {
    try {
      setLoading(true);
      const res = await fetch(`${apiData.PORT}/api/get/pricebookentry?Id=${id}`);
      const data = await res.json();

      if (!res.ok || !data.data || data.data.length === 0) {
        toast.error(data.error || "Failed to load pricebookentry");
        setEntry(null);
        return;
      }

      const record = data.data[0];
      setEntry(record);
      setForm(record);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pricebookentry");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEntry();
  }, [id]);

  // -------------------------------------------------
  // VALIDATION
  // -------------------------------------------------
  function validate() {
    const newErrors = {};

    ["Name", "Unitprice"].forEach(f => {
      if (!form[f] || !form[f].toString().trim()) {
        newErrors[f] = "This field is required";
      }
    });

    if (form.Unitprice && isNaN(Number(form.Unitprice))) {
      newErrors.Unitprice = "Unit Price must be numeric";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // -------------------------------------------------
  // SAVE RECORD
  // -------------------------------------------------
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
        ModifiedDate: helperMethods.dateToString()
      };
      const res = await fetch(`${apiData.PORT}/api/pricebookentry/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Update failed.");
        return;
      }

      toast.success(payload.Name + " was updated successfully.");
      setEditMode(false);
      fetchEntry();
      resetButton();
    } catch (e) {
      toast.error("Unexpected error."+e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading pricebook entry…</div>;
  if (!entry) return <div>No pricebook entry found.</div>;

  // -------------------------------------------------
  // RENDER FIELD HELPER
  // -------------------------------------------------
  const renderField = (label, name, options = {}) => {
    const { editable = true, type = "text" ,required = false } = options;
    const value = editMode ? form[name] : entry[name];

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
              value={value || ""}
              onChange={(e) => {
                const val = e.target.value;
                setForm(prev => ({ ...prev, [name]: val }));
                setErrors(prev => ({ ...prev, [name]: "" }));
              }}
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

  return (
    <div>
      <div className="card p-4 shadow-sm rounded-4">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">Pricebook Entry Details</h2>
        </div>

        {/* ============================
            PRICEBOOK ENTRY INFORMATION
        ============================ */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3"><i className="bi bi-tag me-2"></i>Pricebook Entry Information</h4>

          <div className="row">

            <div className="col-md-6">
              {renderField("Name", "Name", { editable: false, })}
            </div>

            <div className="col-md-6">
              {renderField("Unit Price", "Unitprice", { type: "number",required:true })}
            </div>

            {/* Pricebook Lookup */}
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <RecordLinkField
                isRequired="true"
                  label="Pricebook"
                  id={entry.pricebook_id}
                  firstName={entry.pricebook_Name}
                  table="pricebook"
                />
              </Form.Group>
            </div>

            {/* Product Lookup */}
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <RecordLinkField
                isRequired="true"
                  label="Product"
                  id={entry.Product}
                  firstName={entry.product_Name}
                  table="product"
                />
              </Form.Group>
            </div>

          </div>
        </section>

        {/* ============================
            SYSTEM INFORMATION
        ============================ */}
        <section>
          <h4 className="fw-bold mb-3"><i className="bi bi-clock-history me-2"></i>System Information</h4>

          <div className="row">
            <div className="col-md-6">
              <RecordLinkField
                label="Created By"
                id={entry.createdby_id}
                firstName={entry.createdby_firstname}
                lastName={entry.createdby_lastname}
                table="user"
              />

            </div>

            <div className="col-md-6">
              <RecordLinkField
                label="Modified By"
                id={entry.modifiedby_id}
                firstName={entry.modifiedby_firstname}
                lastName={entry.modifiedby_lastname}
                table="user"
              />
            </div>

            <div className="col-md-6">
              {renderField("Created Date", "CreatedDate", { editable: false })}
            </div>

            <div className="col-md-6">
              {renderField("Modified Date", "ModifiedDate", { editable: false })}
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
