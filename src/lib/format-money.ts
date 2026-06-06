/**
 * Money is stored as integer pesewa (1 GHS = 100 pesewa). Format for display only.
 */
const ghsFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
});

export function formatGhs(pesewa: number): string {
  if (!Number.isInteger(pesewa)) {
    throw new TypeError(`Expected integer pesewa, received ${pesewa}`);
  }
  return ghsFormatter.format(pesewa / 100);
}
