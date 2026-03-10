import { format } from "date-fns";
import { apiData } from "./api";
export const helperMethods = {
  formatDate(dateString) {
    if (!dateString) return "";
    return dateString.split("T")[0]; // safest for ISO strings
  },
  fetchUser() {
    const user = JSON.parse(localStorage.getItem("userData"));
    if (user && user.user && user.user.Id) {
      return user.user.Id;
    }
    return null;
  },
  async fetchUserDetails (){
    const user = JSON.parse(localStorage.getItem("userData"));
    if (!user || !user.user || !user.user.Id) return;
    console.log('user ::',user);
    const response = await fetch(`${apiData.PORT}/api/get/users?Id=${user.user.Id}`);
    const responseResult = await response.json();
    if(!responseResult.success || !responseResult.data )return
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
  handleDateFormat(value){
    if(value){
      if(value.toString().includes('T05:00:00.000Z') || value.toString().includes('00:00.000Z')){
        return format(new Date(value), "dd/MM/yyyy");
      }
      return value
    }else{
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
   getUserName(field,data){
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
        Name: ` ${data?.agent_firstname || ""} ${data?.agent_lastname || ""}`.trim(),
        Entity: "customers",
      };
    }
    if (f === "hirer") {
      return {
        Id: value,
        Name: ` ${data?.hirer_firstname || ""} ${data?.hirer_lastname || ""}`.trim(),
        Entity: "customers",
      };
    }
    if (f === "guarantor") {
      return {
        Id: value,
        Name: ` ${data?.guarantor_firstname || ""} ${data?.guarantor_lastname || ""}`.trim(),
        Entity: "customers",
      };
    }
    if (f === "referrer1") {
      return {
        Id: value,
        Name: ` ${data?.referrer1_firstname || ""} ${data?.referrer1_lastname || ""}`.trim(),
        Entity: "customers",
      };
    }
    if (f === "referrer2") {
      return {
        Id: value,
        Name: ` ${data?.referrer2_firstname || ""} ${data?.referrer2_lastname || ""}`.trim(),
        Entity: "customers",
      };
    }

    if (f === "model") {
      return {
        Id: value,
        Name: ` ${data?.products__Product.Name || ""}`.trim(),
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
  
};
