import type { ApiClient, Pin, Plan } from "../types";

// TODO: Implement once the server API contract is finalized.
export const apiClient: ApiClient = {
  async getPins(): Promise<Pin[]> {
    throw new Error("apiClient.getPins is not implemented yet");
  },
  async getPlans(): Promise<Plan[]> {
    throw new Error("apiClient.getPlans is not implemented yet");
  },
};
