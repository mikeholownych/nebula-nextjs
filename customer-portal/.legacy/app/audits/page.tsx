"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8769";

interface Audit {
  id: string;
  org_id: string;
  site_url: string;
  status: string;
  score: number | null;
  created_at: string;
  completed_at: string | null;
}

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      const response = await fetch(`${API_URL}/api/audits`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch audits");
      }

      const data = await response.json();
      setAudits(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
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
              <Link href="/audits" className="text-blue-600 px-3 py-2">
                Audits
              </Link>
              <Link href="/organization" className="text-gray-600 hover:text-gray-900 px-3 py-2">
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audits</h1>
            <p className="mt-2 text-gray-600">
              View and manage your landing page audits
            </p>
          </div>
          <Link
            href="/audits/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            New Audit
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Audits table */}
        <div className="bg-white rounded-lg shadow">
          {audits.length === 0 ? (
            <div className="text-center py-12">
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
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site URL
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={audit.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {audit.site_url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          audit.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : audit.status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : audit.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {audit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {audit.score !== null ? (
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                audit.score >= 70
                                  ? "bg-green-600"
                                  : audit.score >= 40
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                              }`}
                              style={{ width: `${audit.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{audit.score}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(audit.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/audits/${audit.id}`}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        View
                      </Link>
                      {audit.status === "completed" && (
                        <button className="text-gray-600 hover:text-gray-800">
                          Download
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
