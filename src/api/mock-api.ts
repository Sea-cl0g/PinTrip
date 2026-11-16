import type { ApiClient, Pin, Plan, PlanMomentItem, PlanPinItem, PublicUser } from "../types";

type MockPlanPinItem = Omit<PlanPinItem, "pin"> & { pinId: number | null };
type MockPlan = Omit<Plan, "items"> & {
  items: (MockPlanPinItem | PlanMomentItem)[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPublicUser(value: unknown): value is PublicUser {
  return isRecord(value)
    && isInteger(value.id)
    && isNonEmptyString(value.handle)
    && isNonEmptyString(value.displayName);
}

function isPublishedContent(value: Record<string, unknown>): boolean {
  return isInteger(value.id)
    && isNonEmptyString(value.title)
    && typeof value.body === "string"
    && typeof value.emoji === "string"
    && value.status === "published"
    && typeof value.publishedAt === "string"
    && Number.isFinite(Date.parse(value.publishedAt))
    && Array.isArray(value.images)
    && isPublicUser(value.author);
}

function isPin(value: unknown): value is Pin {
  return isRecord(value)
    && isPublishedContent(value)
    && typeof value.latitude === "number"
    && value.latitude >= -90
    && value.latitude <= 90
    && typeof value.longitude === "number"
    && value.longitude >= -180
    && value.longitude <= 180
    && Array.isArray(value.images)
    && value.images.length <= 3
    && isInteger(value.likeCount)
    && value.likeCount >= 0;
}

function isMockPlanItem(value: unknown): value is MockPlanPinItem | PlanMomentItem {
  if (!isRecord(value)
    || !isInteger(value.id)
    || !isInteger(value.position)
    || value.position < 0
    || !(value.durationMinutes === null
      || (typeof value.durationMinutes === "number"
        && Number.isFinite(value.durationMinutes)
        && value.durationMinutes >= 0))) {
    return false;
  }

  if (value.type === "pin") {
    return value.pinId === null || isInteger(value.pinId);
  }
  return value.type === "moment" && isNonEmptyString(value.title);
}

function isMockPlan(value: unknown): value is MockPlan {
  return isRecord(value)
    && isPublishedContent(value)
    && Array.isArray(value.items)
    && value.items.every(isMockPlanItem);
}

async function loadMockList<T extends { id: number }>(
  name: "pins" | "plans",
  isItem: (value: unknown) => value is T,
): Promise<T[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`);

  if (!response.ok) {
    throw new Error(`Failed to fetch mock ${name} (HTTP ${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`Mock data for ${name} must be an array`);
  }

  const ids = new Set<number>();
  return data.map((item: unknown, index: number) => {
    if (!isItem(item)) {
      throw new Error(`Invalid ${name} mock data at item ${index + 1}`);
    }
    if (ids.has(item.id)) {
      throw new Error(`Duplicate ID ${item.id} in ${name} mock data`);
    }
    ids.add(item.id);
    return item;
  });
}

export function getPins(): Promise<Pin[]> {
  return loadMockList("pins", isPin);
}

export async function getPlans(): Promise<Plan[]> {
  const [plans, pins] = await Promise.all([
    loadMockList("plans", isMockPlan),
    getPins(),
  ]);
  const pinsById = new Map(pins.map((pin) => [pin.id, pin]));

  return plans.map((plan) => ({
    ...plan,
    items: plan.items.map((item) => {
      if (item.type === "moment") {
        return item;
      }

      const { pinId, ...planItem } = item;
      if (pinId === null) {
        return { ...planItem, pin: null };
      }

      const pin = pinsById.get(pinId);
      if (!pin) {
        throw new Error(`Plan ${plan.id} references missing pin ${pinId} in mock data`);
      }

      return { ...planItem, pin };
    }),
  }));
}

export const mockApiClient: ApiClient = { getPins, getPlans };
