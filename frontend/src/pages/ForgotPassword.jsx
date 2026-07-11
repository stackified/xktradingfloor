import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, Shield } from "lucide-react";
import { forgotPassword } from "../controllers/authController.js";
import { useToast } from "../contexts/ToastContext.jsx";

function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await forgotPassword({ email: email.trim() });
      setSubmitted(true);
      toast.success(res.message || "Check your email for a reset link.", 5000);
    } catch (err) {
      const status = err.response?.status;
      const errorMessage =
        status === 429
          ? "Too many reset attempts. Please wait before trying again."
          : err.response?.data?.message ||
            err.message ||
            "Failed to send reset link. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage, 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-black min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <Helmet>
        <title>Forgot Password | XK Trading Floor</title>
        <meta
          name="description"
          content="Reset your XK Trading Floor account password."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Forgot password?</h1>
          <p className="text-gray-400">
            Enter your email and we&apos;ll send you a secure reset link
          </p>
        </div>

        <div className="card bg-gray-900/80 backdrop-blur-xl border border-gray-800/50 shadow-2xl">
          <div className="card-body p-8">
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="h-7 w-7 text-green-400" />
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  If an account exists with{" "}
                  <span className="text-white font-medium">{email}</span>, you will
                  receive a password reset link shortly. The link expires in 1 hour
                  and can only be used once.
                </p>
                <p className="text-xs text-gray-500">
                  For security, repeated requests are rate-limited.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      className="input pl-10 h-12"
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  className="btn btn-primary w-full h-12 rounded-lg font-semibold text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={loading || submitted}
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
