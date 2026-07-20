import { useEffect, useMemo, useState } from "react";
import {
  FaVideo, FaDownload, FaPlay, FaClock, FaHdd, FaCalendarAlt, FaTrashAlt,
} from "react-icons/fa";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import {
  PageHeader, SearchInput, Button, Badge, AdminModal,
} from "../../components/ui";
import { AdminTable } from "../adminComponents/adminUi";

/* status pill variant map (Badge) */
const STATUS_VARIANT = {
  READY:     "success",
  RECORDING: "primary",
  UPLOADING: "warning",
  FAILED:    "danger",
  DELETED:   "neutral",
};

function fmtDuration(sec) {
  if (!sec && sec !== 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminRecordings() {
  const { showAlert } = useAlert();

  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // preview modal { open, url, title }
  const [preview, setPreview] = useState({ open: false, url: "", title: "" });
  const [busyId, setBusyId] = useState(null); // recording id currently generating a URL

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const res = await axiosSecure.get("/v1/calls/admin/recordings/");
      setRecordings(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load recordings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSignedUrl = async (id) => {
    const res = await axiosSecure.get(`/v1/calls/admin/recordings/${id}/signed-url/`);
    return res.data?.signed_url;
  };

  const handlePreview = async (rec) => {
    if (rec.status !== "READY") {
      showAlert("Recording is not ready yet", "warning");
      return;
    }
    try {
      setBusyId(rec.id);
      const url = await getSignedUrl(rec.id);
      if (!url) throw new Error("no url");
      setPreview({ open: true, url, title: rec.participants });
    } catch (err) {
      console.error(err);
      showAlert("Could not generate preview link", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (rec) => {
    if (rec.status !== "READY") {
      showAlert("Recording is not ready yet", "warning");
      return;
    }
    try {
      setBusyId(rec.id);
      const url = await getSignedUrl(rec.id);
      if (!url) throw new Error("no url");
      // signed URL is a direct Cloudinary asset — open in a new tab to download
      window.open(url, "_blank", "noopener");
    } catch (err) {
      console.error(err);
      showAlert("Could not generate download link", "error");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recordings.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (r.participants || "").toLowerCase().includes(q) ||
        (r.room_id || "").toLowerCase().includes(q)
      );
    });
  }, [recordings, search, statusFilter]);

  const columns = [
    { key: "participants", label: "Participants" },
    { key: "status", label: "Status" },
    { key: "size", label: "Size" },
    { key: "duration", label: "Duration" },
    { key: "recorded", label: "Recorded At" },
    { key: "expires", label: "Auto-delete" },
    { key: "actions", label: "Actions", align: "center" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FaVideo />}
        title="Call Recordings"
        subtitle="Review and download recorded consultation calls"
        breadcrumb={[{ label: "Dashboard", to: "/admin" }, { label: "Recordings" }]}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by participant or room…"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full border border-input bg-muted px-4 py-2.5 text-sm font-bold text-foreground outline-none hover:bg-muted/70 focus:border-primary"
        >
          <option value="">All statuses</option>
          <option value="READY">Ready</option>
          <option value="RECORDING">Recording</option>
          <option value="UPLOADING">Uploading</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        rows={filtered}
        loading={loading}
        loadingLabel="Loading recordings…"
        empty={{
          icon: <FaVideo />,
          title: "No recordings",
          description: "Recorded calls will appear here once they finish uploading.",
        }}
        renderRow={(rec) => (
          <>
            <td className="py-3 px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <FaVideo className="text-sm" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate max-w-[220px]">
                    {rec.participants}
                  </p>
                  <p className="text-2xs text-muted-foreground font-mono truncate max-w-[220px]">
                    {rec.room_id}
                  </p>
                </div>
              </div>
            </td>
            <td className="py-3 px-5">
              <Badge variant={STATUS_VARIANT[rec.status] || "neutral"}>{rec.status}</Badge>
            </td>
            <td className="py-3 px-5 whitespace-nowrap text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FaHdd className="text-2xs opacity-60" />
                {rec.file_size_mb != null ? `${rec.file_size_mb} MB` : "—"}
              </span>
            </td>
            <td className="py-3 px-5 whitespace-nowrap text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FaClock className="text-2xs opacity-60" />
                {fmtDuration(rec.duration_seconds)}
              </span>
            </td>
            <td className="py-3 px-5 whitespace-nowrap text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FaCalendarAlt className="text-2xs opacity-60" />
                {fmtDate(rec.started_at)}
              </span>
            </td>
            <td className="py-3 px-5 whitespace-nowrap text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <FaTrashAlt className="text-2xs opacity-60" />
                {rec.delete_after ? new Date(rec.delete_after).toLocaleDateString() : "—"}
              </span>
            </td>
            <td className="py-3 px-5">
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="soft"
                  disabled={rec.status !== "READY" || busyId === rec.id}
                  loading={busyId === rec.id}
                  onClick={() => handlePreview(rec)}
                  title="Preview"
                >
                  <FaPlay className="text-2xs" /> Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={rec.status !== "READY" || busyId === rec.id}
                  onClick={() => handleDownload(rec)}
                  title="Download"
                >
                  <FaDownload className="text-2xs" /> Download
                </Button>
              </div>
            </td>
          </>
        )}
      />

      {/* Preview modal */}
      {preview.open && (
        <AdminModal
          open
          onClose={() => setPreview({ open: false, url: "", title: "" })}
          title={preview.title || "Recording"}
          subtitle="Signed preview link — expires shortly"
          icon={<FaVideo />}
          size="xl"
          bodyClassName=""
        >
          <div className="bg-black">
            <video
              src={preview.url}
              controls
              autoPlay
              className="w-full max-h-[70vh]"
            />
          </div>
        </AdminModal>
      )}
    </div>
  );
}
