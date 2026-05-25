import React, { useState, useEffect } from "react";
import { AllBranches } from "../services/branchService";
import "../styles/donationLocations.css";

const DonationLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await AllBranches();
        setLocations(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching donation locations:", error);
        setError("Error fetching donation locations.");
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  if (loading) {
    return <p>Loading donation locations...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="donation-locations-container fade-in">
      <h2 className="title fade-in">Donation Locations</h2>
      <ul className="list fade-in">
        {locations.map((location, index) => (
          <li key={index} className="list-item">
            <strong>{location.name}</strong>: {location.location}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonationLocations;
