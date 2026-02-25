import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Form,
  Tabs,
  Tab,
  Modal,
  Spinner,
} from "react-bootstrap";
import { COLUMNS } from "../utility/columns";
import { apiData } from "../utility/api";
import CustomNavbar from "../components/CustomNavbar";
import CustomTable from "../components/CustomTable";

export default function LoanPortal() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [sheetName, setSheetName] = useState("001");
  const [warnings, setWarnings] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isCheckboxShow, setIsCheckboxShow] = useState(true);

  const FILTERS = {
    pending: [
      "New",
      "Rejected - Ready to resend",
      "Modified - Ready to resend",
    ],
    sent: ["Sent to Bank"],
    rejected: ["Rejected"],
  };

  const HEADINGS = {
    pending: "Loans Pending to Send",
    sent: "Loans Sent to Bank",
    rejected: "Rejected Loans",
  };

  useEffect(() => {
    fetchLoans();
  }, [sheetName]);

  useEffect(() => {
    const statuses = FILTERS[activeTab];
    const filteredLoans = loans.filter(
      (l) =>
        statuses.includes(l.UMRNStatus) &&
        Object.values(l).join(" ").toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(filteredLoans);
    setSelected(new Set());
  }, [activeTab, loans, search]);

  async function fetchLoans() {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiData.PORT}/api/get/joindata/loans-with-customers?sheetName=${sheetName}`
      );
      const data = await res.json();
      data.data.forEach((ele) => ele.action = 'CREATE')
      setLoans(data.data || []);
    } catch (err) {
      toast.error("Error fetching loans: " + err);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id) {
    const newSet = new Set(selected);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelected(newSet);
  }

  async function handleDownload() {
    if (selected.size === 0) {
      toast.warning("Please select at least one loan.");
      return;
    }
    const loanIds = Array.from(selected);
    setLoading(true);
    try {
      const response = await fetch(`${apiData.PORT}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanIds, sheetName }),
      });

      if (!response.ok) {
        const err = await response.json();

        if (err.warnings && err.warnings.length) {
          setWarnings(err.warnings);
          setShowWarningModal(true);
        }

        toast.error(err.error || "Download failed");
        return;
      }

      const warningsHeader = response.headers.get("X-Warnings");
      if (warningsHeader) {
        try {
          const parsedWarnings = JSON.parse(warningsHeader);
          if (Array.isArray(parsedWarnings) && parsedWarnings.length) {
            setWarnings(parsedWarnings);
            setShowWarningModal(true);
          }
        } catch (e) {
          console.error("Failed to parse X-Warnings header", e);
        }
      }

      const disposition = response.headers.get("Content-Disposition");
      let filename = "download.zip";
      if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].replace(/"/g, "").trim();
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      a.remove();

      await fetchLoans();
    } catch (err) {
      toast.error("Error generating ZIP: " + err);
    } finally {
      setLoading(false);
    }
  }

  const handleRowSelection = useCallback(
    (selectedOption, row) => {
      switch (selectedOption) {
        case "view":
          navigate(`/loans/detail/${row.Id}/view`);
          break;
        case "edit":
          navigate(`/details/loans/${row.Id}/edit`);
          break;
        case "delete":
          // setRecordToDelete(row);
          // setShowDeleteModal(true);
          break;
        default:
          break;
      }
    },
    [navigate]
  );
  const handleTabChenge = (props) => {
    if (props === 'pending') {
      setIsCheckboxShow(true)
    } else {
      setIsCheckboxShow(false)
    }
    setActiveTab(props)
  }
  const onSelectall = (props) => {
    const newSet = new Set(selected);
    if (props.target.checked) {
      filtered.forEach((l) => newSet.add(l.Id));
    } else {
      filtered.forEach((l) => newSet.delete(l.Id));
    }
    setSelected(newSet);
  };
  return (
    <>
      <CustomNavbar />

      <Container fluid className="mt-4">
        {/* Header */}
        <Row className="mb-3">
          <Col xs={12}>
            <h1 className="h3">Loan Management Portal</h1>
            <p className="text-muted">
              Manage, review, and track loan applications.
            </p>
          </Col>
        </Row>

        {/* Controls */}
        <Row className="mb-3 g-2 align-items-center">
          <Col xs={12} md={3}>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => handleTabChenge(k)}
              id="loan-tabs"
              className="mb-3"
            >
              <Tab eventKey="pending" title="Pending" />
              <Tab eventKey="sent" title="Sent to Bank" />
              <Tab eventKey="rejected" title="Rejected" />
            </Tabs>
          </Col>

          <Col xs={12} md={3}>
            <Form.Control
              type="text"
              placeholder="Search loans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>

          <Col xs={12} md={2}>
            <Form.Select
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
            >
              <option value="001">ECS Fixed</option>
              <option value="002">ECS Max</option>
            </Form.Select>
          </Col>

          <Col xs={12} md={4} className="justify-content-center">
            <Row>
              <Col xs={6} md={6}>
                {activeTab === "pending" && (
                  <Button
                    variant="light"
                    onClick={handleDownload}
                    disabled={loading}
                    className="d-flex align-items-center gap-2 border border-2"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />{" "}
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-download"></i> Download Selected
                      </>
                    )}
                  </Button>
                )}
              </Col>

              <Col xs={6} md={6} className="d-flex justify-content-end">
                <Button
                  variant="light"
                  className="d-flex align-items-center gap-2 border border-2"
                  onClick={() => navigate("/portal/bank-response")}
                >
                  Bank Response <i className="bi bi-box-arrow-up-right"></i>
                </Button>
              </Col>
            </Row>
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
                onRowClick={(row) => navigate(`/loans/detail/${row.Id}/view`)}
                onOptionSelect={handleRowSelection}
                columns={COLUMNS}
                onSelect={toggleSelect}
                selectable={isCheckboxShow}
                selected={selected}
                onSelectall={onSelectall}
                showIndex="true"
              />
            )}
          </Col>
        </Row>

        {/* Warning Modal */}
        <Modal
          show={showWarningModal}
          onHide={() => setShowWarningModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Some loans were skipped</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>The following loans were not included in the download:</p>
            <ul>
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowWarningModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}
