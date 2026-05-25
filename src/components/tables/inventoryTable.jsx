import React from "react";
import styled from "styled-components";

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  background-color: #fff;
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

    &:last-child td:first-child {
      border-bottom-left-radius: 8px;
    }

    &:last-child td:last-child {
      border-bottom-right-radius: 8px;
    }
  }

  td {
    padding: 12px 15px;
    text-align: left;
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

const InventoryTable = ({
  bloodBags,
  onDelete,
  onSort,
  sortColumn,
  pagination,
  showDelete = true,
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <React.Fragment>
      <TableContainer>
        <StyledTable>
          <StyledThead>
            <tr>
              <th
                onClick={() => raiseSort("bloodType")}
                className={renderSortIcon("bloodType")}
              >
                Blood Type
              </th>
              <th
                onClick={() => raiseSort("bloodCollector")}
                className={renderSortIcon("bloodCollector")}
              >
                Collector
              </th>
              <th
                onClick={() => raiseSort("locationCollected")}
                className={renderSortIcon("locationCollected")}
              >
                Collected In
              </th>
              <th
                onClick={() => raiseSort("collectionDate")}
                className={renderSortIcon("collectionDate")}
              >
                Collected Date
              </th>
              <th
                onClick={() => raiseSort("expiryDate")}
                className={renderSortIcon("expiryDate")}
              >
                Expiry Date
              </th>
              {showDelete && <th />}
            </tr>
          </StyledThead>
          <StyledTbody>
            {bloodBags.map((bloodBag) => (
              <tr
                key={bloodBag._id}
                onClick={() =>
                  (window.location.href = `/inventory/${bloodBag._id}`)
                }
              >
                <td>{bloodBag.bloodType}</td>
                <td>{bloodBag.bloodCollector}</td>
                <td>{bloodBag.locationCollected}</td>
                <td>{formatDate(bloodBag.collectionDate)}</td>
                <td>{formatDate(bloodBag.expiryDate)}</td>
                {showDelete && (
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(bloodBag);
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

export default InventoryTable;
