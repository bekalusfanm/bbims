import React from "react";
import { Route, Redirect } from "react-router-dom";

/**
 * Hospital Admin Route middleware
 * Protects routes that should only be accessible to Hospital Admin users
 */
const HospitalAdminRoute = ({ component: Component, ...rest }) => {
  // Define a function to check user role - this ensures fresh data each render
  const checkUserRole = () => {
    try {
      // Get the user from localStorage
      const userString = localStorage.getItem("user");
      
      if (!userString) {
        console.warn("HospitalAdminRoute: No user found in localStorage");
        return null;
      }
      
      const user = JSON.parse(userString);
      
      if (!user || !user.role) {
        console.warn("HospitalAdminRoute: Invalid user data in localStorage", user);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error("HospitalAdminRoute: Error parsing user data", error);
      return null;
    }
  };
  
  return (
    <Route
      {...rest}
      render={(props) => {
        // Check user on each render to ensure fresh data
        const user = checkUserRole();
        
        if (!user) {
          // If no user is logged in, redirect to login
          console.warn(`HospitalAdminRoute: Redirecting to login from ${props.location.pathname}`);
          return (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: props.location },
              }}
            />
          );
        }

        // Check if user has Hospital Admin role (case-sensitive check)
        if (user.role !== "Hospital Admin") {
          // If user is not a Hospital Admin, redirect to unauthorized
          console.warn(`HospitalAdminRoute: Access denied for ${user.role} trying to access ${props.location.pathname}`);
          return (
            <Redirect
              to={{
                pathname: "/unauthorized",
                state: { from: props.location },
              }}
            />
          );
        }

        // If user is a Hospital Admin, render the component
        console.info(`HospitalAdminRoute: Granting access to ${user.username} (${user.role}) for ${props.location.pathname}`);
        return <Component {...props} />;
      }}
    />
  );
};

export default HospitalAdminRoute; 