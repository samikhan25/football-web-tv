"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    console.log("LOGIN BUTTON PRESSED");

    setLoading(true);
    setMessage("Logging in...");

    try {
      const supabase = createSupabaseBrowserClient();

      console.log("SUPABASE CLIENT CREATED");

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      console.log("LOGIN RESPONSE:", error);

      if (error) {
        setLoading(false);
        setMessage(error.message);
        return;
      }

      setMessage("Login successful!");

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setLoading(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong during login."
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h1>Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && (
          <p
            style={{
              margin: 0,
              wordBreak: "break-word",
            }}
          >
            {message}
          </p>
        )}
      </form>
    </main>
  );
}