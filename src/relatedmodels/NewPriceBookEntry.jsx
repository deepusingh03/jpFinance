import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { apiData } from "../utility/api";
import LookupField from "../components/LookupField";
import { toast } from "react-toastify";
import { helperMethods } from "../utility/CMPhelper";

function NewPriceBookEntry({ show, onHide, record, success }) {
  /** ✅ Initial State Generator */
  const getInitialState = (record) => {
    if (record?.data?.Name?.startsWith("PB")) {
      return {
        Pricebook: record.data.Id,
        PricebookName: record.data.Name,
        Product: "",
        ProductName: "",
        Unitprice: "",
        isProbook: true,
        isProduct: false,
      };
    } else if (record?.data) {
      return {
        Product: record.data.Id,
        ProductName: record.data.Name,
        Pricebook: "",
        PricebookName: "",
        Unitprice: "",
        isProduct: true,
        isProbook: false,
      };
    }

    return {
      Pricebook: "",
      PricebookName: "",
      Product: "",
      ProductName: "",
      Unitprice: "",
      isProduct: false,
      isProbook: false,
    };
  };

  const [formData, setFormData] = useState(getInitialState(record));
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /** ✅ Sync form when modal opens */
  useEffect(() => {
    if (show) {
      setFormData(getInitialState(record));
      setFormErrors({});
    }
  }, [record, show]);

  /** ✅ Generate unique ID */
  const generateId = (length = 30) => {
    const timestamp = Date.now().toString(36);
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    const randomPart = Array.from({ length: length - timestamp.length })
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join("");

    return timestamp + randomPart;
  };

  /** ✅ Close handler with reset */
  const handleClose = () => {
    if (!loading) {
      setFormData(getInitialState(record));
      setFormErrors({});
      onHide();
    }
  };

  /** ✅ Validation */
  const validateForm = () => {
    const errors = {};

    if (!formData.Product) {
      errors.Product = "This field is required";
    }

    if (!formData.Pricebook) {
      errors.Pricebook = "This field is required";
    }

    if (!formData.Unitprice) {
      errors.Unitprice = "This field is required";
    } else if (!/^\d+$/.test(formData.Unitprice)) {
      errors.Unitprice = "Invalid unit price";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** ✅ Check duplicate entry */
  const checkPricebookEntry = async () => {
    if (formData.Pricebook && formData.Product) {
      try {
        const data = await helperMethods.getEntityDetails(
          `pricebookentry?Pricebook=${formData.Pricebook}&Product=${formData.Product}`,
        );
        if (data?.length > 0) {
          return false;
        }

        return true;
      } catch {
        return true;
      }
    }
    return true;
  };

  /** ✅ Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (!(await checkPricebookEntry())) {
      toast.warning(
        "Only one active Price Book Entry is allowed per Product and Price Book.",
      );
      return;
    }

    setLoading(true);

    try {
      const newRecord = {
        ...formData,
        Id: generateId(),
        isactive: true,
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

      /** ✅ Success */
      toast.success("New record added successfully!");

      /** ✅ Reset form */
      setFormData(getInitialState(record));
      setFormErrors({});
      onHide();
      success && success();
      /** ✅ Refresh + close */
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          New PriceBook Entry
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            {/* Pricebook */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <span className="text-danger">*</span> PriceBook
                </Form.Label>
                <LookupField
                  value={{ Id: formData.Pricebook }}
                  entityName="pricebook"
                  placeholder="Search pricebook"
                  isDisabled={formData.isProbook}
                  onSelect={(rec) =>
                    setFormData({
                      ...formData,
                      Pricebook: rec.Id,
                      PricebookName: rec.Name,
                    })
                  }
                />
              </Form.Group>
            </Col>

            {/* Product */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <span className="text-danger">*</span> Product
                </Form.Label>
                <LookupField
                  value={{ Id: formData.Product }}
                  entityName="products"
                  placeholder="Search Product"
                  isDisabled={formData.isProduct}
                  isInvalid={!!formErrors.Product}
                  onSelect={(rec) =>
                    setFormData({
                      ...formData,
                      Product: rec.Id,
                      ProductName: rec.Name,
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            {/* Unit Price */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <span className="text-danger">*</span> Unit Price
                </Form.Label>
                <Form.Control
                  type="number"
                  value={formData.Unitprice}
                  min="0"
                  isInvalid={!!formErrors.Unitprice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Unitprice: e.target.value,
                    })
                  }
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.Unitprice}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Actions */}
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
  );
}

export default NewPriceBookEntry;
