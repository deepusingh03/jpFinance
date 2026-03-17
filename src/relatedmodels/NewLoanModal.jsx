// NewLoanModal.js
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { NumericFormat } from "react-number-format";
import LookupField from "../components/LookupField"; // adjust path as needed
import ModelYearSelect from "../components/ModelYearSelect";
import ModelMonthSelect from "../components/ModelMonthSelect";
import { apiData } from "../utility/api";
import { helperMethods } from "../utility/CMPhelper";
import { toast } from "react-toastify";
import Select from "react-select";
import { documentData } from "../utility/documentData";
import SystemDetails from "../components/SystemDetails";
// import { isArray } from "chart.js/helpers";
const NewLoanModal = ({ showLoanModal, hideLoanModal, fetchLoans, record }) => {
  const [emiDetails, setEMIDetails] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState([]);
  const [isProgrammaticChange, setIsProgrammaticChange] = useState(false);
  const [newLoan, setnewLoan] = useState(getEmptyLoan());
  const [defaultLoansValues, setDefaultLoansValues] = useState(null);
  useEffect(() => {
    console.log('documentData :: ',documentData);
    if (record) {
      if (record && record.Model) {
        const option = {
          value: record.Model,
          label: record.model_Name,
          data: record,
        };

        record.ModelId = option;
      }

      setnewLoan(record);
      console.log("this loan data :: ", record);
    } else {
      setnewLoan(getEmptyLoan());
    }
  }, [record]);

  useEffect(() => {
    if (!defaultLoansValues) {
      getDefaultValues();
    }
  });
  const getDefaultValues = async () => {
    const response = await fetch(`${apiData.PORT}/api/get/loandefaultvalue`);
    const responseResult = await response.json();
    if (!responseResult || !responseResult.data) return;
    const formattedObject = responseResult.data.reduce((acc, item) => {
      const key = item.Type.toLowerCase()
        .replace(/\s+/g, "")
        .replace(/^\w/, (c) => c.toLowerCase());

      acc[key] = Number(item.Value); // convert to number
      return acc;
    }, {});

    console.log("formattedObject ::", formattedObject);
    setDefaultLoansValues(formattedObject);
    // return formattedObject;
  };

  // Watch for Dealer changes
  useEffect(() => {
    getProductModels();
  }, [newLoan.Dealer]);
  const onHideModal = () => {
    if (!record) {
      setnewLoan(getEmptyLoan()); // ✅ only reset for new loan
    }
    setErrors({});
    hideLoanModal();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setnewLoan({ ...newLoan, [name]: value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleEMIAmountChange = (props) => {
    if (isProgrammaticChange) {
      setIsProgrammaticChange(false);
      return;
    }

    const singleEMIAmount = props.floatValue;
    setErrors({ ...errors, EMIAmount: "" });

    if (newLoan.CalculateTerm === "Calculate Interest(Default)") {
      const tenure = Number(newLoan.Tenure);
      const principal = Number(newLoan.DisburseAmount);

      // Total amount customer will pay
      const totalPayable = singleEMIAmount * tenure;

      // Interest amount
      const interest = totalPayable - principal;

      // Flat ROI calculation
      let rateOfInterest = (interest / principal) * (12 / tenure) * 100;
      rateOfInterest = Math.round(rateOfInterest * 100) / 100;
      const updatedApp = {
        ...newLoan,
        EMIAmount: singleEMIAmount,
        RemainingAmountWithInterest: totalPayable,
        RateOfInterest: isNaN(rateOfInterest) ? 15 : Number(rateOfInterest),
      };

      setnewLoan(updatedApp);
      calculateEMIs(updatedApp);
    } else {
      // EMI entered → calculate tenure
      const principal = Number(newLoan.DisburseAmount);
      const roi = Number(newLoan.RateOfInterest);

      const totalPayable = principal + (principal * roi) / 100;
      const tenure = Math.round(totalPayable / singleEMIAmount);

      const updatedApp = {
        ...newLoan,
        EMIAmount: singleEMIAmount,
        Tenure: tenure,
      };

      setnewLoan(updatedApp);
      calculateEMIs(updatedApp);
    }
  };

  const handleTenureChange = (event) => {
    const tenureValue = Number(event.target.value);
    if (!tenureValue) {
      setnewLoan({
        ...newLoan,
        Tenure: 0,
      });
      return;
    }
    if (!newLoan?.TotalPrice || !newLoan?.EMIStartDate) return;
    setIsProgrammaticChange(true); // Set flag to true
    const roi = 15; // annual ROI %

    // 70% disbursement
    const disburseAmount = newLoan.DisburseAmount;

    // Simple interest calculation
    const remainingAmount =
      disburseAmount + (disburseAmount * roi * tenureValue) / (100 * 12);

    // EMI calculation
    const emiAmount = Math.ceil(remainingAmount / tenureValue);

    // EMI End Date calculation
    const emiEndDate = new Date(newLoan.EMIStartDate);
    emiEndDate.setMonth(emiEndDate.getMonth() + tenureValue - 1);

    const formattedEndDate = emiEndDate.toISOString().split("T")[0];

    const updatedApp = {
      ...newLoan,
      Tenure: tenureValue,
      DisburseAmount: disburseAmount,
      RemainingAmountWithInterest: remainingAmount,
      RateOfInterest: roi,
      EMIAmount: emiAmount,
      EMIEndDate: formattedEndDate,
      NOCDate: formattedEndDate,
      // DefaultValues: false
    };

    setnewLoan(updatedApp);
    calculateEMIs(updatedApp);
  };

  const handleTotalAmountChange = (props) => {
    setIsProgrammaticChange(true); // Set flag to true
    setErrors({ ...errors, TotalPrice: "" });
    const totalAmountValue = props.floatValue;
    const updatedApp = {
      ...newLoan,
      DisburseAmount: totalAmountValue - newLoan.DownPayment,
    };
    updatedApp.RemainingAmountWithInterest =
      updatedApp.DisburseAmount +
      (updatedApp.DisburseAmount *
        updatedApp.RateOfInterest *
        updatedApp.Tenure) /
        (100 * 12);

    updatedApp.EMIAmount = Math.ceil(
      updatedApp.RemainingAmountWithInterest / updatedApp.Tenure
    );
    // Update state
    updatedApp.TotalPrice = totalAmountValue;
    // updatedApp.DefaultValues = false;
    setnewLoan(updatedApp);
    // Pass the new data directly so it's accurate
    calculateEMIs(updatedApp);
  };

  const handleDownPaymentChange = (props) => {
    setIsProgrammaticChange(true); // Set flag to true
    const downpaymentValue = props.floatValue;
    const updatedApp = {
      ...newLoan,
      DisburseAmount: newLoan.TotalPrice - downpaymentValue,
    };
    updatedApp.RemainingAmountWithInterest =
      updatedApp.DisburseAmount +
      (updatedApp.DisburseAmount *
        updatedApp.RateOfInterest *
        updatedApp.Tenure) /
        (100 * 12);

    updatedApp.EMIAmount = Math.ceil(
      updatedApp.RemainingAmountWithInterest / updatedApp.Tenure
    );
    updatedApp.DownPayment = downpaymentValue;
    //updatedApp.DefaultValues = false;
    // Update state
    setnewLoan(updatedApp);
    // Pass the new data directly so it's accurate
    calculateEMIs(updatedApp);
  };
  const handleChangeROI = (event) => {
    try {
      setIsProgrammaticChange(true);
      setErrors({ ...errors, RateOfInterest: "" });
      const roi = Number(event.target.value);
      const updatedApp = {
        ...newLoan,
      };
      updatedApp.RemainingAmountWithInterest =
        updatedApp.DisburseAmount +
        (updatedApp.DisburseAmount * roi * updatedApp.Tenure) / (100 * 12);
      updatedApp.EMIAmount = Math.ceil(
        updatedApp.RemainingAmountWithInterest / updatedApp.Tenure
      );
      updatedApp.RateOfInterest = roi;
      setnewLoan(updatedApp);
      calculateEMIs(updatedApp);
    } catch (err) {
      console.log("this is the error : ", err);
    }
  };
  const getProductModels = async () => {
    setIsProgrammaticChange(true);

    if (!newLoan.Dealer) {
      setnewLoan((prev) => ({
        ...prev,
        Model: "",
        ModelId: "",
        ModelName: "",
      }));
      setProducts([]);
      return;
    }

    const response = await fetch(
      `${apiData.PORT}/api/fetch/pricebook-product/${newLoan.Dealer}`
    );
    const responseResult = await response.json();
    console.log("responseResult :: ",responseResult)
    const records = responseResult?.data ?? [];
    const options = records.map((record) => ({
      value: record.Id,
      label: record.Name,
      data: record,
    }));

    setProducts(options);
    // ✅ Don't clear Model — let the Select find the matching option from loaded products
  };
  const getAmountDetails = (option) => {
    if (!newLoan.Dealer || !option) {
      console.warn("Dealer or Model not selected");
      return;
    }

    const unitPrice = Number(option.data?.UnitPrice) || 0;

    const downPayment = unitPrice * 0.3;
    const disburseAmount = unitPrice - downPayment;

    const rate = 15;
    const tenure = 12;

    const remainingAmount =
      disburseAmount + (disburseAmount * rate * tenure) / (100 * 12);

    const emiAmount = Math.ceil(remainingAmount / tenure);

    const updatedApp = {
      ...newLoan,
      ModelId: option, // ✅ IMPORTANT
      Model: option.value,
      ModelName: option.label,

      Tenure: tenure,
      TotalPrice: unitPrice,
      Unitprice: unitPrice,
      DownPayment: downPayment,
      DisburseAmount: disburseAmount,
      RemainingAmountWithInterest: remainingAmount,
      EMIAmount: emiAmount,
      CCPower: option.data?.CCPower,
      RateOfInterest: rate,
      DefaultValues: true,
    };

    setnewLoan(updatedApp);
    calculateEMIs(updatedApp);
  };

  const calculateEMIs = (appData = newLoan) => {
    if (
      appData.Tenure &&
      appData.Tenure < 100 &&
      appData.EMIAmount &&
      appData.EMIStartDate
    ) {
      const emiList = [];
      const startDate = new Date(appData.EMIStartDate);

      for (let i = 1; i <= appData.Tenure; i++) {
        const emiDate = new Date(startDate);
        emiDate.setMonth(startDate.getMonth() + i - 1);

        const formattedDate = emiDate
          .toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replace(/ (\d{4})$/, ", $1");

        emiList.push({
          Id: generateId(50),
          EMIIndex: i,
          DueDate: emiDate.toISOString().split("T")[0],
          displayDate: formattedDate,
          Amount: appData.EMIAmount,
          Status: "Due",
        });
      }

      setEMIDetails(emiList);
    }
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      toast.error("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    newLoan["Id"] = generateId();
    newLoan["CreatedBy"] = helperMethods.fetchUser();
    newLoan["CreatedDate"] = helperMethods.dateToString();
    newLoan["ModifiedBy"] = helperMethods.fetchUser();
    newLoan["ModifiedDate"] = helperMethods.dateToString();

    createLoanItems();
    try {
      newLoan["Id"] = generateId();
      const res = await fetch(`${apiData.PORT}/api/loans/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLoan),
      });

      const data = await res.json();
      if (res.ok) {
        // Add new record locally (optional re-fetch)
        hideLoanModal();
        setnewLoan({
          RateOfInterest: 15,
          Tenure: 12,
        });
        // setSubmitting(true);
        toast.success("New Loan created successfully.");
        createLoanItems();
        CreateDocumentsRecords();
        fetchLoans();
      } else {
        toast.error("Error adding loan record: " + data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("⚠️ Server error. Please try again.");
    }
  };
  const createLoanItems = async () => {
    if (emiDetails && emiDetails.length > 0) {
      try {
        emiDetails.forEach((element) => {
          element.Loan = newLoan.Id;
          (element.ModifiedBy = helperMethods.fetchUser()),
            (element.ModifiedDate = helperMethods.dateToString()),
            (element.CreatedBy = helperMethods.fetchUser()),
            (element.CreatedDate = helperMethods.dateToString());
        });
        const res = await fetch(`${apiData.PORT}/api/child/loanitems/insert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emiDetails),
        });
        // const data = await res.json();
        if (res.ok) {
          setSubmitting(false);
          toast.success("Loan Items created successfully.");
          fetchLoans();
        } else {
          setSubmitting(false);
          //toast.error(" Error adding loan items: " + data.error);
        }
      } catch (error) {
        setSubmitting(false);
        console.error("Error:", error);
        toast.error("⚠️ Server error. Please try again.");
      }
    }
  };

  const CreateDocumentsRecords = async () => {
    try {
      // Create a new array instead of mutating imported data
      const payload = documentData.map((ele) => ({
        Id: generateId(),
        ...ele,
        ParentId: newLoan.Id,
      }));
      console.log('payload ::',payload)
      const res = await fetch(`${apiData.PORT}/api/child/documents/insert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create document records");
      }

      toast.success("Documents records created successfully.");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "⚠️ Server error. Please try again.");
    }
  };

  const validateFields = () => {
    const newErrors = {};
    const requiredFields = [
      "Dealer",
      "Agent",
      "ConditionType",
      "Model",
      "ModelMonth",
      "ModelYear",
      "InsuranceType",
      "TotalPrice",
      "DownPayment",
      "RateOfInterest",
      "Tenure",
      "EMIAmount",
      "AgreementDate",
      "FirstAutoDebitDate",
      "EMIStartDate",
      "EMIEndDate",
      "Hirer",
    ];

    requiredFields.forEach((field) => {
      if (!newLoan[field]) {
        newErrors[field] = "This field is required";
      }
    });

    if (newLoan.Email && !/\S+@\S+\.\S+/.test(newLoan.Email)) {
      newErrors.Email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const IFSC_REGEX = /^[A-Z]{4}0[0-9]{6}$/;

  const handleUpdateLoan = async () => {
    if (!validateFields()) {
      toast.error("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    const payload = {
      ...newLoan,
      ModifiedBy: helperMethods.fetchUser(),
      ModifiedDate: helperMethods.dateToString(),
      AgreementDate: newLoan.AgreementDate.toString().split("T")[0],
      FirstAutoDebitDate: newLoan.FirstAutoDebitDate.toString().split("T")[0],
      EMIStartDate: newLoan.EMIStartDate.toString().split("T")[0],
      EMIEndDate: newLoan.EMIEndDate.toString().split("T")[0],
      NOCDate: newLoan.NOCDate.toString().split("T")[0],
      ModelId: null,
    };
    try {
      const res = await fetch(`${apiData.PORT}/api/loans/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`${record.Name} was updated successfully.`);
        setSubmitting(false);
        hideLoanModal();
        fetchLoans();
      } else {
        toast.error("Error updating loan record: ");
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setSubmitting(false);
      toast.error("⚠️ Server error. Please try again.");
    }
  };
  // -------------------------------------------------------
  // HELPER: Compute EMI/NOC end date from a given start date
  // -------------------------------------------------------
  function computeEndDate(startDate, tenure) {
    if (!startDate || !tenure) return "";
    try {
      const d = new Date(startDate);
      if (isNaN(d.getTime())) return "";
      d.setMonth(d.getMonth() - 1 + Number(tenure));
      return d.toISOString().split("T")[0];
    } catch (e) {
      console.error("computeEndDate error:", e);
      return "";
    }
  }

  // -------------------------------------------------------
  // HELPER: Compute EMI start date (8th of next/month-after-next)
  // -------------------------------------------------------
  function computeEMIStartDate(fromDate) {
    if (!fromDate) return "";
    try {
      const base = new Date(fromDate);
      if (isNaN(base.getTime())) return "";
      const result = new Date(base);
      result.setDate(8);
      if (base.getDate() >= 25) {
        result.setMonth(base.getMonth() + 2);
      } else {
        result.setMonth(base.getMonth() + 1);
      }
      return result.toISOString().split("T")[0];
    } catch (e) {
      console.error("computeEMIStartDate error:", e);
      return "";
    }
  }

  // -------------------------------------------------------
  // HANDLER: Agreement Date change
  // -------------------------------------------------------
  function handleAgreementDateChange(e, newLoan, setnewLoan) {
    const rawValue = e?.target?.value;
    if (!rawValue) return;

    const emiStart = computeEMIStartDate(rawValue);
    const endDate = computeEndDate(emiStart, newLoan.Tenure);

    setnewLoan({
      ...newLoan,
      AgreementDate: rawValue,
      EMIStartDate: emiStart,
      FirstAutoDebitDate: emiStart,
      EMIEndDate: endDate,
      NOCDate: endDate,
    });
  }

  // -------------------------------------------------------
  // HANDLER: First Auto Debit Date change
  // -------------------------------------------------------
  function handleFirstAutoDebitDateChange(e, newLoan, setnewLoan) {
    const rawValue = e?.target?.value;
    if (!rawValue) return;

    setnewLoan({
      ...newLoan,
      FirstAutoDebitDate: rawValue,
    });
  }

  // -------------------------------------------------------
  // HELPER: Get default FirstAutoDebitDate value on mount
  // (called once if newLoan.FirstAutoDebitDate is not set)
  // -------------------------------------------------------
  function getDefaultAutoDebitDate(newLoan, setnewLoan) {
    const today = new Date();
    const emiStart = computeEMIStartDate(today.toISOString().split("T")[0]);
    const endDate = computeEndDate(emiStart, newLoan.Tenure);

    setnewLoan({
      ...newLoan,
      EMIStartDate: emiStart,
      FirstAutoDebitDate: emiStart,
      EMIEndDate: endDate,
      NOCDate: endDate,
    });

    return emiStart;
  }

  return (
    <>
      {/* <SpinnerComp show={isLoadingMode} message={isLoadingMsg}></SpinnerComp> */}
      {/* ✅ New Application Modal */}
      <Modal
        show={showLoanModal}
        onHide={onHideModal}
        centered
        backdrop="static" // ⛔ Prevent closing by clicking outside
        keyboard={false}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title className="w-100 text-center">
            {record ? `Edit ${record?.Name}` : "New Loan"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              {record && (
                <Col md={12}>
                  <fieldset className="custom-fieldset">
                    <legend className="custom-legend">Loan Details</legend>
                    <Row>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Loan Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="Name"
                            value={newLoan.Name || ""}
                            disabled
                            readOnly
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>UMRN Stutas</Form.Label>
                          <Form.Select
                            name="UMRNStatus"
                            value={newLoan.UMRNStatus}
                            isInvalid={!!errors.UMRNStatus}
                            onChange={(e) => {
                              setnewLoan({
                                ...newLoan,
                                UMRNStatus: e.target.value,
                              });
                            }}
                            required
                          >
                            <option value="New">New</option>
                            <option value="Sent to Bank">Sent to Bank</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Rejected - Ready to resend">
                              Rejected - Ready to resend
                            </option>
                            <option value="Modified">Modified</option>
                            <option value="Modified - Ready to resend">
                              Modified - Ready to resend
                            </option>
                            <option value="Created">Created</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>UMRN Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="UMRN"
                            value={newLoan.UMRN || ""}
                            disabled
                            readOnly
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Rejected Reason</Form.Label>
                          <Form.Control
                            type="text"
                            name="RejectedReason"
                            value={newLoan.RejectedReason || ""}
                            disabled
                            readOnly
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </fieldset>
                </Col>
              )}

              <Col md={12}>
                <fieldset className="custom-fieldset">
                  <legend className="custom-legend">Dealer Information</legend>
                  {/* <legend className="custom-legend">Dealer Information</legend> */}
                  <Row>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          <span style={{ color: "red" }}>*</span> Dealer
                        </Form.Label>
                        <LookupField
                          value={{ Id: newLoan.Dealer }}
                          entityName="dealers"
                          placeholder="Search Dealer"
                          where="s"
                          isInvalid={!!errors.Dealer}
                          // isCreateable="true"
                          onSelect={(record) => {
                            setErrors({ ...errors, Dealer: "" });
                            setnewLoan({
                              ...newLoan,
                              Dealer: record.Id,
                              DealerName: record.Name,
                            });
                            //  getAmountDetails();
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>
                          <span style={{ color: "red" }}>*</span> Agent
                        </Form.Label>
                        <LookupField
                          value={{ Id: newLoan.Agent }}
                          entityName={`customers?Dealer=${newLoan.Dealer}&Agent=1`}
                          placeholder="Search Agent"
                          isDisabled={!newLoan.Dealer && true}
                          isInvalid={!!errors.Agent}
                          onSelect={(record) => {
                            setErrors({ ...errors, Agent: "" });
                            setnewLoan({
                              ...newLoan,
                              Agent: record.Id,
                              AgentName: record.Name,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Dealer File Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="DealerFileNumber"
                          value={newLoan.DealerFileNumber ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              DealerFileNumber: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </fieldset>
              </Col>
              <Col md={12}>
                <fieldset className="custom-fieldset">
                  <legend className="custom-legend">Vehicle Information</legend>

                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> New/Used
                        </Form.Label>
                        <Form.Select
                          name="ConditionType"
                          value={newLoan.ConditionType ?? ""}
                          isInvalid={!!errors.ConditionType}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              ConditionType: e.target.value,
                            });
                          }}
                          required
                        >
                          <option value="New">New</option>
                          <option value="Used">Used</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> Model
                        </Form.Label>
                        <div
                          className={errors.Model ? "react-select-invalid" : ""}
                        >
                          <Select
                            classNamePrefix="react-select"
                            options={products}
                            value={products.find(
                              (option) => option.value === newLoan.Model
                            )}
                            placeholder="Select..."
                            isSearchable
                            onChange={(option) => {
                              setErrors({ ...errors, Model: "" });
                              setnewLoan({
                                ...newLoan,
                                Model: option.value,
                              });
                              getAmountDetails(option);
                            }}
                          />
                        </div>
                        {errors.Model && (
                          <div
                            className="text-danger mt-1"
                            style={{ fontSize: "0.875rem" }}
                          >
                            {errors.Model}
                          </div>
                        )}
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> Model Month
                        </Form.Label>
                        <ModelMonthSelect
                          value={
                            newLoan.ModelMonth || new Date().getMonth() + 1
                          }
                          onChange={(month) => {
                            setnewLoan({
                              ...newLoan,
                              ModelMonth: month.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> Model Year
                        </Form.Label>
                        <ModelYearSelect
                          value={newLoan.ModelYear ?? ""}
                          onChange={(month) => {
                            setnewLoan({
                              ...newLoan,
                              ModelYear: month.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>CC Power</Form.Label>
                        <Form.Control
                          type="text"
                          name="CCPower"
                          value={newLoan.CCPower}
                          disabled
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> Insurance Type
                        </Form.Label>
                        <Form.Select
                          name="InsuranceType"
                          value={newLoan.InsuranceType ?? ""}
                          isInvalid={!!errors.InsuranceType}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              InsuranceType: e.target.value,
                            });
                          }}
                          required
                        >
                          <option value="1+4 Years">1+4 Years</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Chasis No</Form.Label>
                        <Form.Control
                          type="text"
                          name="ChasisNo"
                          value={newLoan.ChasisNo ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              ChasisNo: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Engine No</Form.Label>
                        <Form.Control
                          type="text"
                          name="EngineNo"
                          value={newLoan.EngineNo ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              EngineNo: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Registration No</Form.Label>
                        <Form.Control
                          type="text"
                          name="RegistrationNo"
                          value={newLoan.RegistrationNo ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              RegistrationNo: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Color</Form.Label>
                        <Form.Control
                          type="text"
                          name="Color"
                          value={newLoan.Color}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              Color: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </fieldset>
              </Col>
              <Col md={12}>
                <fieldset className="custom-fieldset">
                  <legend className="custom-legend">Amount</legend>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> Total Price
                        </Form.Label>
                        <NumericFormat
                          thousandSeparator={true}
                          prefix="₹"
                          decimalScale={2}
                          onInput={() => {
                            setnewLoan({ ...newLoan, DefaultValues: false });
                          }}
                          fixedDecimalScale={true}
                          value={newLoan.TotalPrice ?? ""}
                          isInvalid={!!errors.TotalPrice}
                          onValueChange={handleTotalAmountChange}
                          customInput={Form.Control}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.TotalPrice}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> Down Payment
                        </Form.Label>
                        <NumericFormat
                          thousandSeparator={true}
                          prefix="₹"
                          decimalScale={2}
                          fixedDecimalScale={true}
                          value={newLoan.DownPayment ?? ""}
                          onInput={() =>
                            setnewLoan((prev) => ({
                              ...prev,
                              DefaultValues: false,
                            }))
                          }
                          isInvalid={!!errors.DownPayment}
                          onValueChange={handleDownPaymentChange}
                          customInput={Form.Control}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.DownPayment}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Disburse Amount</Form.Label>
                        <NumericFormat
                          thousandSeparator={true}
                          prefix="₹"
                          decimalScale={2}
                          fixedDecimalScale={true}
                          value={newLoan.DisburseAmount ?? ""}
                          customInput={Form.Control}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mt-4">
                        <Form.Check
                          type="checkbox"
                          label="Default Values"
                          name="DefaultValues"
                          checked={newLoan.DefaultValues || true} // ✅ use checked instead of value
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              DefaultValues: e.target.checked,
                            });
                            if (e.target.checked) {
                              getAmountDetails(newLoan.ModelId);
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> Rate Of
                          Interest
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="RateOfInterest"
                          value={newLoan.RateOfInterest ?? ""}
                          onInput={() => {
                            setnewLoan({ ...newLoan, DefaultValues: false });
                          }}
                          isInvalid={errors.RateOfInterest}
                          onChange={handleChangeROI}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.RateOfInterest}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> Tenure(Months)
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="Tenure"
                          value={newLoan.Tenure ?? ""}
                          isInvalid={!!errors.Tenure}
                          onChange={handleTenureChange}
                          onInput={() => {
                            setnewLoan({ ...newLoan, DefaultValues: false });
                          }}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.Tenure}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> EMI Amount
                        </Form.Label>
                        <NumericFormat
                          thousandSeparator={true}
                          prefix="₹"
                          decimalScale={2}
                          fixedDecimalScale={true}
                          value={newLoan.EMIAmount ?? ""}
                          customInput={Form.Control}
                          isInvalid={!!errors.EMIAmount}
                          name="EMIAmount"
                          onInput={() => {
                            setnewLoan({ ...newLoan, DefaultValues: false });
                          }}
                          onValueChange={handleEMIAmountChange}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.EMIAmount}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Calculate Term</Form.Label>
                        <Form.Select
                          name="CalculateTerm"
                          value={newLoan.CalculateTerm ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              CalculateTerm: e.target.value,
                            });
                          }}
                          required
                        >
                          <option value="Calculate Interest(Default)">
                            Calculate Interest(Default)
                          </option>
                          <option value="Calculate Tenure">
                            Calculate Tenure
                          </option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Remaining Amount With Interest</Form.Label>
                        <NumericFormat
                          thousandSeparator={true}
                          prefix="₹"
                          decimalScale={2}
                          fixedDecimalScale={true}
                          value={newLoan.RemainingAmountWithInterest ?? ""}
                          customInput={Form.Control}
                          readOnly
                          disabled
                          name="RemainingAmountWithInterest"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>File Charge</Form.Label>
                        <NumericFormat
                          thousandSeparator={true}
                          prefix="₹"
                          decimalScale={2}
                          fixedDecimalScale={true}
                          value={newLoan.FileCharge || ""}
                          customInput={Form.Control}
                          onValueChange={(values) => {
                            const { floatValue } = values;
                            setnewLoan({
                              ...newLoan,
                              FileCharge: floatValue || 0,
                            });
                          }}
                          name="FileCharge"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>RTO Charge</Form.Label>
                        <NumericFormat
                          thousandSeparator={true}
                          prefix="₹"
                          decimalScale={2}
                          fixedDecimalScale={true}
                          value={newLoan.RTOCharge || ""}
                          customInput={Form.Control}
                          onValueChange={(values) => {
                            const { floatValue } = values;
                            setnewLoan({
                              ...newLoan,
                              RTOCharge: floatValue || 0,
                            });
                          }}
                          name="RTOCharge"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Dealer Commission</Form.Label>
                        <NumericFormat
                          thousandSeparator={true}
                          prefix="₹"
                          decimalScale={2}
                          fixedDecimalScale={true}
                          value={newLoan.DealerComission || ""}
                          customInput={Form.Control}
                          onValueChange={(values) => {
                            const { floatValue } = values;
                            setnewLoan({
                              ...newLoan,
                              DealerComission: floatValue || 0,
                            });
                          }}
                          name="DealerComission"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Agent Commission</Form.Label>
                        <NumericFormat
                          thousandSeparator={true}
                          prefix="₹"
                          decimalScale={2}
                          fixedDecimalScale={true}
                          value={newLoan.AgentComission || ""}
                          customInput={Form.Control}
                          onValueChange={(values) => {
                            const { floatValue } = values;
                            setnewLoan({
                              ...newLoan,
                              AgentComission: floatValue || 0,
                            });
                          }}
                          name="AgentComission"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </fieldset>
              </Col>
              <Col md={12}>
                <fieldset className="custom-fieldset">
                  <legend className="custom-legend">Agreement Details</legend>
                  <Row>
                    {/* Agreement Date */}
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> Agreement Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="AgreementDate"
                          value={
                            helperMethods.formatDate(newLoan.AgreementDate) ||
                            new Date().toISOString().split("T")[0]
                          }
                          isInvalid={!!errors.AgreementDate}
                          onChange={(e) =>
                            handleAgreementDateChange(e, newLoan, setnewLoan)
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.AgreementDate}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    {/* First Auto Debit Date */}
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> First Auto
                          Debit Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="FirstAutoDebitDate"
                          isInvalid={!!errors.FirstAutoDebitDate}
                          value={
                            helperMethods.formatDate(
                              newLoan.FirstAutoDebitDate
                            ) || getDefaultAutoDebitDate(newLoan, setnewLoan)
                          }
                          onChange={(e) =>
                            handleFirstAutoDebitDateChange(
                              e,
                              newLoan,
                              setnewLoan
                            )
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.FirstAutoDebitDate}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> EMI Start Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="EMIStartDate"
                          isInvalid={!!errors.EMIStartDate}
                          value={helperMethods.formatDate(newLoan.EMIStartDate)}
                          onChange={handleChange}
                          readOnly
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.EMIStartDate}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span className="text-danger">*</span> EMI End Date
                        </Form.Label>
                        <Form.Control
                          type="date"
                          name="EMIEndDate"
                          isInvalid={!!errors.EMIEndDate}
                          value={helperMethods.formatDate(newLoan.EMIEndDate)}
                          onChange={handleChange}
                          readOnly
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.EMIEndDate}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Payment Options</Form.Label>
                        <Form.Select
                          name="PaymentOptions"
                          value={newLoan.PaymentOptions ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              PaymentOptions: e.target.value,
                            });
                          }}
                          required
                        >
                          <option value="ECS">ECS</option>
                          <option value="Cash">Cash</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </fieldset>
              </Col>
              <Col md={6}>
                <fieldset className="custom-fieldset">
                  <legend className="custom-legend">Hirer Details</legend>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      {" "}
                      <span className="text-danger">*</span> Hirer
                    </Form.Label>
                    <LookupField
                      value={{ Id: newLoan.Hirer ?? "" }}
                      entityName={`customers?Hirer=1`}
                      placeholder="Search Hirer"
                      isCreateable="true"
                      lookupData={{ Hirer: 1 }}
                      onSelect={(record) => {
                        setErrors((prev) => ({ ...prev, Hirer: "" }));
                        setnewLoan({
                          ...newLoan,
                          Hirer: record.Id,
                          HirerName: record.Name,
                        });
                      }}
                      isInvalid={!!errors.Hirer}
                    />
                  </Form.Group>
                </fieldset>
              </Col>
              <Col md={6}>
                <fieldset className="custom-fieldset">
                  <legend className="custom-legend">Guarantor Details</legend>
                  <Form.Group className="mb-3">
                    <Form.Label>Guarantor</Form.Label>
                    <LookupField
                      value={{ Id: newLoan.Guarantor ?? "" }}
                      entityName={`customers?Guarantor=1`}
                      placeholder="Search Guarantor"
                      lookupData={{ Guarantor: 1 }}
                      isCreateable="true"
                      onSelect={(record) =>
                        setnewLoan({
                          ...newLoan,
                          Guarantor: record.Id,
                          GuarantorName: record.Name,
                        })
                      }
                    />
                  </Form.Group>
                </fieldset>
              </Col>

              <Col md={6}>
                <fieldset className="custom-fieldset">
                  <legend className="custom-legend">Referrer #1</legend>
                  <Form.Group className="mb-3">
                    <Form.Label>Referrer 1</Form.Label>

                    <LookupField
                      value={{ Id: newLoan.Referrer1 ?? "" }}
                      entityName={`customers?Referrer=1`}
                      placeholder="Search Referrer"
                      isCreateable="true"
                      lookupData={{ Referrer: 1 }}
                      onSelect={(record) =>
                        setnewLoan({
                          ...newLoan,
                          Referrer1: record.Id,
                          Referrer1Name: record.Name,
                        })
                      }
                    />
                  </Form.Group>
                </fieldset>
              </Col>
              <Col md={6}>
                <fieldset className="custom-fieldset">
                  <legend className="custom-legend">Referrer #2</legend>
                  <Form.Group className="mb-3">
                    <Form.Label>Referrer 2</Form.Label>

                    <LookupField
                      value={{ Id: newLoan.Referrer2 ?? "" }}
                      entityName={`customers?Referrer=1`}
                      placeholder="Search Referrer"
                      isCreateable="true"
                      lookupData={{ Referrer: 1 }}
                      onSelect={(record) =>
                        setnewLoan({
                          ...newLoan,
                          Referrer2: record.Id,
                          Referrer2Name: record.Name,
                        })
                      }
                    />
                  </Form.Group>
                </fieldset>
              </Col>
              {/* { !record &&  */}
              <Col md={6}>
                <fieldset className="custom-fieldset">
                  <legend className="custom-legend">EMI Details</legend>
                  <Row>
                    {emiDetails &&
                      emiDetails.length < 100 &&
                      emiDetails.map((element, index) => {
                        return (
                          <Col md={6} key={index}>
                            <div
                              className="card p-2 shadow-sm mb-2"
                              style={{
                                width: "auto",
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <div
                                className="rounded-circle bg-danger text-white d-flex justify-content-center align-items-center"
                                style={{
                                  width: "45px",
                                  height: "45px",
                                  fontWeight: "bold",
                                  fontSize: "20px",
                                }}
                              >
                                {index + 1}
                              </div>

                              <div className="ms-2">
                                <strong style={{ fontSize: "1rem" }}>
                                  {element.displayDate}
                                </strong>
                                <br />
                                <small className="text-muted">
                                  Amount —{" "}
                                  {new Intl.NumberFormat("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                    minimumFractionDigits: 2,
                                  }).format(element.Amount)}
                                </small>
                              </div>
                            </div>
                          </Col>
                        );
                      })}
                  </Row>
                </fieldset>
              </Col>
              {/* // } */}
              <Col md={6}>
                <fieldset className="custom-fieldset">
                  <legend className="custom-legend">
                    Document Information
                  </legend>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>NOC Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="NOCDate"
                          defaultValue={
                            helperMethods.formatDate(newLoan.NOCDate) ||
                            new Date().toISOString().split("T")[0]
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Bill No</Form.Label>
                        <Form.Control
                          type="text"
                          name="BillNo"
                          value={newLoan.BillNo ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              BillNo: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>RC No</Form.Label>
                        <Form.Control
                          type="text"
                          name="RCNo"
                          value={newLoan.RCNo ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              RCNo: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Key No</Form.Label>
                        <Form.Control
                          type="text"
                          name="KeyNo"
                          value={newLoan.KeyNo ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              KeyNo: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Insurance Policy No</Form.Label>
                        <Form.Control
                          type="text"
                          name="InsurancePolicyNo"
                          value={newLoan.InsurancePolicyNo ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              InsurancePolicyNo: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Insurance Company Name</Form.Label>
                        <LookupField
                          value={{ Id: newLoan.InsuranceCompanyNameId ?? "" }}
                          entityName="insurancecompanies"
                          placeholder="Search Company"
                          where="s"
                          onSelect={(record) =>
                            setnewLoan({
                              ...newLoan,
                              InsuranceCompanyNameId: record.Id,
                              InsuranceCompanyName: record.Name,
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Customer Bank Name</Form.Label>
                        <LookupField
                          value={{ Id: newLoan.CustomerBankNameId ?? "" }}
                          entityName="banks"
                          placeholder="Search Bank"
                          where="s"
                          onSelect={(record) =>
                            setnewLoan({
                              ...newLoan,
                              CustomerBankNameId: record.Id,
                              CustomerBankName: record.Name,
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <span>IFSC Code</span>
                          <span
                            className="ms-1"
                            style={{ fontSize: "0.75rem", color: "#6c757d" }}
                          >
                            (11 characters)
                          </span>
                        </Form.Label>

                        <Form.Control
                          type="text"
                          name="BankIFSC"
                          value={newLoan.BankIFSC ?? ""}
                          maxLength={11}
                          placeholder="ABCD0123456"
                          onChange={(e) => {
                            let val = e.target.value.toUpperCase();
                            val = val.replace(/[^A-Z0-9]/g, ""); // allow only letters & numbers

                            setnewLoan({
                              ...newLoan,
                              BankIFSC: val,
                            });
                          }}
                          isInvalid={
                            newLoan.BankIFSC &&
                            newLoan.BankIFSC.length === 11 &&
                            !IFSC_REGEX.test(newLoan.BankIFSC)
                          }
                        />

                        {/* Live validation block */}
                        {newLoan.BankIFSC && (
                          <>
                            {newLoan.BankIFSC.length < 11 && (
                              <small style={{ color: "red" }}>
                                IFSC must be exactly 11 characters
                              </small>
                            )}

                            {newLoan.BankIFSC.length === 11 &&
                              (IFSC_REGEX.test(newLoan.BankIFSC) ? (
                                <small style={{ color: "green" }}>
                                  Valid IFSC Code
                                </small>
                              ) : (
                                <small style={{ color: "red" }}>
                                  Invalid IFSC format:
                                  <br />
                                  • First 4 letters must be alphabets
                                  <br />
                                  • 5th character must be 0
                                  <br />• Last 6 must be alphanumeric
                                </small>
                              ))}
                          </>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Bank MICR</Form.Label>
                        <Form.Control
                          type="text"
                          name="BankMICR"
                          value={newLoan.BankMICR ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              BankMICR: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Bank Account Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="BankAccountNumber"
                          value={newLoan.BankAccountNumber ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              BankAccountNumber: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Bank Branch Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="BankBranchName"
                          value={newLoan.BankBranchName ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              BankBranchName: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Account Type</Form.Label>

                        <Form.Select
                          name="AccountType"
                          value={newLoan.AccountType ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              AccountType: e.target.value,
                            });
                          }}
                          required
                        >
                          <option value="Saving">Saving</option>
                          <option value="Current">Current</option>
                          <option value="Cash Credit(CC)">
                            Cash Credit(CC)
                          </option>
                          <option value="Others">Others</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Customer Bank Phone Number</Form.Label>
                        <Form.Control
                          type="test"
                          name="CustomerBankPhoneNumber"
                          value={newLoan.CustomerBankPhoneNumber ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              CustomerBankPhoneNumber: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Number Of Cheques</Form.Label>
                        <Form.Control
                          type="text"
                          name="NumberOfCheques"
                          value={newLoan.NumberOfCheques ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              NumberOfCheques: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cheque Number 1</Form.Label>
                        <Form.Control
                          type="text"
                          name="ChequeNumber1"
                          value={newLoan.ChequeNumber1 ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              ChequeNumber1: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cheque Number 2</Form.Label>
                        <Form.Control
                          type="text"
                          name="ChequeNumber2"
                          value={newLoan.ChequeNumber2 ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              ChequeNumber2: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cheque Number 3</Form.Label>
                        <Form.Control
                          type="text"
                          name="ChequeNumber3"
                          value={newLoan.ChequeNumber3 ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              ChequeNumber3: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cheque Number 4</Form.Label>
                        <Form.Control
                          type="text"
                          name="ChequeNumber4"
                          value={newLoan.ChequeNumber4 ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              ChequeNumber4: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cheque Number 5</Form.Label>
                        <Form.Control
                          type="text"
                          name="ChequeNumber5"
                          value={newLoan.ChequeNumber5 ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              ChequeNumber5: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="Description"
                          value={newLoan.Description ?? ""}
                          onChange={(e) => {
                            setnewLoan({
                              ...newLoan,
                              Description: e.target.value,
                            });
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </fieldset>
              </Col>
            </Row>
            {record && <SystemDetails data={newLoan} />}
            <div className="text-end">
              <Button
                variant="secondary"
                onClick={() => {
                  if (!record) {
                    setnewLoan(getEmptyLoan());
                  }
                  onHideModal();
                }}
                className="me-2"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={record != null ? handleUpdateLoan : handleSubmit}
                variant="dark"
              >     
                {submitting ? <Spinner animation="border" size="sm" /> : "Save"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
  function generateId(length = 30) {
    const timestamp = Date.now().toString(36); // adds time uniqueness
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomPart = "";

    // Using crypto API for better randomness (if supported)
    if (window.crypto && window.crypto.getRandomValues) {
      const randomValues = new Uint8Array(length - timestamp.length);
      window.crypto.getRandomValues(randomValues);
      randomPart = Array.from(randomValues)
        .map((num) => chars[num % chars.length])
        .join("");
    } else {
      // Fallback to Math.random() if crypto is unavailable
      for (let i = 0; i < length - timestamp.length; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    const id = timestamp + randomPart;
    return id.length >= length ? id.slice(0, length) : id;
  }
};
function getEmptyLoan() {
  return {
    Dealer: "",
    Agent: "",
    DealerFileNumber: "",
    ConditionType: "New",
    Model: "",
    ModelMonth: (new Date().getMonth() + 1).toString(),
    ModelYear: new Date().getFullYear().toString(),
    CCPower: "",
    InsuranceType: "1+4 Years",
    ChasisNo: "",
    EngineNo: "",
    RegistrationNo: "",
    Color: "",
    TotalPrice: "",
    DownPayment: "",
    DisburseAmount: "",
    RateOfInterest: 15,
    Tenure: 12,
    EMIAmount: "",
    RemainingAmountWithInterest: "",
    FileCharge: "",
    RTOCharge: "",
    DealerComission: "",
    AgentComission: "",
    AgreementDate: new Date().toISOString().split("T")[0],
    FirstAutoDebitDate: "",
    EMIStartDate: "",
    EMIEndDate: "",
    PaymentOptions: "ECS",
    Hirer: "",
    Guarantor: "",
    Referrer1: "",
    Referrer2: "",
    NOCDate: "",
    BillNo: "",
    RCNo: "",
    KeyNo: "",
    InsurancePolicyNo: "",
    InsuranceCompanyName: "",
    CustomerBankName: "",
    BankIFSC: "",
    BankMICR: "",
    UMRNStatus: "New",
    BankAccountNumber: "",
    BankBranchName: "",
    AccountType: "Saving",
    CustomerBankPhoneNumber: "",
    NumberOfCheques: "",
    ChequeNumber1: "",
    ChequeNumber2: "",
    ChequeNumber3: "",
    ChequeNumber4: "",
    ChequeNumber5: "",
    Description: "",

    // Extra fields you had in example
    DefaultValues: true,
    CalculateTerm: "Calculate Interest(Default)",
  };
}

export default NewLoanModal;
