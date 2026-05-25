import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../../context/userContext";

const TableContainer = styled.div`
  overflow-x: auto;
  margin-bottom: 20px; /* Add space between the table and the pagination */
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: Arial, sans-serif;
  background-color: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
`;

const StyledThead = styled.thead`
  background-color: #343a40;
  color: #fff;

  th {
    padding: 12px 15px;
    cursor: pointer;
    position: relative;

    &:hover {
      background-color: #495057;
    }

    &.sorted-asc::after {
      content: "▲";
      position: absolute;
      right: 10px;
    }

    &.sorted-desc::after {
      content: "▼";
      position: absolute;
      right: 10px;
    }

    &:first-child {
      border-top-left-radius: 8px;
    }

    &:last-child {
      border-top-right-radius: 8px;
    }
  }
`;

const StyledTbody = styled.tbody`
  tr {
    &:nth-of-type(even) {
      background-color: #f2f2f2;
    }

    &:hover {
      background-color: #e9ecef;
      cursor: pointer;
    }

    td {
      padding: 12px 15px;
      text-align: left;

      &:first-child {
        border-bottom-left-radius: 8px;
      }

      &:last-child {
        border-bottom-right-radius: 8px;
      }
    }
  }

  button {
    border: none;
    padding: 8px 12px;
    color: #fff;
    background-color: #dc3545;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background-color: #c82333;
    }
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px; /* Add space between the pagination and the table */
`;

const DonorTable = ({
  donors,
  onDelete,
  onSort,
  sortColumn,
  showDelete,
  pagination,
  userRole
}) => {
  const raiseSort = (path) => {
    const newSortColumn = { ...sortColumn };
    if (newSortColumn.path === path) {
      newSortColumn.order = newSortColumn.order === "asc" ? "desc" : "asc";
    } else {
      newSortColumn.path = path;
      newSortColumn.order = "asc";
    }
    onSort(newSortColumn);
  };

  const renderSortIcon = (column) => {
    if (column !== sortColumn.path) return null;
    if (sortColumn.order === "asc") return "sorted-asc";
    return "sorted-desc";
  };

  const handleDonorClick = (donor) => {
    // For Super Admin, show the donor details in read-only mode
    if (userRole === "Super Admin") {
      // Use a modal or view-only page instead of the edit form
      window.location.href = `/donors/view/${donor._id}`;
    } else {
      // For other roles, open the edit form
      window.location.href = `/donors/${donor._id}`;
    }
  };

  return (
    <React.Fragment>
      <TableContainer>
        <StyledTable>
          <StyledThead>
            <tr>
              <th
                onClick={() => raiseSort("personalInfo.name")}
                className={renderSortIcon("personalInfo.name")}
              >
                Name
              </th>
              <th
                onClick={() => raiseSort("personalInfo.age")}
                className={renderSortIcon("personalInfo.age")}
              >
                Age
              </th>
              <th
                onClick={() => raiseSort("healthInfo.bloodType")}
                className={renderSortIcon("healthInfo.bloodType")}
              >
                Blood Type
              </th>
              <th
                onClick={() => raiseSort("healthInfo.rhFactor")}
                className={renderSortIcon("healthInfo.rhFactor")}
              >
                Rh Factor
              </th>
              <th
                onClick={() => raiseSort("branchId")}
                className={renderSortIcon("branchId")}
              >
                Branch ID
              </th>
              {showDelete && <th />}
            </tr>
          </StyledThead>
          <StyledTbody>
            {donors.map((donor) => (
              <tr
                key={donor._id}
                onClick={() => handleDonorClick(donor)}
              >
                <td>{donor.personalInfo.name}</td>
                <td>{donor.personalInfo.age}</td>
                <td>{donor.healthInfo.bloodType}</td>
                <td>{donor.healthInfo.rhFactor}</td>
                <td>{donor.branchId}</td>
                {showDelete && (
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(donor);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </StyledTbody>
        </StyledTable>
      </TableContainer>
      {pagination && <PaginationContainer>{pagination}</PaginationContainer>}
    </React.Fragment>
  );
};

export default DonorTable;
