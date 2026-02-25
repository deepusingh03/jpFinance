import React from 'react';
import { Form } from "react-bootstrap";

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ModelMonthSelect = ({ value, onChange }) => {
  return (
    <Form.Group className="mb-3">
      {/* <Form.Label>Model Month</Form.Label> */}
      <Form.Select name="ModelMonth" value={value} onChange={onChange} required>
        {months.map((month, index) => (
          <option key={month} value={index+1}>{index+1}</option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default ModelMonthSelect;
