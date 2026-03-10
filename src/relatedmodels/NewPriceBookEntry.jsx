import React, { useState } from "react";
import {
  Modal,
  Button,
  Toast,
  Form,
  ToastContainer,
  Row,
  Col,
} from "react-bootstrap";
import { apiData } from "../utility/api";
import LookupField from "../components/LookupField";
import { toast } from "react-toastify";
import { helperMethods } from "../utility/CMPhelper";

function NewPriceBookEntry({ show, onHide, record, success }) {
  const [formData, setFormData] = useState(
    record?.data?.Name?.startsWith("PB")
      ? {
          Pricebook: record.data.Id,
          PricebookName: record.data.Name,
          isProbook: true,
        }
      : {
          Product: record.data.Id,
          ProductName: record.data.Name,
          isProduct: true,
        }
  );
  const [formErrors, setFormErrors] = useState({});

  const [loading, setLoading] = useState(false);
  /** ✅ Generates unique ID for new records */
  const generateId = (length = 30) => {
    const timestamp = Date.now().toString(36);
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomPart = Array.from({ length: length - timestamp.length })
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join("");
    return timestamp + randomPart;
  };

  /** ✅ Resets modal state */
  const handleClose = () => {
    if (!loading) onHide();
  };
  const validateForm = () => {
    const errors = {};
    const requiredFields = ["Product", "Unitprice"];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors[field] = "This field is required";
      }
    });

    if (formData.Unitprice && !/^\d+$/.test(formData.Unitprice)) {
      errors.Unitprice = "Invalid unitprice";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  /** ✅ Handles form submission */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please complete all required fields.");
      return;
    }
    if (!(await checkPricebookEntry())) {
      toast.warning(
        "Only one active Price Book Entry is allowed per Product and Price Book."
      );
      return;
    }
    setLoading(true);
    try {
      const newRecord = {
        ...formData,
        Id: generateId(),
        isactive:true,
        CreatedBy: helperMethods.fetchUser(),
        CreatedDate: helperMethods.dateToString(),
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString(),
      };

      const res = await fetch(`${apiData.PORT}/api/pricebookentry/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error adding record");
      }

      // ✅ Success
      setFormData({});
      toast.success("New record added successfully!", "success");

      // Refresh parent list after success
      setTimeout(() => {
        success();
        onHide();
      }, 800);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkPricebookEntry = async () => {
    if (formData.Pricebook && formData.Product) {
      const res = await fetch(
        `${apiData.PORT}/api/get/pricebookentry?Pricebook=${formData.Pricebook}&Product=${formData.Product}`
      );
      if (!res.ok) return true;
      const data = await res.json();
      if (data.success == true && data.data.length == 0) return true;
      if (!data && data.data.length > 0) {
        return false;
      }
    }
  };
  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        centered
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="w-100 text-center">
            New PriceBookEntry
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <span className="text-danger">*</span> PriceBook
                  </Form.Label>
                  <LookupField
                    value={{ Id: formData.Pricebook }}
                    entityName={`pricebook`}
                    placeholder="Search pricebook"
                    isDisabled={formData.isProbook}
                    onSelect={(record) =>
                      setFormData({
                        ...formData,
                        Pricebook: record.Id,
                        PricebookName: record.Name,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <span className="text-danger">*</span> Product
                  </Form.Label>
                  <LookupField
                    value={{ Id: formData.Product }}
                    entityName={`products`}
                    placeholder="Search Product"
                    isDisabled={formData.isProduct}
                    isInvalid={!!formErrors.Product}
                    onSelect={(record) =>
                      setFormData({
                        ...formData,
                        Product: record.Id,
                        ProductName: record.Name,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                {/* Conditional LookupField */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <span className="text-danger">*</span> Unit Price
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="Name"
                    value={formData.Unitprice}
                    min="0"
                    // required
                    isInvalid={!!formErrors.Unitprice}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        Unitprice: e.target.value,
                      });
                    }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.Unitprice}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              {/* <Col md={6}>
                <Form.Group className="mt-4">
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    name="Active"
                    checked={formData.Isactive}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        Isactive: e.target.checked,
                      });
                    }}
                  />
                </Form.Group>
              </Col> */}
            </Row>

            <div className="text-end">
              <Button
                variant="secondary"
                onClick={handleClose}
                className="me-2"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="dark" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default NewPriceBookEntry;
