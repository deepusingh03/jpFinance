import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { Form, Modal, Button, Spinner } from "react-bootstrap";
import { helperMethods } from "../utility/CMPhelper";
import { apiData } from "../utility/api";
import CustomNavbar from "../components/CustomNavbar";

const strongPass = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^]).{8,}$/;
const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
const safeJson = (r) => r.json().catch(() => null);

// ──────────────────────────────
// REUSABLE INPUT FIELD
// ──────────────────────────────
const Field = ({ label, value, set, error, type = "text" }) => (
  <Form.Group className="mb-3">
    <Form.Label className="fw-semibold"><span className="text-danger">*</span> {label}</Form.Label>
    <Form.Control
      type={type}
      value={value}
      onChange={(e) => set(e.target.value)}
      isInvalid={!!error}
    />
    {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
  </Form.Group>
);

// ──────────────────────────────
// EDIT PROFILE MODAL
// ──────────────────────────────
function EditProfileModal({ user, show, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setForm({
        Id:user?.Id || "",
        FirstName: user?.FirstName || "",
        LastName: user?.LastName || "",
        Phone: user?.Phone || "",
      });
    }
    setErrors({});
  }, [show, user]);

  const validate = () => {
    const e = {};
    if (!form.FirstName.trim()) e.FirstName = "First name is required.";
    if (!form.LastName.trim()) e.LastName = "Last name is required.";

    if (!form.Phone.trim()) e.Phone = "Phone number is required.";
    else if (!phoneRegex.test(form.Phone.trim()))
      e.Phone = "Invalid phone number format.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const changed = useMemo(() => {
    const ref = {
      Id:user?.Id || "",
      FirstName: user?.FirstName || "",
      LastName: user?.LastName || "",
      Phone: user?.Phone || "",
    };
    return JSON.stringify(ref) !== JSON.stringify(form);
  }, [form, user]);

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) return toast.error("Fix the highlighted errors.");

    setLoading(true);
    const payload = {
      ...form,
      ModifiedBy: helperMethods.fetchUser(),
      ModifiedDate: helperMethods.dateToString(),
    };
    const res = await fetch(`${apiData.PORT}/api/user/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res);

    if (!res.ok || !data?.success) {
      toast.error(data?.error || "Failed to update profile.");
    } else {
      toast.success("Profile updated successfully.");
      onSaved?.();
      onClose?.();
    }

    setLoading(false);
  };

  return (
    <Modal show={show} centered onHide={onClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Edit Profile</Modal.Title>
      </Modal.Header>

      <Form onSubmit={save}>
        <Modal.Body>
          <Field 
            label="First Name"
            value={form.FirstName}
            set={(v) => setForm((s) => ({ ...s, FirstName: v }))}
            error={errors.FirstName}
          />
          <Field 
            label="Last Name"
            value={form.LastName}
            set={(v) => setForm((s) => ({ ...s, LastName: v }))}
            error={errors.LastName}
          />
          <Field 
            label="Phone"
            value={form.Phone}
            set={(v) => setForm((s) => ({ ...s, Phone: v }))}
            error={errors.Phone}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button type="submit" disabled={!changed || loading}>
            {loading ? <Spinner size="sm" /> : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ──────────────────────────────
// CHANGE PASSWORD MODAL
// ──────────────────────────────
function ChangePasswordModal({ show, onClose }) {
  const [vals, setVals] = useState({ current: "", next: "", confirm: "" });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) setVals({ current: "", next: "", confirm: "" });
    setErr({});
  }, [show]);

  const validate = () => {
    const e = {};

    if (!vals.current.trim()) e.current = "Current password is required.";
    if (!vals.next.trim()) e.next = "New password is required.";
    else if (!strongPass.test(vals.next))
      e.next = "Password must be 8+ chars and include upper, lower, number & special character.";
    if (vals.next !== vals.confirm) e.confirm = "Passwords do not match.";

    setErr(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return toast.error("Fix the errors to continue.");

    setLoading(true);

    const payload = {
      Id:helperMethods.fetchUser(),
      currentPassword: vals.current,
      newPassword: vals.next,
      ModifiedBy: helperMethods.fetchUser(),
      ModifiedDate: helperMethods.dateToString(),
    };

    const res = await fetch(`${apiData.PORT}/api/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await safeJson(res);

    if (!res.ok || !data?.success) {
      toast.error(data?.error || "Failed to update password.");
    } else {
      toast.success("Password updated.");
      onClose?.();
    }

    setLoading(false);
  };

  return (
    <Modal show={show} centered onHide={onClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Change Password</Modal.Title>
      </Modal.Header>

      <Form onSubmit={submit}>
        <Modal.Body>
          <Field
            label="Current Password"
            type="password"
            value={vals.current}
            set={(v) => setVals((s) => ({ ...s, current: v }))}
            error={err.current}
          />

          <Field
            label="New Password"
            type="password"
            value={vals.next}
            set={(v) => setVals((s) => ({ ...s, next: v }))}
            error={err.next}
          />

          <Field
            label="Confirm Password"
            type="password"
            value={vals.confirm}
            set={(v) => setVals((s) => ({ ...s, confirm: v }))}
            error={err.confirm}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>

          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Update Password"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ──────────────────────────────
// MAIN VIEW PROFILE PAGE
// ──────────────────────────────
export default function ViewProfile() {
  const [user, setUser] = useState(null);
  const [load, setLoad] = useState(true);
  const [edit, setEdit] = useState(false);
  const [pwd, setPwd] = useState(false);

  const loadProfile = useCallback(async (signal) => {
    try {
      setLoad(true);

      const stored = localStorage.getItem("userData");
      if (!stored) throw new Error("Missing local user data");

      const localUser = JSON.parse(stored);

      const res = await fetch(`${apiData.PORT}/api/get/users?Id=${localUser.Id}`, { signal });
      const data = await safeJson(res);

      if (!res.ok || !data?.data?.length) {
        toast.error("Unable to load profile.");
        setUser(null);
      } else {
        setUser(data.data[0]);
      }
    } catch (err) {
      if (err.name !== "AbortError") toast.error("Could not load profile.");
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProfile(controller.signal);
    return () => controller.abort();
  }, [loadProfile]);

  if (load)
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </div>
    );

  if (!user)
    return (
      <div className="text-center py-5">
        <h5 className="text-danger">Profile not found</h5>
        <Button className="mt-3" onClick={() => loadProfile()}>
          Retry
        </Button>
      </div>
    );

  return (
    <>
      <CustomNavbar />

      <div className="card p-4 mt-3 shadow-sm">
        <h3 className="mb-3">My Profile</h3>

        {["FirstName", "LastName", "Email", "Phone"].map((f) => (
          <div key={f} className="mb-3">
            <div className="text-secondary small">{f}</div>
            <div className="fw-bold fs-5">{user[f] || "-"}</div>
            <hr />
          </div>
        ))}

        <div className="d-flex gap-3 mt-4">
          <Button onClick={() => setEdit(true)}>Edit Profile</Button>
          <Button variant="warning" onClick={() => setPwd(true)}>
            Change Password
          </Button>
        </div>
      </div>

      <EditProfileModal
        show={edit}
        user={user}
        onClose={() => setEdit(false)}
        onSaved={() => loadProfile()}
      />

      <ChangePasswordModal show={pwd} onClose={() => setPwd(false)} />
    </>
  );
}
