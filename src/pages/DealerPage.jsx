import React, { useState, useEffect, useMemo,useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Button,
  Form,
  Toast,
  ToastContainer,
  Spinner,
} from "react-bootstrap";
import CustomNavbar from "../components/CustomNavbar";
import CustomTable from "../components/CustomTable";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
// import { apiData } from "../utility/api";
import { helperMethods } from "../utility/CMPhelper";
import NewDealerModal from "../relatedmodels/NewDealerModal";

function DealerPage() {
  const navigate = useNavigate();

  const [dealers, setDealers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [recordToEdit, setRecordToEdit] = useState(null);

  const [isLoading, setIsLoading] = useState(true);




  const fetchDealers = useCallback(async () => {
    setIsLoading(true); // Set loading to true when fetching data
    try {
      const data = await helperMethods.getEntityDetails('dealers')//await fetch(`${apiData.PORT}/api/get/dealers`);
      console.log('data :: ',data);
      setDealers(data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    } 
  }, []);
  // Set document title
  useEffect(() => {
    fetchDealers()
    document.title = "Dealers | JP Finance";
  }, [fetchDealers]);


  // Filtered dealers based on search
  const filteredApps = useMemo(() => {
    if (!searchTerm) return dealers;
    const term = searchTerm.toLowerCase();
    return dealers.filter(
      (app) =>
        app.Name?.toLowerCase().includes(term) ||
        app.Phone?.toLowerCase().includes(term) ||
        app.Email?.toLowerCase().includes(term)
    );
  }, [searchTerm, dealers]);

  // Handlers
  const handleShow = () =>{
    setRecordToEdit(null);
    setShowModal(true);
  }
  const handleClose = () => setShowModal(false);
  
  

  const handleRowSelection = (option, row) => {
    if (option === "view") navigate(`/dealers/detail/${row.Id}/view`);
    else if (option === "edit") {
      setRecordToEdit(row);
      setShowModal(true);
    }
    else if (option === "delete") {
      setRecordToDelete(row);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = () => {
    fetchDealers();
    // setShowDeleteModal(false);
    // setRecordToDelete(null);
    
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <CustomNavbar />

      <Row className="mb-3 mt-4 mx-2">
        <Col xs={12} className="text-start fw-bold h4">
          All Dealers
        </Col>
      </Row>

      <Row className="mb-3 mt-4 mx-2">
        <Col xs={8}>
          <Form.Control
            type="text"
            placeholder="Search by Name, Phone, or Email..."
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

      <Row className="mx-2">
        <Col>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="dark" />
            </div>
          ) : (
            <CustomTable
              data={filteredApps}
              onRowClick={(row) => navigate(`/dealers/detail/${row.Id}/view`)}
              onOptionSelect={handleRowSelection}
              // showIndex="true"
              columns={[
                { label: "Name", key: "Name" },
                { label: "Phone", key: "Phone" },
                { label: "Email", key: "Email" },
                { label: "Dealer Owner Name", key: "OwnerName" },
                { label: "Created By", key: "CreatedBy" },
                { label: "Created Date", key: "CreatedDate" },
              ]}
            />
          )}
        </Col>
      </Row>

      {/* Add New Dealer Modal */}
      <NewDealerModal
        show={showModal}
        handleClose={handleClose}
        fetchDealers={fetchDealers}
        record={recordToEdit}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={cancelDelete}
        onConfirmBack={confirmDelete}
        record={recordToDelete}
        entityName="dealers"
      />
    </div>
  );
}


// Dealer Modal Component


export default DealerPage;
