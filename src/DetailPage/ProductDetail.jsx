import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import LookupField from "../components/LookupField";
import RecordLinkField from "../components/RecordLinkField";
import { helperMethods } from "../utility/CMPhelper";
import { toast } from "react-toastify";
import { apiData } from "../utility/api";

// const API = 'https://jpfincorp.com';

export default function ProductDetail({ isEdit, resetButton }) {
  const { id } = useParams();
  //   const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setEditMode(isEdit);
    if (isEdit) {
      fetchProduct();
    }
  }, [isEdit]);

  async function fetchProduct() {
    try {
      setLoading(true);
      const data = await helperMethods.getEntityDetails(`products?Id=${id}`);

      if (!data || data.length === 0) {
        toast.error(data.error || "Failed to load product");
        setProduct(null);
        return;
      }

      const record = data[0];
      setProduct(record);
      setForm(record);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // ----------------------------
  // VALIDATION
  // ----------------------------
  function validate() {
    const newErrors = {};

    [
      "Name",
      "Code",
      "Brand",
      "CCPower",
      "ModelMonth",
      "ModelYear",
      "Description",
    ].forEach((f) => {
      if (!form[f] || form[f].toString().trim() === "") {
        newErrors[f] = "This field is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ----------------------------
  // SAVE PRODUCT
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
      const res = await fetch(`${apiData.PORT}/api/products/update`, {
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
      resetButton();
      setEditMode(false);
      fetchProduct();
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading product details…</div>;
  if (!product) return <div>No product found.</div>;

  // ----------------------------
  // FIELD RENDER HELPERS
  // ----------------------------
  const renderField = (label, name, options = {}) => {
    const {
      editable = true,
      textarea = false,
      type = "text",
      required = false,
    } = options;
    const value = editMode ? form[name] : product[name];

    return (
      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">
          {required && <span className="text-danger">* </span>}
          {label}
        </Form.Label>

        {editMode && editable ? (
          <>
            {textarea ? (
              <Form.Control
                as="textarea"
                rows={4}
                value={value || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [name]: e.target.value }))
                }
                isInvalid={!!errors[name]}
              />
            ) : (
              <Form.Control
                type={type}
                value={value || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [name]: e.target.value }))
                }
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
          <h2 className="fw-bold">Product Details</h2>
        </div>

        {/* ================= PRODUCT INFO ================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-box-seam me-2"></i>Product Information
          </h4>

          <div className="row">
            <div className="col-md-6">
              {renderField("Name", "Name", { required: true })}
            </div>
            <div className="col-md-6">{renderField("Code", "Code")}</div>
            <div className="col-md-6">
              {renderField("CC Power", "CCPower", { required: true })}
            </div>
            <div className="col-md-6">
              {renderField("Model Month", "ModelMonth", { type: "number" })}
            </div>
            <div className="col-md-6">
              {renderField("Model Year", "ModelYear")}
            </div>
            <div className="col-md-6">
              {renderField("Description", "Description", { textarea: true })}
            </div>
          </div>
        </section>

        {/* ================= BRAND SECTION ================= */}
        <section className="mb-4">
          <h4 className="fw-bold mb-3">
            <i className="bi bi-tags me-2"></i>Brand Information
          </h4>

          <div className="row">
            <div className="col-md-6">
              {/* Lookup to brand */}
              <Form.Group className="mb-3">
                {editMode ? (
                  <>
                    <Form.Label className="fw-semibold">
                      <span className="text-danger">* </span> Brand
                    </Form.Label>
                    <LookupField
                      value={{ Id: form.Brand }}
                      entityName="brands"
                      placeholder="Search Brands"
                      isInvalid={errors.Brand}
                      onSelect={(record) => {
                        setForm({
                          ...form,
                          Brand: record.Id,
                          BrandName: record.Name,
                        });
                        setErrors((prev) => ({
                          ...prev,
                          Brand: "",
                        }));
                      }}
                    />
                  </>
                ) : (
                  <div className="col-md-12">
                    <RecordLinkField
                      label="Brand"
                      data={product.brands__Brand}
                      table="brands"
                    />
                  </div>
                )}
              </Form.Group>
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
                data={product.users__CreatedBy}
                table="user"
              />
            </div>

            <div className="col-md-6">
              <RecordLinkField
                label="Modified By"
                data={product.users__ModifiedBy}
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
