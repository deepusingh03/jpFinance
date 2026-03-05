import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const SystemDetails = ({ data = {} }) => {
  const navigate = useNavigate();

  // Handle case when data is an array (as in the JSON structure)
  const recordData = Array.isArray(data) ? data[0] || {} : data;

  // Extract data from the nested user objects
  const createdByUser = recordData.users__CreatedBy || {};
  const modifiedByUser = recordData.users__ModifiedBy || {};

  const systemFields = [
    {
      label: "Created By",
      value: createdByUser.FirstName && createdByUser.LastName 
        ? `${createdByUser.FirstName} ${createdByUser.LastName}`.trim()
        : createdByUser.Email || "—",
      name: "createdBy",
      id: recordData.CreatedBy || createdByUser.Id,
      isClickable: true,
    },
    {
      label: "Modified By",
      value: modifiedByUser.FirstName && modifiedByUser.LastName 
        ? `${modifiedByUser.FirstName} ${modifiedByUser.LastName}`.trim()
        : modifiedByUser.Email || "—",
      name: "modifiedBy",
      id: recordData.ModifiedBy || modifiedByUser.Id,
      isClickable: true,
    },
    { 
      label: "Created Date", 
      value: recordData.CreatedDate || "—", 
      name: "createdDate" 
    },
    { 
      label: "Modified Date", 
      value: recordData.ModifiedDate || "—", 
      name: "modifiedDate" 
    },
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
              {field.isClickable && field.id ? (
                <Form.Control
                  name={field.name}
                  value={field.value || ""}
                  style={{
                    cursor: "pointer",
                    color: "#0d6efd",
                    textDecoration: "underline",
                    backgroundColor: "#e9ecef",
                  }}
                  onClick={() => goToRecord(field.id)}
                  readOnly
                />
              ) : (
                <Form.Control
                  name={field.name}
                  value={field.value || ""}
                  style={{
                    backgroundColor: "#e9ecef",
                  }}
                  readOnly
                />
              )}
            </Form.Group>
          </Col>
        ))}
      </Row>
    </fieldset>
  );
};

export default SystemDetails;