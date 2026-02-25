import React from "react";
import { Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function RecordLinkField({
  isRequired = false,
  label,
  id,
  firstName,
  lastName,
  fallback,
  table
}) {
  const navigate = useNavigate();

  const displayName =
    (firstName || lastName)
      ? `${firstName || ""} ${lastName || ""}`.trim()
      : fallback || id || "—";

  const goToRecord = () => {
    if (!id) return;
    navigate(`/${table === 'pricebook' || table === 'pricebookentry' ?table:table+'s'}/detail/${id}/view`);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label className="fw-semibold"> 
      {isRequired && (
            <span className="text-danger">* </span> 
          )} 
        {label}</Form.Label>

      <div className="p-2 bg-light rounded">
        {id ? (
          <button
            type="button"
            className="btn btn-link p-0 align-baseline"
            onClick={goToRecord}
          >
            {displayName}
          </button>
        ) : (
          <span>{displayName}</span>
        )}
      </div>
    </Form.Group>
  );
}
