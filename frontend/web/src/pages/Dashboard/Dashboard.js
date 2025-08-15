import React from 'react';
import './Dashboard.css';
import DashboardWidgets from './DashboardWidgets';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <DashboardWidgets />
    </div>
  );
};

export default Dashboard;