import React, { useState, useEffect } from "react";
import { Toggle } from "rsuite";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { apiData } from "../utility/api";
import { helperMethods } from "../utility/CMPhelper";
import { toast } from "react-toastify";

function NewPriceBook({ show, onHide, record, parentData, success }) {

  /** ✅ Initial State Generator */
  const getInitialState = () => ({
    PricebookName: "",
    Dealer: parentData?.data?.Id || "",
    DealerName: parentData?.data?.Name || "",
    IsActive: true,
  });

  const [formData, setFormData] = useState(getInitialState());
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  /** ✅ Sync form when modal opens / data changes */
  useEffect(() => {
    if (!show) return;

    if (record) {
      // Edit mode
      setFormData({
        Dealer: record.dealer_id,
        DealerName: record.dealer_Name,
        IsActive: record.IsActive,
        PricebookName: record.Name,
        Id: record.Id,
      });
    } else if (parentData) {
      // Create with parent
      setFormData({
        ...getInitialState(),
        Dealer: parentData.data.Id,
        DealerName: parentData.data.Name,
      });
    } else {
      // Fresh create
      setFormData(getInitialState());
    }

    setFormErrors({});
  }, [record, parentData, show]);

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
      setFormData(getInitialState());
      setFormErrors({});
      onHide();
    }
  };

  /** ✅ Validation */
  const validateForm = () => {
    const errors = {};

    if (!formData.PricebookName) {
      errors.PricebookName = "This field is required";
    }

    if (!formData.DealerName) {
      errors.DealerName = "Dealer is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** ✅ Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please complete all required fields.");
      return;
    }

    setLoading(true);

    try {
      let url = "";
      let payload = {};

      if (record) {
        // UPDATE
        url = `${apiData.PORT}/api/pricebook/update/`;

        payload = {
          ...formData,
          ModifiedDate: helperMethods.dateToString(),
          ModifiedBy: helperMethods.fetchUser(),
        };
      } else {
        // CREATE
        url = `${apiData.PORT}/api/pricebook/insert`;

        payload = {
          ...formData,
          Id: generateId(),
          CreatedDate: helperMethods.dateToString(),
          CreatedBy: helperMethods.fetchUser(),
          ModifiedDate: helperMethods.dateToString(),
          ModifiedBy: helperMethods.fetchUser(),
        };
      }

      const res = await fetch(url, {
        method: record ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error saving record");

      toast.success(
        record
          ? `${record.Name} was updated successfully.`
          : "PriceBook created successfully."
      );

      /** ✅ Reset after success */
      setFormData(getInitialState());
      setFormErrors({});

      success && success();
      onHide();

    } catch (error) {
      toast.error(error.message || "Server error");
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
        <Modal.Title>
          {record ? "Edit Price Book" : "Add New Price Book"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            {/* Pricebook Name */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <span className="text-danger">*</span> PriceBook Name
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.PricebookName || ""}
                  isInvalid={!!formErrors.PricebookName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      PricebookName: e.target.value,
                    })
                  }
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.PricebookName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Dealer */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <span className="text-danger">*</span> Dealer
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.DealerName || ""}
                  isInvalid={!!formErrors.DealerName}
                  disabled
                  readOnly
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.DealerName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            {/* Active Toggle */}
            <Col md={6}>
              <Form.Group className="mt-4">
                <Toggle
                  size="lg"
                  checked={formData.IsActive}
                  onChange={(checked) =>
                    setFormData({
                      ...formData,
                      IsActive: checked,
                    })
                  }
                >
                  Active
                </Toggle>
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

export default NewPriceBook;