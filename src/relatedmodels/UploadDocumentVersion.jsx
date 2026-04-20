// components/UploadModal.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  ProgressBar,
  Alert,
  Badge,
  ListGroup,
  Row,
  Col,
} from "react-bootstrap";
// import 'bootstrap/dist/css/bootstrap.min.css';
import "../css/UploadModal.css";
import { helperMethods } from "../utility/CMPhelper";
import { apiData } from "../utility/api";

const UploadDocumentVersion = ({
  show,
  onClose,
  parentData,
  onUploadComplete,
}) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  useEffect(() => {
  })
  // File type icons mapping
  const fileIcons = {
    pdf: "bi-filetype-pdf text-danger",
    image: "bi-filetype-jpg text-success",
    text: "bi-filetype-txt text-info",
    word: "bi-filetype-docx text-primary",
    excel: "bi-filetype-xlsx text-success",
    powerpoint: "bi-filetype-pptx text-warning",
    default: "bi-file-earmark text-secondary",
  };
  // Get file type based on extension
  const getFileType = (fileName) => {
    const ext = fileName.split(".").pop().toLowerCase();

    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"].includes(ext))
      return "image";
    if (ext === "txt" || ext === "md") return "text";
    if (ext === "doc" || ext === "docx") return "word";
    if (ext === "xls" || ext === "xlsx") return "excel";
    if (ext === "ppt" || ext === "pptx") return "powerpoint";
    return "default";
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    setError("");

    // Check file size (50MB limit)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit");
      return;
    }

    // Check file type
    const fileType = getFileType(selectedFile.name);
    const supportedTypes = [
      "pdf",
      "image",
      "text",
      "word",
      "excel",
      "powerpoint",
    ];
    if (!supportedTypes.includes(fileType) && fileType !== "default") {
      setError("File type not supported");
      return;
    }

    const fileData = {
      file: selectedFile,
      name: selectedFile.name,
      size: formatFileSize(selectedFile.size),
      type: fileType,
      lastModified: new Date(selectedFile.lastModified).toLocaleDateString(),
      preview: fileType === "image" ? URL.createObjectURL(selectedFile) : null,
    };

    setFile(fileData);
    setFileName(selectedFile.name.replace(/\.[^/.]+$/, "")); // Remove extension
  };

  // Browse for file
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // File input change
  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  // Simulate upload process
  const simulateUpload = () => {
    return new Promise((resolve) => {
      setIsUploading(true);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(resolve, 500); // Small delay for completion effect
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    });
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    try {
      setIsUploading(true);
      const formData = new FormData();

      // ---- metadata ----
      formData.append("Id", generateId());
      formData.append("LoanName", parentData?.loans__ParentId.Name || "");
      formData.append("ParentDocument", parentData?.Id || "");
      formData.append("DocumentName", parentData?.Name || "");
      formData.append("Name", fileName || file.file.name);
      formData.append("Description", description || "");
      formData.append("CreatedBy", helperMethods.fetchUser());
      formData.append("CreatedDate", helperMethods.dateToString());
      formData.append("ModifiedBy", helperMethods.fetchUser());
      formData.append("ModifiedDate", helperMethods.dateToString());

      // ---- file (IMPORTANT FIX) ----
      formData.append("file", file.file); // 👈 must be file.file
      const res = await fetch(`${apiData.PORT}/api/upload/documentversion/insert`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      await simulateUpload();

      onUploadComplete({
        ...file,
        name: fileName,
        description,
        uploadedAt: new Date().toISOString(),
      });
      setIsUploading(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
      setIsUploading(false);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFile(null);
    setFileName("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Reset form
  const resetForm = () => {
    setFile(null);
    setFileName("");
    setDescription("");
    setUploadProgress(0);
    setIsUploading(false);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title className="fw-bold">
          <i className="bi bi-cloud-arrow-up me-2"></i>
          Upload Document
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-0">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* File Selection Area */}
        {!file ? (
          <div
            className={`drop-area text-center p-5 border-2 rounded-3 ${
              isDragging
                ? "border-primary bg-primary bg-opacity-10"
                : "border-dashed border-secondary"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            style={{ cursor: "pointer" }}
          >
            <div className="mb-3">
              <i className="bi bi-cloud-arrow-up display-1 text-muted"></i>
            </div>
            <h5 className="mb-2">Drag & drop your file here</h5>
            <p className="text-muted mb-3">or click to browse files</p>
            <div className="mb-3">
              <Badge bg="light" text="dark" className="me-1">
                PDF
              </Badge>
              <Badge bg="light" text="dark" className="me-1">
                JPG
              </Badge>
              <Badge bg="light" text="dark" className="me-1">
                PNG
              </Badge>
              <Badge bg="light" text="dark" className="me-1">
                DOC
              </Badge>
              <Badge bg="light" text="dark" className="me-1">
                XLS
              </Badge>
              <Badge bg="light" text="dark">
                TXT
              </Badge>
            </div>
            <small className="text-muted">Maximum file size: 50MB</small>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="d-none"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            />
          </div>
        ) : (
          <div>
            {/* File Preview */}
            <div className="file-preview card border mb-4">
              <div className="card-body">
                <Row className="align-items-center">
                  <Col xs="auto">
                    <div className="position-relative">
                      <i className={`bi ${fileIcons[file.type]} fs-1`}></i>
                      {file.preview && (
                        <div className="position-absolute top-0 start-100 translate-middle">
                          <div className="badge bg-primary rounded-circle p-1">
                            <i className="bi bi-image text-white fs-6"></i>
                          </div>
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col>
                    <h6 className="mb-1 fw-bold">{file.name}</h6>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      <small className="text-muted">
                        <i className="bi bi-filetype-{file.type === 'pdf' ? 'pdf' : file.type === 'image' ? 'jpg' : 'txt'} me-1"></i>
                        {file.type.toUpperCase()}
                      </small>
                      <small className="text-muted">
                        <i className="bi bi-hdd me-1"></i>
                        {file.size}
                      </small>
                      {/* <small className="text-muted">
                        <i className="bi bi-calendar me-1"></i>
                        Modified {file.lastModified}
                      </small> */}
                    </div>
                    {file.preview && (
                      <div className="mt-2">
                        <img
                          src={file.preview}
                          alt="Preview"
                          className="img-thumbnail"
                          style={{ maxWidth: "100px", maxHeight: "100px" }}
                        />
                      </div>
                    )}
                  </Col>
                  <Col xs="auto">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </Col>
                </Row>
              </div>
            </div>

            {/* File Details Form */}
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">
                  <i className="bi bi-pencil me-1"></i>
                  File Name
                </Form.Label>
                <Form.Control
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter a descriptive name for your file"
                  disabled={isUploading}
                />
                <Form.Text className="text-muted">
                  This will be the display name of your document
                </Form.Text>
              </Form.Group>

              {/* <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  <i className="bi bi-chat-text me-1"></i>
                  Description (Optional)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a brief description of this document..."
                  disabled={isUploading}
                />
              </Form.Group> */}

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold">
                      <i className="bi bi-cloud-arrow-up me-1"></i>
                      Uploading...
                    </span>
                    <span className="text-primary fw-bold">
                      {uploadProgress}%
                    </span>
                  </div>
                  <ProgressBar
                    now={uploadProgress}
                    animated
                    striped
                    variant="primary"
                    className="mb-2"
                  />
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Please don't close this window until upload is complete
                  </small>
                </div>
              )}

              {/* Upload Tips */}
              <div className="bg-light p-3 rounded-3">
                <h6 className="fw-semibold mb-3">
                  <i className="bi bi-lightbulb me-1 text-warning"></i>
                  Upload Tips
                </h6>
                <ListGroup variant="flush" className="bg-transparent">
                  <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Use descriptive file names for better organization
                  </ListGroup.Item>
                  <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Add tags or categories in the description
                  </ListGroup.Item>
                  <ListGroup.Item className="bg-transparent border-0 px-0 py-1">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Keep file sizes under 50MB for faster uploads
                  </ListGroup.Item>
                </ListGroup>
              </div>
            </Form>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-top-0">
        <Button
          variant="outline-secondary"
          onClick={handleClose}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          variant="dark"
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="position-relative"
        >
          {isUploading ? (
            <>
              <span className="spinner-border spinner-border-sm" />
            </>
          ) : (
            <>
              <i className="bi bi-cloud-check me-2"></i>
              Upload Document
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
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
export default UploadDocumentVersion;
