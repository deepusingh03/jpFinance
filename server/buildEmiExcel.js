import ExcelJS  from "exceljs";

export async function buildEmiExcel({ connection}) {
  // 1. Fetch Data

  const [rows] = await connection.query(
      `
      SELECT
        e.Id        AS EmiId,
        e.DueDate,
        e.Amount,
        l.UMRN,
        l.DealerFileNumber,
        c.FirstName,
        c.LastName
      FROM loanitems e
      INNER JOIN loans l ON e.Loan = l.Id
      LEFT JOIN customers c ON l.Hirer = c.Id
      WHERE e.Status = 'Due'
        AND MONTH(e.DueDate) = MONTH(CURRENT_DATE())
        AND YEAR(e.DueDate) = YEAR(CURRENT_DATE())
        AND DAY(e.DueDate) <= 8
      ORDER BY e.DueDate ASC
     `
    );

  if (!rows.length) {
    throw new Error("No Due EMIs found for current month");
  }

  const emiIds = rows.map(r => r.EmiId);

  // 2. Setup Filename
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  const filename = `289232_MMS_TXN_${dd}${mm}${yyyy}_001.xlsx`;

  // 3. Create Excel
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("EMIs");

  ws.columns = [
    { header: "SR NUMBER", key: "SrNumber", width: 12 },
    { header: "MANDATE NO (UMRN)", key: "UMRN", width: 22 },
    { header: "DEBIT DATE", key: "DebitDate", width: 16 },
    { header: "AMOUNT", key: "Amount", width: 14 },
    { header: "MANDATE ACCOUNT HOLDER NAME", key: "AccountHolder", width: 36 },
    { header: "CUSTOMER REF NO", key: "CustomerRefNo", width: 22 },
    { header: "OTHER REF NO", key: "OtherRefNo", width: 26 }
  ];

  rows.forEach((r, index) => {
    let formattedDate = "";
    if (r.DueDate) {
      const date = new Date(r.DueDate);
      formattedDate = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    }

    ws.addRow({
      SrNumber: index + 1,
      UMRN: r.UMRN || "",
      DebitDate: formattedDate,
      Amount: Number(r.Amount) || 0,
      AccountHolder: `${r.FirstName || ""} ${r.LastName || ""}`.trim(),
      CustomerRefNo: r.DealerFileNumber || "",
      OtherRefNo: r.EmiId
    });
  });

  ws.getRow(1).font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  
  return { buffer, filename, emiIds};
}

