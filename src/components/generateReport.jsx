// GenerateReport.js
import React from "react";
import { useNavigate } from "react-router-dom";

const GenerateReport = ({ bloodBags }) => {
  const navigate = useNavigate();

  const handleGenerateReport = () => {
    navigate("/report", { state: { bloodBags } });
  };

  return (
    <div className="d-flex justify-content-center mt-4">
      <button className="btn btn-secondary" onClick={handleGenerateReport}>
        Generate Report
      </button>
    </div>
  );
};

export default GenerateReport;
