import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import styled from "styled-components";
import userService from "../services/userService";
import { useTheme } from '../context/ThemeContext';

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const SettingsCard = styled.div`
  background: var(--card-background);
  border-radius: 10px;
  box-shadow: 0 4px 16px var(--shadow-color);
  margin-bottom: 20px;
  border: 1px solid var(--border-color);
`;

const SettingsHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
`;

const SettingsIcon = styled.i`
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-right: 15px;
`;

const SettingsTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
`;

const SettingsBody = styled.div`
  padding: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color);
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 15px;
  border: 1px solid var(--input-border);
  border-radius: 5px;
  font-size: 1rem;
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: border-color 0.2s;

  &:focus {
    border-color: #007bff;
    outline: none;
  }

  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.7;
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px 15px;
  border: 1px solid var(--input-border);
  border-radius: 5px;
  font-size: 1rem;
  background-color: var(--input-bg);
  color: var(--text-color);
  transition: border-color 0.2s;

  &:focus {
    border-color: #007bff;
    outline: none;
  }

  option {
    background-color: var(--input-bg);
    color: var(--text-color);
  }
`;

const ToggleSwitch = styled.div`
  display: flex;
  align-items: center;
`;

const ToggleLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 30px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;

  &:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + & {
    background-color: var(--primary-color);
  }

  input:checked + &:before {
    transform: translateX(30px);
  }

  /* Moon and sun icons for dark mode toggle */
  &:after {
    content: '☀️';
    position: absolute;
    right: 8px;
    top: 5px;
    font-size: 14px;
    transition: 0.4s;
    opacity: 1;
  }

  input:checked + &:after {
    content: '🌙';
    right: auto;
    left: 8px;
    opacity: 1;
  }
`;

const ToggleText = styled.span`
  margin-left: 15px;
  font-weight: 500;
  color: var(--text-color);
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:not(:last-child) {
    margin-right: 10px;
  }
`;

const SaveButton = styled(Button)`
  background-color: #007bff;
  color: #fff;
  
  &:hover {
    background-color: #0069d9;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f8f9fa;
  color: #212529;
  
  &:hover {
    background-color: #e2e6ea;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 5px;
  display: ${props => (props.visible ? 'block' : 'none')};
`;

const SuccessMessage = styled.div`
  color: #28a745;
  font-size: 0.875rem;
  margin-top: 5px;
  display: ${props => (props.visible ? 'block' : 'none')};
`;

const PasswordDropdownHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 0;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  
  &:hover {
    background-color: var(--hover-bg);
  }
`;

const PasswordDropdownTitle = styled.div`
  display: flex;
  align-items: center;
`;

const PasswordDropdownContent = styled.div`
  max-height: ${props => props.isOpen ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  padding-top: ${props => props.isOpen ? '20px' : '0'};
`;

const DropdownIcon = styled.i`
  transition: transform 0.3s ease;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0)'};
`;

const Settings = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || {});
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: darkMode,
    language: 'en',
    email: user.email || '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [isPasswordDropdownOpen, setIsPasswordDropdownOpen] = useState(false);

  // Load user settings from localStorage or API
  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem("userSettings"));
    if (savedSettings) {
      setSettings(prevSettings => ({
        ...prevSettings,
        ...savedSettings
      }));
    }
  }, []);

  // Keep local settings in sync with ThemeContext
  useEffect(() => {
    setSettings(prevSettings => ({
      ...prevSettings,
      darkMode
    }));
  }, [darkMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setSettings({
      ...settings,
      [name]: newValue
    });
    
    // Use ThemeContext for dark mode toggle
    if (name === 'darkMode') {
      toggleDarkMode();
    }
  };
  
  const togglePasswordDropdown = () => {
    setIsPasswordDropdownOpen(!isPasswordDropdownOpen);
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
    
    // Clear success message when user starts typing again
    if (passwordChanged) {
      setPasswordChanged(false);
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordForm.oldPassword) {
      newErrors.oldPassword = "Current password is required";
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // In a real app, we would call the API
      // Example:
      // await userService.updateUserSettings(settings);
      
      // For demo purposes, just update localStorage
      localStorage.setItem("userSettings", JSON.stringify({
        notifications: settings.notifications,
        darkMode: settings.darkMode,
        language: settings.language
      }));
      
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate the form first
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // For a real implementation that connects to the backend:
      // await userService.changePassword({
      //   userId: user._id,
      //   oldPassword: passwordForm.oldPassword,
      //   newPassword: passwordForm.newPassword
      // });
      
      // TEMPORARY FIX: Accept any password for the demo
      // In a real app, you would verify the password with the server
      
      console.log("Password accepted for demo purposes");
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the stored password
      localStorage.setItem("userPassword", passwordForm.newPassword);
      
      // Clear the form
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Show success message
      setPasswordChanged(true);
      
      // Show toast notification
      toast.success("Password changed successfully");
      
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContainer>
      <h1 className="mb-4">Settings</h1>
      
      {/* Appearance Settings */}
      <SettingsCard>
        <SettingsHeader>
          <SettingsIcon className="fas fa-palette" />
          <SettingsTitle>Appearance</SettingsTitle>
        </SettingsHeader>
        <SettingsBody>
          <FormGroup>
            <ToggleSwitch>
              <ToggleLabel>
                <input 
                  type="checkbox" 
                  name="darkMode" 
                  checked={settings.darkMode}
                  onChange={handleChange}
                />
                <ToggleSlider />
              </ToggleLabel>
              <ToggleText>Dark Mode</ToggleText>
            </ToggleSwitch>
          </FormGroup>
          
          <FormGroup>
            <FormLabel>Language</FormLabel>
            <FormSelect 
              name="language" 
              value={settings.language}
              onChange={handleChange}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="ar">Arabic</option>
            </FormSelect>
          </FormGroup>
        </SettingsBody>
      </SettingsCard>
      
      {/* Notification Settings */}
      <SettingsCard>
        <SettingsHeader>
          <SettingsIcon className="fas fa-bell" />
          <SettingsTitle>Notifications</SettingsTitle>
        </SettingsHeader>
        <SettingsBody>
          <FormGroup>
            <ToggleSwitch>
              <ToggleLabel>
                <input 
                  type="checkbox" 
                  name="notifications" 
                  checked={settings.notifications}
                  onChange={handleChange}
                />
                <ToggleSlider />
              </ToggleLabel>
              <ToggleText>Enable Notifications</ToggleText>
            </ToggleSwitch>
          </FormGroup>
        </SettingsBody>
      </SettingsCard>
      
      {/* Account Settings */}
      <SettingsCard>
        <SettingsHeader>
          <SettingsIcon className="fas fa-user-cog" />
          <SettingsTitle>Account</SettingsTitle>
        </SettingsHeader>
        <SettingsBody>
          <FormGroup>
            <FormLabel>Email Address</FormLabel>
            <FormInput 
              type="email" 
              name="email" 
              value={settings.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={user.role === "Super Admin"} // Disable for Super Admin for safety
            />
            {user.role === "Super Admin" && (
              <small className="text-muted">Super Admin email cannot be changed for security reasons.</small>
            )}
          </FormGroup>
          
          {/* Password Change Dropdown */}
          <PasswordDropdownHeader onClick={togglePasswordDropdown}>
            <PasswordDropdownTitle>
              <SettingsIcon className="fas fa-key" />
              <span><strong>Change Password</strong></span>
            </PasswordDropdownTitle>
            <DropdownIcon 
              className="fas fa-chevron-down" 
              isOpen={isPasswordDropdownOpen}
            />
          </PasswordDropdownHeader>
          
          <PasswordDropdownContent isOpen={isPasswordDropdownOpen}>
            <SuccessMessage visible={passwordChanged}>
              Your password has been changed successfully.
            </SuccessMessage>
            
            <form onSubmit={handleChangePassword}>
              <FormGroup>
                <FormLabel>Current Password</FormLabel>
                <FormInput 
                  type="password" 
                  name="oldPassword" 
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                />
                <ErrorMessage visible={errors.oldPassword}>
                  {errors.oldPassword}
                </ErrorMessage>
              </FormGroup>
              
              <FormGroup>
                <FormLabel>New Password</FormLabel>
                <FormInput 
                  type="password" 
                  name="newPassword" 
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />
                <ErrorMessage visible={errors.newPassword}>
                  {errors.newPassword}
                </ErrorMessage>
              </FormGroup>
              
              <FormGroup>
                <FormLabel>Confirm New Password</FormLabel>
                <FormInput 
                  type="password" 
                  name="confirmPassword" 
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
                <ErrorMessage visible={errors.confirmPassword}>
                  {errors.confirmPassword}
                </ErrorMessage>
              </FormGroup>
              
              <ButtonGroup>
                <SaveButton 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </SaveButton>
              </ButtonGroup>
            </form>
          </PasswordDropdownContent>
        </SettingsBody>
      </SettingsCard>
      
      <ButtonGroup>
        <CancelButton type="button" onClick={() => window.history.back()}>Cancel</CancelButton>
        <SaveButton 
          type="button" 
          onClick={handleSaveSettings}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </SaveButton>
      </ButtonGroup>
    </SettingsContainer>
  );
};

export default Settings; 