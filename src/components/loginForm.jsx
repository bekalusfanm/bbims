import React from "react";
import Joi from "joi-browser";
import Form from "./common/form";
import { toast } from "react-toastify";
import { login } from "../services/authService";

class LoginForm extends Form {
  state = {
    data: { email: "", password: "" },
    errors: {},
  };

  schema = {
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().label("Password"),
  };

  doSubmit = async () => {
    try {
      const { data } = this.state;
      console.log("Submitting login data:", data); // Debug log

      await login(data.email, data.password);
      const token = localStorage.getItem("token"); // Retrieve the token from local storage
      if (!token) throw new Error("No token found");
      
      // Store the password temporarily for password change verification
      // In a real app, you would NEVER do this - this is only for demonstration
      // Passwords should only be stored and verified securely on the server
      localStorage.setItem("userPassword", data.password);
      console.log("Saved password to localStorage:", data.password); // Debug log
      
      toast.success("Login successful!");
      window.location = "/"; // Redirect to homepage or any other page
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        const errors = { ...this.state.errors };
        errors.email = ex.response.data; // Assuming the error message is in response.data
        this.setState({ errors });
        toast.error("Invalid email or password");
      }
    }
  };

  render() {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Login</h1>
          <form onSubmit={this.handleSubmit}>
            {this.renderInput("email", "Email", "email", "form-control")}
            {this.renderInput(
              "password",
              "Password",
              "password",
              "form-control"
            )}
            {this.renderButton("Login", "btn btn-primary btn-block")}
          </form>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    borderRadius: "10px",
    backgroundColor: "#6db2e0",
  },
  card: {
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    padding: "20px",
    maxWidth: "400px",
    width: "100%",
    backgroundColor: "#c0c2dd",
  },
  title: {
    marginBottom: "30px",
    fontWeight: "600",
    fontSize: "24px",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: "15px",
  },
  btnBlock: {
    width: "100%",
  },
  alertDanger: {
    marginTop: "10px",
  },
};

export default LoginForm;
