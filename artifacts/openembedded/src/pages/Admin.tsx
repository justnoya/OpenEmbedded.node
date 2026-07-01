// @ts-nocheck
import { useState, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/authContext.js";

// ── Types ──────────────────────────────────────────────────────────────────

type UserStatus = "active" | "suspended" | "banned";

interface AdminUser {
  id: string;
  username: string;
  globalName: string | null;
  discriminator: string;
  avatar: string | null;
  createdAt: string;
  lastSeenAt: string;
  status: UserStatus;
  suspendedUntil: string | null;
  suspensionReason: string | null;
}

interface AdminStats {
  total: number;
  active: number;
  suspended: number;
  banned: number;
}

interface UsersResponse {
  users: AdminUser[];
  stats: AdminStats;
  pagination: { page: number; limit: number; total: number; pages: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function avatarUrl(user: AdminUser): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=80`;
  }
  const idx = (BigInt(user.id) >> 22n) % 6n;
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

async function adminFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`/api${path}`, {
    ...opts,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

// ── Suspend Modal ──────────────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { label: "1 hour", hours: 1 },
  { label: "6 hours", hours: 6 },
  { label: "12 hours", hours: 12 },
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "Indefinite", hours: 0 },
];

function SuspendModal({
  user,
  onClose,
  onConfirm,
  loading,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: (hours: number, reason: string) => void;
  loading: boolean;
}) {
  const [selectedHours, setSelectedHours] = useState(24);
  const [reason, setReason] = useState("");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "24px",
          width: "420px",
          maxWidth: "calc(100vw - 32px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600, color: "#f0f0f0" }}>
          Suspend @{user.username}
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#606060" }}>
          User will be blocked from accessing OpenEmbedded.
        </p>

        {/* Duration */}
        <label style={{ display: "block", fontSize: "12px", color: "#707070", marginBottom: "8px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Duration
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.hours}
              onClick={() => setSelectedHours(opt.hours)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s",
                borderColor: selectedHours === opt.hours ? "#efefef" : "#333",
                background: selectedHours === opt.hours ? "#efefef" : "transparent",
                color: selectedHours === opt.hours ? "#111" : "#909090",
                fontFamily: "inherit",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Reason */}
        <label style={{ display: "block", fontSize: "12px", color: "#707070", marginBottom: "8px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Reason <span style={{ color: "#444", fontWeight: 400, textTransform: "none" }}>(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Violation of terms of service..."
          maxLength={512}
          rows={3}
          style={{
            width: "100%",
            background: "#111",
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
            padding: "10px 12px",
            color: "#f0f0f0",
            fontSize: "13px",
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: "20px",
          }}
        />

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "7px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#909090",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedHours, reason)}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "7px",
              border: "1px solid #f59e0b",
              background: "rgba(245,158,11,0.12)",
              color: "#f59e0b",
              fontSize: "13px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Suspending…" : "Suspend User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ban Confirm Modal ──────────────────────────────────────────────────────

function BanModal({
  user,
  onClose,
  onConfirm,
  loading,
}: {
  user: AdminUser;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: "12px",
          padding: "24px",
          width: "400px",
          maxWidth: "calc(100vw - 32px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#f0f0f0" }}>
            Ban @{user.username}?
          </h3>
        </div>
        <p style={{ margin: "0 0 20px 42px", fontSize: "13px", color: "#606060" }}>
          This permanently blocks the user from signing in.
        </p>

        <label style={{ display: "block", fontSize: "12px", color: "#707070", marginBottom: "8px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Reason <span style={{ color: "#444", fontWeight: 400, textTransform: "none" }}>(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for ban..."
          maxLength={512}
          rows={2}
          style={{
            width: "100%",
            background: "#111",
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
            padding: "10px 12px",
            color: "#f0f0f0",
            fontSize: "13px",
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: "20px",
          }}
        />

        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "7px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#909090",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "7px",
              border: "1px solid #ef4444",
              background: "rgba(239,68,68,0.12)",
              color: "#ef4444",
              fontSize: "13px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Banning…" : "Ban User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ user }: { user: AdminUser }) {
  if (user.status === "banned") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "3px 8px", borderRadius: "20px",
        background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
        fontSize: "11px", fontWeight: 500, color: "#ef4444",
      }}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
        Banned
      </span>
    );
  }
  if (user.status === "suspended") {
    const until = user.suspendedUntil ? new Date(user.suspendedUntil) : null;
    const expired = until && until < new Date();
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "3px 8px", borderRadius: "20px",
        background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
        fontSize: "11px", fontWeight: 500, color: "#f59e0b",
      }}
      title={until ? `Until ${until.toLocaleString()}` : "Indefinitely"}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        {expired ? "Suspended (expired)" : until ? `Until ${timeAgo(user.suspendedUntil!)} expiry` : "Suspended"}
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 8px", borderRadius: "20px",
      background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
      fontSize: "11px", fontWeight: 500, color: "#4ade80",
    }}>
      <svg width="7" height="7" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="4" fill="currentColor"/>
      </svg>
      Active
    </span>
  );
}

// ── User Card ──────────────────────────────────────────────────────────────

function UserCard({
  user,
  onSuspend,
  onBan,
  onUnban,
  actionLoading,
}: {
  user: AdminUser;
  onSuspend: (user: AdminUser) => void;
  onBan: (user: AdminUser) => void;
  onUnban: (user: AdminUser) => void;
  actionLoading: string | null;
}) {
  const isLoading = actionLoading === user.id;

  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #222",
        borderRadius: "10px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}
    >
      {/* Avatar */}
      <img
        src={avatarUrl(user)}
        alt={user.username}
        width={44}
        height={44}
        style={{ borderRadius: "50%", flexShrink: 0, objectFit: "cover", background: "#222" }}
        onError={(e) => {
          const idx = (BigInt(user.id) >> 22n) % 6n;
          (e.currentTarget as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
        }}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "#f0f0f0" }}>{user.username}</span>
          {user.globalName && user.globalName !== user.username && (
            <span style={{ fontSize: "12px", color: "#555" }}>{user.globalName}</span>
          )}
          <StatusBadge user={user} />
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
          <span style={{ fontSize: "11px", color: "#484848" }}>
            Joined {timeAgo(user.createdAt)}
          </span>
          <span style={{ fontSize: "11px", color: "#404040" }}>
            Last seen {timeAgo(user.lastSeenAt)}
          </span>
          <span style={{ fontSize: "11px", color: "#383838", fontFamily: "JetBrains Mono, monospace" }}>
            {user.id}
          </span>
        </div>
        {user.suspensionReason && (
          <div style={{ marginTop: "4px", fontSize: "11px", color: "#555", fontStyle: "italic" }}>
            Reason: {user.suspensionReason}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        {user.status !== "active" ? (
          <button
            onClick={() => onUnban(user)}
            disabled={isLoading}
            title="Remove suspension or ban"
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#909090",
              fontSize: "12px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: isLoading ? 0.5 : 1,
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#4ade80"; (e.currentTarget as HTMLElement).style.color = "#4ade80"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLElement).style.color = "#909090"; }}
          >
            {isLoading ? "…" : "Restore"}
          </button>
        ) : (
          <>
            <button
              onClick={() => onSuspend(user)}
              disabled={isLoading}
              title="Temporarily suspend this user"
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #2a2a2a",
                background: "transparent",
                color: "#909090",
                fontSize: "12px",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: isLoading ? 0.5 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#f59e0b"; (e.currentTarget as HTMLElement).style.color = "#f59e0b"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLElement).style.color = "#909090"; }}
            >
              Suspend
            </button>
            <button
              onClick={() => onBan(user)}
              disabled={isLoading}
              title="Permanently ban this user"
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #2a2a2a",
                background: "transparent",
                color: "#909090",
                fontSize: "12px",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: isLoading ? 0.5 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ef4444"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLElement).style.color = "#909090"; }}
            >
              Ban
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Admin Page ─────────────────────────────────────────────────────────────

export function Admin() {
  const { adminId } = useParams<{ adminId: string }>();
  const { auth, user } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Access control ───────────────────────────────────────────────────────
  const isAuthorised =
    auth.status === "authenticated" && user?.id === adminId;

  if (auth.status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
          <path d="M12 2A10 10 0 0 1 22 12" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!isAuthorised) {
    navigate("/");
    return null;
  }

  // ── Data fetching ────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery<UsersResponse>({
    queryKey: ["admin-users", page, search, statusFilter],
    queryFn: () =>
      adminFetch(
        `/v1/admin/users?page=${page}&limit=30${search ? `&search=${encodeURIComponent(search)}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`
      ),
    staleTime: 30_000,
  });

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Mutations ────────────────────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const handleSuspendConfirm = async (hours: number, reason: string) => {
    if (!suspendTarget) return;
    setActionLoading(suspendTarget.id);
    try {
      await adminFetch(`/v1/admin/users/${suspendTarget.id}/suspend`, {
        method: "POST",
        body: JSON.stringify({ hours, reason }),
      });
      showToast(`@${suspendTarget.username} suspended.`, "success");
      setSuspendTarget(null);
      invalidate();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanConfirm = async (reason: string) => {
    if (!banTarget) return;
    setActionLoading(banTarget.id);
    try {
      await adminFetch(`/v1/admin/users/${banTarget.id}/ban`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      showToast(`@${banTarget.username} banned.`, "success");
      setBanTarget(null);
      invalidate();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnban = async (u: AdminUser) => {
    setActionLoading(u.id);
    try {
      await adminFetch(`/v1/admin/users/${u.id}/unban`, { method: "POST" });
      showToast(`@${u.username} restored to active.`, "success");
      invalidate();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Search debounce ──────────────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 300);
  };

  const stats = data?.stats;

  return (
    <div style={{ minHeight: "100vh", background: "#111111", fontFamily: "'DM Sans', sans-serif", color: "#f0f0f0" }}>
      {/* ── Nav bar ──────────────────────────────────────────────────────── */}
      <nav style={{
        height: "52px",
        borderBottom: "1px solid #1e1e1e",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "12px",
        position: "sticky",
        top: 0,
        background: "#111111",
        zIndex: 10,
      }}>
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", color: "#f0f0f0" }}
        >
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#1a1a1a"/>
            <circle cx="16" cy="16" r="7" stroke="#efefef" strokeWidth="2"/>
            <circle cx="16" cy="16" r="3" fill="#efefef"/>
          </svg>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#f0f0f0" }}>OpenEmbedded</span>
        </button>
        <span style={{ color: "#2a2a2a", fontSize: "16px" }}>·</span>
        <span style={{ fontSize: "13px", color: "#505050" }}>Admin</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "12px", color: "#404040" }}>
          {user?.globalName ?? user?.username}
        </span>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 20px" }}>

        {/* ── Header + stats ───────────────────────────────────────────── */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 700, color: "#f0f0f0" }}>
            Users
          </h1>
          {stats && (
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <StatChip label="Total" value={stats.total} color="#505050" />
              <StatChip label="Active" value={stats.active} color="#4ade80" />
              <StatChip label="Suspended" value={stats.suspended} color="#f59e0b" />
              <StatChip label="Banned" value={stats.banned} color="#ef4444" />
            </div>
          )}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by username…"
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                background: "#1a1a1a",
                border: "1px solid #222",
                borderRadius: "8px",
                color: "#f0f0f0",
                fontSize: "13px",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#333")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#222")}
            />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {["", "active", "suspended", "banned"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  borderColor: statusFilter === s ? "#efefef" : "#222",
                  background: statusFilter === s ? "#efefef" : "transparent",
                  color: statusFilter === s ? "#111" : "#606060",
                }}
              >
                {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── User list ────────────────────────────────────────────────── */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#404040" }}>
            Loading users…
          </div>
        )}
        {isError && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#ef4444", fontSize: "13px" }}>
            Failed to load users. Make sure ADMIN_DISCORD_ID is configured.
          </div>
        )}
        {data && data.users.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#404040", fontSize: "13px" }}>
            No users found.
          </div>
        )}
        {data && data.users.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.users.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                onSuspend={setSuspendTarget}
                onBan={setBanTarget}
                onUnban={handleUnban}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────── */}
        {data && data.pagination.pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "24px" }}>
            <PaginationBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</PaginationBtn>
            <span style={{ padding: "6px 14px", fontSize: "13px", color: "#606060" }}>
              {page} / {data.pagination.pages}
            </span>
            <PaginationBtn disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>→</PaginationBtn>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {suspendTarget && (
        <SuspendModal
          user={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onConfirm={handleSuspendConfirm}
          loading={actionLoading === suspendTarget.id}
        />
      )}
      {banTarget && (
        <BanModal
          user={banTarget}
          onClose={() => setBanTarget(null)}
          onConfirm={handleBanConfirm}
          loading={actionLoading === banTarget.id}
        />
      )}

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 500,
          background: toast.type === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: toast.type === "success" ? "#4ade80" : "#ef4444",
          zIndex: 100,
          backdropFilter: "blur(8px)",
          whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, display: "inline-block" }} />
      <span style={{ fontSize: "13px", color: "#606060" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#909090" }}>{value}</span>
    </div>
  );
}

function PaginationBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 14px",
        borderRadius: "7px",
        border: "1px solid #222",
        background: "transparent",
        color: disabled ? "#2a2a2a" : "#606060",
        fontSize: "13px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}
