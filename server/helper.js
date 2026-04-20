let cachedSettings = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 5 * 60 * 1000;
 

/**
 * Column configuration for Loan Export / Display
 */

export const COLUMNS = [
  { label: "Sr Number", key: "SrNumber" },
  { label: "UMRN", key: "UMRN" },
  { label: "UIN", key: "UIN" },
  { label: "Customer Code", key: "CustomerCode" },
  { label: "Utility Code", key: "UtilityCode" },
  { label: "Utility Name", key: "UtilityName" },
  { label: "Debit Customer Name", key: "DebitCustomerName" },
  { label: "Debit Account No", key: "BankAccountNumber" },
  { label: "Debit Account Type", key: "AccountType" },
  { label: "Debit IFSC/MICR", key: "DebitIFSC" },
  { label: "Debit Bank Name", key: "BankBranchName" },
  { label: "Category Code", key: "CategoryCode" },
  { label: "Amount", key: "Amount" },
  { label: "Amount Type", key: "AmountType" },
  { label: "Customer Ref No", key: "CustomerRefNo" },
  { label: "Scheme Ref No", key: "SchemeRefNo" },
  { label: "Period", key: "Period" },
  { label: "Payment Type", key: "PaymentType" },
  { label: "Frequency", key: "Frequency" },
  { label: "Start Date", key: "StartDate" },
  { label: "End Date", key: "EndDate" },
  { label: "Auto Debit Date", key: "AutoDebitDate" },
  { label: "CustomerAddnID", key: "CustomerAddnID" },
  { label: "LandLine", key: "LandLine" },
  { label: "Mobile", key: "Mobile" },
  { label: "Email", key: "Email" },
  { label: "Other Ref No", key: "OtherRefNo" },
  { label: "Action", key: "action" }
];

/**
 * Converts column config to export fields
 */
export function loanFields() {
  return COLUMNS.map((col) => ({
    header: col.label,
    key: col.key,
    width: col.width ?? 20,
  }));
}

export function generateId (length = 30){
  const timestamp = Date.now().toString(36);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomPart = "";
  for (let i = 0; i < length - timestamp.length; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return timestamp + randomPart;
};

export function getFormattedDate(){
  const now = new Date();
  const datePart = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const timePart = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toLowerCase();

  return `${datePart}, ${timePart}`;
};
export async function getDefaultValues(db) {
  const [rows] = await db.query(
    "SELECT Type, Value FROM loandefaultvalue"
  );

  const formattedObject = rows.reduce((acc, item) => {
    const key = item.Type.toLowerCase()
      .replace(/\s+/g, "")
      .replace(/^\w/, (c) => c.toLowerCase());

    acc[key] = Number(item.Value);
    return acc;
  }, {});

  return formattedObject;
}
export async function getCompanySettings(db) {
  const now = Date.now();

  // Return cached settings if not expired
  if (cachedSettings && (now - settingsCacheTime) < SETTINGS_CACHE_TTL) {
    return cachedSettings;
  }

  // Fetch settings from DB
  const [settingsRows] = await db.query(preparedStatements.getCompanySettings);

  cachedSettings = settingsRows[0] || {};
  settingsCacheTime = now;

  return cachedSettings;
}

export const preparedStatements = {
  getLoanWithCustomer: `
      SELECT l.*, c.FirstName, c.LastName, c.Phone, c.Email
      FROM loans l
      LEFT JOIN customers c ON l.Hirer = c.Id
      WHERE l.Id = ?
  `,
  getLoansWithCustomers: `
      SELECT l.*, c.FirstName, c.LastName, c.Phone, c.Email
      FROM loans l
      LEFT JOIN customers c ON l.Hirer = c.Id
      ORDER BY l.\`Name\` ASC
  `,
  getLoansInWithCustomers: `
      SELECT l.*, c.FirstName, c.LastName, c.Phone, c.Email
      FROM loans l
      LEFT JOIN customers c ON l.Hirer = c.Id
      WHERE l.Id IN (?)
  `,
  getCompanySettings: `SELECT * FROM companysettings LIMIT 1`,
  getDocuments: `SELECT * FROM documents WHERE ParentId = ?`,
  getDocumentsIn: `SELECT * FROM documents WHERE ParentId IN (?)`,
  updateLoanStatus: `UPDATE loans SET UMRNStatus = ? WHERE Id = ?`,
  updateLoansStatus: `UPDATE loans SET UMRNStatus = ? WHERE Id IN (?)`,
  insertDocument: `INSERT INTO documents (Id, Name, Link, ParentId) VALUES (?, ?, ?, ?)`,
  updateLoanApproved: `UPDATE loans SET UMRN = ?, UMRNStatus = 'Created', RejectedReason = NULL WHERE Id = ?`,
  updateLoanRejected: `UPDATE loans SET UMRNStatus = 'Rejected', RejectedReason = ? WHERE Id = ?`,
  bulkUpdateLoansApproved: `
      UPDATE loans 
      SET UMRN = CASE WHEN Id = ? THEN ? ELSE UMRN END,
          UMRNStatus = CASE WHEN Id = ? THEN 'Created' ELSE UMRNStatus END,
          RejectedReason = NULL
      WHERE Id IN (?)
  `,
};

 export const roundedAmount = (amount) => {
  if (!amount) return 0;
  return Math.ceil((amount * 2) / 100000) * 100000;
};

export const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
};
export const transformLoan = (loan, settings, sheetName, index = 1) => {
  const debitName = loan.FirstName || loan.LastName ? `${loan.FirstName || ""} ${loan.LastName || ""}`.trim() : "";
  const debitIFSC = loan.BankIFSC || loan.BankMICR || "";
  return {
      SrNumber: index,
      UMRN: loan.UMRN || "",
      UIN: loan.Name || "",
      CustomerCode: settings.CustomerCode || "",
      UtilityCode: settings.UtilityCode || "",
      UtilityName: settings.UtilityName || "",
      DebitCustomerName: debitName,
      BankAccountNumber: loan.BankAccountNumber || "",
      AccountType: loan.AccountType || "",
      DebitIFSC: debitIFSC,
      BankBranchName: loan.CustomerBankName || "",
      CategoryCode: settings.CategoryCode || "",
      Amount: sheetName === "001" ? loan.EMIAmount || null : roundedAmount(loan.RemainingAmountWithInterest),
      AmountType: sheetName === "001" ? "F" : "M",
      CustomerRefNo: loan.DealerFileNumber || "",
      SchemeRefNo: null,
      Period: settings.Period || "",
      PaymentType: settings.PaymentType || "",
      Frequency: settings.Frequency || "",
      StartDate: formatDate(loan.EMIStartDate),
      EndDate: sheetName === "001" ? formatDate(loan.AgreementDate) : formatDate(settings.EMIEndDate),
      AutoDebitDate: sheetName === "001" ? formatDate(loan.FirstAutoDebitDate) : "",
      CustomerAddnID: null,
      LandLine: null,
      Mobile: loan.Phone || "",
      Email: loan.Email || "",
      OtherRefNo: loan.Id,
      Id: loan.Id,
      UMRNStatus: loan.UMRNStatus,
  };
};