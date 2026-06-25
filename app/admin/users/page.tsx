"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, User, UserRole } from "@/lib/api";
import Modal from "@/app/components/Modal";

export const dynamic = "force-dynamic";

export default function ModeratorUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [actionUser, setActionUser] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.moderator.getUsers({
      search: search || undefined,
      role: (roleFilter || undefined) as UserRole | undefined,
    }).then(setUsers).catch((err) => {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to fetch users" });
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, refreshKey]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setRefreshKey(k => k + 1);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setActionUser(userId);
    setMessage(null);
    try {
      await api.moderator.changeUserRole(userId, newRole);
      setMessage({ type: "success", text: "Role updated successfully" });
      setRefreshKey(k => k + 1);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to change role" });
    }
    setActionUser(null);
  };

  const handleDelete = async (userId: string) => {
    setConfirmDelete(null);
    setActionUser(userId);
    setMessage(null);
    try {
      await api.moderator.deleteUser(userId);
      setMessage({ type: "success", text: "User deleted successfully" });
      setRefreshKey(k => k + 1);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete user" });
    }
    setActionUser(null);
  };

  const roleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      CUSTOMER: "badge-primary",
      SELLER: "badge-success",
      MODERATOR: "badge-warning",
    };
    return <span className={`badge ${colors[role]}`}>{role}</span>;
  };

  if (!currentUser || currentUser.role !== "MODERATOR") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-secondary text-lg">Access denied. Moderator only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-secondary mt-1">Manage platform users, roles, and permissions</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-success/10 text-success border border-success/20" : "bg-error/10 text-error border border-error/20"}`}>
          {message.text}
        </div>
      )}

      {/* Search & Filter */}
      <div className="card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input flex-1"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
            className="input w-44"
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="SELLER">Sellers</option>
            <option value="MODERATOR">Moderators</option>
          </select>
          <button type="submit" className="btn btn-primary">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
            <p className="text-secondary">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Level</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{roleBadge(user.role)}</td>
                    <td>
                      <p className="text-sm">{user.phone || "—"}</p>
                    </td>
                    <td>
                      <p className="text-sm">
                        {[user.city, user.state].filter(Boolean).join(", ") || "—"}
                      </p>
                    </td>
                    <td>
                      <div className="text-center">
                        <p className="font-semibold text-primary">L{user.level}</p>
                        <p className="text-xs text-muted">{user.xp} XP</p>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-muted">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {user.id === currentUser?.id ? (
                          <span className="text-xs text-muted italic">Cannot modify self</span>
                        ) : (
                          <>
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                              disabled={actionUser === user.id}
                              className="input text-sm py-1 px-2 w-28"
                            >
                              <option value="CUSTOMER">Customer</option>
                              <option value="SELLER">Seller</option>
                              <option value="MODERATOR">Moderator</option>
                            </select>
                            <button
                              onClick={() => setConfirmDelete(user.id)}
                              disabled={actionUser === user.id}
                              className="btn btn-sm text-danger hover:text-danger"
                              title="Delete user"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p className="text-secondary mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmDelete(null)} className="btn btn-outline flex-1">Cancel</button>
          <button onClick={() => confirmDelete && handleDelete(confirmDelete)} className="btn btn-danger flex-1">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
