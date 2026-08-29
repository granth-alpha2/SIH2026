"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devHint, setDevHint] = useState<string | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error?.message || "Failed to dispatch OTP. Please check your number.");
        setLoading(false);
        return;
      }

      if (data.devOtp) {
        setDevHint(`Test Code: ${data.devOtp}`);
        setOtp(data.devOtp); // Auto-fill in development for convenience
      } else {
        setDevHint(null);
      }

      setStep("otp");
    } catch {
      setError("Network error while connecting to authentication service.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error?.message || "Invalid or expired OTP code.");
        setLoading(false);
        return;
      }

      // Successful verification
      router.push("/");
      router.refresh();
    } catch {
      setError("Failed to verify code. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <Link className="brand" href="/">
          <span className="brand-mark">✳</span>
          <span>agriprofit</span>
        </Link>
        <p className="eyebrow">FARMER AUTHENTICATION</p>
        <h1 id="login-title">Sign in to your farm workspace</h1>
        <p className="subhead">
          {step === "phone"
            ? "Enter your registered mobile number to receive a one-time verification code."
            : `Enter the 6-digit verification code sent to +91 ${phone}`}
        </p>

        {error && <div className="p-2.5 mb-3 text-xs rounded bg-rose-50 text-rose-700 border border-rose-200">{error}</div>}
        {devHint && <div className="p-2.5 mb-3 text-xs rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">{devHint}</div>}

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <label htmlFor="phone">Mobile Number</label>
            <div className="flex gap-2">
              <span className="p-2.5 bg-gray-100 border rounded text-xs text-gray-600 flex items-center font-medium">+91</span>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="e.g. 9876543210"
                className="flex-1 p-2.5 border rounded text-xs"
                required
              />
            </div>
            <button className="primary-button full mt-3" type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send Verification OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <label htmlFor="otp">Enter 6-Digit OTP Code</label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="p-2.5 border rounded text-xs tracking-widest text-center text-lg font-bold"
              required
            />
            <button className="primary-button full mt-3" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify & Enter Workspace"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError("");
                setDevHint(null);
              }}
              className="text-xs text-gray-500 hover:text-emerald-700 text-center block mt-3 font-medium"
            >
              ← Change phone number
            </button>
          </form>
        )}

        <div className="mt-4 pt-3 border-t text-center">
          <p className="text-[11px] text-gray-500">
            Development Mode: In-memory mock authentication active.
          </p>
        </div>
      </section>
    </main>
  );
}