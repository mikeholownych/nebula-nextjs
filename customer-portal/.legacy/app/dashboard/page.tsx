"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8769";

interface User {
  id: string;
  email: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  is_agency: boolean;
}

interface Audit {
  id: string;
  site_url: string;
  status: string;
  score: number | null;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // In production, get user from session/cookies
      // For now, redirect to login if no user
      setLoading(false);
    } catch (err) {
      setError("Failed to load dashboard");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

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
              <Link
                href="/audits"
                className="text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Audits
              </Link>
              <Link
                href="/organization"
                className="text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Organization
              </Link>
              <Link
                href="/subscription"
                className="text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Subscription
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            {user ? `Welcome back, ${user.email}` : "Welcome to Nebula Components"}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Total Audits
            </h3>
            <p className="text-3xl font-bold text-blue-600">{audits.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Organization
            </h3>
            <p className="text-lg text-gray-600">
              {organization?.name || "No organization"}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Active Subscription
            </h3>
            <p className="text-lg text-green-600">Active</p>
          </div>
        </div>

        {/* Recent audits */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Audits</h2>
          </div>
          <div className="p-6">
            {audits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No audits yet</p>
                <Link
                  href="/audits/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded inline-block"
                >
                  Create Your First Audit
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2">Site URL</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Score</th>
                    <th className="text-left py-2">Created</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => (
                    <tr key={audit.id} className="border-t">
                      <td className="py-3">{audit.site_url}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            audit.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : audit.status === "processing"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {audit.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {audit.score !== null ? `${audit.score}/100` : "-"}
                      </td>
                      <td className="py-3">
                        {new Date(audit.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/audits/${audit.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/audits/new"
                className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-center"
              >
                New Audit
              </Link>
              <Link
                href="/organization/settings"
                className="block bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-center"
              >
                Organization Settings
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Need Help?
            </h3>
            <p className="text-gray-600 mb-4">
              Get help with landing page optimization and conversion tracking.
            </p>
            <a
              href="mailto:support@nebulacomponents.shop"
              className="text-blue-600 hover:text-blue-800"
            >
              Contact Support →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
