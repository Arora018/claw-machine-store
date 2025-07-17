import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Paper
} from '@mui/material';
import {
  TrendingUp, Inventory, Toys, AttachMoney
} from '@mui/icons-material';
import api from '../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/analytics/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
      // Set default values in case of error
      setDashboardData({
        totalSales: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalMachines: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Typography>Loading dashboard...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  // Provide default values to prevent undefined errors
  const data = dashboardData || {};
  const totalSales = data.totalSales || 0;
  const totalRevenue = data.totalRevenue || 0;
  const totalProducts = data.totalProducts || 0;
  const totalMachines = data.totalMachines || 0;

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          </Box>
          <Box color={color}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sales"
            value={totalSales}
            icon={<TrendingUp fontSize="large" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            icon={<AttachMoney fontSize="large" />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Machines"
            value={totalMachines}
            icon={<Toys fontSize="large" />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={totalProducts}
            icon={<Inventory fontSize="large" />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Typography>
              ✅ Backend Connected<br/>
              ✅ Demo Mode Active<br/>
              ✅ All Services Running
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Typography>
              Average Sale: ₹{totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0}<br/>
              Products Available: {totalProducts}<br/>
              Machines Active: {totalMachines}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
