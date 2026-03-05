// server/server.js
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import bcrypt from "bcrypt";
import validator from "validator";
import { objectFields, auditFields,updateAuditFields } from "./fieldsHelper.js";

dotenv.config();
const app = express();
app.use(express.json());

// ✅ CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.2.101:5173",
      "http://192.168.2.102:5174",
      "http://192.168.2.103:5173",
      "http://192.168.2.104:5173",
      "https://jpfincorp.com",
    ],
    methods: ["GET", "POST", "DELETE","PUT"],
    credentials: true,
  })
);
const SENSITIVE_FIELDS = [
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
  "secret"
];

// ✅ MySQL connection pool
const db = mysql.createPool({
  host: "localhost",
  user:  "root",
  password: "",
  database: "jpfinance",
});

// ✅ Unified response helper
const sendResponse = (res, success, message, data = null) => {
  res.status(success ? 200 : 400).json({ success, message, data });
};

// ✅ Root folder for uploaded files
// eslint-disable-next-line no-undef
const rootFolder = path.join(process.cwd(), "documents");
if (!fs.existsSync(rootFolder)) fs.mkdirSync(rootFolder, { recursive: true });

// ✅ Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { LoanName } = req.body;
    const dir = path.join("documents", LoanName || "misc");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
export const upload = multer({ storage });

/* ============================================================
   🔐 LOGIN
============================================================ */

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return sendResponse(res, false, "Email and password are required");
  }

  // Email format validation
  if (!validator.isEmail(email)) {
    return sendResponse(res, false, "Invalid email format");
  }

  // Password length validation (minimum 8 characters)
  if (password.length < 8) {
    return sendResponse(res, false, "Password must be at least 8 characters long");
  }

  try {
    // Get user by email only (not with password)
    const [rows] = await db.query(
      "SELECT * FROM users WHERE Email = ?",
      [email]
    );

    if (rows.length === 0) {
      // Use generic message to prevent user enumeration
      return sendResponse(res, false, "Invalid email or password");
    }

    const user = rows[0];
    
    // Compare provided password with hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.Password);

    if (!isPasswordValid) {
      return sendResponse(res, false, "Invalid email or password");
    }

    // Remove sensitive data before sending response
    const { Password, ...userWithoutPassword } = user;
    
    // Generate JWT token for authentication (optional but recommended)
    // const token = jwt.sign({ userId: user.id, email: user.Email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return sendResponse(res, true, "Login successful", {
      user: userWithoutPassword,
      // token: token // Include if using JWT
    });

  } catch (err) {
    console.error("Login error:", err);
    return sendResponse(res, false, "An error occurred during login. Please try again.");
  }
});

/* ============================================================
   🧾 GENERIC GET with optional filters
   Example: /api/get/customers?Country=USA&State=CA
============================================================ */
app.get("/api/get/:entityName", async (req, res) => {
  const { entityName } = req.params;
  const filters = req.query;

  // ✅ Validate table name
  if (!/^[a-zA-Z0-9_]+$/.test(entityName)) {
    return sendResponse(res, false, "Invalid table name");
  }

  try {
    // Step 0: Ensure table exists
    if (!(await tableExists(db, entityName))) {
      return sendResponse(res, false, `Table '${entityName}' does not exist`);
    }

    // Step 1: Discover foreign keys
    const [fkRows] = await db.query(
      `
      SELECT 
        kcu.COLUMN_NAME AS fk_column,
        kcu.REFERENCED_TABLE_NAME AS parent_table,
        kcu.REFERENCED_COLUMN_NAME AS parent_column
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
      JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
       AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA
      WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND kcu.TABLE_NAME = ?
        AND kcu.TABLE_SCHEMA = DATABASE()
      `,
      [entityName]
    );

    // Step 2: Load parent table columns (excluding sensitive)
    const relations = {};
    for (const { fk_column, parent_table, parent_column } of fkRows) {
      const [parentCols] = await db.query(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ?
          AND TABLE_SCHEMA = DATABASE()
        `,
        [parent_table]
      );

      relations[fk_column] = {
        table: parent_table,
        refColumn: parent_column,
        columns: parentCols
          .map(c => c.COLUMN_NAME)
          .filter(c => !SENSITIVE_FIELDS.includes(c.toLowerCase()))
      };
    }

    // Step 3: Build SELECT & JOINs
    const selectParts = ["child.*"];
    const joinParts = [];

    Object.entries(relations).forEach(([fk, meta]) => {
      const { table, refColumn, columns } = meta;
      const alias = `${table}__${fk}`;

      columns.forEach(col => {
        selectParts.push(
          `\`${alias}\`.\`${col}\` AS \`${alias}__${col}\``
        );
      });

      joinParts.push(
        `LEFT JOIN \`${table}\` AS \`${alias}\`
         ON child.\`${fk}\` = \`${alias}\`.\`${refColumn}\``
      );
    });

    let sql = `
      SELECT ${selectParts.join(", ")}
      FROM \`${entityName}\` AS child
    `;
    if (joinParts.length) sql += " " + joinParts.join(" ");

    // Step 4: WHERE filters (non-sensitive only)
    const [colRows] = await db.query(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = ?
        AND TABLE_SCHEMA = DATABASE()
      `,
      [entityName]
    );

    const tableColumns = colRows
      .map(r => r.COLUMN_NAME)
      .filter(c => !SENSITIVE_FIELDS.includes(c.toLowerCase()));

    const params = [];
    const validFilters = Object.keys(filters).filter(k =>
      tableColumns.includes(k)
    );

    if (validFilters.length) {
      sql +=
        " WHERE " +
        validFilters
          .map(k => {
            params.push(filters[k]);
            return `child.\`${k}\` = ?`;
          })
          .join(" AND ");
    }

    // Step 5: Execute query
    const [rows] = await db.query(sql, params);

    // Step 6: Reshape flat rows → nested objects
    const shaped = rows.map(row => {
      const result = {};

      Object.entries(row).forEach(([key, value]) => {
        const match = key.match(/^(.+?)__([^_]+)$/);

        if (match) {
          const [, parentAlias, field] = match;
          if (!result[parentAlias]) result[parentAlias] = {};
          result[parentAlias][field] = value;

          if (field === "id" && value === null) {
            result[parentAlias] = null;
          }
        } else {
          result[key] = value;
        }
      });

      return result;
    });

    sendResponse(
      res,
      true,
      shaped.length ? "Success" : "No records",
      shaped
    );
  } catch (err) {
    console.error("DB Error:", err);
    sendResponse(res, false, "Database error");
  }
});

// ✅ Helper: Table existence
async function tableExists(db, tableName) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = ?
      AND TABLE_SCHEMA = DATABASE()
    `,
    [tableName]
  );

  return rows[0].count > 0;
}
/* ============================================================
   🔍 RELATED RECORDS
============================================================ */
// app.get("/records/related/:entity/:field/:parentId", async (req, res) => {
//   const { entity, field, parentId } = req.params;
//   try {
//     const [rows] = await db.query("SELECT * FROM ?? WHERE ?? = ?", [
//       entity,
//       field,
//       parentId,
//     ]);
//     sendResponse(res, true, "Success", rows);
//   } catch (err) {
//     console.error("Error:", err);
//     sendResponse(res, false, "Database error");
//   }
// });

/* ============================================================
   🔎 DETAILS BY ID
============================================================ */
// app.get("/details/:entity/:id", async (req, res) => {
//   const { entity, id } = req.params;
//   try {
//     const [rows] = await db.query("SELECT * FROM ?? WHERE Id = ?", [
//       entity,
//       id,
//     ]);
//     rows.length
//       ? sendResponse(res, true, "Success", rows[0])
//       : sendResponse(res, false, "No record found");
//   } catch (err) {
//     console.error("Error:", err);
//     sendResponse(res, false, "Database error");
//   }
// });

/* ============================================================
   💰 PRICEBOOK + PRICEBOOKENTRY JOIN
============================================================ */
// app.get(
//   "/api/fetch/price-book-and-price-book-entry/:dealerId/:modalId",
//   async (req, res) => {
//     const { dealerId, modalId } = req.params;
//     try {
//       const query = `
//         SELECT 
//           pb.Id AS pricebook_id,
//           pb.Name AS PricebookName,
//           pb.Dealer,
//           pb.Product,
//           pbe.Id AS pricebookentry_id,
//           pbe.Unitprice,
//           pbe.Name AS EntryName,
//           pbe.Isactive,
//           pbe.Pricebook
//         FROM pricebook pb
//         JOIN pricebookentry pbe 
//           ON pb.Id = pbe.Pricebook
//         WHERE pb.Dealer = ? AND pbe.Product = ?;
//       `;
//       const [rows] = await db.query(query, [dealerId, modalId]);
//       sendResponse(
//         res,
//         rows.length > 0,
//         rows.length > 0 ? "Success" : "No records found",
//         rows
//       );
//     } catch (err) {
//       console.error("Error:", err);
//       sendResponse(res, false, "Database error");
//     }
//   }
// );
/* ============================================================
   🔍 RELATED CHILDS
============================================================ */
app.get("/api/related/childs/:entity", async (req, res) => {
  const { entity } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        table_name AS child_table,
        column_name AS child_column,
        constraint_name
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE referenced_table_name = ?
        AND referenced_column_name = 'id'`,
      [entity]  // Pass entity as parameter - MySQL will properly quote it
    );
    sendResponse(res, true, "Success", rows);
  } catch (err) {
    console.error("Error:", err);
    sendResponse(res, false, "Database error");
  }
});
/* ============================================================
   ❌ DELETE RECORD
============================================================ */
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
    console.error("Error:", err);
    sendResponse(res, false, "Database error");
  }
});

/* ============================================================
   🧱 INSERT HELPERS
============================================================ */
const insertRecord = async (res, table, fields, values) => {
  try {
    const placeholders = fields.map(() => "?").join(", ");
    const query = `INSERT INTO ${table} (${fields.join(
      ", "
    )}) VALUES (${placeholders})`;
    const [result] = await db.query(query, values);
    sendResponse(res, true, "Record inserted successfully", {
      id: result.insertId,
    });
  } catch (err) {
    console.error(`Error inserting into ${table}:`, err);
    sendResponse(res, false, err.message || "Insert failed");
  }
};

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
    console.error(`Error updating ${table}:`, err);
    sendResponse(res, false, err.message || "Update failed");
  }
};

app.post("/api/:entity/insert", (req, res) => {
  const { entity } = req.params;

  const baseFields = objectFields[entity];
  if (!baseFields) {
    return res.status(400).json({ error: "Invalid entity" });
  }

  const fields = [...baseFields, ...auditFields];

  insertRecord(
    res,
    entity,
    fields,
    fields.map((f) => req.body[f])
  );
});


app.put("/api/:entity/update", (req, res) => {
  const { entity} = req.params;

  const baseFields = objectFields[entity];
  if (!baseFields) {
    return res.status(400).json({ error: "Invalid entity" });
  }

  const fields = [...baseFields, ...updateAuditFields];

  updateRecord(
    res,
    entity,
    fields,
    fields.map((f) => req.body[f]),
    req.body['Id']
  );
});
// ✅ Bulk Loan Items Insert
app.post("/api/child/loanitems/insert", async (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records) || records.length === 0)
      return sendResponse(res, false, "Invalid data format");

    const fields = ["Id", "Amount", "Loan", "DueDate", "Status"];
    const placeholders = records
      .map(() => "(" + fields.map(() => "?").join(", ") + ")")
      .join(", ");
    const values = records.flatMap((r) => fields.map((f) => r[f]));

    const query = `INSERT INTO loanitems (${fields.join(
      ", "
    )}) VALUES ${placeholders}`;
    await db.query(query, values);
    sendResponse(res, true, "All records inserted successfully");
  } catch (err) {
    console.error("Error inserting loanitems:", err);
    sendResponse(res, false, "Database insert failed");
  }
});

/* ============================================================
   📁 DOCUMENT UPLOAD
============================================================ */
app.post("/api/documents/upload", upload.any(), async (req, res) => {
  try {
    const { LoanName, ParentId, fileIds } = req.body;
    const files = req.files;

    if (!LoanName || !files?.length)
      return sendResponse(res, false, "Missing LoanName or no files uploaded");

    const fileIdMap = JSON.parse(fileIds || "{}");
    const insertQuery = `
      INSERT INTO documents (Id, Name, Link, Size, ParentId)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const file of files) {
      const Id = fileIdMap[file.fieldname] || Date.now().toString();
      const Name = file.originalname;
      const Link = `${LoanName}/${file.originalname}`;
      const Size = file.size;
      await db.query(insertQuery, [Id, Name, Link, Size, ParentId]);
    }

    sendResponse(res, true, "Files uploaded successfully");
  } catch (err) {
    console.error("Upload error:", err);
    sendResponse(res, false, "Upload failed");
  }
});

/* ============================================================
   📂 Static File Serving
============================================================ */
app.use("/documents", express.static("documents"));

/* ============================================================
   🚀 Server Start
============================================================ */
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
