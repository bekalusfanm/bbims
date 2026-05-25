import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { toast } from "react-toastify";

class Logout extends Component {
  componentDidMount() {
    this.confirmLogout();
  }

  confirmLogout = () => {
    const userConfirmed = window.confirm("Are you sure you want to log out?");
    if (userConfirmed) {
      localStorage.removeItem("token"); // Assuming token is stored with the key "token"
      localStorage.removeItem("user"); // Clear user data if it's stored
      localStorage.removeItem("userPassword"); // Clear the stored password
      toast.success("Logged out successfully!");
      this.props.history.push("/login"); // Redirect to login page
    } else {
      this.props.history.push("/"); // Redirect back to the home page if logout is cancelled
    }
  };

  render() {
    return null;
  }
}

export default withRouter(Logout);
