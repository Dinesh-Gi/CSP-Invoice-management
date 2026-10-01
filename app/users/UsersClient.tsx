"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

const roles = ["ADMIN", "FINANCE", "SALES", "MANAGEMENT", "VIEWER"];

export default function UsersPage() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/users");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load users.");
      }

      setUsers(data.users);
    } catch (error) {
      console.error("Load users error:", error);
      setError(
        error instanceof Error ? error.message : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function checkAccess() {
      try {
        const response = await fetch("/api/auth/me");

        if (!response.ok) {
          window.location.href = "/login";
          return;
        }

        const data = await response.json();

        if (!data.success || data.user?.role !== "ADMIN") {
          setAccessDenied(true);
          return;
        }

        await loadUsers();
      } catch (error) {
        console.error("Access check error:", error);
        setAccessDenied(true);
      } finally {
        setCheckingAccess(false);
      }
    }

    checkAccess();
  }, []);

  function openAddModal() {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("VIEWER");
    setIsActive(true);
    setShowPassword(false);
    setError("");
    setShowModal(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setIsActive(user.isActive);
    setShowPassword(false);
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingUser(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Name and email address are required.");
      return;
    }

    if (!editingUser && password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (editingUser && password && password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setSaving(true);

      const body: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        role,
        isActive,
      };

      if (password) body.password = password;
      if (editingUser) body.id = editingUser.id;

      const response = await fetch("/api/users", {
        method: editingUser ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to save user.");
        return;
      }

      setShowModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      console.error("Save user error:", error);
      setError("Unable to save user. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleUserStatus(user: User) {
    const action = user.isActive ? "deactivate" : "activate";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          isActive: !user.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.message || `Unable to ${action} user.`);
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error("Toggle user status error:", error);
      alert(`Unable to ${action} user. Please try again.`);
    }
  }

  function formatRole(value: string) {
    return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getInitials(value: string) {
    const parts = value.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.isActive) ||
        (statusFilter === "INACTIVE" && !user.isActive);

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const activeUsers = users.filter((user) => user.isActive).length;
  const adminUsers = users.filter((user) => user.role === "ADMIN").length;
  const inactiveUsers = users.length - activeUsers;

  if (checkingAccess) {
    return (
      <div className="flex min-h-[calc(100vh-62px)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
          <p className="mt-3 text-xs font-medium text-gray-500">
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-[calc(100vh-62px)] items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-lg">
            🔒
          </div>
          <h2 className="mt-3 text-base font-bold text-gray-950">
            Access Denied
          </h2>
          <p className="mt-1.5 text-xs text-gray-500">
            You do not have permission to access User Management.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="mt-5 h-9 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-950">
            User Management
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">
            Manage users, roles and account access.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <span className="text-base leading-none">+</span>
          Add User
        </button>
      </div>

      {error && !showModal && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Total Users
          </p>
          <p className="mt-1 text-xl font-bold text-gray-950">{users.length}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Active
          </p>
          <p className="mt-1 text-xl font-bold text-green-600">{activeUsers}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Inactive
          </p>
          <p className="mt-1 text-xl font-bold text-gray-500">{inactiveUsers}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Administrators
          </p>
          <p className="mt-1 text-xl font-bold text-blue-600">{adminUsers}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-gray-950">Users</h2>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {filteredUsers.length} of {users.length} users
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="h-8 w-52 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">All Roles</option>
              {roles.map((item) => (
                <option key={item} value={item}>
                  {formatRole(item)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs text-gray-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-xs text-gray-500">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-sm">
              {users.length === 0 ? "＋" : "⌕"}
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-700">
              {users.length === 0 ? "No users found" : "No matching users"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {users.length === 0
                ? "Add your first user to get started."
                : "Try changing the search or filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-left">
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    User
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    Role
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-blue-700">
                          {getInitials(user.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            ID #{user.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2.5 text-xs text-gray-600">
                      {user.email}
                    </td>

                    <td className="px-4 py-2.5">
                      <span className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                        {formatRole(user.role)}
                      </span>
                    </td>

                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold ${
                          user.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="h-7 rounded-md border border-gray-200 px-2.5 text-[10px] font-bold text-gray-700 transition hover:bg-gray-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleUserStatus(user)}
                          className={`h-7 rounded-md border px-2.5 text-[10px] font-bold transition ${
                            user.isActive
                              ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-5">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-gray-950">
                  {editingUser ? "Edit User" : "Add User"}
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {editingUser
                    ? "Update account details and access."
                    : "Create a new application user."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-7 w-7 items-center justify-center rounded-md text-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 p-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-bold text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter full name"
                    disabled={saving}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-bold text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="user@example.com"
                    disabled={saving}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[11px] font-bold text-gray-700">
                    {editingUser ? "New Password" : "Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={
                        editingUser
                          ? "Leave blank to keep current password"
                          : "Minimum 8 characters"
                      }
                      disabled={saving}
                      className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 pr-14 text-xs text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-100"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-gray-700">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    disabled={saving}
                    className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-900 outline-none focus:border-blue-500 focus:bg-white"
                  >
                    {roles.map((item) => (
                      <option key={item} value={item}>
                        {formatRole(item)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="flex h-9 w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3">
                    <div>
                      <p className="text-[11px] font-bold text-gray-800">
                        Account Status
                      </p>
                      <p className="text-[9px] text-gray-500">
                        Allow sign in
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive((value) => !value)}
                      disabled={saving}
                      className={`relative h-5 w-9 rounded-full transition ${
                        isActive ? "bg-blue-600" : "bg-gray-300"
                      }`}
                      aria-label="Toggle account status"
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                          isActive ? "left-4.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-8 rounded-lg border border-gray-200 px-3.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-8 rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingUser
                      ? "Update User"
                      : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
