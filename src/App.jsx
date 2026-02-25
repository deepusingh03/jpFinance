import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DealerPage from "./pages/DealerPage";
import HomePage from "./pages/HomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import EntityDetailData from "./components/EntityDetailData";
import CustomerPage from "./pages/CustomerPage";
import BrandPage from "./pages/BrandsPage";
import ProductPage from "./pages/ProductPage";
import LoanPage from "./pages/LoanPage";
import LaonPortal from "./pages/LoanList";
import BankResponseUpload from "./pages/BankResponseUpload";
import { ToastContainer } from "react-toastify";
import ViewProfile from "./pages/ViewProfile";
import Users from "./pages/Users";
import CompanyInformation from "./pages/CompanyInformation";
import EMIBankResponseUpload from "./pages/EMI_Response";
import SettingsPage from "./pages/SettingsPage";
import CustomerBanks from "./SettingComponets/CustomerBanks";
import InsuranceCompanies from "./SettingComponets/InsuranceCompanies";
import TaskManager from "./testing/TaskManager";
import VideoCallInterface from "./testing/VideoCallInterface";
import { UserProvider } from "./context/UserContext";
import LoanDefaultValues from "./SettingComponets/LoanDefaultValues";
import EMIPage from "./pages/EMIPage";

function App() {
  return (
    <>
      {/* Wrap entire app with UserProvider */}
      <UserProvider>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <Routes>
          {/* Public route - no UserProvider needed here */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* All protected routes will have access to UserContext */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dealers"
            element={
              <ProtectedRoute>
                <DealerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/brands"
            element={
              <ProtectedRoute>
                <BrandPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <ProductPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans"
            element={
              <ProtectedRoute>
                <LoanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:entityType/detail/:id/view"
            element={
              <ProtectedRoute>
                <EntityDetailData />
              </ProtectedRoute>
            }
          />

          <Route
            path="/details/childs/:entityType/:id/view"
            element={
              <ProtectedRoute>
                <EntityDetailData key={window.location.pathname} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ViewProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/customer-banks"
            element={
              <ProtectedRoute>
                <CustomerBanks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/insurance"
            element={
              <ProtectedRoute>
                <InsuranceCompanies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/ecs"
            element={
              <ProtectedRoute>
                <CompanyInformation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/loan-defaults"
            element={
              <ProtectedRoute>
                <LoanDefaultValues />
              </ProtectedRoute>
            }
          />
LoanDefaultValues
          <Route
            path="/setting"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/loans"
            element={
              <ProtectedRoute>
                <LaonPortal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portal/bank-response"
            element={
              <ProtectedRoute>
                <BankResponseUpload />
              </ProtectedRoute>
            }
          />
           <Route
            path="/portal/emis"
            element={
              <ProtectedRoute>
                <EMIPage/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/portal/emi-bank-response"
            element={
              <ProtectedRoute>
                <EMIBankResponseUpload />
              </ProtectedRoute>
            }
          />
          
          {/* Testing routes - optionally protect these too */}
          <Route
            path="/vcall"
            element={
              <ProtectedRoute>
                <VideoCallInterface />
              </ProtectedRoute>
            }
          />

          {/* Optional: Add a 404 route */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <div className="container text-center mt-5">
                  <h1>404 - Page Not Found</h1>
                  <p>The page you're looking for doesn't exist.</p>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </UserProvider>
    </>
  );
}

export default App;