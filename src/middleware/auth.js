import React from "react";
import { Route, Redirect } from "react-router-dom";

/**
 * Protected Route middleware
 * Ensures users are authenticated before accessing protected routes
 */
const ProtectedRoute = ({ component: Component, ...rest }) => {
  // Define a function to check user authentication - this ensures fresh data each render
  const checkAuthentication = () => {
    try {
      // Get the user from localStorage
      const userString = localStorage.getItem("user");
      
      if (!userString) {
        console.warn("ProtectedRoute: No user found in localStorage");
        return null;
      }
      
      const user = JSON.parse(userString);
      
      if (!user) {
        console.warn("ProtectedRoute: Invalid user data in localStorage");
        return null;
      }
      
      return user;
    } catch (error) {
      console.error("ProtectedRoute: Error parsing user data", error);
      return null;
    }
  };
  
  return (
    <Route
      {...rest}
      render={(props) => {
        // Check user on each render to ensure fresh data
        const user = checkAuthentication();
        
        if (!user) {
          // If no user is logged in, redirect to login
          console.warn(`ProtectedRoute: Redirecting to login from ${props.location.pathname}`);
          return (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: props.location },
              }}
            />
          );
        }

        // If user is authenticated, render the component
        console.info(`ProtectedRoute: Granting access to ${user.username} (${user.role}) for ${props.location.pathname}`);
        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute; 