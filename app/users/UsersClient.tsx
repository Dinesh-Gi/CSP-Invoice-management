"use client";

import { FormEvent, useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

const roles = [
  "ADMIN",
  "FINANCE",
  "SALES",
  "MANAGEMENT",
  "VIEWER",
];

export default function UsersPage() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] =
    useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/users");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load users."
        );
      }

      setUsers(data.users);
    } catch (error) {
      console.error("Load users error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load users."
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

        if (
          !data.success ||
          data.user?.role !== "ADMIN"
        ) {
          setAccessDenied(true);
          return;
        }

        await loadUsers();
      } catch (error) {
        console.error(
          "Access check error:",
          error
        );

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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!name.trim() || !email.trim()) {
      setError(
        "Name and email address are required."
      );
      return;
    }

    if (
      !editingUser &&
      password.length < 8
    ) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (
      editingUser &&
      password &&
      password.length < 8
    ) {
      setError(
        "Password must contain at least 8 characters."
      );
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

      if (password) {
        body.password = password;
      }

      if (editingUser) {
        body.id = editingUser.id;
      }

      const response = await fetch("/api/users", {
        method: editingUser ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to save user."
        );
        return;
      }

      setShowModal(false);
      setEditingUser(null);

      await loadUsers();
    } catch (error) {
      console.error(
        "Save user error:",
        error
      );

      setError(
        "Unable to save user. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleUserStatus(user: User) {
    const action = user.isActive
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        "/api/users",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: user.id,
            isActive: !user.isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            `Unable to ${action} user.`
        );
        return;
      }

      await loadUsers();
    } catch (error) {
      console.error(
        "Toggle user status error:",
        error
      );

      alert(
        `Unable to ${action} user. Please try again.`
      );
    }
  }

  function formatRole(value: string) {
    return value
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function getInitials(value: string) {
    const parts = value
      .trim()
      .split(/\s+/);

    if (parts.length === 1) {
      return parts[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }

  // Access checking screen

  if (checkingAccess) {
    return (
      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-gray-500">
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  // Access denied screen

  if (accessDenied) {
    return (
      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center p-8">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl">
            🔒
          </div>

          <h2 className="mt-4 text-xl font-bold text-gray-950">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            You do not have permission to access
            User Management.
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}

      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-950">
            User Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage users, roles and account access.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <span className="text-lg leading-none">
            +
          </span>

          Add User
        </button>
      </div>

      {/* Error */}

      {error && !showModal && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Total Users
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-950">
            {users.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Active Users
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {users.filter(
              (user) => user.isActive
            ).length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Administrators
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {users.filter(
              (user) => user.role === "ADMIN"
            ).length}
          </p>
        </div>
      </div>

      {/* Users Table */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-bold text-gray-950">
            Users
          </h3>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-semibold text-gray-700">
              No users found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Add your first user to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                    User
                  </th>

                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Email
                  </th>

                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Role
                  </th>

                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {getInitials(
                            user.name
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {user.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            User ID: {user.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {user.email}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {formatRole(
                          user.role
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
                          user.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {user.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(user)
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleUserStatus(
                              user
                            )
                          }
                          className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                            user.isActive
                              ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {user.isActive
                            ? "Deactivate"
                            : "Activate"}
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

      {/* Modal */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-gray-950">
                  {editingUser
                    ? "Edit User"
                    : "Add User"}
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  {editingUser
                    ? "Update account details and access."
                    : "Create a new application user."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {/* Name */}

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter full name"
                  disabled={saving}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              {/* Email */}

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="user@example.com"
                  disabled={saving}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              {/* Password */}

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  {editingUser
                    ? "New Password"
                    : "Password"}
                </label>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current password"
                        : "Minimum 8 characters"
                    }
                    disabled={saving}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-16 text-sm text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              {/* Role */}

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Role
                </label>

                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value)
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                >
                  {roles.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {formatRole(item)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}

              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    Account Status
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Allow this user to sign in.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsActive(
                      (value) => !value
                    )
                  }
                  disabled={saving}
                  className={`relative h-6 w-11 rounded-full transition ${
                    isActive
                      ? "bg-blue-600"
                      : "bg-gray-300"
                  }`}
                  aria-label="Toggle account status"
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                      isActive
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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