import React, { useState,useEffect } from "react";
import {
  Navbar,
  Container,
  Nav,
  Offcanvas,
  Button,
  ListGroup,
  Badge,
} from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { helperMethods } from "../utility/CMPhelper";
function CustomNavbar() {
  const [userName, setUserName] = useState(null);
  const [userInitials, setUserInitials] = useState("");
  const [showLeftMenu, setShowLeftMenu] = useState(false);
  const [showRightMenu, setShowRightMenu] = useState(false);
  useEffect(() => {
      fetchUser();
  }, []);  // Empty dependency array ensures it only runs once
  const fetchUser = async () => {
    const localUserData = JSON.parse(localStorage.getItem("userData"));
    const userRecord = await helperMethods.getEntityDetails(`users?Id=${localUserData?.Id || localUserData?.user?.Id}`);
    const user = userRecord[0] || null
    if (user && user.Id) {
      const fullName = `${user.FirstName} ${user.LastName}`;
      setUserName(fullName);

      const initials = `${user.FirstName.charAt(0)}${user.LastName.charAt(0)}`.toUpperCase();
      setUserInitials(initials);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/";
  };

  // Avatar component
  const Avatar = ({ size = "md", showName = false }) => {
    const sizeMap = {
      sm: { width: "45px", height: "45px", fontSize: "16px" },
      md: { width: "60px", height: "60px", fontSize: "20px" },
      lg: { width: "90px", height: "90px", fontSize: "32px" },
    };

    const avatarSize = sizeMap[size];

    return (
      <div className="d-flex align-items-center">
        <div
          style={{
            width: avatarSize.width,
            height: avatarSize.height,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "600",
            fontSize: avatarSize.fontSize,
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
            border: "3px solid white",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          className="avatar-hover"
        >
          {userInitials || "?"}
        </div>
        {showName && (
          <span className="fw-semibold ms-3 d-lg-inline">
            {userName || "Loading..."}
          </span>
        )}
      </div>
    );
  };

  const menuItems = [
    { to: "/", label: "Dashboard", icon: "speedometer2" },
    { to: "/dealers", label: "Dealers", icon: "shop" },
    { to: "/customers", label: "Customers", icon: "people" },
    { to: "/brands", label: "Brands", icon: "tag" },
    { to: "/products", label: "Products", icon: "box-seam" },
    { to: "/loans", label: "Loans", icon: "cash-coin" },
    { to: "/portal/loans", label: "Loan Portal", icon: "globe" },
    { to: "/portal/emis", label: "EMI Portal", icon: "bank" },
  ];

  return (
    <>
      <style>{`
        .avatar-hover:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4) !important;
        }

        .nav-link-custom {
          position: relative;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .nav-link-custom:hover {
          background-color: rgba(102, 126, 234, 0.1);
          transform: translateY(-2px);
        }

        .nav-link-custom.active {
          color: #5544ed !important; 

        }


        .offcanvas-profile-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          color: white;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }

        .list-group-item-custom {
          border: none;
          border-radius: 8px;
          margin-bottom: 8px;
          transition: all 0.3s ease;
          padding: 12px 16px;
        }

        .list-group-item-custom:hover {
          background-color: rgba(102, 126, 234, 0.1);
          transform: translateX(8px);
        }

        .logout-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .mobile-nav-link {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 8px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-nav-link:hover {
          background-color: rgba(102, 126, 234, 0.1);
          transform: translateX(8px);
        }

        .mobile-nav-link.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
        }

        .navbar-custom {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          border-bottom: 1px solid rgba(102, 126, 234, 0.1);
        }
      `}</style>

      {/* ================= NAVBAR ================= */}
      <Navbar bg="white" className="navbar-custom px-3 py-2">
        <Container fluid>
          {/* LEFT PROFILE ICON */}
          <div onClick={() => setShowLeftMenu(true)}>
            <Avatar size="sm" showName={true} />
          </div>

          {/* DESKTOP NAV (lg+) */}
          <Nav className="d-none d-lg-flex align-items-center gap-2">
            {menuItems.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link nav-link-custom fw-medium ${
                    isActive ? "active" : "text-dark"
                  }`
                }
              >
                <i className={`bi bi-${item.icon} me-2`}></i>
                {item.label}
              </NavLink>
            ))}
          </Nav>

          {/* MOBILE MENU BUTTON */}
          <Button
            variant="outline-primary"
            className="d-lg-none"
            style={{
              borderRadius: "8px",
              border: "2px solid #667eea",
            }}
            onClick={() => setShowRightMenu(true)}
          >
            <i className="bi bi-list fs-4"></i>
          </Button>
        </Container>
      </Navbar>

      {/* ================= LEFT OFFCANVAS ================= */}
      <Offcanvas
        show={showLeftMenu}
        onHide={() => setShowLeftMenu(false)}
        placement="start"
      >
        <Offcanvas.Header closeButton className="border-bottom" />
        <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
          <div>
            {/* Profile Card */}
            <div className="offcanvas-profile-card text-center">
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "700",
                  fontSize: "32px",
                  margin: "0 auto 16px",
                  border: "4px solid rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {userInitials || "?"}
              </div>
              <h5 className="mb-1">{userName || "Loading..."}</h5>
              <Badge bg="light" text="dark" className="px-3 py-2">
                <i className="bi bi-briefcase me-2"></i>
                Dealer Manager
              </Badge>
            </div>

            {/* Menu Items */}
            <ListGroup variant="flush">
              <ListGroup.Item
                action
                as={NavLink}
                to="/profile"
                className="list-group-item-custom"
              >
                <i className="bi bi-person me-3"></i>
                View Profile
              </ListGroup.Item>
              <ListGroup.Item
                action
                as={NavLink}
                to="/setting"
                className="list-group-item-custom"
              >
                <i className="bi bi-people me-3"></i>
                Settings
              </ListGroup.Item>
              {/* <ListGroup.Item
                action
                as={NavLink}
                to="/companyinfo"
                className="list-group-item-custom"
              >
                <i className="bi bi-building me-3"></i>
                ECS Details
              </ListGroup.Item> */}
            </ListGroup>
          </div>

          <Button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </Button>
        </Offcanvas.Body>
      </Offcanvas>

      {/* ================= RIGHT OFFCANVAS (MOBILE) ================= */}
      <Offcanvas
        show={showRightMenu}
        onHide={() => setShowRightMenu(false)}
        placement="end"
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold">
            <i className="bi bi-list-ul me-2"></i>
            Menu
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="p-3">
          <Nav className="flex-column">
            {menuItems.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link mobile-nav-link fw-medium ${
                    isActive ? "active" : "text-dark"
                  }`
                }
                onClick={() => setShowRightMenu(false)}
              >
                <i className={`bi bi-${item.icon}`}></i>
                {item.label}
              </NavLink>
            ))}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default CustomNavbar;
