import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const SystemDetails = ({ data = {} }) => {
  const navigate = useNavigate();

  const systemFields = [
    {
      label: "Created By",
      value: `${data.createdby_firstname || ""} ${data.createdby_lastname || ""}`.trim(),
      name: "createdBy",
      id: data.createdby_id,
      isClickable: true,
    },
    {
      label: "Modified By",
      value: `${data.modifiedby_firstname || ""} ${data.modifiedby_lastname || ""}`.trim(),
      name: "modifiedBy",
      id: data.modifiedby_id,
      isClickable: true,
    },
    { label: "Created Date", value: data.CreatedDate, name: "createdDate" },
    { label: "Modified Date", value: data.ModifiedDate, name: "modifiedDate" },
  ];

  const goToRecord = (id) => {
    if (!id) return;
    navigate(`/users/detail/${id}/view`);
  };

  return (
    <fieldset className="custom-fieldset">
      <legend className="custom-legend">System Information</legend>
      <Row>
        {systemFields.map((field) => (
          <Col md={6} key={field.name}>
            <Form.Group className="mb-3">
              <Form.Label>{field.label}</Form.Label>
              <Form.Control
                name={field.name}
                value={field.value || ""}
                style={
                  field.isClickable
                    ? {
                        cursor: "pointer",
                        color: "#0d6efd",
                        textDecoration: "underline",
                        backgroundColor: "#e9ecef",
                      }
                    : {
                        backgroundColor: "#e9ecef",
                      }
                }
                onClick={() => {
                  field.isClickable && goToRecord(field.id);
                }}
                readOnly
              />
            </Form.Group>
          </Col>
        ))}
      </Row>
    </fieldset>
  );
};

export default SystemDetails;