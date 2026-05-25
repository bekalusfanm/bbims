import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ProgressBar, Tabs, Tab, Alert } from 'react-bootstrap';
import styled from 'styled-components';
import { FaUsers, FaTint, FaHospital, FaExchangeAlt } from 'react-icons/fa';
import userService from '../../services/userService';
import inventoryService from '../../services/inventoryService';
import branchService from '../../services/branchService';
import donorService from '../../services/donorService';
import ReportsAndAnalytics from '../reports/ReportsAndAnalytics';

const DashboardContainer = styled.div`
  padding: 20px;
  background-color: ${props => props.isDarkMode ? '#2d3436' : '#f8f9fa'};
  min-height: 100vh;
`;

const StyledCard = styled(Card)`
  border: none;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  background-color: ${props => props.isDarkMode ? '#34495e' : '#fff'};
  color: ${props => props.isDarkMode ? '#f5f6fa' : '#2d3436'};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  
  h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${props => props.isDarkMode ? '#f5f6fa' : '#2d3436'};
  }
  
  svg {
    margin-right: 10px;
    color: ${props => props.theme};
  }
`;

const CardBody = styled.div`
  padding: 15px 20px;
`;

const StyledProgressBar = styled(ProgressBar)`
  height: 10px;
  margin-top: 10px;
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.background};
  margin-right: 15px;
  
  svg {
    color: white;
    font-size: 20px;
  }
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 5px;
  color: ${props => props.isDarkMode ? '#f5f6fa' : '#2d3436'};
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: ${props => props.isDarkMode ? '#bdc3c7' : '#6c757d'};
`;

const BranchPerformance = styled.div`
  margin-top: 10px;
  
  .branch-name {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    
    span {
      font-size: 0.85rem;
      color: ${props => props.isDarkMode ? '#bdc3c7' : '#6c757d'};
    }
  }
`;

const StyledTabs = styled(Tabs)`
  margin-top: 20px;
  border-bottom: 1px solid ${props => props.isDarkMode ? '#4a5568' : '#dee2e6'};
  
  .nav-link {
    color: ${props => props.isDarkMode ? '#bdc3c7' : '#6c757d'};
    background-color: transparent;
    border: none;
    
    &.active {
      color: ${props => props.isDarkMode ? '#f5f6fa' : '#495057'};
      background-color: transparent;
      border-bottom: 3px solid var(--primary-color);
    }
    
    &:hover {
      color: ${props => props.isDarkMode ? '#f5f6fa' : '#495057'};
      border-color: transparent;
    }
  }
`;

const BloodTypeIndicator = styled.div`
  background-color: ${props => props.color};
  border-radius: 4px;
  color: white;
  padding: 3px 8px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
  margin-right: 8px;
`;

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalBranches: 0,
    totalInventory: 0
  });
  
  const [branchPerformance, setBranchPerformance] = useState([]);
  const [bloodTypeDistribution, setBloodTypeDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch users count
      const users = await userService.getAllUsers();
      
      // Fetch donors count
      const donors = await donorService.getAllDonors();
      
      // Fetch branches
      const branches = await branchService.getAllBranches();
      
      // Fetch inventory
      const inventory = await inventoryService.getAllInventory();
      
      // Set main stats
      setStats({
        totalUsers: users.length,
        totalDonors: donors.length,
        totalBranches: branches.length,
        totalInventory: inventory.reduce((sum, item) => sum + item.quantity, 0)
      });
      
      // Process branch performance data
      const branchData = branches.map(branch => {
        const branchUsers = users.filter(user => user.branchId === branch._id).length;
        const branchDonors = donors.filter(donor => donor.branchId === branch._id).length;
        const branchInventory = inventory
          .filter(item => item.branchId === branch._id)
          .reduce((sum, item) => sum + item.quantity, 0);
        
        // Calculate a performance score based on various metrics
        const perfScore = Math.min(100, Math.floor((branchDonors * 2 + branchInventory) / 5));
        
        return {
          id: branch._id,
          name: branch.name,
          performanceScore: perfScore,
          users: branchUsers,
          donors: branchDonors,
          inventory: branchInventory
        };
      });
      
      setBranchPerformance(branchData.sort((a, b) => b.performanceScore - a.performanceScore));
      
      // Process blood type distribution
      const bloodData = inventory.reduce((acc, item) => {
        if (!acc[item.bloodType]) {
          acc[item.bloodType] = 0;
        }
        acc[item.bloodType] += item.quantity;
        return acc;
      }, {});
      
      const totalQuantity = Object.values(bloodData).reduce((sum, qty) => sum + qty, 0);
      
      const distribution = Object.entries(bloodData).map(([type, qty]) => ({
        type,
        quantity: qty,
        percentage: totalQuantity ? Math.round((qty / totalQuantity) * 100) : 0
      }));
      
      setBloodTypeDistribution(distribution.sort((a, b) => b.quantity - a.quantity));
      
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  const getBloodTypeColor = (type) => {
    const colors = {
      'A+': '#e74c3c',
      'A-': '#c0392b',
      'B+': '#3498db',
      'B-': '#2980b9',
      'AB+': '#9b59b6',
      'AB-': '#8e44ad',
      'O+': '#2ecc71',
      'O-': '#27ae60'
    };
    
    return colors[type] || '#95a5a6';
  };
  
  if (loading) {
    return (
      <DashboardContainer isDarkMode={isDarkMode}>
        <Container>
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading dashboard data...</p>
          </div>
        </Container>
      </DashboardContainer>
    );
  }
  
  if (error) {
    return (
      <DashboardContainer isDarkMode={isDarkMode}>
        <Container>
          <Alert variant="danger" className="mt-4">
            {error}
          </Alert>
        </Container>
      </DashboardContainer>
    );
  }
  
  return (
    <DashboardContainer isDarkMode={isDarkMode}>
      <Container fluid>
        <h2 className="mb-4" style={{ color: isDarkMode ? '#f5f6fa' : '#2d3436' }}>
          Super Admin Dashboard
        </h2>
        
        {/* Stats Row */}
        <Row>
          <Col lg={3} md={6}>
            <StyledCard isDarkMode={isDarkMode}>
              <CardBody>
                <div className="d-flex align-items-center">
                  <IconWrapper background="#e74c3c">
                    <FaUsers />
                  </IconWrapper>
                  <div>
                    <StatValue isDarkMode={isDarkMode}>{stats.totalUsers}</StatValue>
                    <StatLabel isDarkMode={isDarkMode}>Total Users</StatLabel>
                  </div>
                </div>
              </CardBody>
            </StyledCard>
          </Col>
          
          <Col lg={3} md={6}>
            <StyledCard isDarkMode={isDarkMode}>
              <CardBody>
                <div className="d-flex align-items-center">
                  <IconWrapper background="#3498db">
                    <FaTint />
                  </IconWrapper>
                  <div>
                    <StatValue isDarkMode={isDarkMode}>{stats.totalDonors}</StatValue>
                    <StatLabel isDarkMode={isDarkMode}>Total Donors</StatLabel>
                  </div>
                </div>
              </CardBody>
            </StyledCard>
          </Col>
          
          <Col lg={3} md={6}>
            <StyledCard isDarkMode={isDarkMode}>
              <CardBody>
                <div className="d-flex align-items-center">
                  <IconWrapper background="#2ecc71">
                    <FaHospital />
                  </IconWrapper>
                  <div>
                    <StatValue isDarkMode={isDarkMode}>{stats.totalBranches}</StatValue>
                    <StatLabel isDarkMode={isDarkMode}>Total Branches</StatLabel>
                  </div>
                </div>
              </CardBody>
            </StyledCard>
          </Col>
          
          <Col lg={3} md={6}>
            <StyledCard isDarkMode={isDarkMode}>
              <CardBody>
                <div className="d-flex align-items-center">
                  <IconWrapper background="#9b59b6">
                    <FaExchangeAlt />
                  </IconWrapper>
                  <div>
                    <StatValue isDarkMode={isDarkMode}>{stats.totalInventory}</StatValue>
                    <StatLabel isDarkMode={isDarkMode}>Blood Units Available</StatLabel>
                  </div>
                </div>
              </CardBody>
            </StyledCard>
          </Col>
        </Row>
        
        <StyledTabs 
          defaultActiveKey="overview" 
          className="mb-3" 
          isDarkMode={isDarkMode}
        >
          <Tab eventKey="overview" title="Overview">
            <Row>
              {/* Branch Performance */}
              <Col lg={6}>
                <StyledCard isDarkMode={isDarkMode}>
                  <CardHeader isDarkMode={isDarkMode} theme="#3498db">
                    <FaHospital />
                    <h4>Branch Performance</h4>
                  </CardHeader>
                  <CardBody>
                    <BranchPerformance isDarkMode={isDarkMode}>
                      {branchPerformance.map(branch => (
                        <div key={branch.id} className="mb-3">
                          <div className="branch-name">
                            <span>{branch.name}</span>
                            <span>{branch.performanceScore}%</span>
                          </div>
                          <StyledProgressBar 
                            now={branch.performanceScore} 
                            variant={
                              branch.performanceScore > 75 ? "success" : 
                              branch.performanceScore > 50 ? "info" : 
                              branch.performanceScore > 25 ? "warning" : "danger"
                            }
                          />
                          <div className="d-flex justify-content-between mt-1">
                            <small style={{ color: isDarkMode ? '#bdc3c7' : '#6c757d' }}>
                              Users: {branch.users}
                            </small>
                            <small style={{ color: isDarkMode ? '#bdc3c7' : '#6c757d' }}>
                              Donors: {branch.donors}
                            </small>
                            <small style={{ color: isDarkMode ? '#bdc3c7' : '#6c757d' }}>
                              Inventory: {branch.inventory} units
                            </small>
                          </div>
                        </div>
                      ))}
                    </BranchPerformance>
                  </CardBody>
                </StyledCard>
              </Col>
              
              {/* Blood Type Distribution */}
              <Col lg={6}>
                <StyledCard isDarkMode={isDarkMode}>
                  <CardHeader isDarkMode={isDarkMode} theme="#e74c3c">
                    <FaTint />
                    <h4>Blood Type Distribution</h4>
                  </CardHeader>
                  <CardBody>
                    {bloodTypeDistribution.map(blood => (
                      <div key={blood.type} className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <BloodTypeIndicator color={getBloodTypeColor(blood.type)}>
                            {blood.type}
                          </BloodTypeIndicator>
                          <span style={{ color: isDarkMode ? '#bdc3c7' : '#6c757d' }}>
                            {blood.quantity} units ({blood.percentage}%)
                          </span>
                        </div>
                        <StyledProgressBar 
                          now={blood.percentage} 
                          variant={blood.type.includes('A') ? 'danger' : 
                                  blood.type.includes('B') ? 'primary' : 
                                  blood.type.includes('AB') ? 'warning' : 'success'}
                        />
                      </div>
                    ))}
                  </CardBody>
                </StyledCard>
              </Col>
            </Row>
          </Tab>
          
          <Tab eventKey="reports" title="Reports & Analytics">
            <ReportsAndAnalytics />
          </Tab>
        </StyledTabs>
      </Container>
    </DashboardContainer>
  );
};

export default SuperAdminDashboard; 