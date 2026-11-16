export interface PublicUser {
  id: number;
  handle: string;
  displayName: string;
}

export interface Pin {
  id: number;
  title: string;
  body: string;
  emoji: string;
  latitude: number;
  longitude: number;
  status: "draft" | "published";
  publishedAt: string | null;
  images: unknown[];
  likeCount: number;
  author: PublicUser;
}

export interface PlanPinItem {
  id: number;
  type: "pin";
  position: number;
  durationMinutes: number | null;
  pin: Pin | null;
}

export interface PlanMomentItem {
  id: number;
  type: "moment";
  position: number;
  durationMinutes: number | null;
  title: string;
}

export type PlanItem = PlanPinItem | PlanMomentItem;

export interface Plan {
  id: number;
  title: string;
  body: string;
  emoji: string;
  status: "draft" | "published";
  publishedAt: string | null;
  images: unknown[];
  author: PublicUser;
  items: PlanItem[];
}

export interface ApiClient {
  getPins(): Promise<Pin[]>;
  getPlans(): Promise<Plan[]>;
}
