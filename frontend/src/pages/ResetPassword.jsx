import React from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { resetPassword, validateResetToken } from "../controllers/authController.js";
import { useToast } from "../contexts/ToastContext.jsx";
import PasswordStrength from "../components/shared/PasswordStrength.jsx";
import { validatePassword } from "../utils/passwordPolicy.js";

function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form, setForm] = React.useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [validatingToken, setValidatingToken] = React.useState(Boolean(token));
  const [tokenValid, setTokenValid] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function verifyToken() {
      if (!token) {
        setValidatingToken(false);
        setTokenValid(false);
        return;
      }

      setValidatingToken(true);
      try {
        await validateResetToken(token);
        if (!cancelled) {
          setTokenValid(true);
        }
      } catch (err) {
        if (!cancelled) {
          setTokenValid(false);
        }
      } finally {
        if (!cancelled) {
          setValidatingToken(false);
        }
      }
    }

    verifyToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token || !tokenValid) {
      setError("Invalid or missing reset link. Please request a new one.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordCheck = validatePassword(form.newPassword);
    if (!passwordCheck.valid) {
      setError(passwordCheck.errors[0]);
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword({
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(true);
      toast.success(res.message || "Password reset successfully.", 5000);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const status = err.response?.status;
      const errorMessage =
        status === 429
          ? "Too many reset attempts. Please wait before trying again."
          : err.response?.data?.message ||
            err.message ||
            "Failed to reset password. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage, 5000);
    } finally {
      setLoading(false);
    }
  }

  if (validatingToken) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center px-4 py-12">
        <Helmet>
          <title>Reset Password | XK Trading Floor</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="text-center text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-400" />
          <p className="text-sm">Verifying your secure reset link...</p>
        </div>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center px-4 py-12">
        <Helmet>
          <title>Reset Password | XK Trading Floor</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="card bg-gray-900/80 border border-gray-800/50 max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-semibold text-white mb-2">Invalid reset link</h1>
          <p className="text-gray-400 text-sm mb-6">
            This password reset link is invalid, expired, or has already been used.
          </p>
          <Link
            to="/forgot-password"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            Request a new link
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <Helmet>
        <title>Reset Password | XK Trading Floor</title>
        <meta
          name="description"
          content="Set a new password for your XK Trading Floor account."
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
          <h1 className="text-3xl font-bold text-white mb-2">Set new password</h1>
          <p className="text-gray-400">
            Create a strong password that meets all security requirements
          </p>
        </div>

        <div className="card bg-gray-900/80 backdrop-blur-xl border border-gray-800/50 shadow-2xl">
          <div className="card-body p-8">
            {success ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="h-7 w-7 text-green-400" />
                </div>
                <p className="text-gray-300 text-sm">
                  Your password has been reset. All active sessions were signed out
                  for your security. Redirecting you to login...
                </p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      className="input pl-10 pr-10 h-12"
                      placeholder="Enter new password"
                      type={showPassword ? "text" : "password"}
                      value={form.newPassword}
                      onChange={(e) =>
                        setForm({ ...form, newPassword: e.target.value })
                      }
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <PasswordStrength password={form.newPassword} />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      className="input pl-10 pr-10 h-12"
                      placeholder="Confirm new password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({ ...form, confirmPassword: e.target.value })
                      }
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
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
                  disabled={loading || success}
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset password
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <Link
                  to="/forgot-password"
                  className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Request a new link
                </Link>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ResetPassword;
