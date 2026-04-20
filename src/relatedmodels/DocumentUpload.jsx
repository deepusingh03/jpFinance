import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Table,
  Card,
  Badge,
  Alert,
} from "react-bootstrap";
import {
  FaTrashAlt,
  FaUpload,
  FaFile,
  FaCheckCircle,
  FaCloudUploadAlt,
} from "react-icons/fa";
import { apiData } from "../utility/api";

const baseDocuments = [
  { Name: "Photo", isUploaded: false },
  { Name: "Voter's ID", isUploaded: false },
  { Name: "Stamp/Cheque", isUploaded: false },
  { Name: "29, 30 Form", isUploaded: false },
  { Name: "Vehicle's Bill", isUploaded: false },
  { Name: "Vehicle's Insurance", isUploaded: false },
  { Name: "Vehicle's Key", isUploaded: false },
  { Name: "Ecs Fixed", isUploaded: false },
  { Name: "Ecs Max", isUploaded: false },
];

const DocumentUpload = ({ show, handleClose, record, data }) => {
  const [files, setFiles] = useState({});
  const [docs, setDocs] = useState(baseDocuments);
  const [isUploading, setIsUploading] = useState(false);

  // Pre-fill uploaded document info from backend data
  useEffect(() => {
    if (record?.entity === "documents" && Array.isArray(data)) {
      setDocs((prevDocs) =>
        prevDocs.map((doc) => {
          const normalized = doc.Name.replace(/[^\w]/g, "_");
          const match = data.find(
            (ele) => ele.Name.split(".")[0] === normalized
          );
          if (match) {
            return {
              ...doc,
              isUploaded: true,
              extension: match.Name.split(".")[1],
              size: match.Size,
            };
          }
          return doc;
        })
      );
    }
  }, [record, data]);

  // Handle file selection
  const handleFileChange = (e, doc) => {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split(".").pop();
    const newFileName = `${doc.Name.replace(/[^\w]/g, "_")}.${extension}`;
    const renamedFile = new File([file], newFileName, { type: file.type });
    renamedFile.Id = generateId();

    setFiles((prev) => ({
      ...prev,
      [doc.Name]: renamedFile,
    }));

    setDocs((prevDocs) =>
      prevDocs.map((ele) =>
        ele.Name === doc.Name
          ? { ...ele, isUploaded: true, extension, size: file.size }
          : ele
      )
    );
  };

  // Remove selected file
  const handleRemoveFile = (doc) => {
    setFiles((prev) => {
      const updated = { ...prev };
      delete updated[doc.Name];
      return updated;
    });

    setDocs((prevDocs) =>
      prevDocs.map((ele) =>
        ele.Name === doc.Name
          ? { ...ele, isUploaded: false, extension: null, size: null }
          : ele
      )
    );
  };

  // Submit all uploads
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(files).length === 0) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("LoanName", record?.data?.Name || "");
    formData.append("ParentId", record?.data?.Id || "");

    const fileIdMap = {};
    Object.entries(files).forEach(([doc, file]) => {
      fileIdMap[doc] = file.Id;
      formData.append(doc, file);
    });
    formData.append("fileIds", JSON.stringify(fileIdMap));
    try {
      const res = await fetch(`${apiData.PORT}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      alert(result.message || "Files uploaded successfully!");
      setFiles({});
      handleClose();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed!");
    } finally {
      setIsUploading(false);
    }
  };

  // Helpers
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/i)) return "🖼️";
    if (fileName.match(/\.(pdf)$/i)) return "📄";
    if (fileName.match(/\.(doc|docx)$/i)) return "📝";
    return "📎";
  };

  const generateId = (length = 30) => {
    const timestamp = Date.now().toString(36);
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomPart = Array.from({ length: length - timestamp.length })
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join("");
    return timestamp + randomPart;
  };

  const uploadedCount = docs.filter((d) => d.isUploaded).length;
  const totalCount = docs.length;
  const readyToUpload = files.length;

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton className="bg-gradient-primary-modal text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaCloudUploadAlt className="me-2" />
          Document Upload
          <Badge bg="light" text="dark" className="ms-2">
            {uploadedCount}/{totalCount}
          </Badge>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {isUploading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary mb-3" role="status" />
            <h5>Uploading Documents...</h5>
            <p className="text-muted">Please wait while we upload your files</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {readyToUpload > 0 && (
              <Alert variant="info" className="d-flex align-items-center">
                <FaCheckCircle className="me-2" />
                <div>
                  <strong>Ready to upload {readyToUpload} document(s)</strong>
                  <div className="small">
                    Total size:{" "}
                    {formatFileSize(
                      files.reduce((sum, d) => sum + (d.size || 0), 0)
                    )}
                  </div>
                </div>
              </Alert>
            )}

            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <Table borderless hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: "30%" }} className="ps-4 py-3">
                        <strong>Document Type</strong>
                      </th>
                      <th className="py-3">
                        <strong>File</strong>
                      </th>
                      <th style={{ width: "80px" }} className="text-center py-3">
                        <strong>Status</strong>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc, idx) => (
                      <tr key={idx} className={doc.isUploaded ? "bg-light" : ""}>
                        <td className="ps-4 align-middle">
                          <div className="d-flex align-items-center">
                            <div
                              className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                                doc.isUploaded ? "bg-success" : "bg-light"
                              }`}
                              style={{ width: "32px", height: "32px" }}
                            >
                              {doc.isUploaded ? (
                                <FaCheckCircle className="text-white" size={14} />
                              ) : (
                                <FaFile className="text-muted" size={14} />
                              )}
                            </div>
                            <div>
                              <strong className="d-block">{doc.Name}</strong>
                              <small className="text-muted">Required</small>
                            </div>
                          </div>
                        </td>

                        <td className="align-middle">
                          {!doc.isUploaded ? (
                            <div
                              className="border-dashed p-3 rounded cursor-pointer"
                              onClick={() =>
                                document.getElementById(`file-${idx}`)?.click()
                              }
                            >
                              <div className="text-center">
                                <FaUpload className="text-muted mb-2" />
                                <div className="small text-muted">
                                  Click to upload or drag & drop
                                </div>
                                <small className="text-muted d-block">
                                  PDF, JPG, PNG up to 10MB
                                </small>
                              </div>
                              <Form.Control
                                id={`file-${idx}`}
                                type="file"
                                onChange={(e) => handleFileChange(e, doc)}
                                className="d-none"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              />
                            </div>
                          ) : (
                            <div className="d-flex align-items-center justify-content-between bg-white p-3 rounded border">
                              <div className="d-flex align-items-center">
                                <span className="me-3 fs-5">
                                  {getFileIcon(
                                    `${doc.Name}.${doc.extension || "pdf"}`
                                  )}
                                </span>
                                <div>
                                  <strong
                                    className="d-block text-truncate"
                                    style={{ maxWidth: "200px" }}
                                  >
                                    {doc.Name}.{doc.extension}
                                  </strong>
                                  <small className="text-muted">
                                    {formatFileSize(doc.size)}
                                  </small>
                                </div>
                              </div>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveFile(doc)}
                                className="ms-2"
                              >
                                <FaTrashAlt />
                              </Button>
                            </div>
                          )}
                        </td>

                        <td className="text-center align-middle">
                          {doc.isUploaded ? (
                            <Badge bg="success" pill>
                              Ready
                            </Badge>
                          ) : (
                            <Badge bg="secondary" pill>
                              Pending
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {uploadedCount > 0 && (
              <div className="d-flex justify-content-between align-items-center mt-4 p-3 bg-light rounded">
                <div>
                  <strong className="text-primary">{uploadedCount}</strong>
                  <span className="text-muted"> out of </span>
                  <strong>{totalCount}</strong>
                  <span className="text-muted"> documents ready</span>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-danger"
                    onClick={() => {
                      setFiles({});
                      setDocs(baseDocuments);
                    }}
                    disabled={isUploading}
                  >
                    Clear All
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={readyToUpload === 0 || isUploading}
                    className="d-flex align-items-center"
                  >
                    <FaCloudUploadAlt className="me-2" />
                    Upload {readyToUpload} Files
                  </Button>
                </div>
              </div>
            )}
          </Form>
        )}
      </Modal.Body>

      <style jsx>{`
        .border-dashed {
          border: 2px dashed #dee2e6;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .border-dashed:hover {
          border-color: #007bff;
          background-color: #f8f9fa;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .bg-gradient-primary-modal {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        }
        .table tbody tr:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </Modal>
  );
};

export default DocumentUpload;
