import React from "react";
import "../../styles/form.css";

const Select = ({ name, label, options, error, helpText, ...rest }) => {
  console.log("Select component rendering with options:", options);
  
  if (!Array.isArray(options)) {
    console.error("Options must be an array");
    return <div className="alert alert-danger">Invalid options format</div>;
  }

  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <select 
        name={name} 
        id={name} 
        {...rest} 
        className={`form-control ${error ? "is-invalid" : ""}`}
      >
        {options.map((option, index) => {
          // Handle different option formats
          let value, label;
          
          if (typeof option === 'object') {
            if (option.value !== undefined && option.label !== undefined) {
              value = option.value;
              label = option.label;
            } else if (option._id !== undefined && option.name !== undefined) {
              value = option._id;
              label = option.name;
            } else {
              console.warn("Invalid option format:", option);
              value = "";
              label = "Invalid Option";
            }
          } else {
            value = option;
            label = option;
          }
          
          return (
            <option key={index} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      {helpText && <small className="form-text text-muted">{helpText}</small>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

export default Select;
