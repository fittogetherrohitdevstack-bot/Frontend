import React from "react";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";
import { Dumbbell, Calendar, Check, Flame, Clock } from "lucide-react";
import { haptics } from "../../motion/Haptics";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const TemplatePreviewModal = ({
  template,
  open,
  onOpenChange,
  onApplyTemplate,
  isApplying,
}) => {
  if (!template) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={template.name}
      description={`${template.fitnessLevel} • ${template.daysPerWeek} Days/Week • ${template.goal}`}
    >
      <div className="space-y-5 pb-6">
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          {template.description}
        </p>

        {/* Schedule Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-600" /> Weekly Schedule ({template.schedule?.length || 0} Days)
          </h4>

          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {template.schedule?.map((day, idx) => {
              const dayTitle = DAY_NAMES[day.dayOfWeek] || `Day ${idx + 1}`;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    day.isRestDay
                      ? "bg-slate-50 border-slate-200"
                      : "bg-white border-purple-100 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900">
                        {dayTitle}: {day.dayName}
                      </span>
                      {day.targetMuscles && day.targetMuscles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {day.targetMuscles.map((m) => (
                            <span
                              key={m}
                              className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {day.isRestDay ? (
                      <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                        Rest Day
                      </span>
                    ) : (
                      <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {day.exercises?.length || 0} Exercises
                      </span>
                    )}
                  </div>

                  {!day.isRestDay && day.exercises && day.exercises.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                      {day.exercises.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="flex items-center justify-between text-xs text-slate-700 font-medium py-0.5"
                        >
                          <span className="truncate pr-2">
                            {exIdx + 1}. {ex.name}
                          </span>
                          <span className="text-slate-400 font-mono shrink-0">
                            {ex.targetSets} × {ex.targetReps} reps
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Apply CTA */}
        <div className="pt-2">
          <Button
            className="w-full min-h-[46px] font-bold shadow-md justify-center"
            isLoading={isApplying}
            onClick={() => {
              haptics.goal();
              onApplyTemplate(template.templateKey);
            }}
          >
            <Check className="w-4 h-4 mr-2" /> Apply as Active Workout Plan
          </Button>
        </div>
      </div>
    </Sheet>
  );
};

export default TemplatePreviewModal;
