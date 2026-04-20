import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import RecordLinkField from "../components/RecordLinkField";
import { helperMethods } from "../utility/CMPhelper";
import { toast } from "react-toastify";
import { apiData } from "../utility/api";
import { format } from "date-fns";

// const API = 'https://jpfincorp.com';

export default function LoanItemDetail({ isEdit, resetButton }) {
  const { id } = useParams();
  // const navigate = useNavigate();

  const [loanItem, setLoanItem] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ----------------------------
  // FETCH LoanItem
  // ----------------------------

  useEffect(() => {
    setEditMode(isEdit);
  }, [isEdit]);
  async function fetchLoanItem() {
    try {
      setLoading(true);
      const data = await helperMethods.getEntityDetails(`loanitems?Id=${id}`);
      console.log(data);
      if (!data || data.length === 0) {
        toast.error(data.error || "Failed to load loanitems");
        setLoanItem(null);
        return;
      }

      const record = data[0];
      record.DueDate = record.DueDate.split('T')[0]
      setLoanItem(record);
      setForm(record);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load loanitem");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLoanItem();
  }, [id]);

  // ----------------------------
  // VALIDATE
  // ----------------------------
  function validate() {
    const newErrors = {};

    ["Amount", "DueDate", "Status"].forEach((f) => {
      if (!form[f] || !form[f].toString().trim()) {
        newErrors[f] = "This field is required";
      }
    });

    if (isNaN(Number(form.Amount))) {
      newErrors.Amount = "Amount must be numeric";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ----------------------------
  // SAVE
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
      console.log("payload ::", payload);
      const res = await fetch(`${apiData.PORT}/api/loanitems/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Update failed.");
        return;
      }

      toast.success("Loan Item updated successfully.");
      resetButton();
      setEditMode(false);
      fetchLoanItem();
    } catch (e) {
      console.error(e);
      toast.error("Unexpected error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading loan item…</div>;
  if (!loanItem) return <div>No loan item found.</div>;

  // ----------------------------
  // FIELD RENDER HELPER
  // ----------------------------
  const renderField = (label, name, options = {}) => {
    const { editable = true, textarea = false, type = "text" } = options;
    const value = editMode ? form[name] : loanItem[name];

    // currency formatter (INR)
    const formatCurrency = (val) => {
      if (!val) return "—";
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }).format(val);
    };

    const isAmountField = label.toLowerCase() === "amount";

    return (
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">{label}</Form.Label>

        {editMode && editable ? (
          <>
            <Form.Control
              as={textarea ? "textarea" : "input"}
              type={textarea ? undefined : type}
              rows={textarea ? 4 : undefined}
              value={value || ""}
              onChange={(e) => {
                let val = e.target.value;

                // allow only numbers for amount field
                if (isAmountField) {
                  val = val.replace(/[^0-9]/g, "");
                }

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
          <div className="p-2 bg-light rounded">
            {isAmountField ? formatCurrency(value) : value || "—"}
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

          <h2 className="fw-bold">Loan Item Details</h2>
        </div>

        {/* ================= LOAN ITEM INFO ================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-credit-card me-2"></i>Loan Item Information
          </h4>

          <div className="row">
            <div className="col-md-6">
              {renderField("Name", "Name", { editable: false })}
            </div>
            <div className="col-md-6">
              {renderField("Amount", "Amount", { type: "number" })}
            </div>

            {/* Loan Lookup */}
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <RecordLinkField
                  label="Loan"
                  data={loanItem.loans__Loan}
                  table="loan"
                />
              </Form.Group>
            </div>

            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Due Date</Form.Label>

                {editMode ? (
                  <>
                    <Form.Control
                      type="date"
                      value={helperMethods.toDateInputFormat(form.DueDate)}
                      onChange={(e) => {
                        const value = e.target.value; // "YYYY-MM-DD"
                      
                        const [year, month, day] = value.split("-");
                      
                        const isoDate = new Date(
                          Date.UTC(year, month - 1, day)
                        ).toISOString();
                      console.log('isoDate :: ',isoDate)
                        setForm((prev) => ({
                          ...prev,
                          DueDate: isoDate.split('T')[0],
                        }));
                      }}
                      isInvalid={!!errors.DueDate}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.DueDate}
                    </Form.Control.Feedback>
                  </>
                ) : (
                  <div className="p-2 bg-light rounded">
                    {format(new Date(loanItem.DueDate), "dd/MM/yyyy")}
                  </div>
                )}
              </Form.Group>
            </div>

            <div className="col-md-6">
              {/* Status dropdown */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Status</Form.Label>

                {editMode ? (
                  <>
                    <Form.Select
                      value={form.Status}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, Status: e.target.value }))
                      }
                      isInvalid={!!errors.Status}
                    >
                      <option>Due</option>
                      <option>Overdue</option>
                      <option>Advance</option>
                      <option>Deposited</option>
                      <option>EMI Moratorium</option>
                      <option>Sent to Bank</option>
                      <option>Rejected</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.Status}
                    </Form.Control.Feedback>
                  </>
                ) : (
                  <div className="p-2 bg-light rounded">{loanItem.Status}</div>
                )}
              </Form.Group>
            </div>
            <div className="col-md-6">
              {renderField("Status Detail", "StatusDetail")}
            </div>
          </div>
        </section>

        {/* ================= SYSTEM INFO ================= */}
        <section>
          <h4 className="fw-bold mb-3">
            <i className="bi bi-clock-history me-2"></i>System Information
          </h4>

          <div className="row">
            <div className="col-md-6">
              <RecordLinkField
                label="Created By"
                data={loanItem.users__CreatedBy}
                table="user"
              />
            </div>

            <div className="col-md-6">
              <RecordLinkField
                label="Modified By"
                data={loanItem.users__ModifiedBy}
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
                setForm(loanItem);
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
