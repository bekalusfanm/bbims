import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

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

const UserTable = ({ users, onDelete, onSort, sortColumn }) => {
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
    <TableContainer>
      <StyledTable>
        <StyledThead>
          <tr>
            <th
              onClick={() => raiseSort("username")}
              className={renderSortIcon("username")}
            >
              Username
            </th>
            <th
              onClick={() => raiseSort("role")}
              className={renderSortIcon("role")}
            >
              Role
            </th>
            <th
              onClick={() => raiseSort("email")}
              className={renderSortIcon("email")}
            >
              Email
            </th>
            <th
              onClick={() => raiseSort("hospitalName")}
              className={renderSortIcon("hospitalName")}
            >
              Hospital Name
            </th>
            <th />
          </tr>
        </StyledThead>
        <StyledTbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td colSpan="5">
                <Link
                  to={`/users/${user._id}`}
                  style={{
                    display: "contents",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{user.email}</td>
                  <td>{user.hospitalName}</td>
                </Link>
              </td>
              <td>
                <button
                  onClick={() => onDelete(user)}
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
  );
};

export default UserTable;
