// server/server.js
// require("dotenv").config();
import xlsx from "xlsx";

import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcrypt";
// import validator from "validator";
import process from "process";
import { buildLoanZip } from "./buildLoanZip.js";
import { buildEmiExcel } from "./buildEmiExcel.js"; // adjust path
import { sendMailSMTP } from "./sendMailSMTP.js";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";


import {
  loanFields,
  getCompanySettings,
  transformLoan,
  generateId,
  getFormattedDate,
  getDefaultValues,
} from "./helper.js";
import {
  objectFields,
  auditFields,
  updateAuditFields,
} from "./fieldsHelper.js";
import { uploadBankResponse } from "./bankResponseUpload.js";

// ─────────────────────────────────────────────
// 🔧 App Initialization
// ─────────────────────────────────────────────
dotenv.config();
const app = express();
app.use(express.json());

// ─────────────────────────────────────────────
// 🌐 CORS Configuration
// Allow requests only from known frontend origins
// ─────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://192.168.2.100:5173",
  "http://192.168.2.101:5173",
  "http://192.168.2.102:5173",
  "http://192.168.2.103:5173",
  "http://192.168.2.104:5173",
  "https://jpfincorp.com",
];

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);



// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Frontend build path
const buildPath = path.join(__dirname, "../public_html");

// Serve static files
app.use(express.static(buildPath));

// ─────────────────────────────────────────────
// 🔒 Sensitive Fields Blacklist
// These field names are stripped from query results
// to prevent accidental exposure of credentials/tokens
// ─────────────────────────────────────────────
const SENSITIVE_FIELDS = new Set([
  "password",
  "Password",
  "passwd",
  "pwd",
  "password_hash",
  "hash",
  "salt",
  "token",
  "access_token",
  "refresh_token",
  "secret",
]);

// ─────────────────────────────────────────────
// 🗄️ MySQL Connection Pool
// Using a pool for efficient connection reuse
// ─────────────────────────────────────────────
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "jpfinance",
  waitForConnections: true,
  connectionLimit: 10, // max concurrent connections in pool
  queueLimit: 0, // unlimited queue
});


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
};
// ─────────────────────────────────────────────
// 📦 Multer File Upload Configuration
// Files are stored under: documents/<LoanName>/<DocumentName>/
// ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const loanName = req.body.LoanName || "UnknownLoan";
    const documentName = req.body.DocumentName || "UnknownDoc";
    const dir = path.join("documents", loanName, documentName);

    // Recursively create directory if it doesn't exist
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    // Preserve original filename; consider sanitizing for production
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });
const memoryUpload = multer({ storage: multer.memoryStorage() });

// ─────────────────────────────────────────────
// 🛠️ Utilities
// ─────────────────────────────────────────────

/**
 * Sends a unified JSON response.
 * @param {Response} res - Express response object
 * @param {boolean} success - Whether the operation succeeded
 * @param {string} message - Human-readable status message
 * @param {*} data - Optional payload
 */
const sendResponse = (res, success, message, data = null) => {
  res.status(success ? 200 : 400).json({ success, message, data });
};

/**
 * Checks whether a given table exists in the current database.
 * @param {Pool} db - MySQL connection pool
 * @param {string} tableName - Table to check
 * @returns {Promise<boolean>}
 */
const tableExists = async (db, tableName) => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()`,
    [tableName]
  );
  return rows[0].count > 0;
};

/**
 * Inserts a new record into the given table.
 * Empty strings are converted to NULL before insertion.
 * @param {Response} res
 * @param {string} table - Target table name
 * @param {string[]} fields - Column names
 * @param {any[]} values - Corresponding values
 */
const insertRecord = async (res, table, fields, values) => {
  try {
    const sanitizedValues = values.map((v) => (v === "" ? null : v));
    const placeholders = fields.map(() => "?").join(", ");
    const query = `INSERT INTO ${table} (${fields.join(
      ", "
    )}) VALUES (${placeholders})`;

    const [result] = await db.query(query, sanitizedValues);
    sendResponse(res, true, "Record inserted successfully", {
      id: result.insertId,
    });
  } catch (err) {
    console.error(`[insertRecord] Error inserting into '${table}':`, err);
    sendResponse(res, false, err.message || "Insert failed");
  }
};

/**
 * Updates an existing record in the given table by its Id.
 * @param {Response} res
 * @param {string} table - Target table name
 * @param {string[]} fields - Columns to update
 * @param {any[]} values - Corresponding new values
 * @param {number|string} id - Record identifier
 */
const updateRecord = async (res, table, fields, values, id) => {
  try {
    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    const query = `UPDATE ${table} SET ${setClause} WHERE Id = ?`;
    const [result] = await db.query(query, [...values, id]);

    if (result.affectedRows === 0) {
      return sendResponse(res, false, "Record not found");
    }

    sendResponse(res, true, "Record updated successfully", {
      id: parseInt(id),
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error(`[updateRecord] Error updating '${table}':`, err);
    sendResponse(res, false, err.message || "Update failed");
  }
};

app.post("/api/upload-bank-response", memoryUpload.single("file"), (req, res) =>
  uploadBankResponse(db, req, res)
);
// ─────────────────────────────────────────────
// 🔐 AUTH — POST /api/login
// Validates credentials against bcrypt-hashed DB passwords
// ─────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendResponse(res, false, "Email and password are required");
  }

  try {
    const [rows] = await db.query(
      "SELECT Id, FirstName, LastName, Email, Password FROM users WHERE Email = ? LIMIT 1",
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return sendResponse(res, false, "Invalid email or password");
    }

    const user = rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.Password);

    if (!isPasswordValid) {
      return sendResponse(res, false, "Invalid email or password");
    }

    // ✅ Access Token (short-lived)
    const accessToken = jwt.sign(
      { userId: user.Id, email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );
     const { Password, ...userWithoutPassword } = user;

    return sendResponse(res, true, "Login success", {
      user: userWithoutPassword,
      accessToken,
    });
  } catch (err) {
    console.error(err);
    return sendResponse(res, false, "Login failed");
  }
});

// ─────────────────────────────────────────────
// 📋 GENERIC GET — GET /api/get/:entityName
// Fetches all rows from a table, auto-joining
// parent tables via discovered foreign keys.
// Supports optional query-string filters.
// Example: /api/get/customers?Country=USA&State=CA
// ─────────────────────────────────────────────
app.get("/api/get/:entityName", authenticateToken,async (req, res) => {
  const { entityName } = req.params;
  const filters = req.query;

  // Whitelist table name to prevent SQL injection
  if (!/^[a-zA-Z0-9_]+$/.test(entityName)) {
    return sendResponse(res, false, "Invalid table name");
  }

  try {
    // Guard: ensure the table actually exists before querying
    if (!(await tableExists(db, entityName))) {
      return sendResponse(res, false, `Table '${entityName}' does not exist`);
    }

    // ── Step 1: Discover foreign keys on this table ──
    const [fkRows] = await db.query(
      `SELECT
         kcu.COLUMN_NAME          AS fk_column,
         kcu.REFERENCED_TABLE_NAME AS parent_table,
         kcu.REFERENCED_COLUMN_NAME AS parent_column
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
       JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
         ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
        AND kcu.TABLE_SCHEMA    = tc.TABLE_SCHEMA
       WHERE tc.CONSTRAINT_TYPE  = 'FOREIGN KEY'
         AND kcu.TABLE_NAME      = ?
         AND kcu.TABLE_SCHEMA    = DATABASE()`,
      [entityName]
    );

    // ── Step 2: Load columns of each parent table (excluding sensitive fields) ──
    const relations = {};
    for (const { fk_column, parent_table, parent_column } of fkRows) {
      const [parentCols] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()`,
        [parent_table]
      );

      relations[fk_column] = {
        table: parent_table,
        refColumn: parent_column,
        columns: parentCols
          .map((c) => c.COLUMN_NAME)
          .filter((c) => !SENSITIVE_FIELDS.has(c)),
      };
    }

    // ── Step 3: Build SELECT list and LEFT JOINs dynamically ──
    const selectParts = ["child.*"];
    const joinParts = [];

    for (const [fk, { table, refColumn, columns }] of Object.entries(
      relations
    )) {
      const alias = `${table}__${fk}`;

      // Prefix each parent column with its alias so we can unpack it later
      columns.forEach((col) => {
        selectParts.push(`\`${alias}\`.\`${col}\` AS \`${alias}__${col}\``);
      });

      joinParts.push(
        `LEFT JOIN \`${table}\` AS \`${alias}\`
         ON child.\`${fk}\` = \`${alias}\`.\`${refColumn}\``
      );
    }

    let sql = `SELECT ${selectParts.join(
      ", "
    )} FROM \`${entityName}\` AS child`;
    if (joinParts.length) sql += " " + joinParts.join(" ");

    // ── Step 4: Apply WHERE filters from query string (safe columns only) ──
    const [colRows] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()`,
      [entityName]
    );

    const tableColumns = colRows
      .map((r) => r.COLUMN_NAME)
      .filter((c) => !SENSITIVE_FIELDS.has(c));

    const params = [];
    const validFilters = Object.keys(filters).filter((k) =>
      tableColumns.includes(k)
    );

    if (validFilters.length) {
      sql +=
        " WHERE " +
        validFilters
          .map((k) => {
            params.push(filters[k]);
            return `child.\`${k}\` = ?`;
          })
          .join(" AND ");
    }

    // ── Step 5: Execute ──
    const [rows] = await db.query(sql, params);

    // ── Step 6: Reshape flat rows → nested objects ──
    // Columns prefixed with "parentAlias__field" are moved under result[parentAlias]
    const shaped = rows.map((row) => {
      const result = {};

      for (const [key, value] of Object.entries(row)) {
        const match = key.match(/^(.+?)__([^_]+)$/);

        if (match) {
          const [, parentAlias, field] = match;
          if (!result[parentAlias]) result[parentAlias] = {};
          result[parentAlias][field] = value;

          // If the join produced no match, collapse the nested object to null
          if (field === "id" && value === null) {
            result[parentAlias] = null;
          }
        } else {
          result[key] = value;
        }
      }

      return result;
    });

    sendResponse(res, true, shaped.length ? "Success" : "No records", shaped);
  } catch (err) {
    console.error("[/api/get/:entityName] DB Error:", err);
    sendResponse(res, false, "Database error");
  }
});

// ─────────────────────────────────────────────
// 💰 PRICEBOOK PRODUCTS — GET /api/fetch/pricebook-product/:dealerid
// Returns all active pricebook products for a specific dealer
// ─────────────────────────────────────────────
app.get("/api/fetch/pricebook-product/:dealerid", async (req, res) => {
  const { dealerid } = req.params;

  try {
    const query = `
      SELECT DISTINCT p.*, pe.UnitPrice
      FROM products p
      JOIN pricebookentry pe ON pe.Product = p.Id
      JOIN pricebook pb      ON pb.Id = pe.Pricebook
      JOIN dealers d         ON d.Id = pb.Dealer
      WHERE d.Id = ? AND pb.IsActive = 1
    `;

    const [rows] = await db.query(query, [dealerid]);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("[/api/fetch/pricebook-product] Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// ─────────────────────────────────────────────
// 🔗 RELATED CHILDREN — GET /api/related/childs/:entity
// Returns all child tables that reference :entity via a FK on 'id'
// ─────────────────────────────────────────────
app.get("/api/related/childs/:entity", async (req, res) => {
  const { entity } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT
         table_name  AS child_table,
         column_name AS child_column,
         constraint_name
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE referenced_table_name  = ?
         AND referenced_column_name = 'id'`,
      [entity]
    );

    sendResponse(res, true, "Success", rows);
  } catch (err) {
    console.error("[/api/related/childs] Error:", err);
    sendResponse(res, false, "Database error");
  }
});

// ─────────────────────────────────────────────
// ❌ DELETE — DELETE /api/delete/:entity/:id
// Hard-deletes a record by its Id
// ─────────────────────────────────────────────
app.delete("/api/delete/:entity/:id", async (req, res) => {
  const { entity, id } = req.params;

  try {
    const [result] = await db.query("DELETE FROM ?? WHERE Id = ?", [
      entity,
      id,
    ]);

    result.affectedRows > 0
      ? sendResponse(res, true, "Record deleted successfully")
      : sendResponse(res, false, "Record not found");
  } catch (err) {
    console.error("[/api/delete] Error:", err);
    sendResponse(res, false, "Database error");
  }
});

// ─────────────────────────────────────────────
// ➕ GENERIC INSERT — POST /api/:entity/insert
// Reads field list from objectFields helper and inserts one record
// ─────────────────────────────────────────────
app.post("/api/:entity/insert", (req, res) => {
  const { entity } = req.params;

  const baseFields = objectFields[entity];
  if (!baseFields) {
    return res.status(400).json({ error: `Unknown entity: '${entity}'` });
  }

  const fields = [...baseFields, ...auditFields];
  insertRecord(
    res,
    entity,
    fields,
    fields.map((f) => req.body[f])
  );
});

// ─────────────────────────────────────────────
// ✏️ GENERIC UPDATE — PUT /api/:entity/update
// Updates an existing record; Id must be present in the body
// ─────────────────────────────────────────────
app.put("/api/:entity/update", (req, res) => {
  const { entity } = req.params;

  const baseFields = objectFields[entity];
  if (!baseFields) {
    return res.status(400).json({ error: `Unknown entity: '${entity}'` });
  }

  const fields = [...baseFields, ...updateAuditFields];
  updateRecord(
    res,
    entity,
    fields,
    fields.map((f) => req.body[f]),
    req.body["Id"]
  );
});

// ─────────────────────────────────────────────
// 📅 BULK LOAN ITEMS INSERT — POST /api/child/loanitems/insert
// Accepts an array of loan instalment records and bulk-inserts them
// ─────────────────────────────────────────────
app.post("/api/child/loanitems/insert", async (req, res) => {
  const records = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return sendResponse(
      res,
      false,
      "Invalid data format: expected a non-empty array"
    );
  }

  try {
    const fields = ["Amount", "Loan", "DueDate", "Status", ...auditFields];
    const placeholders = records
      .map(() => `(${fields.map(() => "?").join(", ")})`)
      .join(", ");
    const values = records.flatMap((r) => fields.map((f) => r[f]));

    await db.query(
      `INSERT INTO loanitems (${fields.join(", ")}) VALUES ${placeholders}`,
      values
    );

    sendResponse(res, true, "All records inserted successfully");
  } catch (err) {
    console.error("[/api/child/loanitems/insert] Error:", err);
    sendResponse(res, false, "Database insert failed");
  }
});

// ─────────────────────────────────────────────
// 📄 BULK DOCUMENTS INSERT — POST /api/child/documents/insert
// Accepts an array of document metadata records and bulk-inserts them
// ─────────────────────────────────────────────
app.post("/api/child/documents/insert", async (req, res) => {
  const records = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return sendResponse(
      res,
      false,
      "Invalid data format: expected a non-empty array"
    );
  }

  try {
    const fields = ["Name", "ParentId", "Version", ...auditFields];
    const placeholders = records
      .map(() => `(${fields.map(() => "?").join(", ")})`)
      .join(", ");

    // Treat empty strings and undefined as NULL for nullable columns
    const values = records.flatMap((r) =>
      fields.map((f) => (r[f] === "" || r[f] === undefined ? null : r[f]))
    );

    await db.query(
      `INSERT INTO documents (${fields.join(", ")}) VALUES ${placeholders}`,
      values
    );

    sendResponse(res, true, "All documents inserted successfully");
  } catch (err) {
    console.error("[/api/child/documents/insert] Error:", err);
    sendResponse(res, false, err.message || "Database insert failed");
  }
});

// ─────────────────────────────────────────────
// 📤 FILE UPLOAD — POST /api/upload/documentversion/insert
// Saves a file to disk and records metadata in DocumentVersion table
// ─────────────────────────────────────────────
app.post(
  "/api/upload/documentversion/insert",
  upload.single("file"),
  async (req, res) => {
    const {
      Id,
      LoanName,
      ParentDocument,
      DocumentName,
      Name,
      Description,
      CreatedBy,
      CreatedDate,
      ModifiedBy,
      ModifiedDate,
    } = req.body;

    if (!req.file) {
      return res.json({ success: false, message: "File not uploaded" });
    }

    try {
      // Construct the relative file path used for serving via /documents/*
      const filePath = `documents/${LoanName}/${DocumentName}/${req.file.filename}`;

      await db.query(
        `INSERT INTO documentversion
         (Id, LoanName, ParentDocument, DocumentName, Name, FilePath, FileType, FileSize, Description, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Id,
          LoanName,
          ParentDocument,
          DocumentName,
          Name,
          filePath,
          req.file.mimetype,
          req.file.size,
          Description,
          CreatedBy,
          CreatedDate,
          ModifiedBy,
          ModifiedDate,
        ]
      );

      res.json({
        success: true,
        message: "File uploaded successfully",
        filePath,
      });
    } catch (err) {
      console.error("[/api/upload/documentversion/insert] Error:", err);
      res.json({ success: false, message: "Upload failed" });
    }
  }
);

app.get("/api/count-od-charges", async (req, res) => {
  try {
    const now = getFormattedDate(); // current timestamp
    const defaultValues = await getDefaultValues(db);
    // Step 1: Get overdue loan items
    const [loanItems] = await db.query(`
      SELECT Id, Amount, DueDate
        FROM loanitems
        WHERE DueDate < CURDATE()
        AND DATEDIFF(CURDATE(), DueDate) >= 7;
    `);

    let processed = 0;

    for (const loan of loanItems) {
      // Step 2: Calculate overdue days
      const [daysResult] = await db.query(
        `SELECT DATEDIFF(CURDATE(), ?) AS days`,
        [loan.DueDate]
      );

      const days = daysResult[0].days;
      if (days <= 0) continue;

      // Step 3: Get Bounce Charge
      const [bounceRows] = await db.query(
        `SELECT SUM(Amount) AS bounceAmount 
         FROM emientry 
         WHERE EMI = ? AND Type = 'Bounce Charge'`,
        [loan.Id]
      );

      const bounceAmount = bounceRows[0].bounceAmount || 0;

      // Step 4: Total amount
      const totalAmount = Number(loan.Amount) + Number(bounceAmount);

      // Step 5: Calculate OD Charge
      const monthlyRate = defaultValues.odchargerate || 3;
      const dailyRate = monthlyRate / 30 / 100;
      const odAmount = Math.round(
        totalAmount * dailyRate * days /// (30 * 100)
      );
      // Step 6: Check existing OD
      const [existingOD] = await db.query(
        `SELECT Id FROM emientry WHERE EMI = ? AND Type = 'OD Charge'`,
        [loan.Id]
      );

      if (existingOD.length > 0) {
        // ✅ UPDATE
        await db.query(
          `UPDATE emientry 
           SET Amount = ?, 
               DueDays = ?, 
               ModifiedBy = ?, 
               ModifiedDate = ?
           WHERE EMI = ? AND Type = 'OD Charge'`,
          [
            odAmount,
            days,
            null, // ModifiedBy
            now, // ModifiedDate
            loan.Id,
          ]
        );
      } else {
        // ✅ INSERT
        await db.query(
          `INSERT INTO emientry 
           (Id, EMI, Type, Amount, DueDays, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate)
           VALUES (?, ?, 'OD Charge', ?, ?, ?, ?, ?, ?)`,
          [
            generateId(),
            loan.Id,
            odAmount,
            days,
            null, // CreatedBy
            now, // CreatedDate
            null, // ModifiedBy
            now, // ModifiedDate
          ]
        );
      }

      processed++;
    }

    res.json({
      success: true,
      message: "OD charges calculated & updated",
      count: processed,
    });
  } catch (err) {
    console.error("OD Charge Error:", err);
    res.status(500).json({
      success: false,
      message: "Error processing OD charges",
      error: err.message,
    });
  }
});

// ─────────────────────────────────────────────
// 📊 DASHBOARD SUMMARY — GET /api/dashboard/summary?start=&end=
// Returns aggregated loan metrics for a given date range
// ─────────────────────────────────────────────
app.get("/api/dashboard/summary", async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res
      .status(400)
      .json({ error: "start and end query params are required" });
  }

  try {
    const sql = `
      SELECT
        COUNT(*)                                                      AS totalLoans,
        COALESCE(SUM(DisburseAmount), 0)                              AS totalDisbursed,

        SUM(CASE WHEN UMRN IS NOT NULL AND UMRN != '' THEN 1 ELSE 0 END)  AS umrnCreated,
        SUM(CASE WHEN UMRN IS NULL OR UMRN = ''        THEN 1 ELSE 0 END)  AS umrnPending,

        SUM(CASE WHEN UMRNStatus = 'Created'            THEN 1 ELSE 0 END)  AS docsCompleted,
        SUM(CASE WHEN UMRNStatus != 'Created'           THEN 1 ELSE 0 END)  AS docsPending
      FROM loans
      WHERE DATE(AgreementDate) BETWEEN ? AND ?
    `;

    const [rows] = await db.execute(sql, [start, end]);
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("[/api/dashboard/summary] Error:", err);
    return res
      .status(500)
      .json({ error: "Server error fetching dashboard summary" });
  }
});

app.get("/api/get/joindata/loans-with-customers", async (req, res) => {
  const sheetName = req.query.sheetName || "001";

  if (!sheetName) {
    return res.status(400).json({
      success: false,
      message: "sheetName is required",
    });
  }

  try {
    const cs = await getCompanySettings(db);
    const [rows] = await db.query(`
      SELECT l.*, c.FirstName, c.LastName, c.Phone, c.Email
        FROM loans l
        LEFT JOIN customers c ON l.Hirer = c.Id
        ORDER BY l.\`Name\` ASC
    `);
    const finalData = rows.map((loan, index) =>
      transformLoan(loan, cs, sheetName, index + 1)
    );
    res.json({
      success: true,
      data: finalData,
    });
  } catch (error) {
    console.error("Join Data Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

//New
app.get("/api/emis/get", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        e.Id,
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

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Error fetching EMIs:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch EMIs",
    });
  } finally {
    //db.release();
  }
});

app.post("/api/download", async (req, res) => {
  const { loanIds, sheetName } = req.body;

  if (!Array.isArray(loanIds) || !loanIds.length) {
    return res.status(400).json({
      success: false,
      error: "loanIds required",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    const baseName = `289232_MMS_REG_${dd}${mm}${yyyy}_${sheetName}`;
    const filename = `${baseName}.zip`;

    // ===== BUILD ZIP (NO res here)
    const zip = await buildLoanZip({
      connection,
      loanIds,
      sheetName,
      storage,
      getCompanySettings,
      transformLoan,
      loanFields,
      baseName,
    });

    // ===== HEADERS
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Disposition, X-Warnings"
    );

    if (zip.warnings.length) {
      res.setHeader("X-Warnings", JSON.stringify(zip.warnings));
    }

    // ===== STREAM ONLY (KEY CHANGE)
    await zip.stream(res);

    // ===== POST-DOWNLOAD UPDATE
    await connection.query(`UPDATE loans SET UMRNStatus = ? WHERE Id IN (?)`, [
      "Sent to Bank",
      zip.validLoanIds,
    ]);

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error("ZIP generation failed:", err);

    if (!res.headersSent) {
      return res.status(400).json({
        success: false,
        error: err.message,
        warnings: err.warnings || [],
      });
    }

    res.destroy();
  } finally {
    connection.release();
  }
});

//New
app.post("/api/download-emi", async (req, res) => {
  //const { emiIds } = req.body;
  const MODIFIED_BY = "B0wBXE1XjmvxcdLSj9FyQKWC8G33mm";
  const modifiedDate = getFormattedDate();

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { buffer, filename, emiIds } = await buildEmiExcel({ connection });

    await connection.query(
      `
      UPDATE loanitems
      SET Status = 'Sent to Bank',
      ModifiedDate = ?, ModifiedBy = ? 
      WHERE Id IN (?)
      `,
      [modifiedDate, MODIFIED_BY, emiIds]
    );

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Send buffer
    res.send(buffer);

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error("EMI Download failed:", err);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to generate Excel",
      });
    }

    res.destroy();
  } finally {
    connection.release();
  }
});

//New
app.post("/api/emi-response", memoryUpload.single("file"), async (req, res) => {
  const rowErrors = [];
  const MODIFIED_BY = "B0wBXE1XjmvxcdLSj9FyQKWC8G33mm"; // Your hardcoded ID

  try {
    // 1. Initial Validation
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    // 2. Parse Excel (CPU/Memory intensive - No DB connection yet)
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, {
      range: 5,
      defval: "",
      raw: false,
    });

    if (!data.length) {
      return res
        .status(400)
        .json({ success: false, error: "Excel file is empty" });
    }

    const validRows = [];
    let skipped = 0;
    let processed = 0;
    const modifiedDate = getFormattedDate();

    // 3. Data Validation Logic
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const excelRowNum = i + 7; // range: 5 + header row + 1
      const emiId = (row["Other Ref No"] || "").toString().trim();
      const debitStatus = (row["Debit Status"] || "")
        .toString()
        .trim()
        .toUpperCase();
      const reason = (row["Reason"] || "").toString().trim();

      if (!emiId) {
        skipped++;
        rowErrors.push(`Row ${excelRowNum}: Missing Other Ref No`);
        continue;
      }

      if (debitStatus === "SUCCESS") {
        validRows.push({ id: emiId, status: "SUCCESS", reason: null });
        processed++;
      } else if (debitStatus === "REJECTED") {
        // Strict check: skip if rejected but no reason provided
        if (!reason) {
          skipped++;
          rowErrors.push(
            `Row ${excelRowNum}: Reason is required for REJECTED status`
          );
        } else {
          validRows.push({ id: emiId, status: "REJECTED", reason: reason });
          processed++;
        }
      } else {
        skipped++;
        rowErrors.push(`Row ${excelRowNum}: Invalid status "${debitStatus}"`);
      }
    }

    if (validRows.length === 0) {
      return res.json({
        success: true,
        summary: { processed: 0, skipped, errors: rowErrors },
      });
    }

    // 4. Database Transaction (Transaction Locality)
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Bulk Update using CASE (Processing in chunks of 500)
      const CHUNK_SIZE = 500;
      for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
        const chunk = validRows.slice(i, i + CHUNK_SIZE);
        const ids = chunk.map((r) => r.id);

        const statusCases = chunk.map(() => `WHEN id = ? THEN ?`).join(" ");
        const detailCases = chunk.map(() => `WHEN id = ? THEN ?`).join(" ");

        const updateParams = [];
        // Params for Status CASE
        chunk.forEach((r) => updateParams.push(r.id, r.status));
        // Params for StatusDetail CASE
        chunk.forEach((r) => updateParams.push(r.id, r.reason));
        // Params for static fields and WHERE clause
        updateParams.push(modifiedDate, MODIFIED_BY, ...ids);

        await connection.query(
          `
                    UPDATE loanitems
                    SET 
                        Status = CASE ${statusCases} ELSE Status END,
                        StatusDetail = CASE ${detailCases} ELSE StatusDetail END,
                        ModifiedDate = ?,
                        ModifiedBy = ?
                    WHERE id IN (${ids.map(() => "?").join(",")})
                `,
          updateParams
        );

        // Handle Bounce Charges (REJECTED only)
        const rejectedInChunk = chunk.filter((r) => r.status === "REJECTED");
        if (rejectedInChunk.length > 0) {
          const insertSql = `
                        INSERT INTO emientry 
                        (Id, EMI, Type, Amount, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate)
                        VALUES ${rejectedInChunk
                          .map(() => "(?, ?, ?, ?, ?, ?, ?, ?)")
                          .join(", ")}
                    `;

          const insertParams = [];
          for (const row of rejectedInChunk) {
            insertParams.push(
              generateId(), // Assuming this helper exists in your scope
              row.id,
              "EMI Bounce CHG",
              500,
              MODIFIED_BY,
              modifiedDate,
              MODIFIED_BY,
              modifiedDate
            );
          }
          await connection.query(insertSql, insertParams);
        }
      }

      await connection.commit();
      return res.json({
        success: true,
        summary: {
          processed,
          success: validRows.filter((r) => r.status === "SUCCESS").length,
          rejected: validRows.filter((r) => r.status === "REJECTED").length,
          skipped,
          errors: rowErrors,
        },
      });
    } catch (dbErr) {
      await connection.rollback();
      throw dbErr;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("EMI Response Error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: [err.message],
    });
  }
});

app.post("/api/cron/email-zip/:sheetName", async (req, res) => {
  // 1. Secret check (Still in Header for security)
  const cronSecret = req.headers["x-cron-secret"];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // 2. Get sheetName from URL Path
  const { sheetName } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 3. Fetch Pending Loans
    const PENDING = [
      "New",
      "Rejected - Ready to send",
      "Modified - Ready to send",
    ];
    const [loansRaw] = await connection.query(
      "SELECT Id FROM loans WHERE UMRNStatus IN (?) ORDER BY `index` DESC",
      [PENDING]
    );

    if (loansRaw.length === 0) {
      await connection.rollback();
      return res.json({ success: true, message: "No pending loans" });
    }

    const loanIds = loansRaw.map((loan) => loan.Id);

    // 4. Build ZIP
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, "0")}${String(
      today.getMonth() + 1
    ).padStart(2, "0")}${today.getFullYear()}`;
    const baseName = `289232_MMS_REG_${dateStr}_${sheetName}`;

    const zip = await buildLoanZip({
      connection,
      loanIds,
      sheetName,
      storage,
      getCompanySettings,
      transformLoan,
      loanFields,
      baseName,
    });

    const zipBuffer = await zip.toBuffer();

    // 5. SEND EMAIL FIRST (Crucial Change)
    // If this fails, it throws an error and goes straight to the catch block (Rollback)
    const recipientEmail =
      process.env.BANK_EMAIL_RECIPIENT || "rjneniya1415@gmail.com";

    await sendMailSMTP({
      to: recipientEmail,
      subject: `Automated Loan Documents - ${baseName}`,
      text: `Attached is the ZIP file containing ${zip.validLoanIds.length} loans.`,
      attachments: [
        {
          filename: `${baseName}.zip`,
          content: zipBuffer,
          contentType: "application/zip",
        },
      ],
    });

    // 6. UPDATE DATABASE ONLY AFTER EMAIL SUCCESS
    await connection.query(`UPDATE loans SET UMRNStatus = ? WHERE Id IN (?)`, [
      "Sent to Bank",
      zip.validLoanIds,
    ]);

    // 7. Commit changes
    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Emailed ${zip.validLoanIds.length} loans and updated status.`,
    });
  } catch (err) {
    // If Email fails or DB fails, nothing is updated
    await connection.rollback();
    console.error("Cron Job Failed:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    connection.release();
  }
});

//New
app.post("/api/cron/email-emi", async (req, res) => {
  // 1. Auth Check
  const cronSecret = req.headers["x-cron-secret"];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const MODIFIED_BY = "B0wBXE1XjmvxcdLSj9FyQKWC8G33mm";
  const modifiedDate = getFormattedDate();
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Build Excel using our utility
    const { buffer, filename, emiIds } = await buildEmiExcel({ connection });
    const recipientEmail =
      process.env.BANK_EMAIL_RECIPIENT || "rjneniya1415@gmail.com";
    await sendMailSMTP({
      to: recipientEmail,
      subject: `EMI Transaction File - ${filename}`,
      text: `Attached is the EMI transaction sheet containing ${emiIds.length} records.`,
      attachments: [
        {
          filename: filename,
          content: buffer,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    });

    // 3. Update Status only after successful email
    await connection.query(
      `UPDATE loanitems SET Status = 'Sent to Bank', ModifiedDate = ?, ModifiedBy = ? WHERE Id IN (?)`,
      [modifiedDate, MODIFIED_BY, emiIds]
    );

    await connection.commit();
    res.json({
      success: true,
      message: `Emailed ${emiIds.length} EMIs successfully.`,
    });
  } catch (err) {
    await connection.rollback();
    console.error("EMI Cron Failed:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    connection.release();
  }
});
// ─────────────────────────────────────────────
// 📁 Static File Serving
// Uploaded files under /documents are served publicly
// ─────────────────────────────────────────────
app.use("/documents", express.static("documents"));


app.post("/api/refresh", (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});
// // ✅ Safe fallback (NO ERROR)
app.use((req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});
// ─────────────────────────────────────────────
// 🚀 Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
