import React from 'react';
import styled from 'styled-components';
import { CSVLink } from 'react-csv';
import { Button, Dropdown, DropdownButton } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const ExportButton = styled.button`
  padding: 8px 16px;
  background-color: var(--primary-color, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  
  &:hover {
    background-color: var(--primary-color-dark, #0056b3);
  }
  
  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  
  i {
    margin-right: 8px;
  }
`;

/**
 * Data Export component provides functionality to export data in CSV and Excel formats
 * @param {Array} data - The data array to export
 * @param {String} filename - Base filename without extension
 * @param {Array} headers - Column headers for the export (optional)
 */
const ExportData = ({ data, filename, headers }) => {
  // Prepare CSV headers if not provided
  const getCSVHeaders = () => {
    if (headers) return headers;
    
    // Auto-generate headers from first data item
    if (data && data.length > 0) {
      return Object.keys(data[0]).map(key => ({ label: key, key }));
    }
    
    return [];
  };

  // Function to convert flat data to xlsx and download
  const exportToExcel = () => {
    try {
      // Convert the data to a worksheet
      const worksheet = XLSX.utils.json_to_sheet(prepareDataForExport());
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      // Generate the Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save and download the file
      saveAs(blob, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data to Excel. Please try again.');
    }
  };

  // Prepare nested data for export by flattening it
  const prepareDataForExport = () => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => {
      const flatItem = {};
      
      // Function to flatten nested objects
      const flattenObject = (obj, prefix = '') => {
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            // Recursively flatten nested objects
            flattenObject(obj[key], `${prefix}${key}_`);
          } else if (Array.isArray(obj[key])) {
            // For arrays, join values with comma
            flatItem[`${prefix}${key}`] = obj[key].map(arrayItem => {
              if (typeof arrayItem === 'object') {
                return JSON.stringify(arrayItem);
              }
              return arrayItem;
            }).join(', ');
          } else {
            // Handle primitive values
            flatItem[`${prefix}${key}`] = obj[key];
          }
        }
      };
      
      flattenObject(item);
      return flatItem;
    });
  };

  // Return button for smaller datasets or dropdown for larger ones
  return (
    <div className="mb-3">
      {data && data.length > 0 ? (
        data.length > 100 ? (
          <DropdownButton id="export-dropdown" title="Export Data" variant="success">
            <Dropdown.Item as={CSVLink} data={prepareDataForExport()} headers={getCSVHeaders()} filename={`${filename}.csv`}>
              Export as CSV
            </Dropdown.Item>
            <Dropdown.Item onClick={exportToExcel}>Export as Excel</Dropdown.Item>
          </DropdownButton>
        ) : (
          <div className="d-flex gap-2">
            <CSVLink 
              data={prepareDataForExport()} 
              headers={getCSVHeaders()} 
              filename={`${filename}.csv`}
              className="btn btn-outline-success btn-sm">
              Export as CSV
            </CSVLink>
            <Button variant="outline-success" size="sm" onClick={exportToExcel}>
              Export as Excel
            </Button>
          </div>
        )
      ) : (
        <Button variant="outline-secondary" size="sm" disabled>
          No data to export
        </Button>
      )}
    </div>
  );
};

/**
 * Utility functions for exporting data to various formats
 */

// Export data to CSV
export const exportToCSV = (data, filename = 'export') => {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }

  try {
    // Get headers from the first item's keys
    const headers = Object.keys(data[0]);
    
    // Function to format cell value properly for CSV
    const formatCSVValue = (value) => {
      if (value === null || value === undefined) return '';
      
      // Convert dates to string
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      
      // Convert objects to JSON string
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      // Wrap strings with commas in quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    };
    
    // Create CSV header row
    const csvHeader = headers.join(',');
    
    // Create CSV rows
    const csvRows = data.map(row => {
      return headers.map(header => formatCSVValue(row[header])).join(',');
    });
    
    // Combine header and rows
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set download attributes
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    // Add to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    alert('Failed to export data to CSV');
  }
};

// Export data to PDF
export const exportToPDF = async (data, filename = 'export', title = 'Exported Data', orientation = 'portrait') => {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }
  
  try {
    // Dynamically import jsPDF and jsPDF-AutoTable
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    // Create new PDF document
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add timestamp
    doc.setFontSize(8);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    
    // Format data for autoTable
    const headers = Object.keys(data[0]).map(key => ({
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      dataKey: key
    }));
    
    // Convert data with special handling for nested objects and dates
    const processedData = data.map(item => {
      const rowData = {};
      Object.entries(item).forEach(([key, value]) => {
        if (value instanceof Date) {
          rowData[key] = value.toLocaleDateString();
        } else if (typeof value === 'object' && value !== null) {
          rowData[key] = JSON.stringify(value);
        } else {
          rowData[key] = value;
        }
      });
      return rowData;
    });
    
    // Create table with data
    autoTable(doc, {
      head: [headers.map(h => h.header)],
      body: processedData.map(row => headers.map(h => row[h.dataKey])),
      startY: 30,
      styles: { overflow: 'linebreak', cellWidth: 'wrap' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 30 }
    });
    
    // Save PDF
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    alert('Failed to export data to PDF. Make sure jspdf and jspdf-autotable are installed.');
  }
};

// Export data to Excel format
export const exportToExcel = async (data, filename = 'export', sheetName = 'Sheet1') => {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }
  
  try {
    // Dynamically import xlsx library
    const XLSX = await import('xlsx');
    
    // Convert data with special handling for nested objects and dates
    const processedData = data.map(item => {
      const rowData = {};
      Object.entries(item).forEach(([key, value]) => {
        if (value instanceof Date) {
          rowData[key] = value.toLocaleDateString();
        } else if (typeof value === 'object' && value !== null) {
          rowData[key] = JSON.stringify(value);
        } else {
          rowData[key] = value;
        }
      });
      return rowData;
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate and download Excel file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export data to Excel. Make sure xlsx library is installed.');
  }
};

export default {
  exportToCSV,
  exportToPDF,
  exportToExcel
}; 