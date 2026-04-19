import React, { useEffect, useState, useRef } from "react";
import API from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { useConfirm } from "../components/ConfirmDialog";

const FILE_ICONS = {
  "application/pdf": "📄",
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
  "image/gif": "🖼️",
  "image/webp": "🖼️",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "📝",
  "application/vnd.ms-powerpoint": "📊",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "📊",
};
const getFileIcon = (type) => FILE_ICONS[type] || "📎";
const formatSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function Notes() {
  const { user } = useAuth();
  const isFaculty = user?.role === "faculty" || user?.role === "admin";
  const { confirm, ConfirmDialogUI } = useConfirm();

  // Browse state
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ department: "", semester: "" });
  const [viewNote, setViewNote] = useState(null);

  // Preview state
  const [previewFile, setPreviewFile] = useState(null); // { url, fileName, fileType }

  // My notes tab (faculty)
  const [tab, setTab] = useState("browse");
  const [myNotes, setMyNotes] = useState([]);
  const [myNotesLoading, setMyNotesLoading] = useState(false);

  // Upload state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    subjectId: "",
    department: user?.department || "",
    semester: "1",
    visibleTo: "semester",
  });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef();

  // Subjects for upload form
  const [subjects, setSubjects] = useState([]);

  const fetchNotes = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.department) params.set("department", filters.department);
    if (filters.semester) params.set("semester", filters.semester);
    API.get(`/notes?${params.toString()}`)
      .then((res) => setNotes(res.data.notes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchMyNotes = () => {
    setMyNotesLoading(true);
    API.get("/notes/my-notes")
      .then((res) => setMyNotes(res.data.notes || []))
      .catch(() => {})
      .finally(() => setMyNotesLoading(false));
  };

  useEffect(() => {
    fetchNotes();
  }, [filters]);
  useEffect(() => {
    if (isFaculty) {
      fetchMyNotes();
      API.get("/subjects")
        .then((res) => setSubjects(res.data.subjects || []))
        .catch(() => {});
    }
  }, [isFaculty]);

  // Upload handler
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      setUploadError("Title is required");
      return;
    }
    if (uploadFiles.length === 0) {
      setUploadError("Please select at least one file");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    const formData = new FormData();
    Object.entries(uploadForm).forEach(([k, v]) => formData.append(k, v));
    uploadFiles.forEach((f) => formData.append("files", f));

    try {
      await API.post("/notes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadSuccess("✅ Notes uploaded successfully!");
      setUploadFiles([]);
      setUploadForm({ ...uploadForm, title: "", description: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchNotes();
      fetchMyNotes();
      setTimeout(() => {
        setUploadSuccess("");
        setTab("my-notes");
      }, 1200);
    } catch (err) {
      setUploadError(
        err.response?.data?.message || "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (id) => {
    const ok = await confirm({
      title: "Delete Note?",
      message:
        "This note and all its uploaded files will be permanently removed from Cloudinary.",
      icon: "📄",
      confirmText: "Yes, Delete",
      confirmColor: "#ef4444",
    });
    if (!ok) return;
    await API.delete(`/notes/${id}`);
    fetchMyNotes();
    fetchNotes();
  };

  // Delete specific file
  const handleDeleteFile = async (noteId, cloudinaryId) => {
    const ok = await confirm({
      title: "Remove File?",
      message: "This file will be permanently deleted from Cloudinary storage.",
      icon: "🗑️",
      confirmText: "Remove",
      confirmColor: "#ef4444",
    });
    if (!ok) return;
    await API.delete(
      `/notes/${noteId}/files/${encodeURIComponent(cloudinaryId)}`,
    );
    if (viewNote?._id === noteId) {
      const res = await API.get(`/notes/${noteId}`);
      setViewNote(res.data.note);
    }
    fetchMyNotes();
  };

  const canManage = (note) =>
    user?.role === "admin" || note.faculty?._id === user?._id;

  return (
    <div>
      {ConfirmDialogUI}
      <div className="page-header">
        <h1>📚 Notes</h1>
        <p>Browse and manage study materials uploaded by faculty</p>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            className={`btn btn-sm ${tab === "browse" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTab("browse")}
          >
            🔍 Browse Notes
          </button>
          {isFaculty && (
            <>
              <button
                className={`btn btn-sm ${tab === "my-notes" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setTab("my-notes")}
              >
                📋 My Notes
              </button>
              <button
                className={`btn btn-sm ${tab === "upload" ? "btn-success" : "btn-ghost"}`}
                onClick={() => setTab("upload")}
              >
                ⬆️ Upload Notes
              </button>
            </>
          )}
        </div>

        {/* ─── BROWSE TAB ─── */}
        {tab === "browse" && (
          <div>
            <div
              className="card"
              style={{ marginBottom: 16, padding: "16px 20px" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                }}
              >
                <div
                  className="form-group"
                  style={{ margin: 0, flex: "1 1 180px" }}
                >
                  <label className="form-label">Department</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Computer Science"
                    value={filters.department}
                    onChange={(e) =>
                      setFilters({ ...filters, department: e.target.value })
                    }
                  />
                </div>
                <div
                  className="form-group"
                  style={{ margin: 0, flex: "0 0 140px" }}
                >
                  <label className="form-label">Semester</label>
                  <select
                    className="form-control"
                    value={filters.semester}
                    onChange={(e) =>
                      setFilters({ ...filters, semester: e.target.value })
                    }
                  >
                    <option value="">All</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        Sem {n}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setFilters({ department: "", semester: "" })}
                >
                  ✕ Clear
                </button>
              </div>
            </div>

            {loading ? (
              <div
                className="card"
                style={{ textAlign: "center", padding: 60 }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                <p style={{ color: "var(--text2)" }}>Loading notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="icon">📭</div>
                  <p>
                    No notes found. {isFaculty && "Upload some to get started!"}
                  </p>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                {notes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onView={() => setViewNote(note)}
                    canManage={canManage(note)}
                    onDelete={() => handleDeleteNote(note._id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── MY NOTES TAB ─── */}
        {tab === "my-notes" && isFaculty && (
          <div>
            {myNotesLoading ? (
              <div
                className="card"
                style={{ textAlign: "center", padding: 60 }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                <p style={{ color: "var(--text2)" }}>Loading your notes...</p>
              </div>
            ) : myNotes.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="icon">📭</div>
                  <p>You haven't uploaded any notes yet.</p>
                  <button
                    className="btn btn-success"
                    style={{ marginTop: 12 }}
                    onClick={() => setTab("upload")}
                  >
                    ⬆️ Upload Now
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                {myNotes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onView={() => setViewNote(note)}
                    canManage={true}
                    onDelete={() => handleDeleteNote(note._id)}
                    showMine
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── UPLOAD TAB ─── */}
        {tab === "upload" && isFaculty && (
          <div className="card" style={{ maxWidth: 680 }}>
            <h3 style={{ marginBottom: 20 }}>⬆️ Upload Study Material</h3>
            {uploadError && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="form-control"
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  placeholder="e.g. Unit 3 - Data Structures Notes"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={uploadForm.description}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of the content..."
                  style={{ resize: "vertical" }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <input
                    className="form-control"
                    value={uploadForm.department}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        department: e.target.value,
                      })
                    }
                    placeholder="e.g. Computer Science"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select
                    className="form-control"
                    value={uploadForm.semester}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, semester: e.target.value })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        Semester {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject (optional)</label>
                  <select
                    className="form-control"
                    value={uploadForm.subjectId}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        subjectId: e.target.value,
                      })
                    }
                  >
                    <option value="">— Select subject —</option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Visible To</label>
                  <select
                    className="form-control"
                    value={uploadForm.visibleTo}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        visibleTo: e.target.value,
                      })
                    }
                  >
                    <option value="semester">Semester</option>
                    <option value="department">Department</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>

              {/* File Drop Zone */}
              <div className="form-group">
                <label className="form-label">
                  Files * (PDF, Images, DOC, PPT — up to 10)
                </label>
                <div
                  style={{
                    border: "2px dashed var(--border)",
                    borderRadius: 10,
                    padding: 28,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background:
                      uploadFiles.length > 0
                        ? "rgba(16,185,129,0.06)"
                        : "var(--bg2)",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = Array.from(e.dataTransfer.files).slice(
                      0,
                      10,
                    );
                    setUploadFiles(dropped);
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                  <p style={{ color: "var(--text2)", fontSize: 14 }}>
                    {uploadFiles.length > 0
                      ? `${uploadFiles.length} file(s) selected`
                      : "Click to select or drag & drop files here"}
                  </p>
                  <p
                    style={{
                      color: "var(--text3)",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    PDF, DOC, PPT, Images · Max 10 files
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      setUploadFiles(Array.from(e.target.files).slice(0, 10))
                    }
                  />
                </div>

                {uploadFiles.length > 0 && (
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {uploadFiles.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          background: "var(--bg2)",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                        }}
                      >
                        <span style={{ fontSize: 18 }}>
                          {getFileIcon(f.type)}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            fontSize: 13,
                            color: "var(--text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {f.name}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>
                          {formatSize(f.size)}
                        </span>
                        <button
                          type="button"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--danger)",
                            fontSize: 16,
                          }}
                          onClick={() =>
                            setUploadFiles(
                              uploadFiles.filter((_, j) => j !== i),
                            )
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setUploadFiles([]);
                    setUploadError("");
                  }}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={uploading}
                >
                  {uploading ? "⏳ Uploading..." : "⬆️ Upload Files"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ─── NOTE DETAIL MODAL ─── */}
      {viewNote && (
        <div className="modal-overlay" onClick={() => setViewNote(null)}>
          <div
            className="modal"
            style={{ maxWidth: 600, width: "94%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>📄 {viewNote.title}</h3>
              <button className="modal-close" onClick={() => setViewNote(null)}>
                ✕
              </button>
            </div>

            {viewNote.description && (
              <p
                style={{
                  color: "var(--text2)",
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                {viewNote.description}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              {viewNote.department && (
                <span className="badge badge-blue">{viewNote.department}</span>
              )}
              {viewNote.semester && (
                <span className="badge badge-purple">
                  Sem {viewNote.semester}
                </span>
              )}
              {viewNote.subject && (
                <span className="badge badge-green">
                  {viewNote.subject.code} · {viewNote.subject.name}
                </span>
              )}
              <span
                className="badge"
                style={{ background: "var(--surface2)", color: "var(--text3)" }}
              >
                👨‍🏫 {viewNote.faculty?.name}
              </span>
            </div>

            <h4
              style={{ fontSize: 13, color: "var(--text3)", marginBottom: 10 }}
            >
              Files ({viewNote.files?.length || 0})
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {viewNote.files?.map((file) => (
                <div
                  key={file.cloudinaryId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: "var(--bg2)",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 22 }}>
                    {getFileIcon(file.fileType)}
                  </span>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.fileName}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>
                      {formatSize(file.size)}
                    </div>
                  </div>
                  {/* ── UPDATED: Open button now triggers in-app preview ── */}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      setPreviewFile({
                        url: file.url,
                        fileName: file.fileName,
                        fileType: file.fileType,
                      })
                    }
                  >
                    👁️ Open
                  </button>
                  {canManage(viewNote) && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        handleDeleteFile(viewNote._id, file.cloudinaryId)
                      }
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── FILE PREVIEW MODAL ─── */}
      {previewFile && (
        <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
          <div
            className="modal"
            style={{
              maxWidth: "92vw",
              width: "92vw",
              height: "90vh",
              display: "flex",
              flexDirection: "column",
              padding: 0,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="modal-header"
              style={{
                padding: "14px 18px",
                flexShrink: 0,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {getFileIcon(previewFile.fileType)} {previewFile.fileName}
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  ↗️ New Tab
                </a>
                <button
                  className="modal-close"
                  onClick={() => setPreviewFile(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              style={{ flex: 1, overflow: "hidden", background: "var(--bg2)" }}
            >
              {previewFile.fileType === "application/pdf" ? (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.url)}&embedded=true`}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title={previewFile.fileName}
                />
              ) : previewFile.fileType?.startsWith("image/") ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                  }}
                >
                  <img
                    src={previewFile.url}
                    alt={previewFile.fileName}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: 8,
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    gap: 16,
                    color: "var(--text2)",
                  }}
                >
                  <div style={{ fontSize: 56 }}>
                    {getFileIcon(previewFile.fileType)}
                  </div>
                  <p style={{ fontSize: 14 }}>
                    இந்த file type-ஐ நேரடியாக preview செய்ய முடியாது.
                  </p>
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                  >
                    ↗️ புதிய Tab-ல் திற
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Note Card Component ──────────────────────────────────────────────────────
function NoteCard({ note, onView, canManage, onDelete, showMine }) {
  return (
    <div
      className="card"
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        cursor: "default",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <h4
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.4,
            }}
          >
            {note.title}
          </h4>
          <span style={{ fontSize: 20, flexShrink: 0 }}>
            {note.files?.[0] ? getFileIcon(note.files[0].fileType) : "📎"}
          </span>
        </div>
        {note.description && (
          <p
            style={{
              fontSize: 12,
              color: "var(--text3)",
              marginTop: 6,
              lineHeight: 1.5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {note.description}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {note.department && (
          <span className="badge badge-blue" style={{ fontSize: 11 }}>
            {note.department}
          </span>
        )}
        {note.semester && (
          <span className="badge badge-purple" style={{ fontSize: 11 }}>
            Sem {note.semester}
          </span>
        )}
        {note.subject && (
          <span className="badge badge-green" style={{ fontSize: 11 }}>
            {note.subject.code}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--text3)",
          fontSize: 12,
        }}
      >
        <span>👨‍🏫 {note.faculty?.name}</span>
        <span>·</span>
        <span>
          📎 {note.files?.length || 0} file{note.files?.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ flex: 1 }}
          onClick={onView}
        >
          👁️ View Files
        </button>
        {canManage && (
          <button className="btn btn-danger btn-sm" onClick={onDelete}>
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
