import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  Button,
  Row,
  Col,
  Alert,
  Tabs,
  Tab,
  Badge,
} from "react-bootstrap";
import RecordRelatedList from "./RecordRelatedList";
import EditModals from "../utility/EditModals";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import DealerDetail from "../DetailPage/DealerDetail";
import LoanDetail from "../DetailPage/LoanDetail";
import CustomerDetail from "../DetailPage/CustomerDetail";
import BrandDetail from "../DetailPage/BrandDetail";
import ProductDetail from "../DetailPage/ProductDetail";
import PricebookDetail from "../DetailPage/PriceBookDetail";
import PricebookEntryDetail from "../DetailPage/PriceBookEntryDetail";
import UserDetail from "../DetailPage/UserDetail";
import LoanItemDetail from "../DetailPage/LoanItemDetail";
import DocumentPreview from "../DetailPage/DocumentPreview";

function DetailsPage({ data, onBack, childs, refresh, entityName }) {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditMode, setisEditMode] = useState(false);
  const [selectTab, setSelectedTab] = useState("details");

  const resetButton = () => {
    setisEditMode(false);
  };
  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------
  const getDisplayName = () => {
    if(entityName.toLowerCase() === "pricebook") return data.PricebookName;
    if (data?.Name) return data.Name;

    if (data?.FirstName || data?.LastName)
      return `${data.FirstName || ""} ${data.LastName || ""}`.trim();
    return "Record Details";
  };
  // ---------------------------------------------------------
  // Effects
  // ---------------------------------------------------------
  useEffect(() => {
    document.title = `${getDisplayName()} | JP Finance`;
    // buildImageURL();
  }, [data]);

  const handleDeleteRecord = () => setShowDeleteModal(true);
  const cancelDelete = () => setShowDeleteModal(false);

  const onConfirm = () => {
    onBack?.();
    refresh?.();
  };
  // ---------------------------------------------------------
  // Fields & Child Mapping
  // ---------------------------------------------------------

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const relatedChilds = useMemo(() => {
    return childs?.map((item) => {
      const [entity, parentField] = item.split("-");
      return { entity, parentField };
    });
  }, [childs]);
  const openEditModal = () => {
    setisEditMode(true);
  }; //setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    refresh?.();
    // buildImageURL();
  };
  const handleTabChange = (tabKey) => {
    setSelectedTab(tabKey);
  };
  const getBadgeVariant = (status) => {
    switch (status) {
      case "due":
        return { bg: "warning", text: "dark" };
      case "success":
        return { bg: "success", text: "light" };
      case "over due":
        return { bg: "danger", text: "light" };
      default:
        return { bg: "secondary", text: "light" };
    }
  };

  if (!data)
    return (
      <div className="container mt-5">
        <Alert
          variant="light"
          className="text-center py-5 rounded-4 border-0 shadow-sm"
        >
          <i className="bi bi-inbox display-4 text-muted mb-3"></i>
          <h5 className="fw-semibold">No record selected</h5>
          <p className="text-muted">Please choose a record to view details.</p>
        </Alert>
      </div>
    );

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <>
      <div className="container mt-4">
        <Card className="shadow-lg rounded-4 border-0">
          {/* ---------------- HEADER ---------------- */}
          <div className="bg-gradient-primary text-white p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
              {/* TITLE SECTION */}
              <div>
                <div className="d-flex align-items-center gap-3 mb-2">
                  <h2 className="fw-bold text-primary mb-0">
                    {getDisplayName()}
                  </h2>

                  {data?.Status && (
                    <Badge
                      bg={getBadgeVariant(data.Status.toLowerCase()).bg}
                      text={getBadgeVariant(data.Status.toLowerCase()).text}
                      className="px-3 py-2"
                    >
                      {data.Status}
                    </Badge>
                  )}
                </div>
                <small className="text-primary">
                  View and manage record details
                </small>
              </div>

              {/* ACTION BUTTONS */}
              <div className="d-flex gap-2 flex-wrap">
                {onBack && (
                  <Button
                    variant="light"
                    onClick={onBack}
                    className="d-flex gap-2"
                  >
                    <i className="bi bi-arrow-left"></i> Back
                  </Button>
                )}
                {entityName != "users" &&
                  selectTab === "details" &&
                  entityName != "documents" &&
                  (!isEditMode ? (
                    <Button
                      variant="light"
                      onClick={openEditModal}
                      className="d-flex gap-2"
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </Button>
                  ) : (
                    <Button
                      variant="light"
                      onClick={resetButton}
                      className="d-flex gap-2"
                    >
                      <i className="bi bi-x-lg"></i> Cancel
                    </Button>
                  ))}

                {entityName != "users" &&
                  selectTab === "details" &&
                  entityName != "documents" && (
                    <Button
                      variant="light"
                      onClick={handleDeleteRecord}
                      className="d-flex gap-2"
                    >
                      <i className="bi bi-trash"></i> Delete
                    </Button>
                  )}
              </div>
            </div>
          </div>

          {/* ---------------- TABS ---------------- */}
          <Tabs
            defaultActiveKey="details"
            className="px-4 pt-3"
            fill
            onSelect={(key) => handleTabChange(key)}
          >
            {/* {entityName} */}
            {/* ----------- RELATED TAB ----------- */}
            {entityName != "users" && entityName != "documents" && (
              <Tab
                eventKey="related"
                title={
                  <span className="d-flex align-items-center gap-2">
                    <i className="bi bi-link-45deg"></i>
                    Related Records
                    {!!relatedChilds?.length && (
                      <Badge bg="primary" pill>
                        {relatedChilds.length}
                      </Badge>
                    )}
                  </span>
                }
              >
                <div className="p-3">
                  {relatedChilds?.length ? (
                    relatedChilds.map((child, idx) => (
                      <div key={idx} className="mb-3">
                        <RecordRelatedList
                          details={{ ...child, Id: data.Id, data }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-5">
                      <i className="bi bi-link-45deg display-4 text-muted"></i>
                      <h5>No Related Records</h5>
                    </div>
                  )}
                </div>
              </Tab>
            )}
            {/* ----------- DETAILS TAB ----------- */}
            <Tab
              eventKey="details"
              title={
                <span className="d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle"></i>
                  Details
                </span>
              }
            >
              <div className="p-4">
                {entityName === "dealers" && (
                  <DealerDetail isEdit={isEditMode} resetButton={resetButton} />
                )}
                {entityName === "customers" && (
                  <CustomerDetail
                    isEdit={isEditMode}
                    resetButton={resetButton}
                  />
                )}
                {entityName === "brands" && (
                  <BrandDetail isEdit={isEditMode} resetButton={resetButton} />
                )}
                {entityName === "products" && (
                  <ProductDetail
                    isEdit={isEditMode}
                    resetButton={resetButton}
                  />
                )}
                {entityName === "pricebook" && (
                  <PricebookDetail
                    isEdit={isEditMode}
                    resetButton={resetButton}
                  />
                )}
                {entityName === "pricebookentry" && (
                  <PricebookEntryDetail
                    isEdit={isEditMode}
                    resetButton={resetButton}
                  />
                )}
                {entityName === "users" && (
                  <UserDetail isEdit={isEditMode} resetButton={resetButton} />
                )}
                {entityName === "loans" && (
                  <LoanDetail isEdit={isEditMode} resetButton={resetButton} />
                )}
                {entityName === "loanitems" && (
                  <LoanItemDetail
                    isEdit={isEditMode}
                    resetButton={resetButton}
                  />
                )}
                {entityName === "documents" && <DocumentPreview data={data} />}
              </div>
            </Tab>
          </Tabs>
        </Card>
      </div>

      {/* -------------- EDIT MODAL -------------- */}
      {showModal && (
        <EditModals
          onShow={showModal}
          onHide={closeModal}
          record={data}
          refreshData={refresh}
          entityName={entityName}
        />
      )}

      {/* -------------- DELETE CONFIRMATION MODAL -------------- */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={cancelDelete}
        onConfirmBack={onConfirm}
        record={data}
        entityName={entityName}
      />
    </>
  );
}

export default DetailsPage;
