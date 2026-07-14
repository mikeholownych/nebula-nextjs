"use client";

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useState } from "react";

const GOOGLE_CLIENT_ID = "625346353182-qnlo095vhh5h8f8m1mkemjrrogppl821.apps.googleusercontent.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8769";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id_token: credentialResponse.credential }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Authentication failed");
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err: any) {
      setError(err.message);
      console.error("Login error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="z-10 w-full max-w-5xl items-center justify-center text-center">
          <h1 className="text-4xl font-bold mb-8">
            Nebula Components Customer Portal
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!user ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-xl mb-4">Sign in to access your dashboard</p>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setError("Google login failed");
                }}
                useOneTap
              />
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-4">
                Welcome, {user.user?.email}
              </h2>
              <div className="text-left space-y-2 mb-6">
                <p>
                  <strong>User ID:</strong> {user.user?.id}
                </p>
                <p>
                  <strong>Organization:</strong> {user.organization?.name}
                </p>
                <p>
                  <strong>Session:</strong> {user.session_id}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-6 rounded"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
