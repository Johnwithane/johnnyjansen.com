// Mirror of functions/src/money/categories.ts. Keep in step.
export const CATEGORIES = [
  "groceries", "eating_out", "home", "utilities", "kids", "car", "health", "clothing", "fun", "travel", "gifts", "subscriptions", "business", "income", "transfer", "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  groceries: "Groceries", eating_out: "Eating out", home: "Home", utilities: "Utilities", kids: "Kids", car: "Car", health: "Health", clothing: "Clothing", fun: "Fun", travel: "Travel", gifts: "Gifts", subscriptions: "Subscriptions", business: "Business", income: "Income", transfer: "Transfer", other: "Other",
};

export const TAX_CATEGORIES = ["none", "medical", "childcare", "donation", "home_office", "vehicle", "union_dues", "moving", "tuition"] as const;
export type TaxCategory = (typeof TAX_CATEGORIES)[number];
export const TAX_LABELS: Record<TaxCategory, string> = {
  none: "Not for taxes", medical: "Medical (33099)", childcare: "Child care (21400)", donation: "Donation (34900)", home_office: "Home office (22900)", vehicle: "Vehicle (22900)", union_dues: "Union dues (21200)", moving: "Moving (21900)", tuition: "Tuition (32300)",
};
