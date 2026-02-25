import React, { useState } from "react";
import { Modal, Button, Form, Card, Spinner } from "react-bootstrap";
import { FaUpload } from "react-icons/fa";
import { apiData } from "../utility/api";

const EditDocument = ({ show, handleClose, data}) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // Handle File Upload
  // -----------------------------
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size (optional 10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    // Rename the file using document Name
    const renamedFile = new File([selectedFile], data?.Name || selectedFile.name, {
      type: selectedFile.type,
    });

    setFile(renamedFile);
  };

  // -----------------------------
  // Submit Document Update
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first.");
  
    try {
      setLoading(true);
  
      const formData = new FormData();
      formData.append("LoanName", data?.Link?.split("/")?.[0] || "");
      formData.append(data?.Name, file);
      formData.append("Id", data?.Id);
  
      const res = await fetch(`${apiData.PORT}/api/documents/update`, {
        method: "POST",
        body: formData,
      });
  
      const result = await res.json();
  
      if (result?.success) {
        window.location.reload()
      } else {
        alert(result?.message || "Failed to update document.");
      }
    } catch (error) {
      console.error(error);
      alert("Upload failed, try again.");
    } finally {
      setLoading(false);
    }
  };
  

  // -----------------------------
  // Clear selected file
  // -----------------------------
  const handleClear = () => setFile(null);

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      backdrop="static"
    >
      {/* Header */}
      <Modal.Header className="bg-gradient-primary-modal text-dark" closeButton>
        <Modal.Title className="w-100 text-center">Edit Document</Modal.Title>
      </Modal.Header>

      {/* Body */}
      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-4">
            <Form onSubmit={handleSubmit}>
              {/* Upload Box */}
              <div
                className="border-dashed p-4 rounded text-center upload-box"
                onClick={() => document.getElementById("file-input")?.click()}
                style={{
                  cursor: "pointer",
                  border: "2px dashed #6c757d",
                  transition: "0.3s",
                }}
              >
                <FaUpload className="text-muted mb-2" size={24} />

                {!file ? (
                  <>
                    <div className="fw-semibold">Click to upload or drag & drop</div>
                    <small className="text-muted">PDF, JPG, PNG, DOC (Max 10MB)</small>
                  </>
                ) : (
                  <div className="mt-2 fw-semibold text-primary">
                    Selected: {file.name}
                  </div>
                )}

                <Form.Control
                  id="file-input"
                  type="file"
                  className="d-none"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>

              {/* Buttons */}
              <div className="d-flex justify-content-end mt-4 gap-2">
                <Button
                  variant="outline-secondary"
                  type="button"
                  onClick={handleClear}
                  disabled={!file || loading}
                >
                  Clear
                </Button>

                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner
                        animation="border"
                        size="sm"
                        className="me-2"
                      />
                      Updating...
                    </>
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Modal.Body>
    </Modal>
  );
};

export default EditDocument;
