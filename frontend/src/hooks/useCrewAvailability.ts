import { computed, type Ref } from "vue";
import type { CrewAvailability } from "../types/Dispatch";

export function useCrewAvailability(crews: Ref<CrewAvailability[]>) {
  const availableCrews = computed(() => crews.value.filter((c) => c.available));

  const crewById = (id: number): CrewAvailability | undefined => crews.value.find((c) => c.id === id);

  const capacityPercent = (c: CrewAvailability): number =>
    c.capacity > 0 ? Math.min(100, Math.round((c.inHand / c.capacity) * 100)) : 0;

  const skillMatch = (c: CrewAvailability, required: string[]): boolean =>
    required.every((s) => c.skills.includes(s));

  const dutyText = (c: CrewAvailability): string => (c.duty_status === "ON_DUTY" ? "值班中" : "休息");

  return { availableCrews, crewById, capacityPercent, skillMatch, dutyText };
}
