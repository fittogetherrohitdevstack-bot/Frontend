import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { measurementApi, weeklyTargetApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { Sheet } from "../components/ui/Sheet";
import { Skeleton } from "../components/ui/Skeleton";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Ruler,
  TrendingDown,
  TrendingUp,
  Minus,
  Plus,
  Calendar,
  CheckCircle2,
  Sparkles,
  Info,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Columns,
  Camera,
  Activity,
  Layers,
  Check,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const BODY_PARTS = [
  { id: "waist", label: "Waist", color: "#7C5CFF", defaultSelected: true },
  { id: "chest", label: "Chest", color: "#10B981", defaultSelected: true },
  { id: "hips", label: "Hips", color: "#F59E0B", defaultSelected: true },
  { id: "abdomen", label: "Abdomen", color: "#EC4899", defaultSelected: false },
  { id: "leftArm", label: "Left Arm", color: "#06B6D4", defaultSelected: false },
  { id: "rightArm", label: "Right Arm", color: "#3B82F6", defaultSelected: false },
  { id: "leftThigh", label: "Left Thigh", color: "#8B5CF6", defaultSelected: false },
  { id: "rightThigh", label: "Right Thigh", color: "#6366F1", defaultSelected: false },
  { id: "neck", label: "Neck", color: "#14B8A6", defaultSelected: false },
  { id: "shoulders", label: "Shoulders", color: "#F97316", defaultSelected: false },
  { id: "calves", label: "Calves", color: "#84CC16", defaultSelected: false },
];

export const MeasurementsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Unit toggle & settings
  const [unit, setUnit] = useState("cm"); // "cm" or "in"
  const [range, setRange] = useState("12w"); // "4w" | "12w" | "26w" | "all"
  const [selectedParts, setSelectedParts] = useState(["waist", "chest", "hips"]);
  const [activeZone, setActiveZone] = useState("waist");

  // Form sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formMeasurements, setFormMeasurements] = useState({});
  const [formNote, setFormNote] = useState("");
  const [formPhoto, setFormPhoto] = useState("");

  // Compare View state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareWeekA, setCompareWeekA] = useState("");
  const [compareWeekB, setCompareWeekB] = useState("");

  // Unit conversion helpers (1 in = 2.54 cm)
  const toDisplay = (cm) => {
    if (cm === undefined || cm === null || isNaN(cm)) return "--";
    if (unit === "in") {
      return (cm / 2.54).toFixed(1);
    }
    return Number(cm).toFixed(1);
  };

  const toCm = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    return unit === "in" ? Math.round(num * 2.54 * 10) / 10 : Math.round(num * 10) / 10;
  };

  // Queries
  const { data: summaryRes, isLoading } = useQuery({
    queryKey: ["measurements-summary", range],
    queryFn: async () => {
      const res = await measurementApi.getSummary(range);
      return res.data;
    },
  });

  const summary = summaryRes?.data || {};
  const { data: weeklyTargetData } = useQuery({
    queryKey: ["weekly-target"],
    queryFn: async () => {
      const res = await weeklyTargetApi.getWeekly();
      return res.data?.data;
    },
    enabled: Boolean(user),
  });
  const weekCheckinStatus = weeklyTargetData?.progress?.measurementsStatus;
  const {
    summaryByPart = {},
    weeklyTable = [],
    monthlyAverages = [],
    ratios = {},
    consistency = {},
    lastEntry = null,
  } = summary;

  // Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      return await measurementApi.upsertMeasurements(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurements-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-target"] });
      queryClient.invalidateQueries({ queryKey: ["reminders-due"] });
      toast.success("Weekly body measurements saved!");
      setIsSheetOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to save measurements");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await measurementApi.deleteMeasurement(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurements-summary"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-target"] });
      queryClient.invalidateQueries({ queryKey: ["reminders-due"] });
      toast.success("Measurement entry deleted");
    },
  });

  // Open Sheet for New / Edit
  const openEntrySheet = (entry = null) => {
    if (entry) {
      setEditingEntryId(entry._id);
      setFormDate(entry.date);
      setFormNote(entry.note || "");
      setFormPhoto(entry.progressImage || "");
      // Convert stored cm to current display unit
      const initial = {};
      if (entry.measurementsCm) {
        Object.keys(entry.measurementsCm).forEach((k) => {
          initial[k] = unit === "in" ? (entry.measurementsCm[k] / 2.54).toFixed(1) : entry.measurementsCm[k];
        });
      }
      setFormMeasurements(initial);
    } else {
      // Pre-fill with last logged measurements for convenience!
      setEditingEntryId(null);
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormNote("");
      setFormPhoto("");
      const initial = {};
      if (lastEntry?.measurementsCm) {
        Object.keys(lastEntry.measurementsCm).forEach((k) => {
          initial[k] =
            unit === "in"
              ? (lastEntry.measurementsCm[k] / 2.54).toFixed(1)
              : lastEntry.measurementsCm[k];
        });
      }
      setFormMeasurements(initial);
    }
    setIsSheetOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("open") === "1" && !isLoading) {
      openEntrySheet();
      const next = new URLSearchParams(searchParams);
      next.delete("open");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoading]);

  const handleStepperChange = (partId, delta) => {
    setFormMeasurements((prev) => {
      const current = parseFloat(prev[partId]) || (unit === "in" ? 30 : 75);
      const step = unit === "in" ? 0.2 : 0.5;
      const updated = Math.max(0, current + delta * step);
      return {
        ...prev,
        [partId]: updated.toFixed(1),
      };
    });
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    const cmPayload = {};
    let count = 0;
    Object.keys(formMeasurements).forEach((k) => {
      const val = parseFloat(formMeasurements[k]);
      if (!isNaN(val) && val > 0) {
        cmPayload[k] = unit === "in" ? Math.round(val * 2.54 * 10) / 10 : Math.round(val * 10) / 10;
        count++;
      }
    });

    if (count === 0) {
      toast.error("Please enter at least one body measurement");
      return;
    }

    saveMutation.mutate({
      date: formDate,
      measurementsCm: cmPayload,
      note: formNote,
      progressImage: formPhoto,
    });
  };

  // Chart data prep
  const chartData = useMemo(() => {
    if (!weeklyTable || weeklyTable.length === 0) return [];
    return weeklyTable.map((w) => {
      const point = {
        name: w.date.slice(5),
        fullDate: w.date,
        weekStart: w.weekStart,
      };
      BODY_PARTS.forEach((part) => {
        const val = w.measurementsCm?.[part.id];
        if (val !== undefined && val !== null) {
          point[part.id] = unit === "in" ? parseFloat((val / 2.54).toFixed(1)) : val;
        }
      });
      return point;
    });
  }, [weeklyTable, unit]);

  const togglePartSelection = (id) => {
    setSelectedParts((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((p) => p !== id) : prev) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] pb-28 pt-4 px-3 sm:px-6 max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Body Measurements
              </h1>
              <p className="text-xs text-gray-500">
                Track circumference changes weekly & watch muscle definition grow
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Unit toggle + Log Check-in CTA */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Unit Toggle */}
          <div className="flex items-center bg-white border border-gray-200/80 rounded-xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setUnit("cm")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                unit === "cm"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              cm
            </button>
            <button
              type="button"
              onClick={() => setUnit("in")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                unit === "in"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              inches
            </button>
          </div>

          <Button
            onClick={() => openEntrySheet()}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Check-in</span>
          </Button>
        </div>
      </div>

      {/* Weekly Check-in Prompt Banner */}
      <GlassCard className="p-4 sm:p-5 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white border-0 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-lime-300" />
                <span>Weekly Milestone</span>
              </div>
              {weekCheckinStatus && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-violet-800 text-[11px] font-extrabold shadow-xs">
                  {weekCheckinStatus === "done"
                    ? "Done this week ✓"
                    : weekCheckinStatus === "overdue"
                    ? "Overdue this week"
                    : "Due this week"}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold">
              {lastEntry
                ? `Last check-in recorded on ${lastEntry.date}`
                : "No weekly check-ins yet"}
            </h2>
            <p className="text-xs text-white/80 max-w-md">
              Measure once every week (recommended Sundays before breakfast) for true consistency.
              Values pre-fill automatically so you only update what shifted!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => openEntrySheet()}
              className="bg-white text-violet-700 hover:bg-white/90 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Ruler className="w-4 h-4 text-violet-600" />
              <span>{lastEntry ? "Update This Week" : "Start First Check-In"}</span>
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Health Ratios & Consistency Bento Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Waist-to-Hip */}
        <GlassCard className="p-3.5 sm:p-4 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Waist-to-Hip</span>
            <Activity className="w-3.5 h-3.5 text-violet-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {ratios.waistToHip ? ratios.waistToHip : "--"}
          </div>
          <div className="text-[11px] text-gray-500 flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                ratios.waistToHip && ratios.waistToHip <= 0.9 ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>{ratios.waistToHip ? (ratios.waistToHip <= 0.85 ? "Optimal" : "Healthy Range") : "Needs waist & hips"}</span>
          </div>
        </GlassCard>

        {/* Waist-to-Height */}
        <GlassCard className="p-3.5 sm:p-4 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Waist-to-Height</span>
            <Percent className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {ratios.waistToHeight ? ratios.waistToHeight : "--"}
          </div>
          <div className="text-[11px] text-gray-500 flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                ratios.waistToHeight && ratios.waistToHeight <= 0.5 ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>{ratios.waistToHeight ? (ratios.waistToHeight <= 0.5 ? "Goal < 0.50 ✓" : "Slightly elevated") : "Height: 175cm"}</span>
          </div>
        </GlassCard>

        {/* Consistency */}
        <GlassCard className="p-3.5 sm:p-4 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Consistency</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-lime-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {consistency.consistencyRate !== undefined ? `${consistency.consistencyRate}%` : "0%"}
          </div>
          <div className="text-[11px] text-gray-500">
            {consistency.weeksLogged || 0} of {consistency.totalWeeksInRange || 12} weeks logged
          </div>
        </GlassCard>
      </div>

      {/* Interactive Body Silhouette & Hot Zones */}
      <GlassCard className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Interactive Body Map</h3>
            <p className="text-xs text-gray-500">Tap any muscle region to view latest value</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase">
            Active: {BODY_PARTS.find((p) => p.id === activeZone)?.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* SVG Silhouette */}
          <div className="md:col-span-5 flex justify-center items-center py-2 bg-gray-50/60 rounded-2xl border border-gray-100">
            <svg
              viewBox="0 0 200 400"
              className="w-48 h-80 drop-shadow select-none cursor-pointer"
            >
              {/* Head / Neck */}
              <circle cx="100" cy="35" r="22" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="2" />
              <rect
                x="88"
                y="58"
                width="24"
                height="18"
                rx="4"
                fill={activeZone === "neck" ? "#7C5CFF" : "#CBD5E1"}
                onClick={() => setActiveZone("neck")}
                className="transition-colors hover:fill-violet-400"
              />

              {/* Shoulders */}
              <rect
                x="45"
                y="74"
                width="110"
                height="20"
                rx="8"
                fill={activeZone === "shoulders" ? "#7C5CFF" : "#E2E8F0"}
                onClick={() => setActiveZone("shoulders")}
                className="transition-colors hover:fill-violet-400"
              />

              {/* Chest */}
              <rect
                x="55"
                y="96"
                width="90"
                height="34"
                rx="6"
                fill={activeZone === "chest" ? "#10B981" : "#E2E8F0"}
                onClick={() => setActiveZone("chest")}
                className="transition-colors hover:fill-emerald-400"
              />

              {/* Waist */}
              <rect
                x="65"
                y="132"
                width="70"
                height="28"
                rx="6"
                fill={activeZone === "waist" ? "#7C5CFF" : "#CBD5E1"}
                onClick={() => setActiveZone("waist")}
                className="transition-colors hover:fill-violet-400"
              />

              {/* Abdomen */}
              <rect
                x="62"
                y="162"
                width="76"
                height="22"
                rx="4"
                fill={activeZone === "abdomen" ? "#EC4899" : "#E2E8F0"}
                onClick={() => setActiveZone("abdomen")}
                className="transition-colors hover:fill-pink-400"
              />

              {/* Hips */}
              <rect
                x="56"
                y="186"
                width="88"
                height="30"
                rx="8"
                fill={activeZone === "hips" ? "#F59E0B" : "#CBD5E1"}
                onClick={() => setActiveZone("hips")}
                className="transition-colors hover:fill-amber-400"
              />

              {/* Left & Right Arms */}
              <rect
                x="28"
                y="96"
                width="22"
                height="80"
                rx="8"
                fill={activeZone === "leftArm" ? "#06B6D4" : "#E2E8F0"}
                onClick={() => setActiveZone("leftArm")}
                className="transition-colors hover:fill-cyan-400"
              />
              <rect
                x="150"
                y="96"
                width="22"
                height="80"
                rx="8"
                fill={activeZone === "rightArm" ? "#3B82F6" : "#E2E8F0"}
                onClick={() => setActiveZone("rightArm")}
                className="transition-colors hover:fill-blue-400"
              />

              {/* Left & Right Thighs */}
              <rect
                x="58"
                y="222"
                width="38"
                height="90"
                rx="10"
                fill={activeZone === "leftThigh" ? "#8B5CF6" : "#E2E8F0"}
                onClick={() => setActiveZone("leftThigh")}
                className="transition-colors hover:fill-purple-400"
              />
              <rect
                x="104"
                y="222"
                width="38"
                height="90"
                rx="10"
                fill={activeZone === "rightThigh" ? "#6366F1" : "#E2E8F0"}
                onClick={() => setActiveZone("rightThigh")}
                className="transition-colors hover:fill-indigo-400"
              />

              {/* Calves */}
              <rect
                x="62"
                y="316"
                width="32"
                height="70"
                rx="8"
                fill={activeZone === "calves" ? "#84CC16" : "#CBD5E1"}
                onClick={() => setActiveZone("calves")}
                className="transition-colors hover:fill-lime-400"
              />
              <rect
                x="106"
                y="316"
                width="32"
                height="70"
                rx="8"
                fill={activeZone === "calves" ? "#84CC16" : "#CBD5E1"}
                onClick={() => setActiveZone("calves")}
                className="transition-colors hover:fill-lime-400"
              />
            </svg>
          </div>

          {/* Region Details & Quick Stepper in Map */}
          <div className="md:col-span-7 space-y-4">
            {(() => {
              const part = BODY_PARTS.find((p) => p.id === activeZone);
              const stat = summaryByPart[activeZone];
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">{part?.label}</h4>
                      <p className="text-xs text-gray-500">
                        {stat
                          ? `Recorded across ${stat.sparkline?.length || 1} check-ins`
                          : "No entries logged yet for this region"}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-gray-900">
                        {toDisplay(stat?.current)}{" "}
                        <span className="text-xs font-semibold text-gray-500">{unit}</span>
                      </div>
                      {stat && stat.changeVsLastWeek !== 0 && (
                        <div
                          className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                            stat.changeVsLastWeek < 0 ? "text-emerald-600" : "text-violet-600"
                          }`}
                        >
                          {stat.changeVsLastWeek < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3" />
                          )}
                          <span>
                            {stat.changeVsLastWeek > 0 ? "+" : ""}
                            {toDisplay(stat.changeVsLastWeek)} {unit} vs last week
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Part Selector Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {BODY_PARTS.map((p) => {
                      const isActive = activeZone === p.id;
                      const hasVal = summaryByPart[p.id]?.current !== undefined;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setActiveZone(p.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            isActive
                              ? "bg-violet-600 text-white shadow-sm"
                              : hasVal
                              ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
                              : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          <span>{p.label}</span>
                          {hasVal && (
                            <span className="text-[10px] opacity-75 font-normal">
                              ({toDisplay(summaryByPart[p.id].current)})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => openEntrySheet()}
                      className="w-full bg-violet-50 text-violet-700 hover:bg-violet-100 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-violet-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Log or Adjust {part?.label} in Bottom Sheet</span>
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </GlassCard>

      {/* Multi-line Trend Chart */}
      <GlassCard className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Circumference Evolution</h3>
            <p className="text-xs text-gray-500">Multi-week progression across selected muscle groups</p>
          </div>

          {/* Range tabs */}
          <div className="flex items-center bg-gray-100 rounded-xl p-0.5 text-xs font-semibold text-gray-500 self-start sm:self-auto">
            {["4w", "12w", "26w", "all"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-lg uppercase transition-all ${
                  range === r ? "bg-white text-gray-900 shadow-sm" : "hover:text-gray-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Part Selection Chips for Chart */}
        <div className="flex flex-wrap gap-1.5">
          {BODY_PARTS.map((p) => {
            const isSelected = selectedParts.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePartSelection(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? "border-transparent text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                style={{
                  backgroundColor: isSelected ? p.color : undefined,
                }}
              >
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Chart Container */}
        <div className="h-64 w-full pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-3 shadow-lg text-xs space-y-1">
                          <div className="font-bold text-gray-900 border-b pb-1 mb-1">
                            {payload[0]?.payload?.fullDate || label}
                          </div>
                          {payload.map((entry) => (
                            <div
                              key={entry.dataKey}
                              className="flex items-center justify-between gap-4"
                            >
                              <span className="flex items-center gap-1.5 font-medium text-gray-600">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: entry.color }}
                                />
                                {BODY_PARTS.find((p) => p.id === entry.dataKey)?.label}
                              </span>
                              <span className="font-bold text-gray-900">
                                {entry.value} {unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {selectedParts.map((partId) => {
                  const part = BODY_PARTS.find((p) => p.id === partId);
                  return (
                    <Line
                      key={partId}
                      type="monotone"
                      dataKey={partId}
                      stroke={part?.color || "#7C5CFF"}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: part?.color || "#7C5CFF" }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
              <Ruler className="w-8 h-8 opacity-40 text-violet-500" />
              <p className="text-xs">Log at least one weekly check-in to see your evolution chart</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Summary Bento Cards Grid per Part */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Region Overview</h3>
          <Button
            variant="ghost"
            onClick={() => setIsCompareOpen(true)}
            className="text-xs text-violet-600 font-semibold hover:bg-violet-50 flex items-center gap-1"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Compare Any 2 Weeks</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {BODY_PARTS.map((part) => {
            const stat = summaryByPart[part.id];
            const hasData = stat?.current !== undefined;
            return (
              <GlassCard
                key={part.id}
                onClick={() => setActiveZone(part.id)}
                className={`p-3.5 bg-white border rounded-2xl shadow-sm transition-all cursor-pointer ${
                  activeZone === part.id
                    ? "border-violet-500 ring-2 ring-violet-500/10"
                    : "border-gray-200/80 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-gray-700">{part.label}</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: part.color }}
                  />
                </div>

                <div className="text-xl font-bold text-gray-900">
                  {hasData ? toDisplay(stat.current) : "--"}{" "}
                  <span className="text-[10px] text-gray-500 font-normal">{unit}</span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Δ Start</span>
                  <span
                    className={`font-semibold ${
                      hasData && stat.changeSinceStart !== 0
                        ? stat.changeSinceStart < 0
                          ? "text-emerald-600"
                          : "text-violet-600"
                        : "text-gray-400"
                    }`}
                  >
                    {hasData
                      ? `${stat.changeSinceStart > 0 ? "+" : ""}${toDisplay(stat.changeSinceStart)} ${unit}`
                      : "--"}
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Weekly History List & Expansion */}
      <GlassCard className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Weekly Check-in Log</h3>
          <span className="text-xs text-gray-500">{weeklyTable.length} check-ins</span>
        </div>

        {weeklyTable.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            No entries logged yet. Click "Check-in" above to log your first weekly measurements!
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {weeklyTable.map((entry) => (
              <div key={entry._id} className="py-3 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                    <span>Week of {entry.weekStart}</span>
                    <span className="text-[10px] font-normal text-gray-500">
                      (Logged {entry.date})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
                    {entry.measurementsCm?.waist && (
                      <span>Waist: {toDisplay(entry.measurementsCm.waist)} {unit}</span>
                    )}
                    {entry.measurementsCm?.chest && (
                      <span>Chest: {toDisplay(entry.measurementsCm.chest)} {unit}</span>
                    )}
                    {entry.measurementsCm?.hips && (
                      <span>Hips: {toDisplay(entry.measurementsCm.hips)} {unit}</span>
                    )}
                    {entry.note && (
                      <span className="italic text-gray-400 max-w-[200px] truncate">
                        "{entry.note}"
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEntrySheet(entry)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Delete this check-in entry?")) {
                        deleteMutation.mutate(entry._id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Compare View Bottom Sheet / Dialog */}
      <Sheet isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} title="Compare Two Weeks">
        <div className="p-4 space-y-4 max-w-lg mx-auto">
          <p className="text-xs text-gray-500">
            Select any two recorded check-in weeks to see an exact side-by-side delta.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase">Week A (Baseline)</label>
              <select
                value={compareWeekA}
                onChange={(e) => setCompareWeekA(e.target.value)}
                className="mt-1 w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl p-2.5"
              >
                <option value="">Select week...</option>
                {weeklyTable.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.weekStart} ({w.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase">Week B (Comparison)</label>
              <select
                value={compareWeekB}
                onChange={(e) => setCompareWeekB(e.target.value)}
                className="mt-1 w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl p-2.5"
              >
                <option value="">Select week...</option>
                {weeklyTable.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.weekStart} ({w.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const entryA = weeklyTable.find((w) => w._id === compareWeekA);
            const entryB = weeklyTable.find((w) => w._id === compareWeekB);

            if (!entryA || !entryB) {
              return (
                <div className="text-center py-8 text-xs text-gray-400">
                  Select two different weeks above to view the difference table.
                </div>
              );
            }

            return (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden mt-3">
                <div className="grid grid-cols-4 bg-gray-50 p-2.5 text-[11px] font-bold text-gray-500 uppercase">
                  <span>Part</span>
                  <span className="text-center">Week A</span>
                  <span className="text-center">Week B</span>
                  <span className="text-right">Change</span>
                </div>

                {BODY_PARTS.map((part) => {
                  const valA = entryA.measurementsCm?.[part.id];
                  const valB = entryB.measurementsCm?.[part.id];
                  if (!valA && !valB) return null;

                  const delta = valB && valA ? Math.round((valB - valA) * 10) / 10 : null;

                  return (
                    <div key={part.id} className="grid grid-cols-4 p-2.5 text-xs items-center">
                      <span className="font-semibold text-gray-800">{part.label}</span>
                      <span className="text-center text-gray-600">{toDisplay(valA)}</span>
                      <span className="text-center text-gray-600">{toDisplay(valB)}</span>
                      <span
                        className={`text-right font-bold ${
                          delta !== null
                            ? delta < 0
                              ? "text-emerald-600"
                              : delta > 0
                              ? "text-violet-600"
                              : "text-gray-400"
                            : "text-gray-300"
                        }`}
                      >
                        {delta !== null
                          ? `${delta > 0 ? "+" : ""}${toDisplay(delta)} ${unit}`
                          : "--"}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </Sheet>

      {/* Measurement Entry Bottom Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingEntryId ? "Edit Weekly Check-In" : "Weekly Body Check-In"}
      >
        <form onSubmit={handleSubmitForm} className="p-4 space-y-4 max-w-lg mx-auto">
          {/* Date Picker */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-600">Check-in Date</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-gray-800"
            />
          </div>

          {/* Body Measurements Stepper List */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {BODY_PARTS.map((part) => {
              const currentVal = formMeasurements[part.id] || "";
              const prevVal = lastEntry?.measurementsCm?.[part.id];

              let deltaBadge = null;
              if (currentVal && prevVal) {
                const curCm = toCm(currentVal);
                const diff = Math.round((curCm - prevVal) * 10) / 10;
                if (diff !== 0) {
                  deltaBadge = (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        diff < 0 ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {toDisplay(diff)} {unit}
                    </span>
                  );
                }
              }

              return (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200/80 rounded-xl"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-800">{part.label}</span>
                      {deltaBadge}
                    </div>
                    {prevVal && (
                      <span className="text-[10px] text-gray-400">
                        Prev: {toDisplay(prevVal)} {unit}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepperChange(part.id, -1)}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      step={unit === "in" ? "0.1" : "0.5"}
                      inputMode="decimal"
                      value={currentVal}
                      onChange={(e) =>
                        setFormMeasurements({ ...formMeasurements, [part.id]: e.target.value })
                      }
                      placeholder="--"
                      className="w-16 text-center text-sm font-bold bg-white border border-gray-200 rounded-lg py-1 text-gray-900"
                    />

                    <button
                      type="button"
                      onClick={() => handleStepperChange(part.id, 1)}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-semibold text-gray-400 w-6 text-center">
                      {unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-600">Weekly Notes (Optional)</label>
            <input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="e.g. Waist feeling tighter after fasted cardio"
              className="mt-1 w-full text-xs bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900"
              maxLength={500}
            />
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{saveMutation.isPending ? "Saving Check-In..." : "Save Weekly Measurements"}</span>
          </Button>
        </form>
      </Sheet>
    </div>
  );
};
