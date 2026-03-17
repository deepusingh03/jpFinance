import xlsx  from "xlsx";
import { getFormattedDate }  from "./helper.js";

export const uploadBankResponse = async (db,req, res) => {

  const rowErrors = [];
  const MODIFIED_BY = "B0wBXE1XjmvxcdLSj9FyQKWC8G33mm";

  try {

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded." });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    const rows = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      { defval: "", raw: false, header: 1 }
    );

    if (rows.length <= 1) {
      return res.status(400).json({ success: false, error: "Sheet is empty." });
    }

    const headers = (rows[0] || []).map(v =>
      v ? v.toString().trim().toLowerCase() : ""
    );

    const findSafe = (keyword) => headers.findIndex(h => h.includes(keyword));

    const idx = {
      loanId: findSafe("other ref"),
      status: headers.indexOf("status"),
      umrn: headers.indexOf("umrn"),
      rejectedReason: findSafe("reject")
    };

    if (idx.loanId === -1 || idx.status === -1) {
      return res.status(400).json({
        success: false,
        error: "Missing 'Other Ref No' or 'Status' columns."
      });
    }

    const approvedUpdates = [];
    const rejectedUpdates = [];
    let skippedCount = 0;
    let processed = 0;
    const modifiedDate = getFormattedDate();

    for (let i = 1; i < rows.length; i++) {

      const row = rows[i];
      const excelRowNum = i + 1;

      const loanId = (row[idx.loanId] || "").toString().trim();
      const status = (row[idx.status] || "").toString().trim().toLowerCase();

      if (!loanId) {
        skippedCount++;
        rowErrors.push(`Row ${excelRowNum}: Missing Loan ID`);
        continue;
      }

      if (status === "approved") {

        const umrnValue = idx.umrn !== -1 ? (row[idx.umrn] || "").toString().trim() : "";

        if (!umrnValue) {
          skippedCount++;
          rowErrors.push(`Row ${excelRowNum}: UMRN required`);
        } else {
          approvedUpdates.push({ loanId, umrnValue });
          processed++;
        }

      } else if (status === "rejected") {

        const reason = idx.rejectedReason !== -1 ? (row[idx.rejectedReason] || "").toString().trim() : "";

        if (!reason) {
          skippedCount++;
          rowErrors.push(`Row ${excelRowNum}: Rejection reason required`);
        } else {
          rejectedUpdates.push({ loanId, reason });
          processed++;
        }

      } else {
        skippedCount++;
        rowErrors.push(`Row ${excelRowNum}: Invalid status "${status}"`);
      }
    }

    if (processed === 0) {
      return res.json({
        success: true,
        message: "No valid rows to update",
        summary: { skipped: skippedCount, processed, errors: rowErrors }
      });
    }

    const connection = await db.getConnection();

    try {

      await connection.beginTransaction();

      const performBulkUpdate = async (data, isApproval) => {

        const CHUNK_SIZE = 500;

        for (let i = 0; i < data.length; i += CHUNK_SIZE) {

          const chunk = data.slice(i, i + CHUNK_SIZE);
          const ids = chunk.map(d => d.loanId);
          const cases = chunk.map(() => `WHEN Id = ? THEN ?`).join(" ");

          const params = [];

          if (isApproval) {

            chunk.forEach(d => params.push(d.loanId, d.umrnValue));
            params.push(modifiedDate, MODIFIED_BY, ...ids);

            await connection.query(
              `UPDATE loans
               SET UMRN = CASE ${cases} END,
               UMRNStatus = 'Created',
               RejectedReason = NULL,
               ModifiedDate = ?, ModifiedBy = ?
               WHERE Id IN (${ids.map(() => "?").join(",")})`,
              params
            );

          } else {

            chunk.forEach(d => params.push(d.loanId, d.reason));
            params.push(modifiedDate, MODIFIED_BY, ...ids);

            await connection.query(
              `UPDATE loans
               SET UMRNStatus = 'Rejected',
               RejectedReason = CASE ${cases} END,
               ModifiedDate = ?, ModifiedBy = ?
               WHERE Id IN (${ids.map(() => "?").join(",")})`,
              params
            );
          }

        }
      };

      if (approvedUpdates.length > 0) await performBulkUpdate(approvedUpdates, true);
      if (rejectedUpdates.length > 0) await performBulkUpdate(rejectedUpdates, false);

      await connection.commit();

      res.json({
        success: true,
        summary: {
          processed,
          approved: approvedUpdates.length,
          rejected: rejectedUpdates.length,
          skipped: skippedCount,
          errors: rowErrors
        }
      });

    } catch (err) {

      await connection.rollback();
      throw err;

    } finally {

      connection.release();

    }

  } catch (err) {

    console.error("API Error:", err);

    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: [err.message]
    });
  }
};

// module.exports = {
//   uploadBankResponse,
//   uploadMiddleware: memoryUpload.single("file")
// };