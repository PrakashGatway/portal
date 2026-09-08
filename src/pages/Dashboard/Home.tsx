import { useState, useEffect } from "react";
import { useAuth } from "../../context/UserContext";
import api from "../../axiosInstance";
import LeadManagement from "../Leads/LeadManagement";
import GREDashboard from "./userDashboard";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./AdminDashbarod";

const EducationAnalytics = () => {
  const { user } = useAuth();

  if (user.role == "teacher") {
    return <TeacherDashboard />;
  }

  if (user.role == "admin") {
    return <AdminDashboard />;
  }

  if (user.role == "counselor") {
    return <LeadManagement />;
  }
  return <GREDashboard />;
};

export default EducationAnalytics;
