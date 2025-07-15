"use client";
import { useEffect, useState } from "react";
import { CLIENT_ID, SMART_TOKEN_URL } from "../../config";

const REDIRECT_URI = typeof window !== "undefined" ? window.location.origin + "/auth/callback" : "http://localhost:3000/auth/callback";

export default function AuthCallback() {
  const [message, setMessage] = useState("Exchanging code for token...");
  const [token, setToken] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (!code) {
      setError("No code found in URL");
      setMessage("");
      return;
    }

    async function exchangeCode() {
      try {
        const params = new URLSearchParams({
          grant_type: "authorization_code",
          code: code || "",
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
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
      } catch (err: any) {
        setError(err.message || "Unknown error");
        setMessage("");
      }
    }
    exchangeCode();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {message && <p>{message}</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {token && (
        <pre className="bg-gray-100 p-4 rounded mt-4 text-xs max-w-xl overflow-x-auto">
          {JSON.stringify(token, null, 2)}
        </pre>
      )}
    </div>
  );
} 