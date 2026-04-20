import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import CustomNavbar from "../components/CustomNavbar";
import CustomTable from "../components/CustomTable";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

import { Row, Col, Button, Form, Spinner } from "react-bootstrap";
import NewProductModal from "../relatedmodels/NewProductModal";
import { toast } from "react-toastify";
import { helperMethods } from "../utility/CMPhelper";

// Constants
const TABLE_COLUMNS = [
  { label: "Name", key: "Name" },
  { label: "Code", key: "Code" },
  { label: "CC Power", key: "CCPower" },
  { label: "Description", key: "Description" },
  { label: "Brand Name", key: "Brand" },
  { label: "Created By", key: "CreatedBy" },
  { label: "Created Date", key: "CreatedDate" },
];

function ProductPage() {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recordToEdit, setRecordToEdit] = useState(null);

  // Set document title
  useEffect(() => {
    document.title = "Products | JP Finance";
  }, []);

  // Fetch products with brand information
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await helperMethods.getEntityDetails('products');
      console.log("Products data:", data);
      
      // Check if data and data.data exist
      if (data  && Array.isArray(data)) {
        // await fetchBrandRecords(data);
        setApplications(data);
        setFilteredApps(data);
      } else {
        console.error("Invalid products data structure:", data);
        toast.error("Invalid products data received");
        
        setLoading(false);
      }
    } catch (err) {
      toast.error("Error fetching data");
      console.error("Error fetching data:", err);
      setLoading(false);
    }
    finally{
      setLoading(false);
    }
  }, []);
  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter applications based on search term
  useEffect(() => {
    if (applications && applications.length > 0) {
      const filtered = applications.filter(
        (app) =>
          app.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.Code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApps(filtered);
    } else if (searchTerm === "") {
      setFilteredApps(applications);
    }
  }, [searchTerm, applications]);

  // Modal handlers
  const handleShow = () => {
    setRecordToEdit(null);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setRecordToEdit(null);
  };

  // Navigation handlers
  const handleCustomerClick = (customer) => {
    if (customer && customer.Id) {
      navigate(`/products/detail/${customer.Id}/view`);
    }
  };

  const handleRowSelection = (selectedOption, row) => {
    if (selectedOption === "view") {
      navigate(`/products/detail/${row.Id}/view`);
    } else if (selectedOption === "edit") {
      setRecordToEdit(row);
      setShowModal(true);
    } else if (selectedOption === "delete") {
      setRecordToDelete(row);
      setShowDeleteModal(true);
    }
  };

  // Delete handlers
  const confirmDelete = () => {
    setShowDeleteModal(false);
    setRecordToDelete(null);
    fetchProducts();
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
          All Products
        </Col>
      </Row>
      <Row className="mb-3 mt-4 mx-2">
        <Col xs={8} className="text-end">
          <Form.Control
            type="text"
            placeholder="Search by Name, Code..."
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

      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" variant="dark" />
        </div>
      ) : (
        <Row className="mx-2">
          <Col>
            <CustomTable
              data={filteredApps}
              onRowClick={handleCustomerClick}
              onOptionSelect={handleRowSelection}
              columns={TABLE_COLUMNS}
            />
          </Col>
        </Row>
      )}
      
      <NewProductModal
        onShow={showModal}
        onHide={handleClose}
        fetchProducts={fetchProducts}
        record={recordToEdit}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={cancelDelete}
        onConfirmBack={confirmDelete}
        record={recordToDelete}
        entityName="products"
      />
    </div>
  );
}

export default ProductPage;