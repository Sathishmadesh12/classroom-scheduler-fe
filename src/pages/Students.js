import React, { useEffect, useState, useRef } from "react";
import API from "../utils/api";
import { useConfirm } from "../components/ConfirmDialog";

const emptyForm = { name: "", email: "", password: "", department: "", phone: "" };

export default function Students() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { confirm, ConfirmDialogUI } = useConfirm();

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef(null);

  const fetchStudents = () => {
    setLoading(true);
    API.get("/users?role=student").then(res => { setUsers(res.data.users); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchStudents(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setError(""); setShowModal(true); };
  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: "", department: u.department || "", phone: u.phone || "" });
    setEditId(u._id); setError(""); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await API.put(`/users/${editId}`, payload);
      } else {
        await API.post("/auth/register", { ...form, role: "student" });
      }
      setShowModal(false); fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: "Delete Student?",
      message: `"${name}" will be permanently removed from the system.`,
      icon: "🗑️",
      confirmText: "Yes, Delete",
      confirmColor: "#ef4444",
    });
    if (!ok) return;
    await API.delete(`/users/${id}`);
    fetchStudents();
  };

  // ── Import handlers ──────────────────────────────────────────────────────────
  const openImport = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError("");
    setShowImportModal(true);
  };

  const handleImport = async () => {
    if (!importFile) { setImportError("Please select a CSV file"); return; }
    setImporting(true); setImportError(""); setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await API.post("/users/import-students", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(res.data);
      fetchStudents();
    } catch (err) {
      setImportError(err.response?.data?.message || "Import failed");
    } finally { setImporting(false); }
  };

  const downloadTemplate = () => {
    const csv = "name,email,department,phone,password\nRaj Kumar,raj@example.com,Computer Science,9876543210,\nPriya S,priya@example.com,Mathematics,9876543211,";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "students_import_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {ConfirmDialogUI}
      <div className="page-header">
        <h1>Student Management</h1>
        <p>Manage student records and enrollments</p>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="section-header">
            <h3>All Students ({users.length})</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={openImport}>📥 Import CSV</button>
              <button className="btn btn-primary" onClick={openAdd}>+ Add Student</button>
            </div>
          </div>
          {loading ? <div className="loading">Loading...</div> : users.length === 0 ? (
            <div className="empty-state"><div className="icon">🎓</div><p>No students found. Add your first student.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong></td>
                      <td style={{ color: "var(--text2)" }}>{u.email}</td>
                      <td>{u.department || "—"}</td>
                      <td>{u.phone || "—"}</td>
                      <td><span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>✏️ Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id, u.name)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? "Edit Student" : "Add Student"}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password {editId ? "(leave blank)" : "*"}</label>
                  <div style={{ position: "relative" }}>
                    <input className="form-control" type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editId} />
                    <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>{showPassword ? "🙈" : "👁️"}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-control" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Student"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" onClick={() => { if (!importing) setShowImportModal(false); }}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📥 Import Students via CSV</h3>
              <button className="modal-close" onClick={() => setShowImportModal(false)} disabled={importing}>✕</button>
            </div>

            {!importResult ? (
              <>
                <div style={{ marginBottom: 16, padding: "12px 14px", background: "var(--bg2, #f8f9fa)", borderRadius: 8, fontSize: 13, color: "var(--text2)" }}>
                  <strong>CSV Format:</strong> name, email, department, phone, password
                  <br /><small>Password column optional — auto-generated if blank. Welcome email sent automatically.</small>
                  <br />
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={downloadTemplate}>⬇️ Download Template</button>
                </div>

                <div className="form-group">
                  <label className="form-label">Select CSV File *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="form-control"
                    onChange={e => setImportFile(e.target.files[0])}
                  />
                  {importFile && <small style={{ color: "var(--text2)", marginTop: 4, display: "block" }}>Selected: {importFile.name}</small>}
                </div>

                {importError && <div className="alert alert-error">{importError}</div>}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                  <button className="btn btn-ghost" onClick={() => setShowImportModal(false)} disabled={importing}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleImport} disabled={importing || !importFile}>
                    {importing ? "Importing..." : "Import Students"}
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1, padding: "12px", background: "#d1fae5", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#065f46" }}>{importResult.summary.created}</div>
                    <div style={{ fontSize: 12, color: "#065f46" }}>Created</div>
                  </div>
                  <div style={{ flex: 1, padding: "12px", background: "#fef3c7", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#92400e" }}>{importResult.summary.skipped}</div>
                    <div style={{ fontSize: 12, color: "#92400e" }}>Skipped</div>
                  </div>
                  <div style={{ flex: 1, padding: "12px", background: "#fee2e2", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#991b1b" }}>{importResult.summary.errors}</div>
                    <div style={{ fontSize: 12, color: "#991b1b" }}>Errors</div>
                  </div>
                </div>

                {importResult.details.skipped.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <strong style={{ fontSize: 13 }}>Skipped (already exist):</strong>
                    {importResult.details.skipped.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>• {s.email}</div>
                    ))}
                  </div>
                )}

                {importResult.details.errors.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <strong style={{ fontSize: 13 }}>Errors:</strong>
                    {importResult.details.errors.map((e, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#ef4444", marginTop: 2 }}>• {e.email || "Row"}: {e.reason}</div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                  <button className="btn btn-primary" onClick={() => setShowImportModal(false)}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
