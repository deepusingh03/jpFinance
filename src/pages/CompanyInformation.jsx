// CompanyInformation.jsx
import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import InputGroup from "react-bootstrap/InputGroup";
import { helperMethods } from "../utility/CMPhelper";
import { apiData } from "../utility/api";
import CustomNavbar from "../components/CustomNavbar";

/****************************************
 * Email Pills Component (Improved)
 ****************************************/
function EmailPills({ title, list, setList, error, setError }) {
  const [emailInput, setEmailInput] = useState("");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function addEmail() {
    if (!emailInput.trim()) return;

    if (!emailRegex.test(emailInput.trim())) {
      setError("Invalid email format");
      return;
    }

    if (list.includes(emailInput.trim())) {
      setError("Email already added");
      return;
    }

    setList([...list, emailInput.trim()]);
    setEmailInput("");
    setError("");
  }

  function removeEmail(email) {
    setList(list.filter((x) => x !== email));
  }

  return (
    <Form.Group className="mb-3">
      <Form.Label>{title}</Form.Label>

      {/* Render chips */}
      <div className="d-flex flex-wrap gap-2 mb-2">
        {list.map((email) => (
          <span
            className="badge bg-dark px-3 py-2 d-flex align-items-center gap-2"
            key={email}
          >
            {email}
            <button
              type="button"
              className="btn-close btn-close-white"
              style={{ fontSize: "8px" }}
              onClick={() => removeEmail(email)}
            />
          </span>
        ))}
      </div>

      {/* Add Email Input */}
      <InputGroup>
        <Form.Control
          placeholder="Add email..."
          value={emailInput}
          onChange={(e) => {
            setEmailInput(e.target.value);
            setError("");
          }}
          isInvalid={!!error}
        />
        <Button variant="dark" onClick={addEmail}>
          Add
        </Button>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </InputGroup>
    </Form.Group>
  );
}

/****************************************
 * Modal (React-Bootstrap Based)
 ****************************************/
function EditCompanyModal({ info, onClose, onSaved }) {
  const [local, setLocal] = useState({
    ...info,
    CCList: info.CCRecipientEmailAddress?.split(",").map((x) => x.trim()) || [],
    ToList: info.ToRecipientEmailAddress?.split(",").map((x) => x.trim()) || [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const fields = [
    { name: "UtilityName", label: "Utility Name" },
    { name: "UtilityCode", label: "Utility Code" },
    { name: "CategoryCode", label: "Category Code" },
    { name: "Frequency", label: "Frequency" },
    { name: "CustomerCode", label: "Customer Code" },
    { name: "PaymentType", label: "Payment Type" },
    { name: "Period", label: "Period", type: "number" }
  ];

  function handleChange(e) {
    setLocal({ ...local, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  }

  function validateFields() {
    const required = [...fields.map((f) => f.name), "EMIEndDate"];
    const newErrors = {};

    required.forEach((field) => {
      if (!local[field] || !local[field].toString().trim()) {
        newErrors[field] = "This field is required";
      }
    });

    if (errors.CCList) newErrors.CCList = errors.CCList;
    if (errors.ToList) newErrors.ToList = errors.ToList;

    return newErrors;
  }

  async function handleSave(e) {
    e.preventDefault();

    const newErrors = validateFields();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix errors before saving.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...local,
        CCRecipientEmailAddress: local.CCList.join(","),
        ToRecipientEmailAddress: local.ToList.join(","),
        EMIEndDate: local.EMIEndDate?.split("T")[0],
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString(),
      };

      const res = await fetch(`${apiData.PORT}/api/companysettings/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Update failed");
        return;
      }

      toast.success("ECS information updated!");
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal show centered size="lg" backdrop="static" onHide={onClose}>
      <Form onSubmit={handleSave}>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Edit ECS Information</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="g-3">
            {fields.map((f) => (
              <Col md={6} key={f.name}>
                <Form.Group>
                  <Form.Label> <span className="text-danger">*</span> {f.label}</Form.Label>
                  <Form.Control
                    type={f.type || "text"}
                    name={f.name}
                    value={local[f.name] || ""}
                    onChange={handleChange}
                    isInvalid={!!errors[f.name]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors[f.name]}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            ))}

            {/* EMI DATE */}
            <Col md={6}>
              <Form.Group>
                <Form.Label><span className="text-danger">*</span> EMI End Date</Form.Label>
                <Form.Control
                  type="date"
                  name="EMIEndDate"
                  value={local.EMIEndDate?.split("T")[0] || "" }
                  onChange={handleChange}
                  isInvalid={!!errors.EMIEndDate}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.EMIEndDate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Email Pills */}
            <Col xs={12}>
              <EmailPills
                title="CC Recipient Emails"
                list={local.CCList}
                setList={(list) => setLocal({ ...local, CCList: list })}
                error={errors.CCList}
                setError={(msg) =>
                  setErrors((prev) => ({ ...prev, CCList: msg }))
                }
              />
            </Col>

            <Col xs={12}>
              <EmailPills
                title="To Recipient Emails"
                list={local.ToList}
                setList={(list) => setLocal({ ...local, ToList: list })}
                error={errors.ToList}
                setError={(msg) =>
                  setErrors((prev) => ({ ...prev, ToList: msg }))
                }
              />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="dark" disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

/****************************************
 * MAIN PAGE
 ****************************************/
export default function CompanyInformation() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  async function fetchInfo() {
    try {
      setLoading(true);

      const res = await fetch(`${apiData.PORT}/api/get/companysettings`);
      const data = await res.json();

      if (!data || !data.data || data.data.length === 0) return;
      setInfo(data.data[0]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load company info.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInfo();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!info) return <div>No company info found.</div>;

  return (
    <>
    <CustomNavbar/>
    <div className="card p-4 shadow-sm rounded-4">
      <h3 className="fw-bold mb-4">ECS Information</h3>

      <Row className="g-3">
        {[
          { label: "Utility Name", value: info.UtilityName },
          { label: "Utility Code", value: info.UtilityCode },
          { label: "Category Code", value: info.CategoryCode },
          { label: "Frequency", value: info.Frequency },
          { label: "Customer Code", value: info.CustomerCode },
          { label: "Payment Type", value: info.PaymentType },
          { label: "Period", value: info.Period },
          { label: "EMI End Date", value: helperMethods.handleDateFormat(info.EMIEndDate) },
        ].map((f, i) => (
          <Col md={6} key={i}>
            <div className="p-3 bg-light border rounded">
              <div className="text-secondary small">{f.label}</div>
              <div className="fw-bold">{f.value}</div>
            </div>
          </Col>
        ))}

        {/* CC EMAILS */}
        <Col xs={12}>
          <div className="p-3 bg-light border rounded">
            <div className="text-secondary small">CC Emails</div>
            <div className="d-flex flex-wrap gap-2">
              {info.CCRecipientEmailAddress?.split(",").map((email) => (
                <span className="badge bg-dark px-3 py-2" key={email}>
                  {email}
                </span>
              ))}
            </div>
          </div>
        </Col>

        {/* TO EMAILS */}
        <Col xs={12}>
          <div className="p-3 bg-light border rounded">
            <div className="text-secondary small">To Emails</div>
            <div className="d-flex flex-wrap gap-2">
              {info.ToRecipientEmailAddress?.split(",").map((email) => (
                <span className="badge bg-dark px-3 py-2" key={email}>
                  {email}
                </span>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      <Button className="btn-dark mt-4" onClick={() => setShowEditModal(true)}>
        Edit ECS Information
      </Button>

      {showEditModal && (
        <EditCompanyModal
          info={info}
          onClose={() => setShowEditModal(false)}
          onSaved={fetchInfo}
        />
      )}
    </div>
    </>
  );
}
