import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { GlassCard } from "../components/ui/GlassCard";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../motion/Haptics";
import { authApi } from "../api/endpoints";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get("token");
  const queryEmail = searchParams.get("email");
  const queryCode = searchParams.get("code");

  const initialToken = routeToken || queryToken || "";

  // Step 1 = Request Code, Step 2 = Enter Code & Reset, Step 3 = Success
  const [step, setStep] = useState(initialToken || queryCode ? 2 : 1);
  const [email, setEmail] = useState(queryEmail || "");
  const [code, setCode] = useState(queryCode || "");
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(Boolean(initialToken));
  const [error, setError] = useState("");
  const [devHelper, setDevHelper] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-verify token if arrived via direct link
  useEffect(() => {
    if (initialToken) {
      setIsVerifyingToken(true);
      authApi
        .verifyResetToken(initialToken)
        .then((res) => {
          if (res.data?.data?.email) {
            setEmail(res.data.data.email);
          }
          setStep(2);
        })
        .catch((err) => {
          setError(
            err.response?.data?.message ||
              "This password reset link has expired or is invalid. Please request a new one."
          );
          setStep(1);
        })
        .finally(() => {
          setIsVerifyingToken(false);
        });
    }
  }, [initialToken]);

  // Handle countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Request Password Reset Code
  const handleRequestCode = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setError("");
    setIsLoading(true);
    haptics.impact();

    try {
      const res = await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      const data = res.data?.data || {};

      haptics.notificationSuccess();
      toast.success("Reset code sent! Check your email / notifications.");

      if (data.devCode) {
        setDevHelper({ code: data.devCode, token: data.devToken });
      }

      setResendCooldown(45);
      setStep(2);
    } catch (err) {
      haptics.notificationError();
      setError(
        err.response?.data?.message ||
          "Failed to request password reset. Please verify your connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit Reset with Code or Token
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!token && (!code || !code.trim())) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);
    haptics.impact();

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        newPassword,
        ...(token ? { token } : { code: code.trim() }),
      };

      const res = await authApi.resetPassword(payload);
      const data = res.data?.data;

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#84CC16", "#10B981", "#06B6D4"],
      });

      haptics.notificationSuccess();
      toast.success("Password reset successful!");

      // If accessToken returned, update local session
      if (data?.accessToken) {
        localStorage.setItem("ft_access_token", data.accessToken);
      }

      setStep(3);

      // Auto redirect after 2.5 seconds
      setTimeout(() => {
        if (data?.accessToken) {
          window.location.href = "/";
        } else {
          navigate("/login");
        }
      }, 2400);
    } catch (err) {
      haptics.notificationError();
      setError(
        err.response?.data?.message ||
          "Invalid or expired verification code. Please request a new code."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isPasswordValid = newPassword.length >= 6;

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-lime-500 selection:text-white">
      {/* Background Ambient Mesh Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-200/35 blur-[120px] pointer-events-none animate-blob-1" />
      <div className="absolute top-1/3 -right-32 w-[26rem] h-[26rem] rounded-full bg-lime-200/35 blur-[130px] pointer-events-none animate-blob-2" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Branding & Back to Login */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-slate-900 items-center justify-center p-2.5 shadow-xl shadow-slate-900/20 mb-2 ring-1 ring-slate-800/40">
            <img
              src="/apple-touch-icon.png"
              alt="FitTogether Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            FitTogether
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto font-medium">
            Account Security & Recovery
          </p>
        </div>

        {/* Card Form */}
        <GlassCard glow="lime" className="p-6 sm:p-8 bg-white/95 border-slate-200/90 shadow-xl">
          {/* Header Step Pills */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-lime-100 text-lime-700 flex items-center justify-center">
                {step === 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-lime-700" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  {step === 1 && "Forgot Password"}
                  {step === 2 && "Reset Password"}
                  {step === 3 && "Recovery Complete"}
                </h2>
                <p className="text-[11px] font-semibold text-slate-400">
                  {step === 1 && "Step 1 of 2: Verify Email"}
                  {step === 2 && "Step 2 of 2: Set New Password"}
                  {step === 3 && "Account Secured"}
                </p>
              </div>
            </div>

            {step !== 3 && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {step}/2
              </span>
            )}
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verification Loader when arrived via token */}
          {isVerifyingToken && (
            <div className="py-8 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                Verifying your secure password reset link...
              </p>
            </div>
          )}

          {/* STEP 1: Request Code */}
          {!isVerifyingToken && step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Enter the email address registered with your FitTogether squad. We'll send you a
                  6-digit verification code to reset your password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoFocus
                    className="w-full min-h-[46px] pl-10 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:bg-white focus:shadow-xs transition-all text-sm font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2 min-h-[48px] font-extrabold text-sm shadow-md"
              >
                <span>Send Verification Code</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          )}

          {/* STEP 2: Enter Code & New Password */}
          {!isVerifyingToken && step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Email Chip */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <Mail className="w-3.5 h-3.5 text-lime-600 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{email}</span>
                </div>
                {!token && (
                  <button
                    type="button"
                    onClick={() => {
                      haptics.tick();
                      setStep(1);
                      setError("");
                    }}
                    className="text-[11px] font-extrabold text-lime-700 hover:text-lime-800 transition-colors shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Dev Helper Card for Instant Local Testing */}
              {devHelper?.code && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                      Demo / Development Helper
                    </span>
                    <span className="font-mono font-bold text-amber-950">
                      Code: {devHelper.code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCode(devHelper.code);
                      haptics.tick();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-200/70 hover:bg-amber-300 text-amber-900 font-extrabold text-[11px] transition-colors cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {/* 6-Digit OTP Code Input (hidden if reset via token link) */}
              {!token && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      6-Digit Verification Code
                    </label>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={() => handleRequestCode()}
                      className="text-[11px] font-bold text-lime-700 hover:text-lime-800 disabled:text-slate-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="code"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="• • • • • •"
                      className="w-full min-h-[48px] px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-lime-500 focus:bg-white focus:shadow-xs transition-all text-center font-mono font-black text-xl tracking-[0.35em]"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* New Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[46px] pl-10 pr-11 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:bg-white focus:shadow-xs transition-all text-sm font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isPasswordValid ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium ${
                      isPasswordValid ? "text-emerald-700 font-bold" : "text-slate-500"
                    }`}
                  >
                    Minimum 6 characters
                  </span>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[46px] pl-10 pr-11 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:bg-white focus:shadow-xs transition-all text-sm font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="flex items-center gap-2 mt-1.5 px-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        passwordsMatch ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    <span
                      className={`text-[11px] font-medium ${
                        passwordsMatch ? "text-emerald-700 font-bold" : "text-rose-600"
                      }`}
                    >
                      {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                disabled={!isPasswordValid || !passwordsMatch || (!token && !code)}
                className="w-full mt-3 min-h-[48px] font-extrabold text-sm shadow-md"
              >
                <Zap className="w-4 h-4 mr-1 text-lime-300 fill-lime-300" />
                <span>Reset Password & Sign In</span>
              </Button>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="py-6 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">Password Reset Complete!</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Your FitTogether credentials have been safely updated. Preparing your dashboard...
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center min-h-[46px] px-6 rounded-2xl bg-gradient-to-r from-lime-600 to-emerald-600 text-white font-black text-xs shadow-md hover:opacity-95 transition-all"
                >
                  <span>Go to FitTogether</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* Bottom Link: Back to Sign In */}
          {step !== 3 && (
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <Link
                to="/login"
                className="min-h-[44px] px-3 py-2 text-xs font-bold text-slate-500 hover:text-lime-700 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;