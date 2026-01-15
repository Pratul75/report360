import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import "@/App.css";

import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import ClientCreate from "@/pages/ClientCreate";
import ClientDetails from "@/pages/ClientDetails";
import Projects from "@/pages/Projects";
import ProjectDetails from "@/pages/ProjectDetails";
import Campaigns from "@/pages/Campaigns";
import CampaignDetails from "@/pages/CampaignDetails";
import CampaignCreate from "@/pages/CampaignCreate";
import ProjectCreate from "@/pages/ProjectCreate";
import VendorCreate from "@/pages/VendorCreate";
import VendorDetails from "@/pages/VendorDetails";
import VehicleCreate from "@/pages/VehicleCreate";
import VehicleDetails from "@/pages/VehicleDetails";
import DriverCreate from "@/pages/DriverCreate";
import DriverDetails from "@/pages/DriverDetails";
import PromoterCreate from "@/pages/PromoterCreate";
import PromoterDetails from "@/pages/PromoterDetails";
import PromoterActivities from "@/pages/PromoterActivities";
import PromoterActivityForm from "@/pages/PromoterActivityForm";
import PromoterActivityDetails from "@/pages/PromoterActivityDetails";
import ExpenseCreate from "@/pages/ExpenseCreate";
import Vendors from "@/pages/Vendors";
import Vehicles from "@/pages/Vehicles";
import Drivers from "@/pages/Drivers";
import Promoters from "@/pages/Promoters";
import Operations from "@/pages/Operations";
import Expenses from "@/pages/Expenses";
import ExpenseDetails from "@/pages/ExpenseDetails";
import Reports from "@/pages/Reports";
import ReportCreate from "@/pages/ReportCreate";
import ReportDetails from "@/pages/ReportDetails";
import VendorDashboard from "@/pages/VendorDashboard";
import ClientServicingDashboard from "@/pages/ClientServicingDashboard";
import DriverDashboard from "@/pages/DriverDashboard";
import JourneyDetails from "@/pages/JourneyDetails";
import InvoiceUpload from "@/pages/InvoiceUpload";
import InvoiceDetails from "@/pages/InvoiceDetails";
import PaymentDetails from "@/pages/PaymentDetails";
import Accounts from "@/pages/Accounts";
import Analytics from "@/pages/Analytics";
import WelcomePage from "@/pages/WelcomePage";
import MLInsights from "@/pages/MLInsights";
import Settings from "@/pages/Settings";
import UserManagement from "@/pages/UserManagement";
import UserRegistration from "@/pages/UserRegistration";
import RolesPermissions from "@/pages/RolesPermissions";
import MasterData from "@/pages/MasterData";
import MasterDataManagement from "@/pages/MasterDataManagement";
import SystemConfiguration from "@/pages/SystemConfiguration";
import Godowns from "@/pages/Godowns";
import GodownInventory from "@/pages/GodownInventory";
import ForbiddenPage from "@/pages/ForbiddenPage";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            
            {/* Welcome Page - for users without specific dashboard */}
            <Route path="welcome" element={<WelcomePage />} />
            
            {/* Vendor Dashboard - for vendor role */}
            <Route path="vendor-dashboard" element={<VendorDashboard />} />
            
            {/* Client Servicing Dashboard - for client_servicing and admin roles */}
            <Route path="client-servicing-dashboard" element={<ClientServicingDashboard />} />
            
            {/* Driver Dashboard - for driver, operations_manager and admin roles */}
            <Route path="driver-dashboard" element={<DriverDashboard />} />
            
            {/* Journey Details - for driver, operations_manager and admin roles */}
            <Route path="journey/:driverId/:date" element={<JourneyDetails />} />
            <Route path="journey/me/:date" element={<JourneyDetails />} />
            
            <Route path="invoices/new" element={<InvoiceUpload />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="payments/:id" element={<PaymentDetails />} />
            
            {/* Clients - require client.read permission */}
            <Route path="clients" element={
              <ProtectedRoute requiredPermission="client.read">
                <Clients />
              </ProtectedRoute>
            } />
            <Route path="clients/new" element={
              <ProtectedRoute requiredPermission="client.create">
                <ClientCreate />
              </ProtectedRoute>
            } />
            <Route path="clients/:id" element={
              <ProtectedRoute requiredPermission="client.read">
                <ClientDetails />
              </ProtectedRoute>
            } />
            <Route path="clients/:id/edit" element={
              <ProtectedRoute requiredPermission="client.update">
                <ClientCreate />
              </ProtectedRoute>
            } />
            
            {/* Projects - require project.read permission */}
            <Route path="projects" element={
              <ProtectedRoute requiredPermission="project.read">
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="projects/new" element={
              <ProtectedRoute requiredPermission="project.create">
                <ProjectCreate />
              </ProtectedRoute>
            } />
            <Route path="projects/:id" element={
              <ProtectedRoute requiredPermission="project.read">
                <ProjectDetails />
              </ProtectedRoute>
            } />
            <Route path="projects/:id/edit" element={
              <ProtectedRoute requiredPermission="project.update">
                <ProjectCreate />
              </ProtectedRoute>
            } />
            
            {/* Campaigns - require campaign.read permission */}
            <Route path="campaigns" element={
              <ProtectedRoute requiredPermission="campaign.read">
                <Campaigns />
              </ProtectedRoute>
            } />
            <Route path="campaigns/new" element={
              <ProtectedRoute requiredPermission="campaign.create">
                <CampaignCreate />
              </ProtectedRoute>
            } />
            <Route path="campaigns/:id" element={
              <ProtectedRoute requiredPermission="campaign.read">
                <CampaignDetails />
              </ProtectedRoute>
            } />
            <Route path="campaigns/:id/edit" element={
              <ProtectedRoute requiredPermission="campaign.update">
                <CampaignCreate />
              </ProtectedRoute>
            } />
            
            {/* Vendors */}
            <Route path="vendors" element={
              <ProtectedRoute requiredPermission="vendor.read">
                <Vendors />
              </ProtectedRoute>
            } />
            <Route path="vendors/new" element={
              <ProtectedRoute requiredPermission="vendor.create">
                <VendorCreate />
              </ProtectedRoute>
            } />
            <Route path="vendors/:id" element={
              <ProtectedRoute requiredPermission="vendor.read">
                <VendorDetails />
              </ProtectedRoute>
            } />
            <Route path="vendors/:id/edit" element={
              <ProtectedRoute requiredPermission="vendor.update">
                <VendorCreate />
              </ProtectedRoute>
            } />
            
            {/* Vehicles */}
            <Route path="vehicles" element={
              <ProtectedRoute requiredPermission="vehicle.read">
                <Vehicles />
              </ProtectedRoute>
            } />
            <Route path="vehicles/new" element={
              <ProtectedRoute requiredPermission="vehicle.create">
                <VehicleCreate />
              </ProtectedRoute>
            } />
            <Route path="vehicles/:id" element={
              <ProtectedRoute requiredPermission="vehicle.read">
                <VehicleDetails />
              </ProtectedRoute>
            } />
            <Route path="vehicles/:id/edit" element={
              <ProtectedRoute requiredPermission="vehicle.update">
                <VehicleCreate />
              </ProtectedRoute>
            } />
            
            {/* Drivers */}
            <Route path="drivers" element={
              <ProtectedRoute requiredPermission="driver.read">
                <Drivers />
              </ProtectedRoute>
            } />
            <Route path="drivers/new" element={
              <ProtectedRoute requiredPermission="driver.create">
                <DriverCreate />
              </ProtectedRoute>
            } />
            <Route path="drivers/:id" element={
              <ProtectedRoute requiredPermission="driver.read">
                <DriverDetails />
              </ProtectedRoute>
            } />
            <Route path="drivers/:id/edit" element={
              <ProtectedRoute requiredPermission="driver.update">
                <DriverCreate />
              </ProtectedRoute>
            } />
            
            {/* Promoters */}
            <Route path="promoters" element={
              <ProtectedRoute requiredPermission="promoter.read">
                <Promoters />
              </ProtectedRoute>
            } />
            <Route path="promoters/new" element={
              <ProtectedRoute requiredPermission="promoter.create">
                <PromoterCreate />
              </ProtectedRoute>
            } />
            <Route path="promoters/:id" element={
              <ProtectedRoute requiredPermission="promoter.read">
                <PromoterDetails />
              </ProtectedRoute>
            } />
            <Route path="promoters/:id/edit" element={
              <ProtectedRoute requiredPermission="promoter.update">
                <PromoterCreate />
              </ProtectedRoute>
            } />
                        {/* Promoter Activities - Promoters can only view and create, Admin can edit */}
            <Route path="promoter-activities" element={
              <ProtectedRoute>
                <PromoterActivities />
              </ProtectedRoute>
            } />
            <Route path="promoter-activities/new" element={
              <ProtectedRoute>
                <PromoterActivityForm />
              </ProtectedRoute>
            } />
            <Route path="promoter-activities/:id" element={
              <ProtectedRoute>
                <PromoterActivityDetails />
              </ProtectedRoute>
            } />
            <Route path="promoter-activities/:id/edit" element={
              <AdminRoute>
                <PromoterActivityForm />
              </AdminRoute>
            } />
                        {/* Other Routes */}
            <Route path="operations" element={<Operations />} />
            <Route path="expenses" element={
              <ProtectedRoute requiredPermission="expense.read">
                <Expenses />
              </ProtectedRoute>
            } />
            <Route path="expenses/new" element={
              <ProtectedRoute requiredPermission="expense.create">
                <ExpenseCreate />
              </ProtectedRoute>
            } />
            <Route path="expenses/:id" element={
              <ProtectedRoute requiredPermission="expense.read">
                <ExpenseDetails />
              </ProtectedRoute>
            } />
            <Route path="expenses/:id/edit" element={
              <ProtectedRoute requiredPermission="expense.update">
                <ExpenseCreate />
              </ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute requiredPermission="report.read">
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="reports/new" element={
              <ProtectedRoute requiredPermission="report.create">
                <ReportCreate />
              </ProtectedRoute>
            } />
            <Route path="reports/:id" element={
              <ProtectedRoute requiredPermission="report.read">
                <ReportDetails />
              </ProtectedRoute>
            } />
            <Route path="reports/:id/edit" element={
              <ProtectedRoute requiredPermission="report.update">
                <ReportCreate />
              </ProtectedRoute>
            } />
            <Route path="accounts" element={<Accounts />} />
            <Route path="analytics" element={<Analytics />} />
            
            {/* ML Insights - Admin Only */}
            <Route path="ml-insights" element={
              <AdminRoute>
                <MLInsights />
              </AdminRoute>
            } />
            
            <Route path="settings" element={
              <AdminRoute>
                <Settings />
              </AdminRoute>
            } />
            <Route path="settings/user-management" element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            } />
            <Route path="settings/user-registration" element={
              <AdminRoute>
                <UserRegistration />
              </AdminRoute>
            } />
            <Route path="settings/roles" element={
              <AdminRoute>
                <RolesPermissions />
              </AdminRoute>
            } />
            <Route path="settings/master-data" element={
              <AdminRoute>
                <MasterData />
              </AdminRoute>
            } />
            <Route path="settings/master-data/:type" element={
              <AdminRoute>
                <MasterDataManagement />
              </AdminRoute>
            } />
            <Route path="settings/system" element={
              <AdminRoute>
                <SystemConfiguration />
              </AdminRoute>
            } />
            
            {/* Godown Inventory Module */}
            <Route path="godown-inventory" element={
              <ProtectedRoute requiredPermission="godown.read">
                <Godowns />
              </ProtectedRoute>
            } />
            <Route path="godown-inventory/:godownId" element={
              <ProtectedRoute requiredPermission="inventory.read">
                <GodownInventory />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
      <HotToaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
