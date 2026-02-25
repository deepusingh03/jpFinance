import React from "react";
import NewLoanModal from "../relatedmodels/NewLoanModal";
import NewDealerModal from "../relatedmodels/NewDealerModal";
import NewCustomerModal from "../relatedmodels/NewCustomerModal";
import NewBrandModal from "../relatedmodels/NewBrandModal";
import NewProductModal from "../relatedmodels/NewProductModal";
// import EditDocument from "../relatedmodels/EditDocumentModal";
import NewPriceBook from "../relatedmodels/NewPriceBook";
function EditModals({ record, onShow, onHide, refreshData, entityName,createdRecord,lookupData }) {
  
  return (
    <>
      {entityName === "dealers" && (
        <NewDealerModal
          show={onShow}
          handleClose={onHide}
          fetchDealers={refreshData}
          record={record}
          newData={createdRecord}
        />
      )}

      {entityName === "customers" && (
        <NewCustomerModal
          handleRefresh={refreshData} // Pass fetchData directly as handler
          showModal={onShow}
          handleClose={onHide}
          record={record}
          lookupData={lookupData}
          newData={createdRecord}
        />
      )}

      {entityName === "brands" && (
        <NewBrandModal
          show={onShow}
          onHide={onHide}
          fetchBrands={refreshData} // Pass fetchBrands to reload data after adding a new brand
          record={record}
        />
      )}
      {entityName === "products" && (
        <NewProductModal
          onShow={onShow}
          onHide={onHide}
          fetchProducts={refreshData}
          record={record}
        />
      )}
      {entityName === "loans" && (
        <NewLoanModal
          showLoanModal={onShow}
          hideLoanModal={onHide}
          fetchLoans={refreshData}
          record={record}
        />
      )}
      {entityName === "pricebook" && (
        <NewPriceBook
          show={onShow}
          onHide={onHide}
          // fetchLoans={refreshData}
          record={record}
        />
      )}
      {/* {entityName === "loans" && (
        <NewLoanModal
          showModal={onShow}
          hideModal={onHide}
          fetchLoans={refreshData}
          record={record}
        />
      )} */}
      {/* {entityName === "documents" && (
        <EditDocument show={onShow} handleClose={onHide} data={record} />
      )} */}
    </>
  );
}

export default EditModals;
