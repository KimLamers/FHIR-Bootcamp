"use client";
import { CLIENT_ID, SMART_AUTH_URL, FHIR_BASE_URL, REDIRECT_URI, SMART_TOKEN_URL } from "./config";
import { useEffect, useState } from "react";
import pkceChallenge from "pkce-challenge";

const SCOPE = "patient/*.read openid profile launch/patient";
const STATE = "random_state_string"; // Replace with secure random string in production

function buildAuthUrl(code_challenge: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    state: STATE,
    aud: FHIR_BASE_URL,
    code_challenge: code_challenge,
    code_challenge_method: "S256",
  });
  return `${SMART_AUTH_URL}?${params.toString()}`;
}

function parseJwt(token: string) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenValid(token: string) {
  const jwt = parseJwt(token);
  if (!jwt || !jwt.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return jwt.exp > now;
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    // Check for valid token in localStorage
    const tokenResponseStr = localStorage.getItem("token_response");
    if (tokenResponseStr) {
      try {
        const tokenResponse = JSON.parse(tokenResponseStr);
        if (tokenResponse.access_token && isTokenValid(tokenResponse.access_token)) {
          setShowLogin(false);
          // Do not redirect automatically
          return;
        }
      } catch {}
    }
    setShowLogin(true);
  }, []);

  const handleLogin = async () => {
    const { code_verifier, code_challenge } = await pkceChallenge();
    sessionStorage.setItem("pkce_code_verifier", code_verifier);
    window.location.href = buildAuthUrl(code_challenge);
  };

  useEffect(() => {
    // Check for code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      setMessage("Exchanging code for token...");
      async function exchangeCode() {
        try {
          // Retrieve code_verifier from sessionStorage
          const code_verifier = sessionStorage.getItem("pkce_code_verifier") || "";
          const params = new URLSearchParams({
            grant_type: "authorization_code",
            code: code || "",
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            code_verifier,
          });
          const res = await fetch(SMART_TOKEN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          });
          if (!res.ok) throw new Error("Token exchange failed");
          const data = await res.json();
          setToken(data);
          setMessage("");
          // Store token for dashboard use
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("token_response", JSON.stringify(data));
          // Optionally, redirect to dashboard
          window.location.href = "/dashboard";
        } catch (err: any) {
          setError(err.message || "Unknown error");
          setMessage("");
        }
      }
      exchangeCode();
    }
  }, []);

  if (!showLogin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-200">
        <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md flex flex-col items-center border-t-8 border-blue-400">
          <h1 className="text-4xl font-extrabold mb-4 text-blue-700 tracking-tight">EHR Patient Portal</h1>
          <p className="mb-8 text-gray-700 text-center text-lg">You are already signed in.</p>
          <a
            href="/dashboard"
            className="rounded-full border-2 border-solid border-teal-500 bg-gradient-to-r from-blue-500 to-teal-400 text-white px-8 py-3 font-bold text-lg shadow hover:from-blue-600 hover:to-teal-500 transition-all mb-4 w-full text-center"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-200">
      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md flex flex-col items-center border-t-8 border-blue-400">
        <h1 className="text-4xl font-extrabold mb-4 text-blue-700 tracking-tight">EHR Patient Portal</h1>
        <p className="mb-8 text-gray-700 text-center text-lg">Sign in to access your health records, medications, lab results, and more.</p>
        <button
          onClick={handleLogin}
          className="rounded-full border-2 border-solid border-teal-500 bg-gradient-to-r from-blue-500 to-teal-400 text-white px-8 py-3 font-bold text-lg shadow hover:from-blue-600 hover:to-teal-500 transition-all mb-4 w-full text-center"
        >
          Sign in with Epic
        </button>
        {message && <p className="text-cyan-700 mt-2">{message}</p>}
        {error && <p className="text-red-600 mt-2">Error: {error}</p>}
      </div>
    </div>
  );
}
