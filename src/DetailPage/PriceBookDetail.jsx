import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import RecordLinkField from "../components/RecordLinkField";
import { helperMethods } from "../utility/CMPhelper";
import { toast } from "react-toastify";
import { apiData } from "../utility/api";

// const API = 'https://jpfincorp.com';

export default function PricebookDetail({ isEdit, resetButton }) {
  const { id } = useParams();
  // const navigate = useNavigate();

  const [pricebook, setPricebook] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setEditMode(isEdit);
    if (isEdit) {
      fetchPricebook();
    }
  }, [isEdit]);
  // ------------------------
  // FETCH PRICEBOOK
  // ------------------------
  async function fetchPricebook() {
    try {
      setLoading(true);
      const res = await fetch(`${apiData.PORT}/api/get/pricebook?Id=${id}`);
      const data = await res.json();

      if (!res.ok || !data.data || data.data.length === 0) {
        toast.error(data.error || "Failed to load pricebook");
        setPricebook(null);
        return;
      }

      const record = data.data[0];
      setPricebook(record);
      setForm(record);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pricebook");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPricebook();
  }, [id]);

  // ------------------------
  // SAVE
  // ------------------------
  async function handleSave() {

    try {
      setSaving(true);
      const payload = {
        ...form,
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString()
      };
      const res = await fetch(`${apiData.PORT}/api/pricebook/update`, {
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
      fetchPricebook();

    } catch {
      toast.error("Unexpected error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading pricebook…</div>;
  if (!pricebook) return <div>No pricebook found.</div>;

  // ------------------------
  // FIELD RENDERER
  // ------------------------
  const renderField = (label, name, options = {}) => {
    const { editable = true, type = "text",required = false  } = options;
    const value = editMode ? form[name] : pricebook[name];

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
        <div className="d-flex justify-content-between align-items-center mb-3">
         <h2 className="fw-bold mb-0">Pricebook Details</h2>
        </div>

        {/* ========================================================= */}
        {/* PRICEBOOK INFORMATION                                     */}
        {/* ========================================================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-tags me-2"></i>Pricebook Information
          </h4>

          <div className="row">

            <div className="col-md-6">
              {renderField("Pricebook Name", "PricebookName", { editable: false ,required:true})}
            </div>

            <div className="col-md-6">
              {/* Lookup: Dealer */}
              <Form.Group className="mb-3">
                <RecordLinkField
                isRequired="true"
                  label="Dealer"
                  id={pricebook.dealer_id}
                  firstName={pricebook.dealer_Name}
                  table="dealer"
                />
              </Form.Group>
            </div>

            <div className="col-md-6">
              {/* IsActive Checkbox */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Active</Form.Label>

                {editMode ? (
                  <Form.Check
                    type="checkbox"
                    label="Is Active"
                    checked={!!form.IsActive}
                    onChange={(e) =>
                      setForm(prev => ({ ...prev, IsActive: e.target.checked ? 1 : 0 }))
                    }
                  />
                ) : (
                  <div className="p-2 bg-light rounded">
                    {pricebook.IsActive ? "Yes" : "No"}
                  </div>
                )}
              </Form.Group>
            </div>

          </div>
        </section>

        {/* ========================================================= */}
        {/* SYSTEM INFORMATION                                        */}
        {/* ========================================================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-clock-history me-2"></i>System Information
          </h4>

          <div className="row">

            <div className="col-md-6">
              <RecordLinkField
                label="Created By"
                id={pricebook.createdby_id}
                firstName={pricebook.createdby_firstname}
                lastName={pricebook.createdby_lastname}
                table="user"
              />

            </div>

            <div className="col-md-6">
              <RecordLinkField
                label="Modified By"
                id={pricebook.modifiedby_id}
                firstName={pricebook.modifiedby_firstname}
                lastName={pricebook.modifiedby_lastname}
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
                fetchPricebook();
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
