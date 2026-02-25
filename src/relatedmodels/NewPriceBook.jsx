import React, { useState,useEffect } from "react";
import { Toggle } from "rsuite";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
} from "react-bootstrap";
import { apiData } from "../utility/api";
import { helperMethods } from "../utility/CMPhelper";
import { toast } from "react-toastify";

function NewPriceBook({ show, onHide, record,parentData, success }) {
  const [formData, setFormData] = useState({IsActive:true});
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (parentData != null) {
      setFormData({
        IsActive:true,
        Dealer:parentData.data.Id,
        DealerName:parentData.data.Name
      });
    } 
    else {
      setFormData({});
    }
  },[parentData]);

  useEffect(() => {
    if (record != null) {
      setFormData({
        Dealer: record.dealer_id,
        DealerName: record.dealer_Name,
        IsActive: record.IsActive,
        Name: record.Name,
        Id: record.Id
      });
    }
  }, [record]);
  
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
    const requiredFields = [
      "PricebookName",
      // "Dealer",
      // DealerName:
    ];
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors[field] = "This field is required";
      }
    });
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
  
    setLoading(true);
  
    try {
      let url = "";
      let payload = {};
  
      if (record) {
        // ============================
        //     UPDATE EXISTING RECORD
        // ============================
        url = `${apiData.PORT}/api/pricebook/update/`;
  
        payload = {
          ...formData,
          ModifiedDate: helperMethods.dateToString(),
          ModifiedBy: helperMethods.fetchUser(),
        };
  
      } else {
        // ============================
        //       CREATE NEW RECORD
        // ============================
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
        method: record == null?"POST":"PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
  
      if (!res.ok) throw new Error(data.message || "Error saving record");
  
      toast.success(record ? record.Name+" was updated successfully." : "PriceBook created successfully.");
      success && success();
      onHide();
  
    } catch (error) {
      toast.error(error.message || "Server error");
    } finally {
      setLoading(false);
    }
  };
  
  /** ✅ Determines lookup context dynamically */

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
          <Modal.Title>Add New Price Book</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                {/* Conditional LookupField */}
                <Form.Group className="mb-3">
                  <Form.Label>
                  <span className="text-danger">*</span> PriceBook Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="Name"
                    value={formData.PricebookName || ""}
                    isInvalid={!!formErrors.PricebookName}
                    onChange={(e)=>{
                      setFormData({
                        ...formData,
                        PricebookName:e.target.value
                      })
                    }}
                  />
                   <Form.Control.Feedback type="invalid">
                      {formErrors.PricebookName}
                    </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                  <span className="text-danger">*</span>  Dealer
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="Name"
                    value={formData.DealerName}
                    isInvalid={!!formErrors.DealerName}
                    disabled
                    readOnly
                  />
                   <Form.Control.Feedback type="invalid">
                      {formErrors.DealerName}
                    </Form.Control.Feedback>
                </Form.Group>
                
              </Col>
              <Col md={6}>
                {/* Conditional LookupField */}
                <Form.Group className="mt-4">
                  <Toggle
                    size="lg"
                    checked={formData.IsActive}
                    onClick={(e) => {
                      setFormData({
                        ...formData,
                        IsActive: e.target.checked,
                      });
                    }}
                  >
                    Active
                  </Toggle>
                </Form.Group>
              </Col>
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

export default NewPriceBook;
