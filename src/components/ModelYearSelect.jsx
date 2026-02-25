import React from "react";
import { Form } from "react-bootstrap";
const ModelYearSelect = ({
  value,
  onChange,
  startYear = 2020,
  endYear = new Date().getFullYear(),
}) => {
  // Generate array of years from endYear to startYear (descending)
  const years = [];
  for (let y = endYear; y >= startYear; y--) {
    years.push(y);
  }

  return (
    <Form.Group className="mb-3">
      {/* <Form.Label>Model Year</Form.Label> */}
      <Form.Select name="ModelYear" value={value} onChange={onChange} required>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );
};

export default ModelYearSelect;
