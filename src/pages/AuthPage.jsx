import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { GlassCard } from "../components/ui/GlassCard";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { haptics } from "../motion/Haptics";

export const AuthPage = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    fitnessGoal: "maintenance",
    currentWeight: 70,
    targetWeight: 70,
    height: 175,
    age: 25,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "age" ||
        name === "height" ||
        name === "currentWeight" ||
        name === "targetWeight"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const trimmedEmail = formData.email.trim();
      if (isLogin) {
        await login({ email: trimmedEmail, password: formData.password });
      } else {
        await register({ ...formData, email: trimmedEmail });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Authentication failed. Please check your inputs."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-lime-500 selection:text-white">
      {/* Background Ambient Mesh Blobs (Soft Pastel) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-200/35 blur-[120px] pointer-events-none animate-blob-1" />
      <div className="absolute top-1/3 -right-32 w-[26rem] h-[26rem] rounded-full bg-lime-200/35 blur-[130px] pointer-events-none animate-blob-2" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-slate-900 items-center justify-center p-2.5 shadow-xl shadow-slate-900/20 mb-2 ring-1 ring-slate-800/40">
            <img
              src="/apple-touch-icon.png"
              alt="FitTogether Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            FitTogether
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto font-medium">
            Your goals. Your diet. Your squad. One shared fitness journey.
          </p>
        </div>

        {/* Card Form */}
        <GlassCard glow="lime" className="p-6 sm:p-8 bg-white/95 border-slate-200/90 shadow-lg">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Rivera"
                  className="w-full min-h-[46px] px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:bg-white focus:shadow-xs transition-all text-sm font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                inputMode="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full min-h-[46px] px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:bg-white focus:shadow-xs transition-all text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full min-h-[46px] pl-4 pr-11 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:bg-white focus:shadow-xs transition-all text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-lime-700">
                  Fitness Baseline & Targets
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-semibold">Goal</label>
                    <select
                      name="fitnessGoal"
                      value={formData.fitnessGoal}
                      onChange={handleChange}
                      className="w-full min-h-[44px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-lime-500 focus:bg-white"
                    >
                      <option value="fat_loss">Fat Loss</option>
                      <option value="muscle_gain">Muscle Gain</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="strength">Strength</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-semibold">Weight (kg)</label>
                    <input
                      type="number"
                      name="currentWeight"
                      inputMode="decimal"
                      value={formData.currentWeight}
                      onChange={handleChange}
                      className="w-full min-h-[44px] px-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-lime-500 focus:bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              {isLogin ? "Sign In to FitTogether" : "Create Account & Plan"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                haptics.tick();
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-xs font-bold text-slate-500 hover:text-lime-700 transition-colors cursor-pointer"
            >
              {isLogin
                ? "Don't have an account yet? Register here"
                : "Already have an account? Sign In"}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AuthPage;
