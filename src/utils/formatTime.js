/**
 * Returns clean relative timestamp for social cards and comments (e.g. "Just now", "5m ago", "2h ago", "3d ago")
 */
export const formatRelativeTime = (isoOrDate) => {
  if (!isoOrDate) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoOrDate).getTime()) / 1000));
  if (diffSec < 45) return "Just now";
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
};
