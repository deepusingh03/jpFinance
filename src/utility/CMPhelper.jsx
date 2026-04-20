import { format } from "date-fns";
import { apiData } from "./api";
export const helperMethods = {
  formatDate(dateString) {
    if (!dateString) return "";
    return dateString.split("T")[0]; // safest for ISO strings
  },
  fetchUser() {
    const user = JSON.parse(localStorage.getItem("userData"));
    return [user?.user?.Id, user?.Id].find(Boolean) || null;
  },
  async fetchUserDetails() {
    const user = JSON.parse(localStorage.getItem("userData"));
    const token = localStorage.getItem("accessToken");
    const uId = user?.Id || user?.user?.Id;

    if (!uId) {
      console.error("User ID not found");
      return;
    }
    const response = await fetch(`${apiData.PORT}/api/get/users?Id=${uId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const responseResult = await response.json();
    if (!responseResult?.success || !responseResult?.data) return;

    return responseResult.data[0];
  },
  dateToString() {
    const date = new Date();
    const options = {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleString("en-GB", options).replace(" at ", ", ");
  },
  handleDateFormat(value) {
    if (value) {
      if (
        value.toString().includes("T05:00:00.000Z") ||
        value.toString().includes("00:00.000Z")
      ) {
        return format(new Date(value), "dd/MM/yyyy");
      }
      return value;
    } else {
      return null;
    }
  },
  generateId(length = 30) {
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
  },
  getUserName(field, data) {
    const value = data?.[field];
    if (!value) return null;

    const f = field.toLowerCase();
    if (f === "createdby") {
      return {
        Id: value,
        Name: `${data?.users__CreatedBy.FirstName || ""} ${
          data?.users__CreatedBy.LastName || ""
        }`.trim(),
        Entity: "users",
      };
    }
    if (f === "modifiedby") {
      return {
        Id: value,
        Name: `${data?.users__ModifiedBy.FirstName || ""} ${
          data?.users__ModifiedBy.LastName || ""
        }`.trim(),
        Entity: "users",
      };
    }
    if (f === "dealer") {
      return {
        Id: value,
        Name: ` ${data?.dealers__Dealer.Name || ""}`.trim(),
        Entity: "dealers",
      };
    }
    if (f === "brand") {
      return {
        Id: value,
        Name: ` ${data?.brands__Brand.Name || ""}`.trim(),
        Entity: "brands",
      };
    }

    if (f === "agent") {
      return {
        Id: value,
        Name: ` ${data?.customers__Agent.FirstName || ""} ${
          data?.customers__Agent.LastName || ""
        }`.trim(),
        Entity: "customers",
      };
    }
    if (f === "hirer") {
      return {
        Id: value,
        Name: ` ${data?.customers__Hirer.FirstName || ""} ${
          data?.customers__Hirer.LastName || ""
        }`.trim(),
        Entity: "customers",
      };
    }
    if (f === "guarantor") {
      return {
        Id: value,
        Name: ` ${data?.customers__Guarantor.FirstName || ""} ${
          data?.customers__Guarantor.LastName || ""
        }`.trim(),
        Entity: "customers",
      };
    }
    if (f === "referrer1") {
      return {
        Id: value,
        Name: ` ${data?.customers__Referrer1.FirstName || ""} ${
          data?.customers__Referrer1.LastName || ""
        }`.trim(),
        Entity: "customers",
      };
    }
    if (f === "referrer2") {
      return {
        Id: value,
        Name: ` ${data?.customers__Referrer2.FirstName || ""} ${
          data?.customers__Referrer2.LastName || ""
        }`.trim(),
        Entity: "customers",
      };
    }

    if (f === "model") {
      return {
        Id: value,
        Name: ` ${data?.products__Model.Name || ""}`.trim(),
        Entity: "products",
      };
    }
    if (f === "loan") {
      return {
        Id: value,
        Name: ` ${data?.loan_Name || ""}`.trim(),
        Entity: "loans",
      };
    }

    if (f === "product") {
      return {
        Id: value,
        Name: ` ${data?.products__Product.Name || ""}`.trim(),
        Entity: "products",
      };
    }
    if (f === "pricebook") {
      return {
        Id: value,
        Name: ` ${data?.pricebook_Name || ""}`.trim(),
        Entity: "pricebook",
      };
    }
    return null;
  },
  async getDefaultValues() {
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
    return formattedObject;
  },

  async getEntityDetails(entityName) {
    try {
      const token = localStorage.getItem("accessToken");

      const res = await fetch(`${apiData.PORT}/api/get/${entityName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("userData");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("accessToken");
        window.location.href = "/";
        throw new Error("Session expired");
      }

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await res.json();
      return data.data || [];
    } catch (error) {
      console.error("API Error:", error.message);
      return [];
    }
  },
   formatCurrency(amount){
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  },
   toDateInputFormat(dateStr){
    const d = new Date(dateStr);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().split("T")[0];
  },
};
