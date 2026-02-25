import React, { useEffect, useState } from "react";
import { Row, Col, Button, Form, Modal, Spinner } from "react-bootstrap";
import { apiData } from "../utility/api";
import { toast } from "react-toastify";
import { helperMethods } from "../utility/CMPhelper";
import SystemDetails from "../components/SystemDetails";

function NewDealerModal({ show, handleClose, fetchDealers, record, newData }) {
  const [newDealer, setNewDealer] = useState(getEmptyDealer());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    setNewDealer({ ...newDealer, [e.target.name]: e.target.value });

    // Clear field error as user types
    setErrors({ ...errors, [e.target.name]: "" });
  };
  useEffect(() => {
    console.log("this is the record : ", record);
    if (record != null) {
      setNewDealer(record);
    } else {
      setNewDealer(getEmptyDealer());
    }
  }, [record]);
  // ---------------------------------------------
  // VALIDATION
  // ---------------------------------------------
  const validateFields = () => {
    const newErrors = {};
    const requiredFields = ["Name", "Phone"];

    requiredFields.forEach((field) => {
      if (!newDealer[field]) {
        newErrors[field] = "This field is required";
      }
    });

    if (newDealer.Email && !/\S+@\S+\.\S+/.test(newDealer.Email)) {
      newErrors.Email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handlePinCodeChange = async (e) => {
    let postalCode = e.target.value;
    let obj = {
      ...newDealer,
    };
    if (postalCode && postalCode != null) {
      const res = await fetch(
        `${apiData.PORT}/api/get/addresses?PostalCode=${postalCode}`
      );
      const data = await res.json();
      if (data && data.data && data.data.length > 0) {
        const address = data.data[0];
        obj.District = address.District;
        obj.City = address.CIty;
      } else {
        obj.District = "";
        obj.City = "";
      }
    }
    obj.PinCode = postalCode;
    setNewDealer(obj);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) {
      toast.error("Please complete all required fields.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...newDealer,
        Id: generateId(),
        CreatedBy: helperMethods.fetchUser(),
        CreatedDate: helperMethods.dateToString(),
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString(),
      };
      const res = await fetch(`${apiData.PORT}/api/dealer/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("New dealer created successfully.");
        setNewDealer(getEmptyDealer());
        fetchDealers && fetchDealers();
        newData && newData(payload);
        handleClose();
      } else {
        toast.error("Failed to create dealer." + data.error);
      }
    } catch (error) {
      toast.error("Failed to create dealer." + error);
    }

    setLoading(false);
  };

  const updateDealerRecord = async (e) => {
    e.preventDefault();

    if (!validateFields()) {
      toast.error("Please complete all required fields.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...newDealer,
        ModifiedBy: helperMethods.fetchUser(),
        ModifiedDate: helperMethods.dateToString(),
      };
      const res = await fetch(`${apiData.PORT}/api/dealer/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({})); // prevent crash if response is not JSON
      if (res.ok && data.success) {
        toast.success(`${payload.Name} was updated successfully.`);
        fetchDealers && fetchDealers();
        handleClose();
        setLoading(false);
      } else {
        toast.error(`Failed to update dealer. ${data.error || ""}`);
        setLoading(false);
      }
    } catch (error) {
      toast.error(`Failed to update dealer. ${error.message || error}`);
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={() => {
          if (!record) {
            setNewDealer(getEmptyDealer());
          }
          setErrors({});
          handleClose();
        }}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="w-100 text-center">
            {" "}
            {record ? "Edit " + record?.Name : "New Dealer"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={record ? updateDealerRecord : handleSubmit}>
            <fieldset className="custom-fieldset">
              <legend className="custom-legend">Dealer Information</legend>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <span className="text-danger">*</span> Name
                    </Form.Label>
                    <Form.Control
                      name="Name"
                      value={newDealer.Name}
                      onChange={handleChange}
                      isInvalid={!!errors.Name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.Name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <span className="text-danger">*</span> Phone
                    </Form.Label>
                    <Form.Control
                      name="Phone"
                      value={newDealer.Phone}
                      onChange={handleChange}
                      isInvalid={!!errors.Phone}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.Phone}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <span className="text-danger"></span> Email
                    </Form.Label>
                    <Form.Control
                      name="Email"
                      value={newDealer.Email}
                      onChange={handleChange}
                      isInvalid={!!errors.Email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.Email}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </fieldset>
            <fieldset className="custom-fieldset">
              <legend className="custom-legend">Address Information</legend>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <span className="text-danger"></span> Country
                    </Form.Label>
                    <Form.Control
                      name="Country"
                      value={newDealer.Country}
                      onChange={handleChange}
                      isInvalid={!!errors.Country}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.Country}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <span className="text-danger"></span> State
                    </Form.Label>
                    <Form.Control
                      name="State"
                      value={newDealer.State}
                      onChange={handleChange}
                      isInvalid={!!errors.State}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.State}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <span className="text-danger"></span> District
                    </Form.Label>
                    <Form.Control
                      name="District"
                      value={newDealer.District}
                      onChange={handleChange}
                      isInvalid={!!errors.District}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.District}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <span className="text-danger"></span> City
                    </Form.Label>
                    <Form.Control
                      name="City"
                      value={newDealer.City}
                      onChange={handleChange}
                      isInvalid={!!errors.City}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.City}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <span className="text-danger"></span> Pin Code
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="PinCode"
                      value={newDealer.PinCode}
                      onChange={handlePinCodeChange}
                      isInvalid={!!errors.PinCode}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.PinCode}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <span className="text-danger"></span> Street
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="Street"
                      value={newDealer.Street}
                      onChange={handleChange}
                      isInvalid={!!errors.Street}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.Street}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </fieldset>
            <fieldset className="custom-fieldset">
              <legend className="custom-legend">Owner Informantion</legend>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Dealer Owner Name</Form.Label>
                    <Form.Control
                      name="OwnerName"
                      value={newDealer.OwnerName}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </fieldset>
            {record && <SystemDetails data={newDealer} />}
            <div className="text-end">
              <Button
                variant="secondary"
                onClick={() => {
                  if (!record) {
                    setNewDealer(getEmptyDealer());
                  }
                  setErrors({});
                  handleClose();
                }}
                className="me-2"
              >
                Cancel
              </Button>

              <Button type="submit" variant="dark" disabled={loading}>
                {loading ? (
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

// ---------------------------------------------
// Utility functions
// ---------------------------------------------
function generateId(length = 30) {
  const timestamp = Date.now().toString(36);
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let randomPart = "";
  for (let i = 0; i < length - timestamp.length; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return timestamp + randomPart;
}

function getEmptyDealer() {
  return {
    Name: "",
    Phone: "",
    Email: "",
    Country: "India",
    State: "Rajasthan",
    District: "",
    PinCode: "",
    Street: "",
    OwnerName: "",
  };
}

export default NewDealerModal;
