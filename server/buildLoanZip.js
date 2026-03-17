import ExcelJS from "exceljs";
import archiver from "archiver";
import path from "path";
import fs from "fs";
// import stream from "stream";
// import { promisify } from "util";
// import process from "process";

// const access = promisify(fs.access);

/**
 * Normalize string for comparison
 */
// function normalize(str) {
//   return (str || "").toLowerCase().replace(/[\s_\-.]+/g, "");
// }

/**
 * Make filename safe
 */
function safeName(str) {
  return (str || "file").replace(/[<>:"/\\|?*]+/g, "_");
}

/**
 * Check if file exists
 */
// async function fileExists(filePath) {
//   try {
//     await access(filePath);
//     return true;
//   } catch {
//     return false;
//   }
// }

/**
 * Build Loan ZIP containing:
 * 1️⃣ Excel sheet
 * 2️⃣ Loan documents
 */
export async function buildLoanZip({
  connection,
  loanIds,
  sheetName,
  rootFolder,
  getCompanySettings,
  transformLoan,
  loanFields,
  baseName
}) {

  // ================= DB =================
  const [rows] = await connection.query(
    `
    SELECT
      l.Id AS LoanId,
      l.Name AS LoanName,
      l.*,
      c.FirstName,
      c.LastName,
      c.Phone,
      c.Email,
      d.Id AS DocumentId,
      d.Name AS DocumentName,
      dv.FilePath AS FileLink
    FROM loans l
    LEFT JOIN customers c ON l.Hirer = c.Id
    LEFT JOIN documents d ON d.ParentId = l.Id
    LEFT JOIN documentversion dv
      ON dv.ParentDocument = d.Id AND dv.Active = 1
    WHERE l.Id IN (?)
    `,
    [loanIds]
  );

  if (!rows.length) {
    throw new Error("No loans found");
  }

  // ================= GROUP =================
  const loanMap = {};

  rows.forEach((r) => {
    if (!loanMap[r.LoanId]) {
      loanMap[r.LoanId] = { loan: r, docs: [] };
    }

    loanMap[r.LoanId].docs.push(r);
  });

  // const requiredKey = normalize(
  //   sheetName === "001" ? "ecs fixed" : "ecs max"
  // );

  const validLoans = [];
  const warnings = [];

  for (const id in loanMap) {
    const entry = loanMap[id];
    validLoans.push(entry.loan);
  }

  if (!validLoans.length) {
    const err = new Error("No valid loans");
    err.warnings = warnings;
    throw err;
  }

  // ================= EXCEL =================
  const cs = await getCompanySettings();

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Loans");

  ws.columns = loanFields();

  validLoans.forEach((loan, i) => {
    ws.addRow({
      ...transformLoan(loan, cs, sheetName, i + 1),
      action: "CREATE"
    });
  });

  ws.getRow(1).font = { bold: true };

  const excelBuffer = await wb.xlsx.writeBuffer();

  // ================= ARCHIVE FACTORY =================
  function createArchive() {
    const archive = archiver("zip", { zlib: { level: 1 } });

    archive.append(excelBuffer, {
      name: `${baseName}.xlsx`
    });

    for (const loan of validLoans) {
      for (const d of loanMap[loan.LoanId].docs) {

        // Skip if no file
        if (!d.FileLink) continue;

        const filePath = path.join(rootFolder, d.FileLink);

        if (fs.existsSync(filePath)) {
          archive.append(fs.createReadStream(filePath), {
            name: `${safeName(loan.LoanName)}${path.extname(d.DocumentName)}`
          });
        }
      }
    }

    return archive;
  }

  // ================= PUBLIC API =================
  return {
    validLoanIds: validLoans.map((l) => l.LoanId),
    warnings,

    async stream(res) {
      const archive = createArchive();
      archive.pipe(res);
      await archive.finalize();
    },

    async toBuffer() {
      return new Promise((resolve, reject) => {
        const archive = createArchive();
        const chunks = [];

        archive.on("data", (c) => chunks.push(c));
        // eslint-disable-next-line no-undef
        archive.on("end", () => resolve(Buffer.concat(chunks)));
        archive.on("error", (err) => reject(err));

        archive.finalize();
      });
    }
  };
}