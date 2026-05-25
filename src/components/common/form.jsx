import React, { Component } from "react";
import Joi from "joi-browser";
import Input from "./input";
import Select from "./select"; // Importing the Select component
import _ from "lodash";
import "../../styles/form.css";

class Form extends Component {
  state = {
    data: {},
    errors: {},
    loading: false
  };

  validate = () => {
    const options = { abortEarly: false };
    const { error } = Joi.validate(this.state.data, this.schema, options);
    if (!error) return null;

    const errors = {};
    for (let item of error.details) errors[item.path.join(".")] = item.message;
    return errors;
  };

  validateProperty = ({ name, value }) => {
    const path = name.split(".");
    let schema = this.schema;
    for (let key of path) {
      schema = schema[key];
    }
    const obj = { [path[path.length - 1]]: value };
    const subSchema = { [path[path.length - 1]]: schema };
    const { error } = Joi.validate(obj, subSchema);
    return error ? error.details[0].message : null;
  };

  handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submission triggered");

    const errors = this.validate();
    this.setState({ errors: errors || {} });
    if (errors) {
      console.log("Form validation failed:", errors);
      return;
    }

    console.log("Form validation passed, proceeding with submission");
    this.doSubmit();
  };

  handleChange = ({ currentTarget: input }) => {
    const errors = { ...this.state.errors };
    const errorMessage = this.validateProperty(input);
    if (errorMessage) errors[input.name] = errorMessage;
    else delete errors[input.name];

    const data = { ...this.state.data };
    _.set(data, input.name, input.value);

    this.setState({ data, errors });
  };

  renderButton(label) {
    return (
      <button 
        disabled={this.validate() || this.state.loading} 
        className="btn btn-primary"
        type="submit"
      >
        {this.state.loading ? "Please wait..." : label}
      </button>
    );
  }

  renderInput(name, label, type = "text", helpText = "") {
    const { data, errors } = this.state;
    const value = _.get(data, name, "");
    const error = errors[name];

    return (
      <Input
        type={type}
        name={name}
        value={value}
        label={label}
        onChange={this.handleChange}
        error={error}
        helpText={helpText}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    );
  }

  renderSelect(name, label, options, onChange, helpText = "") {
    const { data, errors } = this.state;
    const value = _.get(data, name, "");
    const error = errors[name];
    
    console.log("Rendering select:", { name, label, options, value });
    
    // Ensure options are in the correct format: [{ value, label }]
    const formattedOptions = options.map(option => {
      // Handle if options are already in correct format
      if (option.value !== undefined && option.label !== undefined) {
        return option;
      }
      
      // Handle if options are in format { _id, name }
      if (option._id !== undefined && option.name !== undefined) {
        return { value: option._id, label: option.name };
      }
      
      // Handle simple string options
      if (typeof option === 'string') {
        return { value: option, label: option };
      }
      
      // Default case
      console.warn("Unable to format option:", option);
      return { value: "", label: "Invalid Option" };
    });
    
    console.log("Formatted options:", formattedOptions);

    return (
      <Select
        name={name}
        value={value}
        label={label}
        options={formattedOptions}
        onChange={onChange || this.handleChange}
        error={error}
        helpText={helpText}
      />
    );
  }
}

export default Form;
