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
dotenv.config();
const app = express();
app.use(express.json());

// ✅ CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.2.101:5173",
      "http://192.168.2.103:5174",
      "http://192.168.2.103:5173",
      "https://jpfincorp.com",
    ],
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  })
);

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

  const entityRelations = {
    users: {
      user_id:     { table: "users",     columns: ["id", "name", "email"] },
      // dealer_id:   { table: "dealers",   columns: ["id", "name", "phone"] },
      // customer_id: { table: "customers", columns: ["id", "name", "address"] },
    },
  };

  try {
    // ✅ Step 1: Fetch actual columns of the requested table
    const [columnRows] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()`,
      [entityName]
    );

    if (columnRows.length === 0) {
      return sendResponse(res, false, `Table '${entityName}' does not exist`);
    }

    const tableColumns = columnRows.map((r) => r.COLUMN_NAME);

    // ✅ Step 2: Only keep relations where FK column actually exists in the table
    const allRelations = entityRelations[entityName] || {};
    const validRelations = Object.fromEntries(
      Object.entries(allRelations).filter(([fk]) => {
        const exists = tableColumns.includes(fk);
        if (!exists) console.warn(`Skipping FK '${fk}' — not found in '${entityName}'`);
        return exists;
      })
    );

    // Step 3: Build SELECT and JOINs from valid relations only
    const selectParts = [`child.*`];
    const joinParts = [];

    Object.entries(validRelations).forEach(([fk, { table, columns }]) => {
      const alias = table;
      columns.forEach((col) => {
        selectParts.push(`${alias}.${col} AS ${alias}__${col}`);
      });
      joinParts.push(
        `LEFT JOIN \`${table}\` AS \`${alias}\` ON child.\`${fk}\` = \`${alias}\`.id`
      );
    });

    let sql = `SELECT ${selectParts.join(", ")} FROM \`${entityName}\` AS child`;
    if (joinParts.length) sql += ` ${joinParts.join(" ")}`;

    // Step 4: Apply WHERE filters (only on columns that exist)
    const params = [];
    const keys = Object.keys(filters).filter((key) => {
      const exists = tableColumns.includes(key);
      if (!exists) console.warn(`Skipping filter '${key}' — not found in '${entityName}'`);
      return exists;
    });

    if (keys.length > 0) {
      const whereClauses = keys.map((key) => {
        params.push(filters[key]);
        return `child.\`${key}\` = ?`;
      });
      sql += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    const [rows] = await db.query(sql, params);

    // Step 5: Reshape into nested parent objects
    const shaped = rows.map((row) => {
      const result = {};
      Object.entries(row).forEach(([col, val]) => {
        const match = col.match(/^([a-z]+)__(.+)$/);
        if (match) {
          const [, parentAlias, field] = match;
          result[parentAlias] = result[parentAlias] || {};
          result[parentAlias][field] = val;
          // Null out the whole parent if id is null (no related record)
          if (field === "id" && val === null) result[parentAlias] = null;
        } else {
          result[col] = val;
        }
      });
      return result;
    });

    sendResponse(res, true, shaped.length ? "Success" : "No records", shaped);
  } catch (err) {
    console.error("Error:", err);
    sendResponse(res, false, "Database error");
  }
});

/* ============================================================
   🔍 RELATED RECORDS
============================================================ */
app.get("/records/related/:entity/:field/:parentId", async (req, res) => {
  const { entity, field, parentId } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM ?? WHERE ?? = ?", [
      entity,
      field,
      parentId,
    ]);
    sendResponse(res, true, "Success", rows);
  } catch (err) {
    console.error("Error:", err);
    sendResponse(res, false, "Database error");
  }
});

/* ============================================================
   🔎 DETAILS BY ID
============================================================ */
app.get("/details/:entity/:id", async (req, res) => {
  const { entity, id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM ?? WHERE Id = ?", [
      entity,
      id,
    ]);
    rows.length
      ? sendResponse(res, true, "Success", rows[0])
      : sendResponse(res, false, "No record found");
  } catch (err) {
    console.error("Error:", err);
    sendResponse(res, false, "Database error");
  }
});

/* ============================================================
   💰 PRICEBOOK + PRICEBOOKENTRY JOIN
============================================================ */
app.get(
  "/api/fetch/price-book-and-price-book-entry/:dealerId/:modalId",
  async (req, res) => {
    const { dealerId, modalId } = req.params;
    try {
      const query = `
        SELECT 
          pb.Id AS pricebook_id,
          pb.Name AS PricebookName,
          pb.Dealer,
          pb.Product,
          pbe.Id AS pricebookentry_id,
          pbe.Unitprice,
          pbe.Name AS EntryName,
          pbe.Isactive,
          pbe.Pricebook
        FROM pricebook pb
        JOIN pricebookentry pbe 
          ON pb.Id = pbe.Pricebook
        WHERE pb.Dealer = ? AND pbe.Product = ?;
      `;
      const [rows] = await db.query(query, [dealerId, modalId]);
      sendResponse(
        res,
        rows.length > 0,
        rows.length > 0 ? "Success" : "No records found",
        rows
      );
    } catch (err) {
      console.error("Error:", err);
      sendResponse(res, false, "Database error");
    }
  }
);
/* ============================================================
   🔍 RELATED CHILDS
============================================================ */
app.get("/api/related/childs/:entity", async (req, res) => {
  const { entity } = req.params;
  try {
    const [rows] = await db.query(`SELECT 
    table_name AS child_table,
    column_name AS child_column,
    constraint_name
FROM information_schema.KEY_COLUMN_USAGE
WHERE referenced_table_name = ${entity}
  AND referenced_column_name = 'id';`);
    sendResponse(res, true, "Success", rows);
  } catch (err) {
    console.error("Error:", err);
    sendResponse(res, false, "Database error");
  }
});
/* ============================================================
   ❌ DELETE RECORD
============================================================ */
app.delete("/delete/:entity/:id", async (req, res) => {
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

// ✅ Dealer Insert
app.post("/api/dealer/insert", (req, res) => {
  const fields = [
    "Id",
    "Name",
    "Phone",
    "Email",
    "Country",
    "State",
    "District",
    "PinCode",
    "Street",
    "OwnerName",
  ];
  insertRecord(
    res,
    "dealers",
    fields,
    fields.map((f) => req.body[f])
  );
});

// ✅ Customer Insert
app.post("/api/customers/insert", (req, res) => {
  const fields = [
    "Id",
    "FirstName",
    "LastName",
    "Email",
    "Phone",
    "Country",
    "State",
    "District",
    "PinCode",
    "Street",
    "Dealer",
    "Type",
    "DateOfBirth",
  ];
  insertRecord(
    res,
    "customers",
    fields,
    fields.map((f) => req.body[f])
  );
});

// ✅ Brand Insert
app.post("/api/brands/insert", (req, res) => {
  const fields = ["Id", "Name", "Description"];
  insertRecord(
    res,
    "brands",
    fields,
    fields.map((f) => req.body[f])
  );
});

// ✅ Product Insert
app.post("/api/products/insert", (req, res) => {
  const fields = [
    "Id",
    "Name",
    "Code",
    "CCPower",
    "ModelMonth",
    "ModelYear",
    "Description",
    "BrandId",
  ];
  insertRecord(
    res,
    "products",
    fields,
    fields.map((f) => req.body[f])
  );
});

// ✅ Pricebook Insert
app.post("/api/pricebook/insert", (req, res) => {
  const fields = ["Id", "Dealer"];
  insertRecord(
    res,
    "pricebook",
    fields,
    fields.map((f) => req.body[f])
  );
});

// ✅ PricebookEntry Insert
app.post("/api/pricebookentry/insert", (req, res) => {
  const fields = ["Id", "Pricebook", "Isactive", "Unitprice", "Product"];
  insertRecord(
    res,
    "pricebookentry",
    fields,
    fields.map((f) => req.body[f])
  );
});

// ✅ Loan Insert
app.post("/api/loans/insert", (req, res) => {
  const fields = [
    "Id",
    "Dealer",
    "Agent",
    "DealerFileNumber",
    "ConditionType",
    "Model",
    "ModelMonth",
    "ModelYear",
    "CCPower",
    "InsuranceType",
    "ChasisNo",
    "EngineNo",
    "RegistrationNo",
    "Color",
    "TotalPrice",
    "DownPayment",
    "DisburseAmount",
    "RateOfInterest",
    "Tenure",
    "EMIAmount",
    "RemainingAmountWithInterest",
    "FileCharge",
    "RTOCharge",
    "DealerComission",
    "AgentComission",
    "AgreementDate",
    "FirstAutoDebitDate",
    "EMIStartDate",
    "EMIEndDate",
    "PaymentOptions",
    "Hirer",
    "Guarantor",
    "Referrer1",
    "Referrer2",
    "NOCDate",
    "BillNo",
    "RCNo",
    "KeyNo",
    "InsurancePolicyNo",
    "InsuranceCompanyName",
    "CustomerBankName",
    "BankIFSC",
    "BankMICR",
    "BankAccountNumber",
    "BankBranchName",
    "AccountType",
    "CustomerBankPhoneNumber",
    "NumberOfCheques",
    "ChequeNumber1",
    "ChequeNumber2",
    "ChequeNumber3",
    "ChequeNumber4",
    "ChequeNumber5",
    "Description",
  ];
  insertRecord(
    res,
    "loans",
    fields,
    fields.map((f) => req.body[f])
  );
});

// ✅ Bulk Loan Items Insert
app.post("/api/loanitems/insert", async (req, res) => {
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
