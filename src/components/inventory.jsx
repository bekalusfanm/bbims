import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import InventoryTable from "./tables/inventoryTable";
import ListGroup from "./common/listGroup";
import Pagination from "./common/pagination";
import { getBloodBags, deleteBloodBag } from "../services/inventoryService";
import { paginate } from "../utils/paginate";
import _ from "lodash";
import { useUser } from "../context/userContext";

const BloodBags = (props) => {
  const user = useUser();
  const [bloodBags, setBloodBags] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(4);
  const [selectedBloodType, setSelectedBloodType] = useState("All Blood Types");
  const [bloodTypes, setBloodTypes] = useState([]);
  const [sortColumn, setSortColumn] = useState({
    path: "bloodType",
    order: "asc",
  });
  const [branchId, setBranchId] = useState("");
  const [date, setDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const tableRef = useRef(null);

  const fetchData = useCallback(async () => {
    console.log("Fetching blood bags data...");
    setIsLoading(true);
    try {
      const bloodBagsData = await getBloodBags();
      console.log("Fetched blood bags:", bloodBagsData);
      
      if (!Array.isArray(bloodBagsData)) {
        console.error("Blood bags data is not an array:", bloodBagsData);
        setError("Invalid data format received from server");
        setBloodBags([]);
        return;
      }
      
      if (bloodBagsData.length === 0) {
        console.log("No blood bags returned from service");
      }
      
      const uniqueBloodTypes = [
        { _id: "", name: "All Blood Types" },
        ...Array.from(
          new Set(bloodBagsData.map((bloodBag) => bloodBag.bloodType))
        ).map((type) => ({ name: type })),
      ];
      
      setBloodBags(bloodBagsData);
      setBloodTypes(uniqueBloodTypes);
      setError("");
    } catch (error) {
      console.error("Error fetching blood bags:", error);
      setError(error.message || "Failed to fetch blood bags");
      setBloodBags([]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const path = props.location && props.location.pathname;
    console.log("Location changed to:", path);
    if (path === "/inventory") {
      console.log("On inventory page, refreshing data");
      fetchData();
    }
  }, [props.location, fetchData]);

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [bloodBags, currentPage]);

  useEffect(() => {
    const handleFocus = () => {
      console.log("Window got focus, refreshing data");
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      if (window.location.pathname === "/inventory") {
        console.log("Route changed to inventory, refreshing data");
        setRefreshTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const handleDelete = async (bloodBag) => {
    try {
      // Only allow Staff Members to delete blood bags
      const currentUser = JSON.parse(localStorage.getItem("user"));
      if (!currentUser || currentUser.role !== "Staff Member") {
        toast.error("Only Staff Members can delete blood bags");
        return;
      }

      const updatedBloodBags = bloodBags.filter((b) => b._id !== bloodBag._id);
      setBloodBags(updatedBloodBags);
      toast.success("Blood bag deleted successfully");
      await deleteBloodBag(bloodBag._id);
    } catch (error) {
      toast.error("Failed to delete blood bag");
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

  const handleAddBloodBag = (newBloodBag) => {
    setBloodBags([...bloodBags, newBloodBag]);
  };

  const { length: count } = bloodBags;

  if (isLoading) return (
    <div className="container mt-4">
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading inventory data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="container mt-4">
      <div className="alert alert-danger">
        <h4>Error</h4>
        <p>{error}</p>
        <button className="btn btn-outline-danger mt-2" onClick={fetchData}>
          Retry
        </button>
      </div>
    </div>
  );
  
  if (count === 0) return (
    <div className="container mt-4">
      <div className="alert alert-info">
        <h4>There are no blood bags in the database</h4>
        <p>You need to register donors first, then you can register blood bags.</p>
        {user && user.role === "Staff Member" && (
          <div>
            <Link to="/donors/new" className="btn btn-primary mt-2 me-2">
              Add New Donor
            </Link>
            <Link to="/inventory/new" className="btn btn-success mt-2">
              Create Blood Bag
            </Link>
          </div>
        )}
        {user && (user.role === "Admin" || user.role === "Super Admin") && (
          <div className="alert alert-warning mt-3">
            <i className="fas fa-info-circle mr-2"></i>
            <strong>Note:</strong> As a {user.role}, you can monitor inventory but cannot create blood bags. 
            Please ask Staff Members to update the inventory.
          </div>
        )}
      </div>
    </div>
  );

  const filteredBloodBags = bloodBags.filter((bloodBag) => {
    const collectionDate = new Date(bloodBag.collectionDate);
    const bagYear = collectionDate.getFullYear();
    const bagMonth = collectionDate.getMonth() + 1;
    const bagDate = collectionDate.getDate();

    return (
      (!selectedBloodType ||
        selectedBloodType === "All Blood Types" ||
        bloodBag.bloodType === selectedBloodType) &&
      (!branchId || bloodBag.branchId === branchId) &&
      (!date || bagDate === parseInt(date, 10)) &&
      (!month || bagMonth === parseInt(month, 10)) &&
      (!year || bagYear === parseInt(year, 10))
    );
  });

  const sorted = _.orderBy(
    filteredBloodBags,
    [
      (item) => {
        if (
          sortColumn.path === "collectionDate" ||
          sortColumn.path === "expiryDate"
        ) {
          return new Date(item[sortColumn.path]);
        }
        return item[sortColumn.path];
      },
    ],
    [sortColumn.order]
  );

  const bloodBagsPaginated = paginate(sorted, currentPage, pageSize);

  return (
    <div className="row">
      <div className="col-3">
        <div>
          {user && user.role === "Super Admin" && (
            <input
              type="text"
              className="form-control"
              style={{
                width: "200px",
                marginBottom: "20px",
              }}
              placeholder="Enter Branch ID"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            />
          )}
        </div>
        <ListGroup
          items={bloodTypes}
          selectedItem={selectedBloodType}
          onItemSelect={handleBloodTypeSelect}
          defaultItem="All Blood Types"
        />
        {user && (user.role === "Super Admin" || user.role === "Admin") && (
          <div className="mb-3">
            <div className="row">
              <div className="col-2">
                <input
                  type="number"
                  className="form-control"
                  style={{
                    width: "70px",
                    marginTop: "20px",
                  }}
                  placeholder="DD"
                  min="1"
                  max="31"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="col-2">
                <input
                  type="number"
                  className="form-control"
                  style={{
                    width: "70px",
                    marginTop: "20px",
                  }}
                  placeholder="MM"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
              <div className="col-2">
                <input
                  type="number"
                  className="form-control"
                  style={{
                    width: "70px",
                    marginTop: "20px",
                  }}
                  placeholder="YY"
                  min="1900"
                  max="2100"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="col">
        {user && user.role === "Staff Member" && (
          <Link to="/inventory/new" className="btn btn-primary mb-3">
            New Blood Bag
          </Link>
        )}
        <p>Showing {filteredBloodBags.length} blood bags in the database.</p>
        <InventoryTable
          bloodBags={bloodBagsPaginated}
          sortColumn={sortColumn}
          onDelete={handleDelete}
          onSort={handleSort}
          ref={tableRef}
        />
        <Pagination
          itemsCount={filteredBloodBags.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default BloodBags;
