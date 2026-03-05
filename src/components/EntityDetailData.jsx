import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DetailsPage from "../components/DetailsPage";
import CustomNavbar from "../components/CustomNavbar";
import { apiData } from "../utility/api";
import { Spinner } from "react-bootstrap";

function EntityDetailPage() {
  const { entityType, id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [childRecords, setChildRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -------------------------------
  // Fetch data function (reusable)
  // -------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${apiData.PORT}/api/get/${entityType}?Id=${id}`
      );

      // const response = await fetch(`${apiData.PORT}/api/details/${entityType}/${id}`);
      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      console.log("data ::", data);
      if (data && data.data) {
        let childRecords = [];
        if (entityType !== "users") {
          const childresponse = await fetch(
            `${apiData.PORT}/api/related/childs/${entityType}`
          );
          if (!childresponse.ok)
            throw new Error("Failed to fetch child records");

          const childData = await childresponse.json();
          if (childData && childData.success && childData.data.length > 0) {
            childData.data.forEach((ele) => {
              childRecords.push(ele.child_table + "-" + ele.child_column);
            });
          }
        }
        setChildRecords(childRecords);

        setRecord(data.data[0]);
      } else {
        throw new Error("Invalid data format");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Run fetch when id/entityType changes
  // -------------------------------
  useEffect(() => {
    if (id && entityType) {
      fetchData();
    }
  }, [id, entityType]);

  // -------------------------------
  // Refresh function for child component
  // -------------------------------
  const refreshData = () => {
    fetchData();
  };

  // -------------------------------
  // Render UI
  // -------------------------------

  if (error) {
    return (
      <>
        <CustomNavbar />
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#f8f9fa",
            padding: "20px",
          }}
        >
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <CustomNavbar />
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#f8f9fa",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spinner animation="border" variant="dark" />
        </div>
      </>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <CustomNavbar />

      {record ? (
        <DetailsPage
          data={record}
          childs={childRecords}
          refresh={refreshData} // 👉 sent to child
          onBack={() => navigate(-1)}
          entityName={entityType}
          onEdit={() =>
            navigate(`/details/${entityType}/${id}/edit`, { state: { record } })
          }
        />
      ) : (
        <div className="alert alert-warning">
          <strong>No record found for the specified ID.</strong>
        </div>
      )}
    </div>
  );
}

export default EntityDetailPage;
