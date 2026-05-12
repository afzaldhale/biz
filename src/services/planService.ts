export const plans = [
  { name: "basic", price: 499, limit: 50 },
  { name: "medium", price: 999, limit: 150 },
  { name: "advance", price: 1499, limit: 250 },
  { name: "premium", price: 1999, limit: 500 },
  { name: "pro", price: 2999, limit: 1000 },
  { name: "custom", price: "custom", limit: "unlimited" },
];

export function getPlanByName(name: string) {
  return plans.find((plan) => plan.name === name);
}
