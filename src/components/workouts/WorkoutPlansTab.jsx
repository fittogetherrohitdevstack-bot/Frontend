import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workoutApi } from "../../api/endpoints";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { CustomPlanBuilderModal } from "./CustomPlanBuilderModal";
import {
  Calendar,
  Dumbbell,
  Sparkles,
  Plus,
  Check,
  Copy,
  Edit2,
  Trash2,
  ChevronRight,
  Flame,
  Layers,
} from "lucide-react";
import { haptics } from "../../motion/Haptics";
import { toast } from "sonner";
import { motion } from "motion/react";

export const WorkoutPlansTab = () => {
  const queryClient = useQueryClient();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // 1. Fetch user's plans
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["my-workout-plans"],
    queryFn: async () => {
      const res = await workoutApi.getMyPlans();
      return res.data?.data?.plans || [];
    },
  });

  // 2. Fetch built-in templates
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["workout-templates"],
    queryFn: async () => {
      const res = await workoutApi.getTemplates();
      return res.data?.data?.templates || [];
    },
  });

  // Apply template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: (templateKey) => workoutApi.applyTemplate({ templateKey, makeActive: true }),
    onSuccess: (res) => {
      haptics.goal();
      toast.success(res.data?.message || "Template applied as your active plan!");
      setIsPreviewOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-workout-plans"] });
      queryClient.invalidateQueries({ queryKey: ["workout-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["today-workout"] });
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors)
          ? err.response.data.errors.join(", ")
          : "Failed to apply template");
      toast.error(msg);
    },
  });

  // Activate plan mutation
  const activatePlanMutation = useMutation({
    mutationFn: (planId) => workoutApi.activatePlan(planId),
    onSuccess: (res) => {
      haptics.goal();
      toast.success("Active workout plan updated!");
      queryClient.invalidateQueries({ queryKey: ["my-workout-plans"] });
      queryClient.invalidateQueries({ queryKey: ["workout-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["today-workout"] });
    },
  });

  // Duplicate plan mutation
  const duplicatePlanMutation = useMutation({
    mutationFn: (planId) => workoutApi.duplicatePlan(planId),
    onSuccess: () => {
      haptics.selection();
      toast.success("Workout plan duplicated!");
      queryClient.invalidateQueries({ queryKey: ["my-workout-plans"] });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (planId) => workoutApi.deletePlan(planId),
    onSuccess: () => {
      haptics.tick();
      toast.success("Workout plan deleted");
      queryClient.invalidateQueries({ queryKey: ["my-workout-plans"] });
      queryClient.invalidateQueries({ queryKey: ["workout-dashboard"] });
    },
  });

  // Save custom plan mutation
  const savePlanMutation = useMutation({
    mutationFn: (payload) => {
      if (editingPlan?._id) {
        return workoutApi.updatePlan(editingPlan._id, payload);
      }
      return workoutApi.createPlan(payload);
    },
    onSuccess: (res) => {
      haptics.goal();
      toast.success(
        editingPlan ? "Workout plan updated!" : "Custom workout plan created!"
      );
      setIsBuilderOpen(false);
      setEditingPlan(null);
      queryClient.invalidateQueries({ queryKey: ["my-workout-plans"] });
      queryClient.invalidateQueries({ queryKey: ["workout-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["today-workout"] });
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors)
          ? err.response.data.errors.join(", ")
          : "Failed to save workout plan");
      toast.error(msg);
    },
  });

  const activePlan = plansData?.find((p) => p.isActive);
  const otherPlans = plansData?.filter((p) => !p.isActive) || [];

  return (
    <div className="space-y-6">
      {/* Header with Create Plan CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Workout Plan Management
          </h2>
          <p className="text-xs text-slate-500">
            Choose from scientifically balanced splits or design your own custom routine
          </p>
        </div>
        <Button
          size="md"
          variant="primary"
          onClick={() => {
            haptics.tick();
            setEditingPlan(null);
            setIsBuilderOpen(true);
          }}
          className="w-full sm:w-auto shadow-md min-h-[44px] font-black justify-center"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[3]" /> Create Custom Plan
        </Button>
      </div>

      {/* Active Workout Plan Card */}
      {isLoadingPlans ? (
        <Skeleton className="h-44 w-full rounded-3xl" />
      ) : activePlan ? (
        <GlassCard className="p-5 sm:p-6 bg-gradient-to-br from-white to-purple-50/40 border-purple-200/90 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                  <Check className="w-3 h-3 stroke-[3]" /> Active Plan
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {activePlan.daysPerWeek} days / week
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900">{activePlan.name}</h3>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                {activePlan.description || "Active custom training regimen."}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  haptics.tick();
                  setEditingPlan(activePlan);
                  setIsBuilderOpen(true);
                }}
                className="font-bold text-xs min-h-[42px] px-3.5 flex-1 sm:flex-initial justify-center"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  haptics.selection();
                  duplicatePlanMutation.mutate(activePlan._id);
                }}
                className="font-bold text-xs min-h-[42px] min-w-[42px] p-0 flex items-center justify-center shrink-0 border border-slate-200/80 bg-white"
                title="Duplicate plan"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Schedule Strip */}
          {activePlan.schedule && activePlan.schedule.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-100 grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-2">
              {activePlan.schedule.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl text-xs border ${
                    day.isRestDay
                      ? "bg-slate-50 border-slate-200 text-slate-500"
                      : "bg-white border-purple-200 text-slate-900 shadow-2xs"
                  }`}
                >
                  <span className="font-extrabold text-[11px] block truncate">
                    {day.dayName || `Day ${day.dayOfWeek}`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate">
                    {day.isRestDay ? "Rest" : `${day.exercises?.length || 0} exercises`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      ) : (
        <GlassCard className="p-6 text-center bg-white/95 border-slate-200">
          <Dumbbell className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
          <h3 className="font-extrabold text-slate-800 text-sm">No active workout plan</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Select one of our 7 built-in templates below or create your custom split.
          </p>
        </GlassCard>
      )}

      {/* Built-in Split Templates */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" /> Built-in Workout Templates
          </h3>
          <p className="text-xs text-slate-500">
            Configurable splits created by strength coaches. Preview and apply in 1 click.
          </p>
        </div>

        {isLoadingTemplates ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templatesData?.map((tpl) => (
              <motion.div
                key={tpl.templateKey}
                whileHover={{ y: -2 }}
                className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                      {tpl.fitnessLevel}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {tpl.daysPerWeek} days/wk
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{tpl.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      haptics.tick();
                      setSelectedTemplate(tpl);
                      setIsPreviewOpen(true);
                    }}
                    className="flex-1 text-xs font-bold min-h-[42px] justify-center"
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={applyTemplateMutation.isPending}
                    onClick={() => {
                      haptics.goal();
                      applyTemplateMutation.mutate(tpl.templateKey);
                    }}
                    className="flex-1 text-xs font-bold min-h-[42px] justify-center"
                  >
                    Apply
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Custom Plans */}
      {otherPlans.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Saved Custom Plans ({otherPlans.length})
          </h3>

          <div className="space-y-2.5">
            {otherPlans.map((plan) => (
              <div
                key={plan._id}
                className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{plan.name}</h4>
                  <span className="text-xs text-slate-500">
                    {plan.daysPerWeek || 4} days/week • {plan.fitnessLevel || "Intermediate"}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => activatePlanMutation.mutate(plan._id)}
                    className="text-xs font-bold min-h-[40px] px-3 flex-1 sm:flex-initial justify-center"
                  >
                    Set as Active
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingPlan(plan);
                      setIsBuilderOpen(true);
                    }}
                    className="text-xs font-bold min-h-[40px] min-w-[40px] p-0 flex items-center justify-center shrink-0 border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`Delete workout plan "${plan.name}"?`)) {
                        deletePlanMutation.mutate(plan._id);
                      }
                    }}
                    className="text-xs font-bold min-h-[40px] min-w-[40px] p-0 flex items-center justify-center shrink-0 text-rose-500 hover:text-rose-700 border border-rose-100 bg-rose-50/50 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        template={selectedTemplate}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        onApplyTemplate={(key) => applyTemplateMutation.mutate(key)}
        isApplying={applyTemplateMutation.isPending}
      />

      {/* Custom Plan Builder Modal */}
      <CustomPlanBuilderModal
        key={editingPlan?._id || (isBuilderOpen ? "open-builder-new" : "closed-builder")}
        open={isBuilderOpen}
        onOpenChange={(isOpen) => {
          setIsBuilderOpen(isOpen);
          if (!isOpen) {
            setEditingPlan(null);
          }
        }}
        existingPlan={editingPlan}
        onSavePlan={(payload) => savePlanMutation.mutate(payload)}
        isSaving={savePlanMutation.isPending}
      />
    </div>
  );
};

export default WorkoutPlansTab;
