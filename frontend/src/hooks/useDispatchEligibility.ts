import { computed, type Ref } from "vue";
import type { DispatchStateResponse, Eligibility } from "../types/Dispatch";

/**
 * 接单判断展示层：直接消费后端 state 里的 eligibility（与派工确认同一套规则），
 * 另补充占用/排队视角，供班组卡片和工单卡片共用。
 */
export function useDispatchEligibility(state: Ref<DispatchStateResponse | null>, selectedTicketId: Ref<number>) {
  const selectedTicket = computed(() => state.value?.tickets.find((t) => t.id === selectedTicketId.value) ?? null);

  const eligibilityFor = computed(() => {
    if (!state.value || !selectedTicket.value) return {} as Record<number, Eligibility>;
    return state.value.eligibility[selectedTicket.value.id] ?? {};
  });

  const holdOfSelected = computed(() => state.value?.holds.find((h) => h.ticket_id === selectedTicketId.value) ?? null);

  const queueOfSelected = computed(() => state.value?.queue.find((q) => q.ticket_id === selectedTicketId.value) ?? null);

  const holdCountdown = computed(() => {
    if (!holdOfSelected.value || !state.value) return 0;
    return Math.max(0, Math.ceil((Date.parse(holdOfSelected.value.expires_at) - Date.parse(state.value.now)) / 1000));
  });

  return { selectedTicket, eligibilityFor, holdOfSelected, queueOfSelected, holdCountdown };
}
