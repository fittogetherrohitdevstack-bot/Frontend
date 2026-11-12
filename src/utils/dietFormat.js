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
