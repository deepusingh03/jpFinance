import React, { useState, useEffect } from "react";
import { apiData } from "../utility/api";
import { Row, Col, Button, Form, Modal, Spinner } from "react-bootstrap";
import LookupField from "../components/LookupField";
import { helperMethods } from "/src/utility/CMPhelper.jsx";
import { toast } from "react-toastify";
import { Checkbox } from "primereact/checkbox";
import SystemDetails from "../components/SystemDetails";

function NewCustomerModal({
  handleRefresh,
  showModal,
  handleClose,
  record,
  lookupData,
  newData,
}) {
  const [newCustomer, setNewCustomer] = useState(getEmptyCustomer());
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  /** Available Categories */
  const categories = ["Hirer", "Agent", "Guarantor", "Referrer"];
  const onClose = () => {
    if (!record) {
      setNewCustomer(getEmptyCustomer());
    }
    setFormErrors({});
    handleClose();
  };
  
  /** Load record if Editing */
  useEffect(() => {
    if (!showModal) return;
  
    if (record) {
      setNewCustomer({
        ...record, 
        Hirer: !!record.Hirer,
        Agent: !!record.Agent,
        Guarantor: !!record.Guarantor,
        Referrer: !!record.Referrer,
      });
    } else {
      setNewCustomer(getEmptyCustomer());
    }
  
    setFormErrors({});
  }, [showModal, record]);
  

  useEffect(() => {
    if (!lookupData) return;
  
    setNewCustomer((prev) => ({
      ...prev,
      Hirer: !!lookupData.Hirer,
      Agent: !!lookupData.Agent,
      Guarantor: !!lookupData.Guarantor,
      Referrer: !!lookupData.Referrer,
    }));
  }, [lookupData]);
  

  /** Handle text inputs */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setNewCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  /** Handle Category Checkbox */
  const onCategoryChange = (e) => {
    const name = e.value;

    setNewCustomer((prev) => {
      const updated = { ...prev, [name]: e.checked };
      // Update Type only if Agent is checked
      console.log("this is the data :: ", updated);
      return updated;
    });

    setFormErrors((prev) => ({
      ...prev,
      Type: "",
    }));
  };

  /** Validate Required Fields */
  const validateForm = () => {
    const errors = {};
    const required = ["FirstName", "LastName", "Phone"];

    required.forEach((f) => {
      if (!newCustomer[f]) errors[f] = "This field is required";
    });

    // email check
    if (newCustomer.Email && !/\S+@\S+\.\S+/.test(newCustomer.Email)) {
      errors.Email = "Invalid email format";
    }

    // At least one checkbox must be checked
    if (!categories.some((c) => newCustomer[c])) {
      errors.Type = "Select at least one Type";
    }

    // Dealer required if Agent is selected
    if (newCustomer.Agent && !newCustomer.Dealer) {
      errors.Dealer = "Dealer is required for Agent";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  /** Auto-fill city/district from pincode */
  const handlePinCodeChange = async (e) => {
    const postalCode = e.target.value;

    setNewCustomer((prev) => ({ ...prev, PinCode: postalCode }));

    if (!postalCode) return;

    try {
      const res = await fetch(
        `${apiData.PORT}/api/get/addresses?PostalCode=${postalCode}`
      );
      const data = await res.json();

      if (data?.data?.length > 0) {
        const address = data.data[0];
        setNewCustomer((prev) => ({
          ...prev,
          District: address.District,
          City: address.CIty,
        }));
      } else {
        setNewCustomer((prev) => ({
          ...prev,
          District: "",
          City: "",
        }));
      }
    } catch (err) {
      console.error("Pincode Error", err);
    }
  };

  /** Submit for New Customer */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please complete all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...newCustomer,
        Dealer: newCustomer.Agent == false ? null : newCustomer.Dealer,
        Id: generateId(),
        CreatedBy: helperMethods.fetchUser(),
        CreatedDate: helperMethods.dateToString(),
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString(),
      };
      const res = await fetch(`${apiData.PORT}/api/customers/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Customer created successfully.");
        setNewCustomer(getEmptyCustomer());
        handleRefresh && handleRefresh();
        newData && newData(payload);
        handleClose();
      } else {
        toast.error("Failed to create customer.");
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }

    setIsLoading(false);
  };

  /** Submit for Editing Customer */
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please complete all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...newCustomer,
        Dealer: newCustomer.Agent == false ? null : newCustomer.Dealer,
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString(),
        DateOfBirth: newCustomer.DateOfBirth
          ? newCustomer.DateOfBirth.toString().split("T")[0]
          : null,
      };

      const res = await fetch(`${apiData.PORT}/api/customers/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(payload.FirstName + " was updated successfully.");
        setNewCustomer(getEmptyCustomer());
        handleClose();
        handleRefresh && handleRefresh();
      } else {
        toast.error("Failed to update customer.");
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }

    setIsLoading(false);
  };

  return (
    <>
      <Modal
        show={showModal}
        onHide={onClose}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="w-100 text-center">
            {record
              ? `Edit ${record.FirstName} ${record.LastName}`
              : "New Customer"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={record ? handleUpdate : handleSubmit}>
            {/* -------- CUSTOMER INFO -------- */}
            <fieldset className="custom-fieldset">
              <legend className="custom-legend">Customer Information</legend>

              <Row>
                {/* First Name */}
                <InputField
                  col={6}
                  label="First Name"
                  required
                  name="FirstName"
                  value={newCustomer.FirstName}
                  onChange={handleChange}
                  error={formErrors.FirstName}
                />
                {/* Last Name */}
                <InputField
                  col={6}
                  label="Last Name"
                  required
                  name="LastName"
                  value={newCustomer.LastName}
                  onChange={handleChange}
                  error={formErrors.LastName}
                />
                {/* Phone */}
                <InputField
                  col={6}
                  label="Phone"
                  required
                  name="Phone"
                  value={newCustomer.Phone}
                  onChange={handleChange}
                  error={formErrors.Phone}
                />
                {/* Email */}
                <InputField
                  col={6}
                  label="Email"
                  name="Email"
                  value={newCustomer.Email}
                  onChange={handleChange}
                  error={formErrors.Email}
                />

                {/* Date of Birth */}
                <InputField
                  col={6}
                  label="Date Of Birth"
                  type="date"
                  name="DateOfBirth"
                  value={helperMethods.formatDate(newCustomer.DateOfBirth)}
                  onChange={handleChange}
                />

                {/* -------- CHECKBOXES -------- */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>
                      <span className="text-danger">*</span> Type
                    </Form.Label>

                    {categories.map((name) => (
                      <div
                        key={name}
                        className="d-flex align-items-center mb-2"
                      >
                        <Checkbox
                          inputId={name}
                          value={name}
                          onChange={onCategoryChange}
                          checked={newCustomer[name]}
                        />
                        <label htmlFor={name} className="ms-2">
                          {name}
                        </label>
                      </div>
                    ))}

                    {formErrors.Type && (
                      <div className="text-danger small">{formErrors.Type}</div>
                    )}
                  </Form.Group>
                </Col>

                {/* Dealer if Agent */}
                {newCustomer.Agent && (
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        <span className="text-danger">*</span> Dealer
                      </Form.Label>
                      <LookupField
                        value={{ Id: newCustomer.Dealer }}
                        entityName="dealers"
                        placeholder="Search Dealer"
                        onSelect={(rec) => {
                          setNewCustomer((prev) => ({
                            ...prev,
                            Dealer: rec.Id,
                            DealerName: rec.Name,
                          }));
                          setFormErrors((prev) => ({ ...prev, Dealer: "" }));
                        }}
                      />
                      {formErrors.Dealer && (
                        <div className="text-danger small">
                          {formErrors.Dealer}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                )}
              </Row>
            </fieldset>

            {/* -------- ADDRESS INFO -------- */}
            <fieldset className="custom-fieldset">
              <legend className="custom-legend">Address Information</legend>

              <Row>
                <InputField
                  col={6}
                  label="Country"
                  name="Country"
                  value={newCustomer.Country}
                  onChange={handleChange}
                />
                <InputField
                  col={6}
                  label="State"
                  name="State"
                  value={newCustomer.State}
                  onChange={handleChange}
                />
                <InputField
                  col={6}
                  label="District"
                  name="District"
                  value={newCustomer.District}
                  onChange={handleChange}
                />
                <InputField
                  col={6}
                  label="City"
                  name="City"
                  value={newCustomer.City}
                  onChange={handleChange}
                />
                <InputField
                  col={6}
                  label="PinCode"
                  name="PinCode"
                  value={newCustomer.PinCode}
                  onChange={handlePinCodeChange}
                />

                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Street</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="Street"
                      value={newCustomer.Street}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </fieldset>
            {record && <SystemDetails data={newCustomer} />}
            {/* -------- BUTTONS -------- */}
            <div className="text-end">
              <Button variant="secondary" onClick={onClose} className="me-2">
                Cancel
              </Button>
              <Button type="submit" variant="dark" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

/** Reusable Input Component */
const InputField = ({ col, label, required, error, ...props }) => (
  <Col md={col}>
    <Form.Group className="mb-3">
      <Form.Label>
        {required && <span className="text-danger">*</span>} {label}
      </Form.Label>
      <Form.Control {...props} isInvalid={!!error} />
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  </Col>
);

/** Empty object */
function getEmptyCustomer() {
  return {
    FirstName: "",
    LastName: "",
    Phone: "",
    Email: "",
    Type: "",
    Country: "India",
    State: "Rajasthan",
    District: "",
    City: "",
    PinCode: "",
    Street: "",
    Dealer: null,
    DealerName: "",
    Hirer: false,
    Agent: false,
    Guarantor: false,
    Referrer: false,
  };
}

/** ID Generator */
function generateId(length = 30) {
  const timestamp = Date.now().toString(36);
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return (
    timestamp +
    Array.from(
      { length: length - timestamp.length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("")
  );
}

export default NewCustomerModal;
