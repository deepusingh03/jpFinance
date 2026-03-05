import React from "react";
import { Card, Table, Dropdown } from "react-bootstrap";
import { format } from "date-fns";
import { useNavigate, } from "react-router-dom";
import { helperMethods } from "../utility/CMPhelper";

function CustomTable({
  columns = [],
  data = [],
  onRowClick,
  onOptionSelect,
  selectable,
  onSelect,
  selected = new Set(),
  onSelectall,
  showIndex,
}) {
  const autoColumns =
    columns.length === 0 && data.length > 0
      ? Object.keys(data[0]).map((key) => ({ label: key, key: key }))
      : columns;

  const tableColumns = [...autoColumns, { label: "", key: "actions" }];
  const navigate = useNavigate();

  return (
    <Card className="shadow-sm">
      <Card.Body
        style={{ overflowX: "auto", overflowY: "auto", maxHeight: "75vh" }}
      >
        <Table striped bordered hover responsive className="mb-0">
          <thead>
            <tr>
              {selectable && (
                <th>
                  <input
                    type="checkbox"
                    checked={
                      data.length > 0 && data.every((l) => selected.has(l.Id))
                    }
                    onChange={(e) => onSelectall(e)}
                  />
                </th>
              )}
              {showIndex && (
                <th style={{ whiteSpace: "nowrap", textAlign: "center" }}>
                  Sr Number
                </th>
              )}
              {tableColumns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    whiteSpace: "nowrap", // Prevent header wrapping
                    // textAlign: "center",
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, i) => (
                <tr key={row.Id || i} style={{ whiteSpace: "nowrap" }}>
                  {selectable && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(row.Id)}
                        onChange={() => onSelect(row.Id)}
                      />
                    </td>
                  )}
                  {showIndex && (
                    <td style={{ whiteSpace: "nowrap", textAlign: "center" }}>
                      {i + 1}
                    </td>
                  )}
                  {autoColumns.map((col) => (
                    <td key={col.key}>
                      <span
                        onClick={() =>
                          (col.key === "Name" || col.key === "FirstName") &&
                          onRowClick &&
                          onRowClick(row)
                        }
                        style={
                          onRowClick &&
                          (col.key === "Name" || col.key === "FirstName")
                            ? {
                                cursor: "pointer",
                                color: "#0d6efd",
                                textDecoration: "underline",
                              }
                            : { cursor: "default" }
                        }
                      >
                        {isValidDate(row[col.key])
                          ? format(new Date(row[col.key]), "dd/MM/yyyy")
                          : CreateClickablePiont(
                              helperMethods.getUserName(col.key, row)
                            ) || row[col.key]}
                      </span>
                    </td>
                  ))}
                  <td className="text-center">
                    <Dropdown align="end">
                      <Dropdown.Toggle
                        as="span"
                        id={`dropdown-${i}`}
                        className="border-0 p-0 m-0"
                        style={{
                          cursor: "pointer",
                          display: "inline-block",
                          width: "31px",
                        }}
                        aria-label="More options"
                      >
                        {/* <span className="bi bi-three-dots-vertical fs-5 text-secondary"></span> */}
                      </Dropdown.Toggle>

                      <Dropdown.Menu className="fixed-dropdown-menu">
                        <Dropdown.Item
                          onClick={() =>
                            onOptionSelect && onOptionSelect("view", row)
                          }
                          className="d-flex align-items-center gap-2"
                        >
                          <span className="bi bi-eye text-info"></span> View
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            onOptionSelect && onOptionSelect("edit", row)
                          }
                          className="d-flex align-items-center gap-2"
                        >
                          <span className="bi bi-pencil text-primary"></span>{" "}
                          Edit
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            onOptionSelect && onOptionSelect("delete", row)
                          }
                          className="d-flex align-items-center gap-2"
                        >
                          <span className="bi bi-trash text-danger"></span>{" "}
                          Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={tableColumns.length}
                  className="text-center text-secondary"
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  function isValidDate(val) {
    if (!val || typeof val !== "string") return false;

    const isoDatePattern = /^\d{4}-\d{2}-\d{2}(?:[Tt ][0-9:.+-Z]*)?$/;
    if (!isoDatePattern.test(val)) return false;

    const date = new Date(val);
    return date instanceof Date && !isNaN(date.getTime());
  }
  function CreateClickablePiont(data) {
    if (data && (data.Name || data.Name)) {
      return (
        <span
          style={{
            cursor: "pointer",
            color: "#0d6efd",
            textDecoration: "underline",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
          onClick={() =>
            navigate(`/details/childs/${data.Entity}/${data.Id}/view`)
          }
        >
          {data.Name}
        </span>
      );
    }
    return null;
  }
}

export default CustomTable;
