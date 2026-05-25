import React, { createContext, useState, useContext, useEffect } from 'react';

// Create ThemeContext
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // Initialize state from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem('userSettings'));
      return savedSettings && savedSettings.darkMode ? true : false;
    } catch (error) {
      console.error('Error loading dark mode from localStorage:', error);
      return false;
    }
  });

  // Apply theme effect whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Also update the ToastContainer theme
    const toastContainer = document.querySelector('.Toastify');
    if (toastContainer) {
      toastContainer.dataset.theme = darkMode ? 'dark' : 'light';
    }
    
    // Save to localStorage
    try {
      const savedSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
      savedSettings.darkMode = darkMode;
      localStorage.setItem('userSettings', JSON.stringify(savedSettings));
    } catch (error) {
      console.error('Error saving dark mode to localStorage:', error);
    }
  }, [darkMode]);

  // Apply dark mode on initial load
  useEffect(() => {
    // Apply theme on initial render
    const isDarkMode = darkMode || (localStorage.getItem('userSettings') && 
      JSON.parse(localStorage.getItem('userSettings')).darkMode);
    
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Listen for changes from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === 'userSettings') {
        try {
          const newSettings = JSON.parse(e.newValue);
          if (newSettings && newSettings.darkMode !== darkMode) {
            setDarkMode(newSettings.darkMode);
          }
        } catch (error) {
          console.error('Error parsing settings from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prevDarkMode => !prevDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 