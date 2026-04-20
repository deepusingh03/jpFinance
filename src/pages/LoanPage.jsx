import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomNavbar from "../components/CustomNavbar";
import CustomTable from "../components/CustomTable";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

import { Row, Col, Button, Form, Spinner } from "react-bootstrap";
import NewLoanModal from "../relatedmodels/NewLoanModal";
import { toast } from "react-toastify";
import { helperMethods } from "../utility/CMPhelper";

function LoanPage() {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [loading, setLoading] = useState(true); // ⬅️ Spinner state

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Loans | JP Finance";
  }, []);

  // Fetch Loans
  useEffect(() => {
    fetchLoanRecords();
  }, []);

  // Filter applications
  useEffect(() => {
    const filtered = applications.filter((app) =>
      app.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.DealerFileNumber?.toLowerCase().includes(searchTerm.toLowerCase())||
      app.Name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredApps(filtered);
  }, [searchTerm, applications]);


  const fetchLoanRecords = async() => {
    setLoading(true);
    await helperMethods.getEntityDetails('loans')
      .then((data) => {
        setApplications(data || []);
        setFilteredApps(data || []);
      })
      .catch((err) => {
        toast.error("Error fetching loans:", err);
      })

      .finally(() => setLoading(false)); // ⬅️ Hide spinner when done
  };
  const handleShow = () => {
    setRecordToEdit(null);
    setShowModal(true);
  };
  const handleClose = () => setShowModal(false);

  const handleCustomerClick = (customer) => {
    navigate(`/loans/detail/${customer.Id}/view`);
  };

  const handleRowSelection = (selectedOption, row) => {
    if (selectedOption === "view") {
      navigate(`/loans/detail/${row.Id}/view`);
    } else if (selectedOption === "edit") {
      setRecordToEdit(row);
      setShowModal(true);
    } else if (selectedOption === "delete") {
      setRecordToDelete(row);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  return (
    <>
      <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <CustomNavbar />

        {/* PAGE TITLE */}
        <Row className="mb-3 mt-4 mx-2">
          <Col xs={12} className="text-start fw-bold h4">
            All Loans
          </Col>
        </Row>

        {/* SEARCH + NEW BUTTON */}
        <Row className="mb-3 mt-4 mx-2">
          <Col xs={8}>
            <Form.Control
              type="text"
              placeholder="Search by Name, Dealer File Number..."
              value={searchTerm}
              disabled={loading} // ⬅️ Disable while loading
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col xs={4} className="text-end">
            <Button onClick={handleShow} variant="dark" disabled={loading}>
              + New
            </Button>
          </Col>
        </Row>

        {/* LOADING SPINNER */}
        {loading ? (
          <Row className="mt-5 text-center">
            <Col>
              <Spinner animation="border" variant="dark" />
              {/* <div className="mt-2 fw-semibold">Loading loans...</div> */}
            </Col>
          </Row>
        ) : (
          /* TABLE LOADED */
          <Row className="mx-2">
            <Col>
              <CustomTable
                data={filteredApps}
                onRowClick={handleCustomerClick}
                onOptionSelect={handleRowSelection}
                columns={[
                  { label: "Loan Number", key: "Name" },
                  { label: "Tenure", key: "Tenure" },
                  { label: "Rate Of Interest", key: "RateOfInterest" },
                  { label: "Dealer", key: "Dealer" },
                  { label: "Dealer File Number", key: "DealerFileNumber" },
                  { label: "Hirer", key: "Hirer" },
                  { label: "Created By", key: "CreatedBy" },
                  { label: "Created Date", key: "CreatedDate" },
                ]}
              />
            </Col>
          </Row>
        )}

        {/* NEW / EDIT Loan Modal */}
        <NewLoanModal
          showLoanModal={showModal}
          hideLoanModal={handleClose}
          record={recordToEdit}
          fetchLoans={fetchLoanRecords}
        />

        {/* DELETE MODAL */}
        <DeleteConfirmationModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          record={recordToDelete}
          entityName="loans"
        />
      </div>
    </>
  );
}

export default LoanPage;
