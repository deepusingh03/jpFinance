import React, { useState, useEffect } from "react";
import { Modal, Form, Row, Col, Button, Spinner } from "react-bootstrap";
import { apiData } from "../utility/api";
import { toast } from "react-toastify";
import { helperMethods } from "../utility/CMPhelper";
import SystemDetails from "../components/SystemDetails";

function NewBrandModal({ show, onHide, fetchBrands, record }) {
  const [newBrand, setNewBrand] = useState({ Name: "", Description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (record) {
      setNewBrand(record);
    } else {
      setNewBrand({ Name: "", Description: "" });
    }
    setFormErrors({}); // clear errors on open
  }, [record, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewBrand((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    let errors = {};
    if (!newBrand.Name?.trim()) errors.Name = "This field is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateId = (length = 30) => {
    const timestamp = Date.now().toString(36);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomPart = "";
    for (let i = 0; i < length - timestamp.length; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return timestamp + randomPart;
  };

  const handleCreate = async () => {
    const payload = { 
      ...newBrand, 
      Id: generateId(),
      CreatedBy:helperMethods.fetchUser(),
      CreatedDate:helperMethods.dateToString(),
      ModifiedBy: helperMethods.fetchUser(),
      ModifiedDate: helperMethods.dateToString(),
     };

    const res = await fetch(`${apiData.PORT}/api/brands/insert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success("Brand created successfully.");
      fetchBrands &&fetchBrands();
      onHide();
    } else {
      toast.error("Failed to create brand.");
    }
  };

  const handleUpdate = async () => {
    const payload = {
      ...newBrand,
      ModifiedBy: helperMethods.fetchUser(),
      ModifiedDate: helperMethods.dateToString(),
    };
    const res = await fetch(`${apiData.PORT}/api/brands/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(`${payload.Name} updated successfully.`);
      fetchBrands && fetchBrands();
      onHide();
    } else {
      toast.error("Failed to update brand.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please complete all required fields.");
      return;
    } 

    setSubmitting(true);
    try {
      if (record) await handleUpdate();
      else await handleCreate();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" keyboard={false} size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="w-100 text-center">
          {record ? `Edit ${record?.Name}` : "New Brand"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <fieldset className="custom-fieldset">
            <legend className="custom-legend">Brand Information</legend>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <span className="text-danger">*</span> Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="Name"
                    value={newBrand.Name}
                    onChange={handleChange}
                    disabled={submitting}
                    isInvalid={!!formErrors.Name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.Name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="Description"
                    value={newBrand.Description}
                    disabled={submitting}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </fieldset>
          {record && <SystemDetails data={newBrand} />}
          <div className="text-end">
            <Button variant="secondary" onClick={onHide} disabled={submitting} className="me-2">
              Cancel
            </Button>

            <Button type="submit" variant="dark" disabled={submitting}>
              {submitting ? <Spinner animation="border" size="sm" /> : "Save"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default NewBrandModal;
