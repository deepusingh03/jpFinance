import React, { useEffect, useState, useCallback, memo } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { apiData } from "../utility/api";

/* ------------------ Helpers ------------------ */
const formatDate = (d) => d.toISOString().split("T")[0];

const getToday = () => {
  const today = new Date();
  const f = formatDate(today);
  return { start: f, end: f };
};

const getThisWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: formatDate(monday),
    end: formatDate(sunday),
  };
};

const getThisMonth = () => {
  const now = new Date();
  return {
    start: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

/* ------------------ Stat Card ------------------ */
const StatCard = memo(({ label, value, icon, color }) => (
  <div className={`card shadow-sm border-0 ${color}`}>
    <div className="card-body d-flex align-items-center gap-3">
      <i className={`bi ${icon} fs-1`} />
      <div>
        <div className="text-muted">{label}</div>
        <div className="fw-bold fs-4">{value}</div>
      </div>
    </div>
  </div>
));

/* ------------------ Dashboard ------------------ */
export default function Dashboard() {
  const [filters, setFilters] = useState(getToday());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ------------------ API ------------------ */
  const fetchSummary = useCallback(
    async (customDates) => {
      const { start, end } = customDates || filters;

      if (!start || !end) {
        toast.error("Please select both dates.");
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(
          `${apiData.PORT}/api/dashboard/summary?start=${start}&end=${end}`
        );

        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to load summary");
        }

        const d = data.data || {};
        setSummary({
          totalLoans: d.totalLoans ?? 0,
          totalDisbursed: d.totalDisbursed ?? 0,
          umrnCreated: d.umrnCreated ?? 0,
          umrnPending: d.umrnPending ?? 0,
          docsCompleted: d.docsCompleted ?? 0,
          docsPending: d.docsPending ?? 0,
        });
      } catch (err) {
        toast.error(err.message || "Server error");
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  /* ------------------ Quick Filters ------------------ */
  const applyQuickFilter = (rangeFn) => {
    const range = rangeFn();
    setFilters(range);
    fetchSummary(range);
  };

  return (
    <div className="d-flex">
      <div className="flex-grow-1">
        <div className="p-4">

          <h3 className="fw-bold mb-4">Dashboard Overview</h3>

          {/* Filters */}
          <div className="card shadow-sm border-0 p-3 mb-4">
            <div className="row g-3 align-items-end">

              <div className="col-md-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.start}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, start: e.target.value }))
                  }
                />
              </div>

              <div className="col-md-3">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.end}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, end: e.target.value }))
                  }
                />
              </div>

              <div className="col-md-3">
                <Button
                  className="w-100"
                  onClick={() => fetchSummary()}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Loading
                    </>
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>

              <div className="col-md-3 d-flex gap-2">
                <Button
                  variant="outline-primary"
                  className="w-100"
                  disabled={loading}
                  onClick={() => applyQuickFilter(getToday)}
                >
                  Today
                </Button>
                <Button
                  variant="outline-primary"
                  className="w-100"
                  disabled={loading}
                  onClick={() => applyQuickFilter(getThisWeek)}
                >
                  Week
                </Button>
                <Button
                  variant="outline-primary"
                  className="w-100"
                  disabled={loading}
                  onClick={() => applyQuickFilter(getThisMonth)}
                >
                  Month
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="position-relative">
            {loading && (
              <div className="position-absolute top-50 start-50 translate-middle">
                <Spinner animation="border" variant="primary" />
              </div>
            )}

            {summary && (
              <div className={`row g-3 mb-4 ${loading ? "opacity-50" : ""}`}>
                <div className="col-md-4">
                  <StatCard
                    label="Total Loan Applications"
                    value={summary.totalLoans}
                    icon="bi-clipboard-check"
                    color="bg-primary-subtle"
                  />
                </div>

                <div className="col-md-4">
                  <StatCard
                    label="Total Disbursed Amount"
                    value={`₹${summary.totalDisbursed}`}
                    icon="bi-cash-coin"
                    color="bg-success-subtle"
                  />
                </div>

                <div className="col-md-4">
                  <StatCard
                    label="UMRN Created vs Pending"
                    value={`${summary.umrnCreated} / ${summary.umrnPending}`}
                    icon="bi-repeat"
                    color="bg-warning-subtle"
                  />
                </div>

                <div className="col-md-4">
                  <StatCard
                    label="Documents Completed"
                    value={summary.docsCompleted}
                    icon="bi-file-earmark-check"
                    color="bg-info-subtle"
                  />
                </div>

                <div className="col-md-4">
                  <StatCard
                    label="Documents Pending"
                    value={summary.docsPending}
                    icon="bi-hourglass-split"
                    color="bg-danger-subtle"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
