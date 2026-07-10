import { useState, useEffect } from 'react';
import { useAuth } from '../../context/UserContext';
import api from '../../axiosInstance';
import LeadManagement from '../Leads/LeadManagement';
import GREDashboard from './userDashboard';

const EducationAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [counselors, setAllCounselors] = useState([]);


  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'Admin' ? '/admin/analytics' :
        user.role === 'Teacher' ? '/teacher/analytics' :
          '/student/analytics';
      const response = await api.get(`${endpoint}?range=${timeRange}`);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounselors = async () => {
    try {
      const res = await api.get("/users?role=counselor");

      setAllCounselors(res.data?.users || []);
    } catch (error) {
      console.error("Failed to fetch counselors:", error);
    }
  };

  useEffect(() => {
    if (user?.role != "counselor") {
      fetchCounselors();
    }
  }, [user?.role]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, user.role]);


  if (user.role == "counselor") {
    return (<LeadManagement />)
  }
    return (<GREDashboard />)

};

export default EducationAnalytics;