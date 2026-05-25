import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

const TableContainer = styled.div`
  overflow-x: auto;
  margin-bottom: 20px; /* Space between the table and the pagination */
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
  margin-top: 20px; /* Space between the pagination and the table */
`;

const BranchTable = ({
  branches,
  onDelete,
  onSort,
  sortColumn,
  pagination,
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

  return (
    <React.Fragment>
      <TableContainer>
        <StyledTable>
          <StyledThead>
            <tr>
              <th
                onClick={() => raiseSort("name")}
                className={renderSortIcon("name")}
              >
                Name
              </th>
              <th
                onClick={() => raiseSort("location")}
                className={renderSortIcon("location")}
              >
                Location
              </th>
              <th
                onClick={() => raiseSort("adminId")}
                className={renderSortIcon("adminId")}
              >
                Admin ID
              </th>
              <th />
            </tr>
          </StyledThead>
          <StyledTbody>
            {branches.map((branch) => (
              <tr
                key={branch._id}
                className="clickable-row"
                onClick={() =>
                  (window.location.href = `/branches/${branch._id}`)
                }
              >
                <td>{branch.name}</td>
                <td>{branch.location}</td>
                <td>{branch.adminId}</td>
                <td>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(branch);
                    }}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </StyledTbody>
        </StyledTable>
      </TableContainer>
      {pagination && <PaginationContainer>{pagination}</PaginationContainer>}
    </React.Fragment>
  );
};

export default BranchTable;
