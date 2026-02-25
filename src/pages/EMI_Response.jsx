import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiData } from "../utility/api";
import CustomNavbar from "../components/CustomNavbar";


const ALLOWED_TYPES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export default function EMIBankResponseUpload() {
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const navigate = useNavigate();
  const dropRef = useRef(null);
  const fileInputRef = useRef(null);

  // ---------- DRAG & DROP ----------
  function handleDragOver(e) {
    e.preventDefault();
    dropRef.current.classList.add("border-primary");
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dropRef.current.classList.remove("border-primary");
  }

  function handleDrop(e) {
    e.preventDefault();
    dropRef.current.classList.remove("border-primary");

    const dropped = e.dataTransfer.files[0];
    validateAndSetFile(dropped);
  }

  // ---------- VALIDATION ----------
  function validateAndSetFile(selected) {
    let messages = [];

    if (!selected) {
      messages.push("No file detected.");
    } else {
      if (!ALLOWED_TYPES.includes(selected.type)) {
        messages.push("Only .xls or .xlsx files are allowed.");
      }
      if (selected.size > 5 * 1024 * 1024) {
        messages.push("File must be less than 5MB.");
      }
    }

    if (messages.length > 0) {
      setErrors(messages);
      setFile(null);
      return;
    }

    setErrors([]);
    setFile(selected);
    setSummary(null);
  }

  // ---------- SUBMIT ----------
  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setErrors(["Please select a valid Excel file."]);
      return;
    }

    setErrors([]);
    setSummary(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", `${apiData.PORT}/api/emi-response`);

      // Progress tracker
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        setUploading(false);
        setProgress(100);

        const data = JSON.parse(xhr.responseText);

        if (!data.success) {
          const backendErrors =
            Array.isArray(data.details)
              ? data.details
              : [data.error || "Unknown error occurred."];

          setErrors(backendErrors);
          return;
        }

        // SUCCESS
        setSummary(data.summary);
        setFile(null);
        clearInput();  //Reset input after success

        // Animated success message
        setTimeout(() => {
          setProgress(0);
        }, 2000);
      };

      xhr.onerror = () => {
        setUploading(false);
        setErrors(["Upload failed. Check internet and try again."]);
      };

      xhr.send(formData);
    } catch (err) {
      setUploading(false);
      setErrors([err.message || "Unexpected error"]);
    }
  }

  function clearInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearFile() {
    setFile(null);
    setProgress(0);
    setErrors([]);
    setSummary(null);
    clearInput();  //Reset input here too
  }

  return (
    <>
      <CustomNavbar />
    <div className="container py-5">
      {/* PAGE HEADER */}
      <div className="text-center mb-4">
        <h1 className="fw-bold text-dark">EMI Response Upload</h1>
        <p className="text-secondary">
          Drag & drop your Excel response file from the bank.
        </p>
      </div>

      {/* UPLOAD CARD */}
      <div className="card shadow-lg border-0 rounded-4 mx-auto" style={{ maxWidth: 700 }}>
        <div className="card-body p-4">

          {/* Back Button */}
          <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
            ← Back to Loans
          </button>

          {/* DRAG & DROP AREA */}
          <div
            ref={dropRef}
            className="border border-2 border-secondary rounded-4 p-5 text-center bg-light"
            style={{ cursor: "pointer" }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <>
                <i className="bi bi-file-earmark-excel text-success" style={{ fontSize: 50 }}></i>
                <h5 className="mt-3">{file.name}</h5>
                <p className="text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
              </>
            ) : (
              <>
                <i className="bi bi-cloud-upload text-primary" style={{ fontSize: 55 }}></i>
                <h5 className="mt-3">Drag & Drop Excel File Here</h5>
                <p className="text-secondary">or click to browse</p>
              </>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            className="d-none"
            disabled={uploading}
            onChange={(e) => validateAndSetFile(e.target.files[0])}
          />

          {/* CLEAR BUTTON */}
          {file && (
            <button className="btn btn-outline-danger mt-3 w-100" onClick={clearFile}>
              Clear Upload
            </button>
          )}

          {/* PROGRESS BAR */}
          {uploading && (
            <div className="progress mt-4">
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: `${progress}%` }}
              >
                {progress}%
              </div>
            </div>
          )}

          {/* SUBMIT */}
          <button
            className="btn btn-primary mt-4 w-100 py-2 fw-semibold"
            onClick={handleSubmit}
            disabled={!file || uploading}
          >
            {uploading ? "Processing..." : "Upload & Process"}
          </button>

          {/* ERRORS */}
          {errors.length > 0 && (
            <div className="alert alert-danger mt-4 fade show">
              <h6 className="fw-bold text-danger">Errors</h6>
              <ul className="mb-0">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* SUCCESS SUMMARY */}
          {summary && (
            <div className="alert alert-success mt-4 fade show">
              <h5 className="fw-bold">Upload Successful!</h5>

              <div className="mt-3">
                <span className="badge bg-success me-2">
                  Successed: {summary.success}
                </span>
                <span className="badge bg-danger me-2">
                  Rejected: {summary.rejected}
                </span>
                <span className="badge bg-danger me-2">
                  Failed: {summary.failed}
                </span>
                <span className="badge bg-warning text-dark">
                  Skipped: {summary.skipped}
                </span>
              </div>

              <p className="mt-3">
                Total Rows Processed: <strong>{summary.totalRows}</strong>
              </p>

              {summary.errors?.length > 0 && (
                <div className="alert alert-warning mt-3">
                  <h6 className="fw-bold">Row-Level Issues</h6>
                  {summary.errors.map((err, i) => (
                    <p key={i} className="mb-1">• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}