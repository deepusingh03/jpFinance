import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Spinner,
} from "react-bootstrap";

import CustomNavbar from "../components/CustomNavbar";
import CustomTable from "../components/CustomTable";
import { apiData } from "../utility/api";

// EMI Table Columns
const EMI_COLUMNS = [
  { label: "MANDATE NO (UMRN)", key: "UMRN" },
  { label: "DEBIT DATE", key: "DueDate" },
  { label: "AMOUNT", key: "Amount" },
  { label: "MANDATE ACCOUNT HOLDER NAME", key: "AccountHolder" },
  { label: "CUSTOMER REF NO", key: "DealerFileNumber" },
];

export default function EMIPage() {
  const navigate = useNavigate();

  const [emis, setEmis] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // ================= FETCH =================
  useEffect(() => {
    fetchEmis();
  }, []);

  useEffect(() => {
    const filteredEmis = emis.filter((e) =>
      Object.values(e)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
    setFiltered(filteredEmis);
  }, [emis, search]);

  async function fetchEmis() {
    setLoading(true);
    try {
      const res = await fetch(`${apiData.PORT}/api/emis/get`);
      var data = await res.json();
      console.log(data);
      data.data.forEach((element)=>{
        element.AccountHolder = `${element.FirstName || ''} ${element.LastName || ''}`;
      })
      setEmis(data.data || []);
    } catch (err) {
      toast.error("Error fetching EMIs: " + err);
    } finally {
      setLoading(false);
    }
  }

  // ================= DOWNLOAD =================
  async function handleDownload() {
  if (filtered.length === 0) {
    toast.warning("No EMIs available to download.");
    return;
  }

  const emiIds = filtered.map((emi) => emi.Id);
  setLoading(true);

  try {
    const response = await fetch(
      `${apiData.PORT}/api/download-emi`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emiIds }),
      }
    );

    if (!response.ok) {
      let errorMessage = "Download failed";
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        const err = await response.json();
        errorMessage = err.error || errorMessage;
      } else {
        errorMessage = "Server error while generating Excel";
      }

      toast.error(errorMessage);
      return;
    }

    let filename = "emis.xlsx";
    const disposition = response.headers.get("Content-Disposition");
    if (disposition?.includes("filename=")) {
      filename = disposition
        .split("filename=")[1]
        .replace(/["']/g, "")
        .trim();
    }

    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error("Empty Excel file received");
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    toast.success(`Downloaded ${filtered.length} EMIs successfully`);
    await fetchEmis();
  } catch (err) {
    toast.error("Error generating Excel");
    console.error(err);
  } finally {
    setLoading(false);
  }
}

  // ================= ROW OPTIONS =================
  const handleRowSelection = useCallback(
    (selectedOption, row) => {
      switch (selectedOption) {
        case "view":
          navigate(`/loanitems/detail/${row.Id}/view`);
          break;
        case "edit":
          navigate(`/loanitems/detail/${row.Id}/edit`);
          break;
        default:
          break;
      }
    },
    [navigate]
  );

  // ================= UI =================
  return (
    <>
      <CustomNavbar />

      <Container fluid className="mt-4">
        {/* Header */}
        <Row className="mb-3">
          <Col xs={12}>
            <h1 className="h3">EMI Management Portal</h1>
            <p className="text-muted">
              Manage, review, and track EMI payments.
            </p>
          </Col>
        </Row>

        {/* Controls */}
        <Row className="mb-3 g-2 align-items-center">
          <Col xs={12} md={8}>
            <Form.Control
              type="text"
              placeholder="Search EMIs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>

          <Col xs={6} md={2} className="d-flex justify-content-end">
            <Button
              variant="light"
              onClick={handleDownload}
              disabled={loading}
              className="d-flex align-items-center gap-2 border border-2"
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" />
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-download"></i>
                  Download All
                </>
              )}
            </Button>
          </Col>
          <Col xs={6} md={2} className="d-flex justify-content-end">
                <Button
                  variant="light"
                  className="d-flex align-items-center gap-2 border border-2"
                  onClick={() => navigate("/portal/emi-bank-response")}
                >
                  Bank Response <i className="bi bi-box-arrow-up-right"></i>
                </Button>
              </Col>
        </Row>

        {/* Table */}
        <Row>
          <Col xs={12}>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-5">No records found</div>
            ) : (
              <CustomTable
                data={filtered}
                columns={EMI_COLUMNS}
                onRowClick={(row) =>
                  navigate(`/emis/detail/${row.Id}/view`)
                }
                onOptionSelect={handleRowSelection}
                showIndex="true"
              />
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}
