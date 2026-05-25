import React from "react";
import { Route, Redirect } from "react-router-dom";

/**
 * Admin Route middleware
 * Protects routes that should only be accessible to Admin and Super Admin users
 */
const AdminRoute = ({ component: Component, ...rest }) => {
  // Define a function to check user role - this ensures fresh data each render
  const checkUserRole = () => {
    try {
      // Get the user from localStorage
      const userString = localStorage.getItem("user");
      
      if (!userString) {
        console.warn("AdminRoute: No user found in localStorage");
        return null;
      }
      
      const user = JSON.parse(userString);
      
      if (!user || !user.role) {
        console.warn("AdminRoute: Invalid user data in localStorage", user);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error("AdminRoute: Error parsing user data", error);
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
          console.warn(`AdminRoute: Redirecting to login from ${props.location.pathname}`);
          return (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: props.location },
              }}
            />
          );
        }

        // Check if user has Admin or Super Admin role (case-sensitive check)
        const adminRoles = ["Admin", "Super Admin"];
        if (!adminRoles.includes(user.role)) {
          // If user is not an Admin or Super Admin, redirect to unauthorized
          console.warn(`AdminRoute: Access denied for ${user.role} trying to access ${props.location.pathname}`);
          return (
            <Redirect
              to={{
                pathname: "/unauthorized",
                state: { from: props.location },
              }}
            />
          );
        }

        // If user is an Admin or Super Admin, render the component
        console.info(`AdminRoute: Granting access to ${user.username} (${user.role}) for ${props.location.pathname}`);
        return <Component {...props} />;
      }}
    />
  );
};

export default AdminRoute; 