import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import LookupField from "../components/LookupField";
import RecordLinkField from "../components/RecordLinkField";
import { helperMethods } from "../utility/CMPhelper";
import { toast } from "react-toastify";
import { apiData } from "../utility/api";

// Email & phone format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{8,20}$/;

export default function CustomerDetail({ isEdit, resetButton }) {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // ----------------------------
  // FETCH CUSTOMER
  // ----------------------------
  async function fetchCustomer() {
    try {
      setLoading(true);
      const res = await fetch(`${apiData.PORT}/api/get/customers?Id=${id}`);
      const data = await res.json();

      if (!res.ok || !data.data || data.data.length === 0) {
        toast.error(data.error || "Failed to load loan");
        setCustomer(null);
        return;
      }

      const record = data.data[0];
      setCustomer(record);
      setForm(record);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomer();
  }, [id]);
  useEffect(() => {
    setEditMode(isEdit);
    if (isEdit) {
      fetchCustomer();
    }
  }, [isEdit]);
  // ----------------------------
  // VALIDATION
  // ----------------------------
  function validate() {
    const newErrors = {};

    ["FirstName", "LastName", "Phone"].forEach((f) => {
      if (!form[f] || !form[f].toString().trim()) {
        newErrors[f] = "This field is required";
      }
    });

    // Email format
    if (form.Email && form.Email.trim()) {
      if (!emailRegex.test(form.Email.trim())) {
        if (!newErrors.Email) newErrors.Email = "Invalid email format";
      }
    }

    // Phone format
    if (form.Phone && form.Phone.trim()) {
      if (!phoneRegex.test(form.Phone.trim())) {
        if (!newErrors.Phone) newErrors.Phone = "Invalid phone format";
      }
    }

    if (form.Agent && !form.Dealer) {
      newErrors.Dealer = "Please select a Dealer";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ----------------------------
  // SAVE CUSTOMER
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
        DateOfBirth: form?.DateOfBirth?.split("T")[0],
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString(),
      };
      const res = await fetch(`${apiData.PORT}/api/customers/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
console.log(data,res);
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update customer");
        return;
      }
      resetButton();
      toast.success("Customer updated successfully");
      setEditMode(false);
      fetchCustomer();
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading customer...</div>;
  if (!customer) return <div>No customer found</div>;

  // ----------------------------
  // FIELD RENDER HELPERS
  // ----------------------------
  const renderField = (label, name, options = {}) => {
    const { editable = true, type = "text",required = false } = options;
    const value = editMode ? form[name] : customer[name];

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
              onChange={(e) =>
                setForm((p) => ({ ...p, [name]: e.target.value }))
              }
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
        <div className="d-flex justify-content-between mb-3">
          <h2 className="fw-bold">Customer Details</h2>
        </div>
        {/* ================= CUSTOMER INFO ================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-person-circle me-2"></i>Customer Information
          </h4>

          <div className="row">
            <div className="col-md-6">
              {renderField("First Name", "FirstName",{required:true})}
            </div>
            <div className="col-md-6">
              {renderField("Last Name", "LastName", {required:true})}
            </div>
            <div className="col-md-6">{renderField("Phone", "Phone",{required:true})}</div>
            <div className="col-md-6">{renderField("Email", "Email")}</div>
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Date Of Birth</Form.Label>

                {editMode ? (
                  <>
                    <Form.Control
                      type="date"
                      value={form?.DateOfBirth?.split("T")[0]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          DateOfBirth: e.target.value,
                        }))
                      }
                      isInvalid={!!errors.DateOfBirth}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.DateOfBirth}
                    </Form.Control.Feedback>
                  </>
                ) : (
                  <div className="p-2 bg-light rounded">
                    {customer.DateOfBirth !== null
                      ? helperMethods.handleDateFormat(customer.DateOfBirth)
                      : "—"}
                  </div>
                )}
              </Form.Group>
            </div>

            {/* TYPE PICKLIST */}
            <div className="col-md-6">
              <div className="col-md-12">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Type</Form.Label>

                  <div className="d-flex flex-wrap gap-4">
                    {/* Hirer */}
                    <Form.Check
                      type="checkbox"
                      label="Hirer"
                      checked={!!form.Hirer}
                      readOnly={!editMode}
                      onChange={(e) => {
                        if (!editMode) return;
                        setForm((prev) => ({
                          ...prev,
                          Hirer: e.target.checked,
                        }));
                      }}
                    />

                    {/* Agent */}
                    <Form.Check
                      type="checkbox"
                      label="Agent"
                      checked={!!form.Agent}
                      onChange={(e) => {
                        if (!editMode) return;
                        setForm((prev) => ({
                          ...prev,
                          Agent: e.target.checked,
                        }));
                      }}
                    />

                    {/* Guarantor */}
                    <Form.Check
                      type="checkbox"
                      label="Guarantor"
                      checked={!!form.Guarantor}
                      onChange={(e) => {
                        if (!editMode) return;
                        setForm((prev) => ({
                          ...prev,
                          Guarantor: e.target.checked,
                        }));
                      }}
                    />

                    {/* Referrer */}
                    <Form.Check
                      type="checkbox"
                      label="Referrer"
                      checked={!!form.Referrer}
                      onChange={(e) => {
                        if (!editMode) return;
                        setForm((prev) => ({
                          ...prev,
                          Referrer: e.target.checked,
                        }));
                      }}
                    />
                  </div>

                  {/* Validation error */}
                  {errors.Type && (
                    <div className="text-danger small mt-1">{errors.Type}</div>
                  )}
                </Form.Group>
              </div>
            </div>
            {!!form.Agent && (
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  {editMode ? (
                    <>
                      <Form.Label className="fw-semibold"><span className="text-danger">*</span>Dealer</Form.Label>
                      <LookupField
                        value={{ Id: form.Dealer }}
                        entityName="dealers"
                        placeholder="Search Dealer"
                        isInvalid = {errors.Dealer}
                        onSelect={(record) => {
                          setForm({
                            ...form,
                            Dealer: record.Id,
                            DealerName: record.Name,
                          });
                          setErrors((prev) => ({
                            ...prev,
                            Dealer: "",
                          }));
                        }}
                      />
                      {/* {errors.Dealer && (
                        <div className="text-danger small">{errors.Dealer}</div>
                      )} */}
                    </>
                  ) : (
                    <div className="col-md-12">
                      <RecordLinkField
                        label="Dealer"
                        data={customer.dealers__Dealer}
                        table="dealer"
                      />
                    </div>
                  )}
                </Form.Group>
              </div>
            )}
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
            <div className="col-md-6">
              {renderField("District", "District")}
            </div>
            <div className="col-md-6">{renderField("City", "City")}</div>
            <div className="col-md-6">{renderField("Street", "Street")}</div>
            <div className="col-md-6">{renderField("Pin Code", "PinCode")}</div>
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
                data={customer.users__CreatedBy}
                table="user"
              />
            </div>

            <div className="col-md-6">
              <RecordLinkField
                label="Modified By"
                data={customer.users__ModifiedBy}
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

                // setForm(dealer);
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
