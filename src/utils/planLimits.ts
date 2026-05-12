import { getBusinessProfile, updateBusinessUsage } from "../services/businessService";

export async function canAddRecord(businessId: string, collectionName: string) {
  const business = await getBusinessProfile(businessId);
  if (!business) throw new Error("Business profile not found");
  const { planLimit, currentUsage, selectedPlan } = business;
  if (selectedPlan === "custom") return true;
  if (typeof planLimit === "number" && (currentUsage ?? 0) >= planLimit) {
    throw new Error("You have reached your plan limit. Please upgrade your plan to continue.");
  }
  return true;
}
