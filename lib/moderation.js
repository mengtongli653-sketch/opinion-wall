// Auto-hide policy.
// `reports` and `likes` are aggregate counts on a post or comment.
//
// Rule:
//   - need at least MIN_REPORTS reports before considering hiding (avoid one-off griefing)
//   - ratio of reports / (likes + reports) must reach HIDE_RATIO
//
// Examples (MIN=3, RATIO=0.5):
//   reports=2, likes=0  -> visible (below MIN_REPORTS)
//   reports=3, likes=2  -> hidden  (3 / 5 = 0.6 >= 0.5)
//   reports=3, likes=4  -> visible (3 / 7 = 0.43 < 0.5)
//   reports=10, likes=10 -> hidden (10 / 20 = 0.5 >= 0.5)
//
// Admins can override the auto decision by setting `visibility` to 'shown' or 'hidden'.

export const MIN_REPORTS = 3;
export const HIDE_RATIO = 0.5;

export function shouldAutoHide(likes = 0, reports = 0) {
  if (reports < MIN_REPORTS) return false;
  const total = likes + reports;
  if (total === 0) return false;
  return reports / total >= HIDE_RATIO;
}

// Resolve effective visibility given the item's stored visibility + counts.
// Returns 'shown' or 'hidden'. Admin can pass `forAdmin: true` to ignore hiding.
export function effectiveVisibility(item, { forAdmin = false } = {}) {
  if (forAdmin) return 'shown';
  const v = item?.visibility || 'auto';
  if (v === 'shown') return 'shown';
  if (v === 'hidden') return 'hidden';
  return shouldAutoHide(item?.likes || 0, item?.reports || 0) ? 'hidden' : 'shown';
}
