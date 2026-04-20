import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Button, Form, Spinner, Toast, ToastContainer } from "react-bootstrap";
import CustomNavbar from "../components/CustomNavbar";
import CustomTable from "../components/CustomTable";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import NewBrandModal from "../relatedmodels/NewBrandModal";  // Import the new modal component
import { useNavigate } from "react-router-dom";
import {toast} from "react-toastify";
import { helperMethods } from "../utility/CMPhelper";
function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [loading, setLoading] = useState(false); // State for loading
  const [recordToEdit, setRecordToEdit] = useState(null);
  
  const navigate = useNavigate();

  // Fetch all brands
  const fetchBrands = useCallback(async () => {
    setLoading(true); // Set loading to true when fetching data
    try {
      const data = await helperMethods.getEntityDetails('brands');
      setBrands(data);
      setFilteredApps(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(" Error loading data. Please try again.");
    } finally {
      setLoading(false); // Set loading to false once data is fetched
    }
  }, []);

  useEffect(() => {
    document.title = "Brands | JP Finance";
    fetchBrands();
  }, [fetchBrands]);

  // Filter brands based on search term
  useEffect(() => {
    const filtered = brands.filter((app) =>
      app.Name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredApps(filtered);
  }, [searchTerm, brands]);

  const handleRowSelection = useCallback((selectedOption, row) => {
    switch (selectedOption) {
      case "view":
        navigate(`/brands/detail/${row.Id}/view`);
        break;
      case "edit":
        setRecordToEdit(row);
        setShowModal(true);
        break;
      case "delete":
        setRecordToDelete(row);
        setShowDeleteModal(true);
        break;
      default:
        break;
    }
  }, [navigate]);

  const handleShow = () =>{
    setRecordToEdit(null);
    setShowModal(true);
  }
  const handleClose = () => setShowModal(false);
  const confirmDelete = () => {
    fetchBrands()
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };
  const handleBrandsClick = useCallback((brand) => {
    navigate(`/brands/detail/${brand.Id}/view`);
    
  }, [navigate]);
  return (
    <div className="brand-page">
      <CustomNavbar />

      {/* Top row with + New button and Search */}
      <Row className="mb-3 mt-4 mx-2">
        <Col xs={12} className="text-start fw-bold h4">
          All Brands
        </Col>
      </Row>
      <Row className="mb-3 mt-4 mx-2">
        <Col xs={8} className="text-end">
          <Form.Control
            type="text"
            placeholder="Search by Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col xs={4} className="text-end">
          <Button onClick={handleShow} variant="dark">+ New</Button>
        </Col>
      </Row>

      {/* Show loading spinner while data is being fetched */}
      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" variant="dark" />
        </div>
      ) : (
        <Row className="mx-2">
          <Col>
            <CustomTable
              data={filteredApps}
              onRowClick={handleBrandsClick}
              onOptionSelect={handleRowSelection}
              columns={[
                { label: "Name", key: "Name" },
                { label: "Description", key: "Description" },
                { label: "Created By", key: "CreatedBy" },
                { label: "Created Date", key: "CreatedDate" },
              ]}
            />
          </Col>
        </Row>
      )}

      {/* New Brand Modal */}
      <NewBrandModal
        show={showModal}
        onHide={handleClose}
        fetchBrands={fetchBrands}  // Pass fetchBrands to reload data after adding a new brand
        record={recordToEdit}
      />
<DeleteConfirmationModal
        show={showDeleteModal}
        onHide={cancelDelete}
        onConfirmBack={confirmDelete}
        record={recordToDelete}
        entityName="brands"
      />
    </div>
  );
}

export default BrandsPage;
