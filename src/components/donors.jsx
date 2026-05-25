import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import DonorTable from "./tables/donorTable";
import ListGroup from "./common/listGroup";
import Pagination from "./common/pagination";
import { getDonors, deleteDonor } from "../services/donorService";
import { paginate } from "../utils/paginate";
import _ from "lodash";
import { useUser } from "../context/userContext";

const Donors = () => {
  const user = useUser(); // Get the current user context
  const [donors, setDonors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [selectedBloodType, setSelectedBloodType] = useState("All Blood Types");
  const [bloodTypes, setBloodTypes] = useState([]);
  const [sortColumn, setSortColumn] = useState({
    path: "personalInfo.name",
    order: "asc",
  });
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState("");
  const tableRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const donorsData = await getDonors();
        const uniqueBloodTypes = [
          { _id: "", name: "All Blood Types" },
          ...Array.from(
            new Set(donorsData.map((donor) => donor.healthInfo.bloodType))
          ).map((type) => ({ name: type })),
        ];
        setDonors(donorsData);
        setBloodTypes(uniqueBloodTypes);
      } catch (error) {
        console.error("Failed to fetch donors", error);
        setError("Failed to fetch donors");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [donors, currentPage]);

  const handleDelete = async (donor) => {
    try {
      // Only allow Staff Members to delete donors
      if (user.role !== "Staff Member") {
        toast.error("Only Staff Members can delete donors");
        return;
      }

      const originalDonors = [...donors];
      const updatedDonors = donors.filter((d) => d._id !== donor._id);
      setDonors(updatedDonors);
      
      try {
        await deleteDonor(donor._id);
        toast.success("Donor deleted successfully");
      } catch (ex) {
        toast.error("Could not delete donor");
        setDonors(originalDonors);
      }
    } catch (error) {
      toast.error("An error occurred while deleting the donor");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleBloodTypeSelect = (bloodType) => {
    setSelectedBloodType(bloodType === "All Blood Types" ? null : bloodType);
    setCurrentPage(1);
  };

  const handleSort = (sortColumn) => {
    setSortColumn(sortColumn);
  };

  const { length: count } = donors;

  if (error) return <p className="alert alert-danger m-3">{error}</p>;
  
  if (count === 0) return (
    <div className="container mt-4">
      <div className="alert alert-info">
        <h4>There are no donors in the database</h4>
        <p>You need to register donors before you can register blood bags.</p>
        {user && user.role === "Staff Member" && (
          <Link to="/donors/new" className="btn btn-primary mt-2">
            Add New Donor
          </Link>
        )}
        {user && user.role === "Admin" && (
          <div className="alert alert-warning mt-3">
            <i className="fas fa-info-circle mr-2"></i>
            <strong>Note:</strong> As a Branch Admin, you can monitor donors but cannot register new donors. 
            Please ask Staff Members to register donors.
          </div>
        )}
      </div>
    </div>
  );

  const filteredDonors = donors.filter((donor) => {
    return (
      (!selectedBloodType ||
        selectedBloodType === "All Blood Types" ||
        donor.healthInfo.bloodType === selectedBloodType) &&
      (!branchId || donor.branchId === branchId)
    );
  });

  const sorted = _.orderBy(
    filteredDonors,
    [
      (item) => {
        return item[sortColumn.path];
      },
    ],
    [sortColumn.order]
  );

  const donorsPaginated = paginate(sorted, currentPage, pageSize);

  return (
    <div className="row">
      <div className="col-3">
        <ListGroup
          items={bloodTypes}
          selectedItem={selectedBloodType}
          onItemSelect={handleBloodTypeSelect}
          defaultItem="All Blood Types"
        />
        {user.role === "Super Admin" && (
          <React.Fragment>
            <input
              type="text"
              className="form-control"
              style={{ width: "200px", marginTop: "20px" }}
              placeholder="Branch ID"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            />
          </React.Fragment>
        )}
      </div>
      <div className="col">
        <div ref={tableRef}>
          <p className="text-center" style={{ fontSize: "30px" }}>
            Showing {filteredDonors.length} donors in the database.
          </p>
          {user && user.role === "Staff Member" && (
            <div className="d-flex mb-3">
              <Link
                to="/donors/new"
                className="btn btn-primary"
                style={{ marginLeft: 50, height: 40 }}
              >
                Add New Donor
              </Link>
            </div>
          )}
          <DonorTable
            donors={donorsPaginated}
            sortColumn={sortColumn}
            onDelete={user.role === "Staff Member" ? handleDelete : null}
            onSort={handleSort}
            showDelete={user.role === "Staff Member"} // Only Staff Members can delete
            userRole={user.role} // Pass user role to DonorTable
          />
          <Pagination
            itemsCount={filteredDonors.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Donors;
