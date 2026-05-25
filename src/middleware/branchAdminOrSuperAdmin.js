import React from "react";
import { Route, Redirect } from "react-router-dom";

/**
 * Branch Admin Or Super Admin Route middleware
 * Protects routes that should only be accessible to Branch Admin (role 'Admin') and Super Admin users
 */
const BranchAdminOrSuperAdminRoute = ({ component: Component, ...rest }) => {
  // Define a function to check user role - this ensures fresh data each render
  const checkUserRole = () => {
    try {
      // Get the user from localStorage
      const userString = localStorage.getItem("user");
      
      if (!userString) {
        console.warn("BranchAdminOrSuperAdminRoute: No user found in localStorage");
        return null;
      }
      
      const user = JSON.parse(userString);
      
      if (!user || !user.role) {
        console.warn("BranchAdminOrSuperAdminRoute: Invalid user data in localStorage", user);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error("BranchAdminOrSuperAdminRoute: Error parsing user data", error);
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
          console.warn(`BranchAdminOrSuperAdminRoute: Redirecting to login from ${props.location.pathname}`);
          return (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: props.location },
              }}
            />
          );
        }

        // Check if user has Admin (Branch Admin) or Super Admin role (case-sensitive check)
        const allowedRoles = ["Admin", "Super Admin"];
        if (!allowedRoles.includes(user.role)) {
          // If user does not have an allowed role, redirect to unauthorized
          console.warn(`BranchAdminOrSuperAdminRoute: Access denied for ${user.role} trying to access ${props.location.pathname}`);
          return (
            <Redirect
              to={{
                pathname: "/unauthorized",
                state: { from: props.location },
              }}
            />
          );
        }

        // If user has allowed role, render the component
        console.info(`BranchAdminOrSuperAdminRoute: Granting access to ${user.username} (${user.role}) for ${props.location.pathname}`);
        return <Component {...props} />;
      }}
    />
  );
};

export default BranchAdminOrSuperAdminRoute; 