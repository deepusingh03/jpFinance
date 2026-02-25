import React, { useState, useEffect } from "react";
import LookupField from "../components/LookupField";
import { apiData } from "../utility/api";
import { Row, Col, Button, Form, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { helperMethods } from "/src/utility/CMPhelper.jsx";
import SystemDetails from "../components/SystemDetails";

function NewProductModal({ onShow, onHide, fetchProducts, record }) {
  const initialState = {
    Name: "",
    Code: "",
    CCPower: "",
    ModelMonth: "",
    ModelYear: "",
    Description: "",
    Brand: "",
    BrandName: "",
  };

  const [newProduct, setNewProduct] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record) {
      setNewProduct(record);
    } else {
      setNewProduct(initialState);
    }
    setFormErrors({});
  }, [record, onShow]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateFields = () => {
    const errors = {};

    [
      "Name",
      // "Code", 
      "CCPower", 
      // "ModelMonth", 
      // "ModelYear", 
      "Brand"
    ].forEach((field) => {
      if (!newProduct[field]) errors[field] = "This field is required";
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Generate Unique ID ---
  const generateId = (length = 30) => {
    const timestamp = Date.now().toString(36);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomPart = "";

    for (let i = 0; i < length - timestamp.length; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return timestamp + randomPart;
  };

  // --- HANDLE CREATE ---
  const handleCreateProduct = async () => {
    const payload = {
       ...newProduct,
        Id: generateId() ,
        CreatedBy: helperMethods.fetchUser(),
        CreatedDate: helperMethods.dateToString(),
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString(),
      };

    const res = await fetch(`${apiData.PORT}/api/products/insert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("New product added successfully!");
      fetchProducts();
      onHide();
    } else {
      toast.error("❌ Error adding product: " + data?.error);
    }
  };

  // --- HANDLE UPDATE ---
  const handleUpdateProduct = async () => {
    const payload = {
      ...newProduct,
      ModifiedBy: helperMethods.fetchUser(),
      ModifiedDate: helperMethods.dateToString(),
    };

    const res = await fetch(`${apiData.PORT}/api/products/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success(`${payload.Name} updated successfully.`);
      fetchProducts();
      onHide();
    } else {
      toast.error("❌ Error updating product: " + data?.error);
    }
  };

  // --- HANDLE SUBMIT (create or update) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) {
      toast.error("Please complete all required fields.");
      return;
    }
    setLoading(true);

    try {
      if (record) {
        await handleUpdateProduct();
      } else {
        await handleCreateProduct();
      }
    } catch (err) {
      console.error(err);
      toast.error("⚠️ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={onShow}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={false}
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title className="w-100 text-center">
          {record ? `Edit ${record?.Name}` : "New Product"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* PRODUCT INFO */}
          <fieldset className="custom-fieldset">
            <legend className="custom-legend">Product Information</legend>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><span className="text-danger">*</span> Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="Name"
                    disabled={loading}
                    value={newProduct.Name}
                    onChange={handleChange}
                    isInvalid={!!formErrors.Name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.Name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><span className="text-danger"></span> Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="Code"
                    disabled={loading}
                    value={newProduct.Code}
                    onChange={handleChange}
                    isInvalid={!!formErrors.Code}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.Code}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><span className="text-danger">*</span> CC Power</Form.Label>
                  <Form.Control
                    type="text"
                    name="CCPower"
                    disabled={loading}
                    value={newProduct.CCPower}
                    onChange={handleChange}
                    isInvalid={!!formErrors.CCPower}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.CCPower}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label><span className="text-danger"></span> Model Month</Form.Label>
                  <Form.Control
                    type="text"
                    name="ModelMonth"
                    disabled={loading}
                    value={newProduct.ModelMonth}
                    onChange={handleChange}
                    isInvalid={!!formErrors.ModelMonth}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.ModelMonth}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label><span className="text-danger"></span> Model Year</Form.Label>
                  <Form.Control
                    type="text"
                    name="ModelYear"
                    disabled={loading}
                    value={newProduct.ModelYear}
                    onChange={handleChange}
                    isInvalid={!!formErrors.ModelYear}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.ModelYear}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="Description"
                    disabled={loading}
                    value={newProduct.Description}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </fieldset>

          {/* BRAND INFO */}
          <fieldset className="custom-fieldset">
            <legend className="custom-legend">Brand Information</legend>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><span className="text-danger">*</span> Brand</Form.Label>
                  <LookupField
                    value={{ Id: newProduct.Brand, Name: newProduct.BrandName }}
                    entityName="brands"
                    placeholder="Search Brands"
                    disabled={loading}
                    onSelect={(brand) => {
                      setFormErrors((prev) => ({ ...prev, Brand: "" }));
                      setNewProduct((prev) => ({
                        ...prev,
                        Brand: brand.Id,
                        BrandName: brand.Name,
                      }));
                    }}
                    isInvalid={!!formErrors.Brand}
                  />
                  {/* <div className="invalid-feedback d-block">
                    {formErrors.Brand}
                  </div> */}
                </Form.Group>
              </Col>
            </Row>
          </fieldset>
          {record && <SystemDetails data={newProduct} />}
          {/* ACTION BUTTONS */}
          <div className="text-end">
            <Button variant="secondary" onClick={onHide} disabled={loading} className="me-2">
              Cancel
            </Button>

            <Button type="submit" variant="dark" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "Save"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default NewProductModal;
