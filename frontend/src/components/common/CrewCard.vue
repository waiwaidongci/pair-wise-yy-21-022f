<script setup lang="ts">
import type { DispatchCrew, Eligibility } from "../../types/Dispatch";
import StatusBadge from "./StatusBadge.vue";

defineProps<{
  crew: DispatchCrew;
  eligibility?: Eligibility | null;
  busy?: boolean;
}>();
</script>

<template>
  <article class="crew-card" :class="{ rest: crew.duty_status !== 'ON_DUTY' }">
    <header>
      <strong>{{ crew.name }}</strong>
      <StatusBadge :value="crew.duty_status === 'ON_DUTY' ? '值班中' : '休息中'" />
    </header>
    <p class="crew-meta">
      技能：<span class="skill" v-for="skill in crew.skill_tags.split(',')" :key="skill">{{ skill }}</span>
    </p>
    <p class="crew-meta">在手任务：{{ crew.in_hand }}/{{ crew.max_tasks }}<span v-if="crew.in_hand_ids.length">（工单 {{ crew.in_hand_ids.join("、#") }}）</span></p>
    <div v-if="eligibility" class="judge" :class="eligibility.ok ? 'ok' : 'no'">
      <template v-if="eligibility.ok">✔ 可接单</template>
      <ul v-else>
        <li v-for="reason in eligibility.reasons" :key="reason.code">{{ reason.message }}</li>
      </ul>
    </div>
    <footer v-if="$slots.actions" class="crew-actions">
      <slot name="actions" />
    </footer>
  </article>
</template>
