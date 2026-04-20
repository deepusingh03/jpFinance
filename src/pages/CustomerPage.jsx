import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, Form, Spinner } from "react-bootstrap";

import CustomNavbar from "../components/CustomNavbar";
import CustomTable from "../components/CustomTable";
import NewCustomerModal from "../relatedmodels/NewCustomerModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { helperMethods } from "../utility/CMPhelper";


function CustomerPage() {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true); // Track loading state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
const [record,setRecord] = useState(null);
  const navigate = useNavigate();

  // Fetch customer data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await helperMethods.getEntityDetails('customers');
      
      setApplications(data);
      setFilteredApps(data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial page load or refresh data
  useEffect(() => {
    document.title = "Customers | JP Finance";
    fetchData();
  }, [fetchData]);

  // Filtered data based on search term
  useEffect(() => {
    const filtered = applications.filter(
      (app) =>
        app.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app?.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.Phone.toLowerCase().includes(searchTerm.toLowerCase())
        
    );
    setFilteredApps(filtered);
  }, [searchTerm, applications]);

  const handleShow = () =>{
    setRecord(null);
    setShowModal(true)
  };
  const handleClose = () => setShowModal(false);

  const handleCustomerClick = useCallback((customer) => {
    navigate(`/customers/detail/${customer.Id}/view`);
    
  }, [navigate]);

  const handleRowSelection = (option, row) => {
    if (option === "view") navigate(`/customers/detail/${row.Id}/view`);
    else if (option === "edit") {
      setRecord(row);
      setShowModal(true);
      // navigate(`/details/customers/${row.Id}/edit`);
    }
    else if (option === "delete") {
      setRecordToDelete(row);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = () => {
    fetchData();
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };
  return (
    <div className="customer-page">
      <CustomNavbar />

      {/* Top Row */}
      <Row className="mb-3 mt-4 mx-2">
        <Col xs={12} className="text-start fw-bold h4">
          All Customers
        </Col>
      </Row>

      {/* Search and New Customer Button */}
      <Row className="mb-3 mt-4 mx-2">
        <Col xs={8} className="text-end">
          <Form.Control
            type="text"
            placeholder="Search by First Name, Last Name, Phone, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col xs={4} className="text-end">
          <Button onClick={handleShow} variant="dark">
            + New
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <Row className="mx-2">
        <Col>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" variant="dark" />
            </div>
          ) : (
            <div>
            <CustomTable
              data={filteredApps}
              onRowClick={handleCustomerClick}
              onOptionSelect={handleRowSelection}
              columns={[
                { label: "First Name", key: "FirstName" },
                { label: "Last Name", key: "LastName" },
                { label: "Phone", key: "Phone" },
                { label: "Email", key: "Email" },
                { label: "Date Of Birth", key: "DateOfBirth" },
                { label: "Created By", key: "CreatedBy" },
                { label: "Created Date", key: "CreatedDate" },
              ]}
            />
            </div>
          )}
        </Col>
      </Row>
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={cancelDelete}
        onConfirmBack={confirmDelete}
        record={recordToDelete}
        entityName="customers"
      />
      {/* New Customer Modal */}
      <NewCustomerModal
        handleRefresh={fetchData} // Pass fetchData directly as handler
        showModal={showModal}
        handleClose={handleClose}
        record={record}
      />
    </div>
  );
}

export default CustomerPage;
