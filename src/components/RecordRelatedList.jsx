import React, { useState, useEffect } from "react";
import { Table, Card, Spinner, Button, Dropdown } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import NewPriceBook from "../relatedmodels/NewPriceBook";
import NewPriceBookEntry from "../relatedmodels/NewPriceBookEntry";
import { helperMethods } from "/src/utility/CMPhelper.jsx";
import { Checkbox } from "primereact/checkbox";

const RecordRelatedList = ({ details }) => {
  const [relatedData, setRelatedData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPriceBookModal, setShowPriceBookModal] = useState(false);
  const [showPriceBookEntryModal, setShowPriceBookEntryModal] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  // Refresh on URL change
  useEffect(() => {
    console.log('details :::',details)
    setRefresh((prev) => prev + 1);
  }, [location.pathname]);

  // Fetch related data
  useEffect(() => {
    if (!details?.entity || !details?.parentField || !details?.Id) return;
    console.log("details ::: ", details);
    const fetchData = async () => {
      try {
        setLoading(true);

        const data = await helperMethods.getEntityDetails(
          `${details.entity}?${details.parentField}=${details.Id}`
        );
        if (data) {
          const records =
            details.entity.toLowerCase() === "pricebook"
              ? data.filter((ele) => ele.IsActive == 1)
              : data;
          console.log("records :: ", records);
          setRelatedData(records);
          setColumns(records.length > 0 ? Object.keys(records[0]) : []);
        } else {
          setRelatedData([]);
        }
      } catch (err) {
        console.error("❌ Error fetching related data:", err);
        setRelatedData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [details?.entity, details?.parentField, details?.Id, refresh]);

  // Remove unwanted columns
  const filteredColumns = columns.filter(
    (col) =>
      col.toLowerCase() !== "index" &&
      col.toLowerCase() !== "id" &&
      col !== "childs-parentfield" &&
      col !== details?.parentField
  );

  // Add new model modal
  const handleAddNew = () => {
    const entityName = details?.entity?.toLowerCase();
    if (entityName === "pricebook") setShowPriceBookModal(true);
    else if (entityName === "pricebookentry") setShowPriceBookEntryModal(true);
  };

  // Clickable relationship cell
  const CreateClickablePiont = (data) => {
    if (!data?.Name) return null;

    return (
      <span
        style={{
          cursor: "pointer",
          color: "#0d6efd",
          textDecoration: "underline",
          whiteSpace: "nowrap",
        }}
        onClick={() =>
          navigate(`/details/childs/${data.Entity}/${data.Id}/view`)
        }
      >
        {data.Name}
      </span>
    );
  };

  // Cell click
  const handleCellClick = (col, row) => {
    if (col === "Name" || col === "FirstName" || col === "PricebookName") {
      navigate(`/details/childs/${details.entity}/${row.Id}/view`, {
        state: { row },
      });
    }
  };

  // Map checkbox fields
  const checkboxFields = [
    "isactive",
    "active",
    "hirer",
    "agent",
    "guarantor",
    "referrer",
  ];

  // Render cells including checkboxes
  const renderCellData = (col, row) => {
    const value = row[col];

    if (
      checkboxFields.includes(col.toLowerCase()) &&
      (value === "1" || value === 1 || value === "0" || value === 0)
    ) {
      return (
        <Checkbox
          disabled
          readOnly
          checked={value === "1" || value === 1}
          className="checkbox-blue"
        />
      );
    }

    return (
      CreateClickablePiont(helperMethods.getUserName(col, row)) ||
      helperMethods.handleDateFormat(value) || <i className="text-muted">—</i>
    );
  };

  // Main table
  const renderTable = () => (
    <div className="table-responsive">
      <Table striped bordered hover size="sm">
        <thead className="table-light">
          <tr>
            {filteredColumns.map((col) =>
              !col.includes("_") &&
              !(
                details.entity === "pricebook" && col.toLowerCase() === "name"
              ) ? (
                <th
                  key={col}
                  style={{ whiteSpace: "nowrap", textAlign: "center" }}
                >
                  {col}
                </th>
              ) : null
            )}
          </tr>
        </thead>

        <tbody>
          {relatedData.map((row, i) => (
            <tr key={i}>
              {filteredColumns.map(
                (col) =>
                  !col.includes("_") &&
                  !(
                    details.entity === "pricebook" &&
                    col.toLowerCase() === "name"
                  ) && (
                    <td
                      key={col}
                      style={{
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        cursor:
                          col === "Name" ||
                          col === "FirstName" ||
                          col === "PricebookName"
                            ? "pointer"
                            : "default",
                        color:
                          col === "Name" ||
                          col === "FirstName" ||
                          col === "PricebookName"
                            ? "#0d6efd"
                            : "",
                        textDecoration:
                          col === "Name" ||
                          col === "FirstName" ||
                          col === "PricebookName"
                            ? "underline"
                            : "none",
                      }}
                      onClick={() => handleCellClick(col, row)}
                    >
                      {renderCellData(col, row)}
                    </td>
                  )
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );

  return (
    <>
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
            <Card.Title className="text-capitalize mb-0">
              {details?.entity || "Related Records"}
            </Card.Title>

            {(details?.entity == "pricebook" ||
              details?.entity == "pricebookentry" ||
              details?.entity == "documentversion") && (
              <Button
                variant="dark"
                className="px-4 py-2 fw-semibold shadow-sm"
                onClick={handleAddNew}
                disabled={loading}
              >
                + Add New
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" />
            </div>
          ) : relatedData.length === 0 ? (
            <p className="text-muted text-center mb-0">
              No records to display.
            </p>
          ) : (
            renderTable()
          )}
        </Card.Body>
      </Card>

      {/* Modals */}
      <NewPriceBook
        show={showPriceBookModal}
        onHide={() => setShowPriceBookModal(false)}
        parentData={details}
        success={() => setRefresh((prev) => prev + 1)}
      />

      <NewPriceBookEntry
        show={showPriceBookEntryModal}
        onHide={() => setShowPriceBookEntryModal(false)}
        record={details}
        success={() => setRefresh((prev) => prev + 1)}
      />
    </>
  );
};

export default RecordRelatedList;
