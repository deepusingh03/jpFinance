import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import CustomNavbar from "../components/CustomNavbar";

function SettingsPage() {
  const navigate = useNavigate();

  const settingsCards = [
    {
      id: 1,
      icon: "bank2",
      label: "ECS Setting",
      description: "Configure Electronic Clearing Service settings and payment preferences",
      route: "/settings/ecs",
      bgColor: "bg-primary",
    },
    {
      id: 2,
      icon: "people",
      label: "Users",
      description: "Manage user accounts, roles, and access permissions",
      route: "/settings/users",
      bgColor: "bg-success",
    },
    {
      id: 3,
      icon: "building",
      label: "Customer Banks",
      description: "Add and manage customer banking institutions and details",
      route: "/settings/customer-banks",
      bgColor: "bg-info",
    },
    {
      id: 4,
      icon: "shield-check",
      label: "Insurance Companies",
      description: "Configure insurance providers and policy information",
      route: "/settings/insurance",
      bgColor: "bg-warning",
    },
    {
      id: 5,
      icon: "cash-coin",
      label: "Loan Default Value",
      description: "Set default loan parameters, interest rates, and terms",
      route: "/settings/loan-defaults",
      bgColor: "bg-danger",
    },
    {
      id: 6,
      icon: "gear",
      label: "More",
      description: "Additional settings and system configurations",
      route: "/settings/more",
      bgColor: "bg-secondary",
    },
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  return (
    <>
      <CustomNavbar />
      
      <Container fluid className="p-4">
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="mb-1">Settings</h4>
            <p className="text-muted mb-0">Configure and manage your system preferences</p>
          </div>
        </div>

        {/* Settings Cards Grid */}
        <Row>
          {settingsCards.map((card) => (
            <Col key={card.id} xs={12} sm={6} md={4} lg={4} className="mb-4">
              <Card 
                className="h-100 shadow-sm border-0 cursor-pointer"
                onClick={() => handleCardClick(card.route)}
              >
                <Card.Body className="p-4">
                  <div className="d-flex align-items-start">
                    <div className={`rounded-circle p-3 ${card.bgColor} text-white me-3`}>
                      <i className={`bi bi-${card.icon} fs-4`}></i>
                    </div>
                    <div>
                      <h5 className="card-title mb-2">{card.label}</h5>
                      <p className="card-text text-muted mb-3 small">{card.description}</p>
                      <span className="text-primary small fw-semibold">
                        Configure <i className="bi bi-arrow-right ms-1"></i>
                      </span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Stats Section */}
        {/* <Card className="border-0 shadow-sm mt-4">
          <Card.Body>
            <h5 className="mb-4">System Overview</h5>
            <Row className="text-center">
              <Col xs={6} md={3} className="mb-3">
                <div className="p-3 bg-light rounded">
                  <h3 className="text-primary mb-1">24</h3>
                  <p className="text-muted mb-0 small">Active Users</p>
                </div>
              </Col>
              <Col xs={6} md={3} className="mb-3">
                <div className="p-3 bg-light rounded">
                  <h3 className="text-success mb-1">12</h3>
                  <p className="text-muted mb-0 small">Bank Accounts</p>
                </div>
              </Col>
              <Col xs={6} md={3} className="mb-3">
                <div className="p-3 bg-light rounded">
                  <h3 className="text-warning mb-1">8</h3>
                  <p className="text-muted mb-0 small">Insurance Providers</p>
                </div>
              </Col>
              <Col xs={6} md={3} className="mb-3">
                <div className="p-3 bg-light rounded">
                  <h3 className="text-info mb-1">156</h3>
                  <p className="text-muted mb-0 small">Active Loans</p>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card> */}
      </Container>

      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cursor-pointer:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        }
        .rounded-circle {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </>
  );
}

export default SettingsPage;