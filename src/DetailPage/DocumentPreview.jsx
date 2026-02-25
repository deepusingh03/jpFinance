// DocumentsPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import "../css/DocumentPreview.css";
import UploadDocumentVersion from "../relatedmodels/UploadDocumentVersion";
import { apiData } from "../utility/api";
import { toast } from "react-toastify";

const DocumentPreview = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Fetch document versions
  const fetchDocumentVersion = useCallback(async () => {
    if (!data?.Id) return;

    try {
      setIsLoading(true);
      const res = await fetch(
        `${apiData.PORT}/api/get/documentversion?ParentDocument=${data.Id}`
      );
      const result = await res.json();

      const versions = result.data || [];
      setDocuments(versions);

      // Auto-select first document
      if (versions.length > 0) {
        setSelectedDocument(versions[0]);
      }
    } catch (error) {
      console.error("Error fetching document versions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [data?.Id]);

  // ✅ Fetch on load / parent change
  useEffect(() => {
    fetchDocumentVersion();
  }, [fetchDocumentVersion]);

  // ✅ Filter documents
  const filteredDocuments = documents.filter((doc) =>
    doc.Name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ After upload → refetch
  const handleUploadComplete = () => {
    toast.success("Document upload successfully.");
    setIsModalOpen(false);
    fetchDocumentVersion();
  };

  return (
    <div className="documents-page">
      <div className="documents-container">
        {/* Sidebar */}
        <div className="documents-sidebar">
          <div className="sidebar-header">
            <div className="header-top">
              <h2>Documents</h2>
              <button
                className="upload-btn top"
                onClick={() => setIsModalOpen(true)}
              >
                + Upload
              </button>
            </div>

            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* <div className="sidebar-header">
            <h2>Documents</h2>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div> */}

          <div className="documents-list">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.Id}
                className={`document-item ${
                  selectedDocument?.Id === doc.Id ? "selected" : ""
                }`}
                onClick={() => setSelectedDocument(doc)}
              >
                <div className="document-icon">📄</div>
                <div className="document-info">
                  <h4 className="document-name">{doc.Name}</h4>
                  <div className="document-meta">
                    <span>{(doc.Size / 1024).toFixed(1)} KB</span>
                    <span className="divider">•</span>
                    <span>{doc.ModifiedDate}</span>
                  </div>
                </div>
              </div>
            ))}

            {!isLoading && filteredDocuments.length === 0 && (
              <div className="no-results">No documents found</div>
            )}
          </div>

          <div className="sidebar-footer">
            <button className="upload-btn" onClick={() => setIsModalOpen(true)}>
              + Upload Document
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="document-preview">
          {selectedDocument ? (
            <>
              <div className="preview-header">
                <h5>{selectedDocument.Name}</h5>
                <span>
                  {(selectedDocument.Size / 1024).toFixed(1)} KB • Modified{" "}
                  {selectedDocument.ModifiedDate}
                </span>
              </div>

              <div className="preview-content">
                {selectedDocument.Link.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={`${apiData.PORT}/documents/${selectedDocument.Link}`}
                    alt={selectedDocument.Name}
                    className="image-preview"
                  />
                ) : (
                  <iframe
                    title="document-preview"
                    src={`${apiData.PORT}/documents/${selectedDocument.Link}`}
                    className="file-preview"
                  />
                )}
              </div>
            </>
          ) : (
            <div className="no-preview">Select a document to preview</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
           margin-bottom: 12px;
        }

        .header-top h2 {
          margin: 0;
        }
        .upload-btn {
          min-width: 140px;
          max-width:14px;
          padding: 8px 16px;
        }
      `}</style>
      {/* Upload Modal */}
      {isModalOpen && (
        <UploadDocumentVersion
          show={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          parentData={data}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
};

export default DocumentPreview;
