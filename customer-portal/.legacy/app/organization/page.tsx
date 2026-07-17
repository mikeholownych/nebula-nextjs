"use client";

import { useState } from "react";
import Link from "next/link";

export default function OrganizationPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  // Mock data - will be fetched from API
  const organization = {
    name: "Acme Corp",
    slug: "acme-corp",
    is_agency: false,
    created_at: "2026-07-01",
  };

  const members = [
    {
      id: "1",
      email: "mike@example.com",
      role: "owner",
      created_at: "2026-07-01",
    },
    {
      id: "2",
      email: "jane@example.com",
      role: "admin",
      created_at: "2026-07-05",
    },
  ];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    // Invite functionality will be implemented in next phase
    alert("Team invite functionality coming in next phase");
    setShowInviteForm(false);
    setInviteEmail("");
    setInviteRole("member");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Nebula Components
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/audits" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                Audits
              </Link>
              <Link href="/organization" className="text-blue-600 px-3 py-2">
                Organization
              </Link>
              <Link href="/subscription" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                Subscription
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your organization and team members
          </p>
        </div>

        {/* Organization info */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Organization Details</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={organization.name}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Slug
                </label>
                <input
                  type="text"
                  value={organization.slug}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <input
                  type="text"
                  value={organization.is_agency ? "Agency" : "Standard"}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created
                </label>
                <input
                  type="text"
                  value={new Date(organization.created_at).toLocaleDateString()}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team members */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
            <button
              onClick={() => setShowInviteForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Invite Member
            </button>
          </div>

          {/* Invite form */}
          {showInviteForm && (
            <div className="px-6 py-4 bg-gray-50 border-b">
              <form onSubmit={handleInvite}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="colleague@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-end space-x-2">
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                      Send Invite
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteForm(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Members list */}
          <div className="p-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-gray-900">{member.email}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          member.role === "owner"
                            ? "bg-purple-100 text-purple-800"
                            : member.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {member.role !== "owner" && (
                        <>
                          <button className="text-blue-600 hover:text-blue-800 mr-4">
                            Edit Role
                          </button>
                          <button className="text-red-600 hover:text-red-800">
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
