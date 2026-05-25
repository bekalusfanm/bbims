import React from "react";
import "../../styles/form.css";

const Input = ({ name, label, error, placeholder, helpText, ...rest }) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input 
        {...rest} 
        name={name} 
        id={name} 
        className={`form-control ${error ? "is-invalid" : ""}`} 
        placeholder={placeholder}
      />
      {helpText && <small className="form-text text-muted">{helpText}</small>}
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

export default Input;
