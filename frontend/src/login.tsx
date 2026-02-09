import { useState } from 'react';

interface LoginProps {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. Prepare Data
    // Login expects "form-data", Signup expects JSON. We handle both.
    let url = isSignup 
      ? "http://127.0.0.1:8000/api/v1/auth/signup" 
      : "http://127.0.0.1:8000/api/v1/auth/login";

    const body = isSignup 
      ? JSON.stringify({ username, password }) 
      : new URLSearchParams({ username, password }); // OAuth2 expects form data

    const headers = isSignup 
      ? { "Content-Type": "application/json" } 
      : { "Content-Type": "application/x-www-form-urlencoded" };

    try {
      const res = await fetch(url, { method: "POST", headers, body });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Something went wrong");

      if (isSignup) {
        // If signup success, automatically switch to login
        setIsSignup(false);
        setError("Account created! Please log in.");
      } else {
        // Login success!
        onLogin(data.access_token);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      backgroundColor: "#1a1a1a", 
      color: "white", 
      fontFamily: "sans-serif" 
    }}>
      <div style={{ 
        width: "300px", 
        padding: "30px", 
        backgroundColor: "#2d2d2d", 
        borderRadius: "10px", 
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)" 
      }}>
        <h2 style={{ textAlign: "center", marginTop: 0 }}>Edward AI</h2>
        <h3 style={{ textAlign: "center", color: "#ccc" }}>{isSignup ? "Create Account" : "Welcome Back"}</h3>
        
        {error && <div style={{ color: "#ff6b6b", marginBottom: "15px", fontSize: "14px", textAlign: "center" }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "none" }}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "none" }}
            required
          />
          <button 
            type="submit" 
            style={{ 
              padding: "10px", 
              backgroundColor: "#007bff", 
              color: "white", 
              border: "none", 
              borderRadius: "5px", 
              cursor: "pointer", 
              fontWeight: "bold" 
            }}
          >
            {isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
          {isSignup ? "Already have an account?" : "Need an account?"} <br/>
          <button 
            onClick={() => { setIsSignup(!isSignup); setError(""); }} 
            style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", marginTop: "5px" }}
          >
            {isSignup ? "Log In here" : "Sign Up here"}
          </button>
        </div>
      </div>
    </div>
  );
}