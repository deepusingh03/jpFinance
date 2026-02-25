import React from "react";
import CustomNavbar from "../components/CustomNavbar";
import Dashboard from "./Dashboard";

function HomePage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <CustomNavbar />
        <Dashboard />
    </div>
  );
}

export default HomePage;
