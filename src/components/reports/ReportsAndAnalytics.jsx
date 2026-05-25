import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Table, Spinner, Alert } from 'react-bootstrap';
import styled from 'styled-components';
import inventoryService from '../../services/inventoryService';
import donorService from '../../services/donorService';
import branchService from '../../services/branchService';
import { exportToCSV, exportToPDF, exportToExcel } from '../exportData';
import { FaFileCsv, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const ReportContainer = styled.div`
  padding: 20px;
  background-color: ${props => props.isDarkMode ? '#2d3436' : '#fff'};
  color: ${props => props.isDarkMode ? '#f5f6fa' : '#2d3436'};
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  
  h2 {
    margin: 0;
    color: ${props => props.isDarkMode ? '#f5f6fa' : '#2d3436'};
  }
`;

const FilterSection = styled.div`
  margin-bottom: 25px;
  padding: 15px;
  background-color: ${props => props.isDarkMode ? '#404b69' : '#f8f9fa'};
  border-radius: 5px;
`;

const ChartContainer = styled.div`
  margin-top: 20px;
  margin-bottom: 30px;
  background-color: ${props => props.isDarkMode ? '#34495e' : '#fff'};
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const StyledAlert = styled(Alert)`
  margin-top: 15px;
`;

const ReportsAndAnalytics = () => {
  const [reportType, setReportType] = useState('inventory');
  const [timeRange, setTimeRange] = useState('week');
  const [branchId, setBranchId] = useState('all');
  const [branches, setBranches] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const isDarkMode = localStorage.getItem('darkMode') === 'true';

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (reportType) {
      generateReport();
    }
  }, [reportType, timeRange, branchId]);

  const fetchBranches = async () => {
    try {
      const data = await branchService.getAllBranches();
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to load branches. Please try again later.');
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let data = [];
      
      switch (reportType) {
        case 'inventory':
          data = await inventoryService.getInventoryReport(branchId, timeRange);
          prepareInventoryChartData(data);
          break;
        case 'donors':
          data = await donorService.getDonorReport(branchId, timeRange);
          prepareDonorChartData(data);
          break;
        case 'bloodType':
          data = await inventoryService.getBloodTypeDistribution(branchId);
          prepareBloodTypeChartData(data);
          break;
        default:
          data = [];
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again later.');
      setReportData([]);
      setChartData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const prepareInventoryChartData = (data) => {
    if (!data || !data.length) {
      setChartData(null);
      return;
    }

    // Group by date and blood type
    const dateGroups = {};
    data.forEach(item => {
      const date = new Date(item.date).toLocaleDateString();
      if (!dateGroups[date]) {
        dateGroups[date] = {};
      }
      if (!dateGroups[date][item.bloodType]) {
        dateGroups[date][item.bloodType] = 0;
      }
      dateGroups[date][item.bloodType] += item.quantity;
    });

    // Convert to chart format
    const labels = Object.keys(dateGroups).sort((a, b) => new Date(a) - new Date(b));
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const datasets = bloodTypes.map((type, index) => {
      const colorIndex = index % 8;
      const colors = [
        'rgba(255, 99, 132, 0.7)', 
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)',
        'rgba(83, 102, 255, 0.7)'
      ];
      
      return {
        label: type,
        data: labels.map(date => dateGroups[date][type] || 0),
        backgroundColor: colors[colorIndex],
        borderColor: colors[colorIndex].replace('0.7', '1'),
        borderWidth: 1
      };
    });

    setChartData({
      type: 'bar',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Units'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });
  };

  const prepareDonorChartData = (data) => {
    if (!data || !data.length) {
      setChartData(null);
      return;
    }

    // Group by date
    const dateGroups = {};
    data.forEach(item => {
      const date = new Date(item.donationDate).toLocaleDateString();
      if (!dateGroups[date]) {
        dateGroups[date] = 0;
      }
      dateGroups[date]++;
    });

    const labels = Object.keys(dateGroups).sort((a, b) => new Date(a) - new Date(b));
    const donationCounts = labels.map(date => dateGroups[date]);

    setChartData({
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Number of Donations',
            data: donationCounts,
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Donors'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });
  };

  const prepareBloodTypeChartData = (data) => {
    if (!data || !data.length) {
      setChartData(null);
      return;
    }

    // Group by blood type
    const bloodTypeGroups = {};
    data.forEach(item => {
      if (!bloodTypeGroups[item.bloodType]) {
        bloodTypeGroups[item.bloodType] = 0;
      }
      bloodTypeGroups[item.bloodType] += item.quantity;
    });

    const labels = Object.keys(bloodTypeGroups);
    const quantities = labels.map(type => bloodTypeGroups[type]);
    const backgroundColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
      'rgba(83, 102, 255, 0.7)'
    ];

    setChartData({
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data: quantities,
            backgroundColor: backgroundColors.slice(0, labels.length),
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')).slice(0, labels.length),
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          },
          title: {
            display: true,
            text: 'Blood Type Distribution'
          }
        }
      }
    });
  };

  const exportReport = () => {
    if (!reportData.length) {
      setError('No data to export');
      return;
    }

    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(reportData, filename);
  };
  
  const exportReportToPDF = () => {
    if (!reportData.length) {
      setError('No data to export');
      return;
    }

    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}`;
    const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
    exportToPDF(reportData, filename, title, 'landscape');
  };
  
  const exportReportToExcel = () => {
    if (!reportData.length) {
      setError('No data to export');
      return;
    }

    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(reportData, filename, reportType);
  };

  const renderChart = () => {
    if (!chartData) return null;

    switch (chartData.type) {
      case 'bar':
        return <Bar data={chartData.data} options={chartData.options} />;
      case 'pie':
        return <Pie data={chartData.data} options={chartData.options} />;
      case 'line':
        return <Line data={chartData.data} options={chartData.options} />;
      default:
        return null;
    }
  };

  return (
    <ReportContainer isDarkMode={isDarkMode}>
      <ReportHeader isDarkMode={isDarkMode}>
        <h2>Reports & Analytics</h2>
        <ButtonGroup>
          <Button 
            variant="outline-primary" 
            onClick={exportReport} 
            disabled={isLoading || !reportData.length}
          >
            <FaFileCsv className="me-2" /> CSV
          </Button>
          <Button 
            variant="outline-danger" 
            onClick={exportReportToPDF} 
            disabled={isLoading || !reportData.length}
          >
            <FaFilePdf className="me-2" /> PDF
          </Button>
          <Button 
            variant="outline-success" 
            onClick={exportReportToExcel} 
            disabled={isLoading || !reportData.length}
          >
            <FaFileExcel className="me-2" /> Excel
          </Button>
        </ButtonGroup>
      </ReportHeader>

      <FilterSection isDarkMode={isDarkMode}>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Report Type</Form.Label>
              <Form.Select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="inventory">Inventory Status</option>
                <option value="donors">Donor Trends</option>
                <option value="bloodType">Blood Type Distribution</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Time Range</Form.Label>
              <Form.Select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                disabled={reportType === 'bloodType'}
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Branch</Form.Label>
              <Form.Select 
                value={branchId} 
                onChange={(e) => setBranchId(e.target.value)}
              >
                <option value="all">All Branches</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </FilterSection>

      {isLoading ? (
        <div className="text-center mt-5 mb-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Generating report...</p>
        </div>
      ) : error ? (
        <StyledAlert variant="danger">{error}</StyledAlert>
      ) : reportData.length === 0 ? (
        <StyledAlert variant="info">No data available for the selected criteria.</StyledAlert>
      ) : (
        <React.Fragment>
          <ChartContainer>
            {renderChart()}
          </ChartContainer>

          <Table striped bordered hover responsive variant={isDarkMode ? 'dark' : 'light'}>
            <thead>
              <tr>
                {reportType === 'inventory' && (
                  <React.Fragment>
                    <th>Date</th>
                    <th>Blood Type</th>
                    <th>Quantity</th>
                    <th>Branch</th>
                    <th>Status</th>
                  </React.Fragment>
                )}
                
                {reportType === 'donors' && (
                  <React.Fragment>
                    <th>Donor Name</th>
                    <th>Blood Type</th>
                    <th>Donation Date</th>
                    <th>Branch</th>
                    <th>Amount (mL)</th>
                  </React.Fragment>
                )}
                
                {reportType === 'bloodType' && (
                  <React.Fragment>
                    <th>Blood Type</th>
                    <th>Available Units</th>
                    <th>Branch</th>
                    <th>Status</th>
                  </React.Fragment>
                )}
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={index}>
                  {reportType === 'inventory' && (
                    <React.Fragment>
                      <td>{new Date(item.date).toLocaleDateString()}</td>
                      <td>{item.bloodType}</td>
                      <td>{item.quantity}</td>
                      <td>{item.branchName}</td>
                      <td>
                        <span className={`badge bg-${item.status === 'Adequate' ? 'success' : item.status === 'Low' ? 'warning' : 'danger'}`}>
                          {item.status}
                        </span>
                      </td>
                    </React.Fragment>
                  )}
                  
                  {reportType === 'donors' && (
                    <React.Fragment>
                      <td>{item.donorName}</td>
                      <td>{item.bloodType}</td>
                      <td>{new Date(item.donationDate).toLocaleDateString()}</td>
                      <td>{item.branchName}</td>
                      <td>{item.amount}</td>
                    </React.Fragment>
                  )}
                  
                  {reportType === 'bloodType' && (
                    <React.Fragment>
                      <td>{item.bloodType}</td>
                      <td>{item.quantity}</td>
                      <td>{item.branchName}</td>
                      <td>
                        <span className={`badge bg-${item.status === 'Adequate' ? 'success' : item.status === 'Low' ? 'warning' : 'danger'}`}>
                          {item.status}
                        </span>
                      </td>
                    </React.Fragment>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </React.Fragment>
      )}
    </ReportContainer>
  );
};

export default ReportsAndAnalytics; 