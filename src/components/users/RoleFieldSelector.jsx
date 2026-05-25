import React, { useState } from 'react';

// Simple standalone component for testing role-based field switching
const RoleFieldSelector = () => {
  const [role, setRole] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [branchId, setBranchId] = useState('');
  
  // Sample branches for the dropdown
  const branches = [
    { _id: '1', name: 'Branch A' },
    { _id: '2', name: 'Branch B' },
    { _id: '3', name: 'Branch C' }
  ];

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    console.log(`Role changed to: ${newRole}`);
    setRole(newRole);
    
    // Clear fields when role changes
    setHospitalName('');
    setBranchId('');
  };

  return (
    <div className="container mt-4 p-4 border">
      <h3>Role Field Selector Test</h3>
      
      <div className="form-group">
        <label>Role</label>
        <select
          name="role"
          className="form-control"
          value={role}
          onChange={handleRoleChange}
        >
          <option value="">Select Role</option>
          <option value="Super Admin">Super Admin</option>
          <option value="Admin">Admin</option>
          <option value="Hospital Admin">Hospital Admin</option>
          <option value="Staff Member">Staff Member</option>
        </select>
      </div>

      {role === "Hospital Admin" ? (
        <div className="form-group" style={{ backgroundColor: '#f0f8ff', padding: '10px' }}>
          <label>Hospital Name</label>
          <input
            type="text"
            name="hospitalName"
            className="form-control"
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            placeholder="Enter hospital name"
          />
        </div>
      ) : role !== "" ? (
        <div className="form-group" style={{ backgroundColor: '#f5f5f5', padding: '10px' }}>
          <label>Branch</label>
          <select
            name="branchId"
            className="form-control"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">Select Branch</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="alert alert-info mt-3">
        <strong>Current State:</strong><br/>
        Role: {role}<br/>
        Show Hospital Name: {(role === "Hospital Admin").toString()}<br/>
        Show Branch: {(role !== "Hospital Admin" && role !== "").toString()}<br/>
        Hospital Name Value: {hospitalName}<br/>
        Branch ID Value: {branchId}
      </div>
    </div>
  );
};

export default RoleFieldSelector; 