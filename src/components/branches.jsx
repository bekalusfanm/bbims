import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import BranchTable from "./tables/branchTable"; // Assuming this component is similar to InventoryTable
import Pagination from "./common/pagination";
import { getAllBranches, deleteBranch } from "../services/branchService"; // Adjust the import path if needed
import { paginate } from "../utils/paginate";
import _ from "lodash";

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(4);
  const [selectedAdmin, setSelectedAdmin] = useState("All Admins");
  const [admins, setAdmins] = useState([]);
  const [sortColumn, setSortColumn] = useState({
    path: "name",
    order: "asc",
  });
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState("");
  const tableRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const branchesData = await getAllBranches();
        const uniqueAdmins = [
          { _id: "", name: "All Admins" },
          ...Array.from(
            new Set(branchesData.map((branch) => branch.adminId))
          ).map((adminId) => ({ name: adminId })),
        ];
        setBranches(branchesData);
        setAdmins(uniqueAdmins);
        setSelectedAdmin("All Admins"); // Ensure default is set
      } catch (error) {
        console.error(error);
        setError("Failed to fetch branches");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // After sorting, scroll to the top of the table to maintain position
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [branches, currentPage]);

  const handleDelete = async (branch) => {
    try {
      const originalBranches = [...branches]; // Save original list for rollback
      
      // Optimistically update UI
      const updatedBranches = branches.filter((b) => b._id !== branch._id);
      setBranches(updatedBranches);
      
      // Call the API to delete the branch
      console.log(`Attempting to delete branch: ${branch._id} (${branch.name})`);
      const deleteResult = await deleteBranch(branch._id);
      
      // If deletion failed, restore the original list
      if (!deleteResult) {
        console.warn("Delete operation returned false, rolling back UI changes");
        setBranches(originalBranches);
        // No toast needed, the service will handle it
      } else {
        console.log("Branch successfully deleted from database");
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
      
      // Rollback UI changes
      const originalBranches = await getAllBranches();
      setBranches(originalBranches);
      
      // Show error toast
      toast.error(`Failed to delete branch: ${error.message || "Unknown error"}`);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAdminSelect = (admin) => {
    setSelectedAdmin(admin === "All Admins" ? null : admin);
    setCurrentPage(1);
  };

  const handleSort = (sortColumn) => {
    setSortColumn(sortColumn);
  };

  const { length: count } = branches;

  if (error) return <p>{error}</p>;
  if (count === 0) return <p>There are no branches in the database</p>;

  const filteredBranches = branches.filter((branch) => {
    return (
      (!selectedAdmin ||
        selectedAdmin === "All Admins" ||
        branch.adminId === selectedAdmin) &&
      (!branchId || branch._id === branchId)
    );
  });

  const sorted = _.orderBy(
    filteredBranches,
    [sortColumn.path],
    [sortColumn.order]
  );

  const branchesPaginated = paginate(sorted, currentPage, pageSize);

  return (
    <div className="row">
      <div className="col">
        <div ref={tableRef}>
          <p className="text-center" style={{ fontSize: "30px" }}>
            Showing {filteredBranches.length} branches in the database.
          </p>
          <div className="d-flex mb-3">
            <input
              type="text"
              className="form-control mb-3"
              style={{ width: "200px", marginLeft: "100px" }}
              placeholder="Enter Branch ID"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            />
          </div>
          <BranchTable
            branches={branchesPaginated}
            sortColumn={sortColumn}
            onDelete={handleDelete}
            onSort={handleSort}
          />
          <Pagination
            itemsCount={filteredBranches.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
          <Link
            to="/branches/new"
            className="btn btn-primary"
            style={{ marginLeft: 900, height: 40 }}
          >
            {" "}
            Create Branch
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Branches;
