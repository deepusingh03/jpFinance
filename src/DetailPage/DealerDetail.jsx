import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { apiData } from "../utility/api";
import { helperMethods } from "../utility/CMPhelper";
import RecordLinkField from "../components/RecordLinkField";

// const API = process.env.REACT_APP_API_BASE;

// Email & phone format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
export default function DealerDetail({isEdit,resetButton}) {
  const { id } = useParams();
  const [dealer, setDealer] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

useEffect(()=>{
  setEditMode(isEdit);
},[isEdit])

  // ----------------------------
  // FETCH DEALER BY ID
  // ----------------------------
  async function fetchDealer() {
    try {
      setLoading(true);
      const res = await fetch(`${apiData.PORT}/api/get/dealers/?Id=${id}`);

      const data = await res.json();

      if (!res.ok || !data.data) {
        toast.error("Failed to load dealer details.");
        setDealer(null);
        return;
      }
      if(data && data.data && !data.data.length > 0) return;
      setDealer(data.data[0]);
      setForm(data.data[0]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load dealer details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDealer();
  }, [id]);

  // ----------------------------
  // VALIDATION
  // ----------------------------
  function validate() {
    const newErrors = {};

    // Required:
    ["Name", "Phone"
    ].forEach((f) => {
      if (!form[f] || !form[f].toString().trim()) {
        newErrors[f] = "This field is required";
      }
    });

    // Email format
    if (form.Email && form.Email.toString().trim()) {
      if (!emailRegex.test(form.Email.toString().trim())) {
        if (!newErrors.Email) {
          newErrors.Email = "Invalid email format";
        }
      }
    }

    // Phone format
    if (form.Phone && form.Phone.toString().trim()) {
      if (!phoneRegex.test(form.Phone.toString().trim())) {
        if (!newErrors.Phone) {
          newErrors.Phone = "Invalid phone format";
        }
      }
    }

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
      }
      const res = await fetch(`${apiData.PORT}/api/dealer/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Update failed.");
        return;
      }

      toast.success("Dealer updated successfully.");
      setEditMode(false);
      resetButton()
      fetchDealer();
    } catch (e) {
      console.error(e);
      toast.error("Unexpected error.");
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------
  // NAVIGATION TO OTHER RECORDS
  // ----------------------------
 

  if (loading) return <div>Loading dealer details…</div>;
  if (!dealer) return <div>No dealer found.</div>;

  // ----------------------------
  // FIELD RENDER HELPERS
  // ----------------------------
  const renderField = (label, name, options = {}) => {
    const { editable = true } = options;
    const { required = false } = options;
    const value = editMode ? form[name] : dealer[name];

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
              value={value || ""}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({ ...prev, [name]: val }));
                setErrors((prev) => ({ ...prev, [name]: "" }));
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
  
        {/* HEADER WITH EDIT BUTTON AT TOP RIGHT */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Dealer Details</h2>
        </div>
  
        {/* ================= DEALER INFO ================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-person-badge me-2"></i>Dealer Information
          </h4>
  
          <div className="row">
            <div className="col-md-6">{renderField("Name", "Name",{required:true})}</div>
            <div className="col-md-6">{renderField("Phone", "Phone",{required:true})}</div>
            <div className="col-md-6">{renderField("Email", "Email")}</div>
          </div>
        </section>
  
        {/* ================= ADDRESS INFO ================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-geo-alt me-2"></i>Address Information
          </h4>
  
          <div className="row">
            <div className="col-md-6">{renderField("Country", "Country")}</div>
            <div className="col-md-6">{renderField("State", "State")}</div>
            <div className="col-md-6">{renderField("District", "District")}</div>
            <div className="col-md-6">{renderField("City", "City")}</div>
            <div className="col-md-6">{renderField("Street", "Street")}</div>
            <div className="col-md-6">{renderField("Pin Code", "PinCode")}</div>
          </div>
        </section>
  
        {/* ================= OWNER INFO (READ ONLY) ================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-person me-2"></i>Owner Information
          </h4>
          <div className="row">
            <div className="col-md-6">
              {renderField("Dealer Owner Name", "OwnerName", { editable: true })}
            </div>
          </div>
        </section>
  
        {/* ================= SYSTEM INFO ================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-clock-history me-2"></i>System Information
          </h4>
  
          <div className="row">
            <div className="col-md-6">
            <RecordLinkField
                label="Created By"
                id={dealer.createdby_id}
                firstName={dealer.createdby_firstname}
                lastName={dealer.createdby_lastname}
                table="user"
              />
            </div>
  
            <div className="col-md-6">
            <RecordLinkField
                label="Modified By"
                id={dealer.modifiedby_id}
                firstName={dealer.modifiedby_firstname}
                lastName={dealer.modifiedby_lastname}
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
  
        {/* ================= BOTTOM CENTER BUTTONS ================= */}
        {editMode ? (
          <div className="d-flex justify-content-center gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                resetButton()
                setEditMode(false);
                setForm(dealer);
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
