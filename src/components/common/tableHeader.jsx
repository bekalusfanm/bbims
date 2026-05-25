import React from "react";

const TableHeader = ({ columns, sortColumn, onSort, isDarkMode }) => {
  const raiseSort = path => {
    const sortColumnCopy = { ...sortColumn };
    if (sortColumnCopy.path === path)
      sortColumnCopy.order = sortColumnCopy.order === "asc" ? "desc" : "asc";
    else {
      sortColumnCopy.path = path;
      sortColumnCopy.order = "asc";
    }
    onSort(sortColumnCopy);
  };

  const renderSortIcon = column => {
    if (!column.path) return null;
    
    if (sortColumn.path !== column.path) 
      return <span className="sort-icon ms-1 text-muted">&#8645;</span>;
    
    return sortColumn.order === "asc" 
      ? <span className="sort-icon ms-1">&#8593;</span> 
      : <span className="sort-icon ms-1">&#8595;</span>;
  };

  return (
    <thead>
      <tr>
        {columns.map(column => (
          <th
            className="cursor-pointer"
            key={column.path || column.key}
            onClick={() => column.path && raiseSort(column.path)}
            style={{ cursor: column.path ? 'pointer' : 'default' }}
          >
            {column.label}
            {renderSortIcon(column)}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;
