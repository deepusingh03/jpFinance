import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import CustomNavbar from "../components/CustomNavbar";
import CustomTable from "../components/CustomTable";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { apiData } from "../utility/api";

import { Row, Col, Button, Form, Spinner } from "react-bootstrap";
import NewProductModal from "../relatedmodels/NewProductModal";
import { toast } from "react-toastify";
function ProductPage() {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Add loading state
  const [recordToEdit, setRecordToEdit] = useState(false);
  useEffect(() => {
    document.title = "Products | JP Finance";
  });
  const fetchProducts = useCallback(async () => {
    setLoading(true); // Start loading when fetching data
    await fetch(`${apiData.PORT}/api/get/products`)
      .then((res) => res.json())
      .then((data) => {
        fetchBrandRecords(data);
      })
      .catch((err) => {
        toast.error("Error fetching data");
        console.error("Error fetching data:", err);
      });
  }, []);
  // Dummy data for demonstration
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchBrandRecords = async (productData) => {
    await fetch(`${apiData.PORT}/api/get/brands`)
      .then((res) => res.json())
      .then((data) => {
        productData.data.map((element) => {
          element.BrandName =
            data.data.filter((b) => b.Id === element.BrandId)[0]?.Name || "";
        });
        setApplications(productData.data);
        setFilteredApps(productData.data);
        setLoading(false); // Stop loading after fetching
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setLoading(false); // Stop loading on error as well
      });
  };
  // Filter applications based on search term
  useEffect(() => {
    if (applications && applications.length > 0) {
      const filtered = applications.filter(
        (app) =>
          app.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.Code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApps(filtered);
      //fetchBrandRecords();
    } else {
      //setFilteredApps([]); // optional, clear list if no data
    }
  }, [searchTerm, applications]);

  const handleShow = () => {
    setRecordToEdit(null);
    setShowModal(true);
  };
  const handleClose = () => setShowModal(false);

  const handleCustomerClick = (customer) => {
    navigate(`/products/detail/${customer.Id}/view`);
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
      {/* <Container className="container-fluid mt-4"> */}
      {/* Top row with +New button and Search */}
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

      {/* Table */}
      {/* Table */}
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
              columns={[
                { label: "Name", key: "Name" },
                { label: "Code", key: "Code" },
                { label: "CC Power", key: "CCPower" },
                { label: "Description", key: "Description" },
                { label: "Brand Name", key: "Brand" },
                { label: "Created By", key: "CreatedBy" },
                { label: "Created Date", key: "CreatedDate" },
              ]}
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
