import React from "react";
import "../../styles/listGroup.css";

const ListGroup = ({ items, selectedItem, onItemSelect, defaultItem }) => {
  return (
    <ul className="list-group">
      {items.map((item) => (
        <li
          key={item.name}
          onClick={() => onItemSelect(item.name)}
          className={
            item.name === selectedItem ||
            (!selectedItem && item.name === defaultItem)
              ? "list-group-item active"
              : "list-group-item"
          }
          style={{ cursor: "pointer" }}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
};

export default ListGroup;
