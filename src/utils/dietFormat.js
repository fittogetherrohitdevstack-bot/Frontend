const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const roundMacro = (val) => Math.round((Number(val) || 0) * 10) / 10;

const computeMealMacros = (meal = {}) => {
  const items = meal.foodItems || [];
  return items.reduce(
    (acc, item) => {
      acc.calories += Number(item.calories) || 0;
      acc.protein += Number(item.protein) || 0;
      acc.carbs += Number(item.carbs) || 0;
      acc.fats += Number(item.fats) || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
};

const computeDayTotals = (meals = []) =>
  meals.reduce(
    (acc, meal) => {
      const m = computeMealMacros(meal);
      acc.calories += m.calories;
      acc.protein += m.protein;
      acc.carbs += m.carbs;
      acc.fats += m.fats;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

const sortMealsByTime = (meals = []) =>
  [...meals].sort((a, b) =>
    String(a.scheduledTime || "99:99").localeCompare(String(b.scheduledTime || "99:99"))
  );

const formatFoodQuantity = (item) => {
  if (!item.quantity) return "";
  const unit = item.unit || "g";
  return `${item.quantity}${unit === "g" || unit === "ml" ? unit : ` ${unit}`}`;
};

const formatSection = (sectionTitle, meals, style = "share") => {
  const sorted = sortMealsByTime(meals);
  const totals = computeDayTotals(sorted);
  const lines = [];

  if (sorted.length === 0) {
    if (style === "markdown") {
      lines.push(`### ${sectionTitle}\n_No meals planned yet._`);
    } else {
      lines.push(`${sectionTitle}\n  (No meals planned yet)`);
    }
    return lines.join("\n");
  }

  const macroSummary = `${Math.round(totals.calories)} kcal · P ${roundMacro(totals.protein)}g · C ${roundMacro(totals.carbs)}g · F ${roundMacro(totals.fats)}g`;

  if (style === "markdown") {
    lines.push(`## ${sectionTitle}`);
    lines.push(`**Daily Total:** ${macroSummary}`);
    lines.push("");
    sorted.forEach((meal) => {
      const m = computeMealMacros(meal);
      const timePrefix = meal.scheduledTime ? `${meal.scheduledTime} — ` : "";
      lines.push(
        `### ${timePrefix}${meal.name} (${Math.round(m.calories)} kcal | P ${roundMacro(m.protein)}g · C ${roundMacro(m.carbs)}g · F ${roundMacro(m.fats)}g)`
      );
      (meal.foodItems || []).forEach((item) => {
        const qty = formatFoodQuantity(item);
        const kcal = item.calories ? ` — ${Math.round(item.calories)} kcal` : "";
        lines.push(`- **${item.name}**${qty ? ` (${qty})` : ""}${kcal}`);
      });
      if (meal.notes) {
        lines.push(`  > Note: ${meal.notes}`);
      }
      lines.push("");
    });
    return lines.join("\n").trimEnd();
  }

  if (style === "compact") {
    lines.push(`[${sectionTitle}] (${Math.round(totals.calories)} kcal | ${roundMacro(totals.protein)}g P)`);
    sorted.forEach((meal) => {
      const foods = (meal.foodItems || [])
        .map((item) => {
          const qty = formatFoodQuantity(item);
          return qty ? `${item.name} ${qty}` : item.name;
        })
        .join(", ");
      const timeStr = meal.scheduledTime ? `${meal.scheduledTime} ` : "";
      lines.push(`- ${timeStr}${meal.name}: ${foods || "Custom portion"}`);
    });
    return lines.join("\n");
  }

  // Default "share" style (WhatsApp / Notes friendly)
  lines.push(`🍽️ *${sectionTitle}*`);
  lines.push(`📊 Total: ${macroSummary}`);
  lines.push("────────────────────────");

  sorted.forEach((meal) => {
    const m = computeMealMacros(meal);
    const timeStr = meal.scheduledTime ? `${meal.scheduledTime} · ` : "";
    lines.push(
      `\n⏰ *${timeStr}${meal.name}* (${Math.round(m.calories)} kcal | ${roundMacro(m.protein)}g P · ${roundMacro(m.carbs)}g C · ${roundMacro(m.fats)}g F)`
    );
    (meal.foodItems || []).forEach((item) => {
      const qty = formatFoodQuantity(item);
      const kcal = item.calories ? ` (${Math.round(item.calories)} kcal)` : "";
      lines.push(`  • ${item.name}${qty ? ` — ${qty}` : ""}${kcal}`);
    });
    if (meal.notes) {
      lines.push(`  📝 ${meal.notes}`);
    }
  });

  return lines.join("\n");
};

/**
 * Formats the user's current diet plan or selected schedule in a readable shareable format.
 */
export const formatDietPlanText = ({
  planName = "My Diet Plan",
  mode = "simple",
  scope = "current", // "current" | "all"
  style = "share", // "share" | "compact" | "markdown"
  simpleMeals = [],
  alternating = {},
  altSlot = "A",
  isTodayDietA = true,
  days = [],
  selectedDay = 0,
}) => {
  const sections = [];

  if (mode === "simple") {
    sections.push({
      title: `${planName} — Simple Daily Diet`,
      meals: simpleMeals || [],
    });
  } else if (mode === "alternating") {
    const nameA = alternating.dietAName || "Diet A";
    const nameB = alternating.dietBName || "Diet B";
    const tagA = isTodayDietA ? "Today" : "Tomorrow";
    const tagB = isTodayDietA ? "Tomorrow" : "Today";

    if (scope === "all") {
      sections.push({
        title: `${nameA} (${tagA})`,
        meals: alternating.dietAMeals || [],
      });
      sections.push({
        title: `${nameB} (${tagB})`,
        meals: alternating.dietBMeals || [],
      });
    } else if (altSlot === "A") {
      sections.push({
        title: `${planName} — ${nameA} (${tagA})`,
        meals: alternating.dietAMeals || [],
      });
    } else {
      sections.push({
        title: `${planName} — ${nameB} (${tagB})`,
        meals: alternating.dietBMeals || [],
      });
    }
  } else {
    // weekly
    if (scope === "all") {
      const populatedDays = [...(days || [])]
        .filter((d) => (d.meals || []).length > 0)
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      if (populatedDays.length === 0) {
        sections.push({
          title: `${planName} — Weekly Schedule`,
          meals: [],
        });
      } else {
        populatedDays.forEach((d) => {
          sections.push({
            title: `${DAY_NAMES[d.dayOfWeek] || "Day"}`,
            meals: d.meals || [],
          });
        });
      }
    } else {
      const dayEntry = (days || []).find((d) => Number(d.dayOfWeek) === Number(selectedDay));
      sections.push({
        title: `${planName} — ${DAY_NAMES[selectedDay] || "Day"}`,
        meals: dayEntry?.meals || [],
      });
    }
  }

  const header =
    scope === "all" && mode !== "simple"
      ? style === "markdown"
        ? `# ${planName} (${mode === "alternating" ? "2-Diet Alternating Rotation" : "Weekly Plan"})\n\n`
        : style === "compact"
        ? `${planName} (${mode === "alternating" ? "Alternating A/B" : "Weekly"})\n\n`
        : `🥗 *${planName}* (${mode === "alternating" ? "Alternating 2-Diet Plan" : "Weekly Plan"})\n\n`
      : "";

  const divider = style === "compact" ? "\n\n" : "\n\n\n";
  return `${header}${sections.map((s) => formatSection(s.title, s.meals, style)).join(divider)}`.trim();
};

/**
 * Copies text to clipboard safely with a fallback for webviews / restricted contexts.
 */
export const copyTextToClipboard = async (text) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (ok) return true;
  }
  throw new Error("Clipboard unavailable");
};

/**
 * Generates an AI-ready prompt template with strict JSON schema so users can copy,
 * ask ChatGPT / Gemini / Claude to fill their meals & per-dish macros, and paste right back.
 */
export const generateAiDietPrompt = ({
  templateType = "single", // "single" | "alternating" | "weekly"
  targetLabel = "Daily Diet",
  goalNotes = "",
} = {}) => {
  const goalLine = goalNotes.trim()
    ? goalNotes.trim()
    : "[Describe your goal, e.g., 2000 kcal, 140g protein, vegetarian/eggetarian, 4 meals/day]";

  const rules = [
    "Fill my diet plan using ONLY valid JSON matching the exact schema below.",
    "Return ONLY the JSON inside a ```json code block (no extra text outside).",
    "For every individual dish in `foodItems`, fill realistic `quantity`, `unit` (g, ml, pcs, scoop, bowl, cup), `calories`, `protein`, `carbs`, and `fats` numbers.",
    "Use 24-hour \"HH:mm\" format for `scheduledTime` (e.g. \"08:30\", \"13:30\", \"20:30\").",
    "",
    `My target & food preferences (${targetLabel}): ${goalLine}`,
    "",
  ];

  if (templateType === "alternating") {
    const schema = {
      mode: "alternating",
      dietAName: "Diet A (e.g. High-Carb / Veg)",
      dietBName: "Diet B (e.g. High-Protein / Eggs)",
      dietAMeals: [
        {
          name: "Breakfast",
          scheduledTime: "08:30",
          notes: "Optional note",
          foodItems: [
            { name: "Rolled Oats", quantity: 60, unit: "g", calories: 230, protein: 8, carbs: 40, fats: 4 },
            { name: "Skim Milk", quantity: 250, unit: "ml", calories: 90, protein: 9, carbs: 12, fats: 0.5 },
          ],
        },
      ],
      dietBMeals: [
        {
          name: "Breakfast",
          scheduledTime: "08:30",
          notes: "Optional note",
          foodItems: [
            { name: "Whole Eggs", quantity: 2, unit: "eggs", calories: 140, protein: 12, carbs: 1, fats: 10 },
            { name: "Whole Wheat Toast", quantity: 2, unit: "slices", calories: 160, protein: 6, carbs: 30, fats: 2 },
          ],
        },
      ],
    };
    return `${rules.join("\n")}\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\``;
  }

  if (templateType === "weekly") {
    const schema = {
      mode: "weekly",
      days: [
        {
          dayOfWeek: 1,
          meals: [
            {
              name: "Breakfast",
              scheduledTime: "08:30",
              notes: "0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat",
              foodItems: [
                { name: "Rolled Oats", quantity: 60, unit: "g", calories: 230, protein: 8, carbs: 40, fats: 4 },
              ],
            },
          ],
        },
      ],
    };
    return `${rules.join("\n")}\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\``;
  }

  const singleSchema = {
    meals: [
      {
        name: "Breakfast",
        scheduledTime: "08:30",
        notes: "Optional prep tip",
        foodItems: [
          { name: "Rolled Oats", quantity: 60, unit: "g", calories: 230, protein: 8, carbs: 40, fats: 4 },
          { name: "Boiled Eggs", quantity: 2, unit: "eggs", calories: 140, protein: 12, carbs: 1, fats: 10 },
        ],
      },
      {
        name: "Lunch",
        scheduledTime: "13:30",
        notes: "",
        foodItems: [
          { name: "Cooked Rice", quantity: 150, unit: "g", calories: 195, protein: 4, carbs: 42, fats: 0.5 },
          { name: "Paneer Bhurji", quantity: 120, unit: "g", calories: 318, protein: 21.6, carbs: 4.8, fats: 24 },
        ],
      },
    ],
  };

  return `${rules.join("\n")}\`\`\`json\n${JSON.stringify(singleSchema, null, 2)}\n\`\`\``;
};

const toNum = (val, fallback = 0) => {
  if (typeof val === "number" && Number.isFinite(val)) return Math.max(0, val);
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return Math.max(0, parsed);
  }
  return fallback;
};

const normalizeTime = (raw) => {
  if (typeof raw !== "string") return "08:30";
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "08:30";
  const h = Math.min(23, Math.max(0, Number(match[1])));
  const m = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const normalizeDishItem = (item = {}) => ({
  name: String(item.name || item.dish || item.item || item.food || "Dish").trim() || "Dish",
  quantity: toNum(item.quantity ?? item.qty ?? item.amount, 1),
  unit: String(item.unit || item.u || "serving").trim() || "serving",
  calories: Math.round(toNum(item.calories ?? item.cal ?? item.kcal, 0)),
  protein: roundMacro(toNum(item.protein ?? item.p, 0)),
  carbs: roundMacro(toNum(item.carbs ?? item.carb ?? item.c, 0)),
  fats: roundMacro(toNum(item.fats ?? item.fat ?? item.f, 0)),
});

const normalizeMealEntry = (meal = {}) => {
  const rawDishes = meal.foodItems || meal.items || meal.dishes || meal.foods || [];
  const foodItems = Array.isArray(rawDishes)
    ? rawDishes.filter((d) => d && (d.name || d.dish || d.item || d.food)).map(normalizeDishItem)
    : [];

  return {
    name: String(meal.name || meal.mealName || meal.title || "Meal").trim() || "Meal",
    scheduledTime: normalizeTime(meal.scheduledTime || meal.time),
    notes: String(meal.notes || meal.note || "").trim(),
    foodItems:
      foodItems.length > 0
        ? foodItems
        : [{ name: String(meal.name || "Meal Portion").trim(), quantity: 1, unit: "serving", calories: 0, protein: 0, carbs: 0, fats: 0 }],
  };
};

const summarizeMealsList = (meals = []) => {
  const totals = computeDayTotals(meals);
  const dishesCount = meals.reduce((s, m) => s + (m.foodItems?.length || 0), 0);
  return {
    mealsCount: meals.length,
    dishesCount,
    calories: Math.round(totals.calories),
    protein: roundMacro(totals.protein),
    carbs: roundMacro(totals.carbs),
    fats: roundMacro(totals.fats),
  };
};

const DAY_NAME_TO_INDEX = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

/**
 * Extracts and validates AI-generated diet JSON (single meal list, alternating A/B, or weekly days).
 */
export const parseAiDietResponse = (rawText = "") => {
  if (!rawText || !rawText.trim()) {
    return { ok: false, error: "Paste the AI JSON response first." };
  }

  let cleaned = rawText
    .trim()
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");

  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  } else {
    const firstObj = cleaned.indexOf("{");
    const firstArr = cleaned.indexOf("[");
    let start = -1;
    let end = -1;
    if (firstObj !== -1 && (firstArr === -1 || firstObj < firstArr)) {
      start = firstObj;
      end = cleaned.lastIndexOf("}");
    } else if (firstArr !== -1) {
      start = firstArr;
      end = cleaned.lastIndexOf("]");
    }
    if (start !== -1 && end > start) {
      cleaned = cleaned.slice(start, end + 1);
    }
  }

  // Remove trailing commas cleanly so slightly imperfect AI JSON still parses
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (_) {
    return {
      ok: false,
      error: "Could not read valid JSON. Ask the AI to reply with ONLY the ```json block from the template.",
    };
  }

  if (Array.isArray(parsed)) {
    const meals = parsed.map(normalizeMealEntry).filter((m) => m.foodItems.length > 0);
    if (!meals.length) return { ok: false, error: "JSON array did not contain any meals." };
    return { ok: true, kind: "meals", meals, summary: summarizeMealsList(meals) };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Expected a JSON object or meals array." };
  }

  if (Array.isArray(parsed.dietAMeals) || Array.isArray(parsed.dietBMeals)) {
    const dietAMeals = (parsed.dietAMeals || []).map(normalizeMealEntry);
    const dietBMeals = (parsed.dietBMeals || []).map(normalizeMealEntry);
    if (!dietAMeals.length && !dietBMeals.length) {
      return { ok: false, error: "Both dietAMeals and dietBMeals are empty." };
    }
    return {
      ok: true,
      kind: "alternating",
      dietAName: String(parsed.dietAName || "Diet A").trim() || "Diet A",
      dietBName: String(parsed.dietBName || "Diet B").trim() || "Diet B",
      dietAMeals,
      dietBMeals,
      summaryA: summarizeMealsList(dietAMeals),
      summaryB: summarizeMealsList(dietBMeals),
    };
  }

  if (Array.isArray(parsed.days)) {
    const days = parsed.days
      .map((d) => {
        let dayIdx = Number(d.dayOfWeek);
        if (!Number.isInteger(dayIdx) || dayIdx < 0 || dayIdx > 6) {
          const nameKey = String(d.day || d.dayName || d.dayOfWeek || "").trim().toLowerCase();
          dayIdx = DAY_NAME_TO_INDEX[nameKey];
        }
        if (!Number.isInteger(dayIdx) || dayIdx < 0 || dayIdx > 6) return null;
        return {
          dayOfWeek: dayIdx,
          meals: (d.meals || []).map(normalizeMealEntry),
        };
      })
      .filter(Boolean);

    if (!days.length) {
      return { ok: false, error: "No valid days (dayOfWeek 0–6) found in JSON." };
    }
    const allMeals = days.flatMap((d) => d.meals);
    return {
      ok: true,
      kind: "weekly",
      days,
      daysCount: days.length,
      summary: summarizeMealsList(allMeals),
    };
  }

  if (Array.isArray(parsed.meals)) {
    const meals = parsed.meals.map(normalizeMealEntry);
    if (!meals.length) return { ok: false, error: "The meals array is empty." };
    return {
      ok: true,
      kind: "meals",
      planName: parsed.planName ? String(parsed.planName).trim() : "",
      meals,
      summary: summarizeMealsList(meals),
    };
  }

  return {
    ok: false,
    error: "JSON must include `meals`, `dietAMeals`/`dietBMeals`, or `days`.",
  };
};

