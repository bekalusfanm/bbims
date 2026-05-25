import React from 'react';
import TableHeader from './tableHeader';
import TableBody from './tableBody';
import styled from 'styled-components';

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: ${props => props.isDarkMode ? '#34495e' : '#fff'};
  color: ${props => props.isDarkMode ? '#ecf0f1' : '#333'};
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid ${props => props.isDarkMode ? '#2c3e50' : '#ddd'};
  }
  
  th {
    background-color: ${props => props.isDarkMode ? '#2c3e50' : '#f8f9fa'};
    color: ${props => props.isDarkMode ? '#ecf0f1' : '#495057'};
    font-weight: 600;
    cursor: pointer;
    
    &:hover {
      background-color: ${props => props.isDarkMode ? '#3d5a80' : '#e9ecef'};
    }
  }
  
  tbody tr:hover {
    background-color: ${props => props.isDarkMode ? '#3d5a80' : '#f8f9fa'};
  }
  
  .sort-icon {
    margin-left: 5px;
    color: ${props => props.isDarkMode ? '#a0a0a0' : '#6c757d'};
  }
`;

const Table = ({ columns, data, sortColumn, onSort }) => {
  const isDarkMode = localStorage.getItem("darkMode") === "true";
  
  return (
    <div className="table-responsive">
      <StyledTable isDarkMode={isDarkMode}>
        <TableHeader 
          columns={columns} 
          sortColumn={sortColumn} 
          onSort={onSort} 
          isDarkMode={isDarkMode}
        />
        <TableBody 
          data={data} 
          columns={columns} 
          isDarkMode={isDarkMode}
        />
      </StyledTable>
    </div>
  );
};

export default Table;
