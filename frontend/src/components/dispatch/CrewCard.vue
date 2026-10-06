<script setup lang="ts">
import type { CrewAvailability, Evaluation } from "../../types/Dispatch";
import { useCrewAvailability } from "../../hooks/useCrewAvailability";
import { formatCapacity, formatSkills } from "../../utils/formatters";
import { computed } from "vue";

const props = defineProps<{
  crew: CrewAvailability;
  selectedTicketId: number | null;
  evaluation?: Evaluation;
  evaluating?: boolean;
  locked?: boolean;
}>();

const emit = defineEmits<{
  (e: "evaluate", crewId: number): void;
  (e: "confirm", crewId: number): void;
}>();

const { capacityPercent, dutyText } = useCrewAvailability(computed(() => [props.crew]));

const pct = computed(() => capacityPercent(props.crew));
</script>

<template>
  <div class="crew-card" :class="{ 'crew-card--full': !crew.available, 'crew-card--locked': locked }">
    <div class="crew-head">
      <strong>{{ crew.name }}</strong>
      <span class="duty" :class="crew.duty_status === 'ON_DUTY' ? 'duty--on' : 'duty--off'">{{ dutyText(crew) }}</span>
    </div>
    <div class="crew-skills">
      <span v-for="s in crew.skills" :key="s" class="skill-tag">{{ s }}</span>
      <span v-if="!crew.skills.length" class="skill-tag skill-tag--none">无技能标签</span>
    </div>
    <div class="crew-capacity">
      <div class="cap-label">
        <span>在手任务</span>
        <strong>{{ formatCapacity(crew.inHand, crew.capacity) }}</strong>
      </div>
      <div class="cap-bar"><div class="cap-fill" :style="{ width: pct + '%' }" :class="{ 'cap-fill--full': pct >= 100 }"></div></div>
    </div>
    <div class="crew-contact">📞 {{ crew.contact_phone }}</div>

    <div v-if="selectedTicketId" class="crew-actions">
      <button class="btn btn--ghost" :disabled="evaluating" @click="emit('evaluate', crew.id)">
        {{ evaluating ? "评估中…" : "评估接单能力" }}
      </button>
      <button class="btn btn--primary" :disabled="locked || evaluation?.canAccept === false" @click="emit('confirm', crew.id)">
        确认派工
      </button>
    </div>

    <div v-if="selectedTicketId && evaluation" class="crew-eval" :class="evaluation.canAccept ? 'eval--ok' : 'eval--no'">
      <template v-if="evaluation.canAccept">
        <div class="eval-title">✅ 可接单</div>
        <div class="eval-detail">技能 {{ formatSkills(evaluation.requiredSkills) }} 匹配 · 备件齐全 · 容量 {{ formatCapacity(evaluation.inHand, evaluation.capacity) }}</div>
      </template>
      <template v-else>
        <div class="eval-title">⚠️ 无法接单，将进入排队</div>
        <ul class="eval-reasons">
          <li v-for="r in evaluation.reasons" :key="r">{{ r }}</li>
        </ul>
      </template>
    </div>
  </div>
</template>

<style scoped>
.crew-card {
  background: #fbfaf4;
  border: 1px solid #d8d6c8;
  border-radius: 8px;
  padding: 14px;
  display: grid;
  gap: 10px;
}
.crew-card--full { opacity: 0.85; }
.crew-card--locked { border-color: #f5c2c2; }
.crew-head { display: flex; justify-content: space-between; align-items: center; }
.duty { font-size: 12px; padding: 2px 8px; border-radius: 999px; font-weight: 700; }
.duty--on { background: #e4efe4; color: #244b31; }
.duty--off { background: #f0e6d2; color: #7d4d18; }
.crew-skills { display: flex; flex-wrap: wrap; gap: 6px; }
.skill-tag { font-size: 11px; background: #eef1e8; border: 1px solid #d8d6c8; padding: 2px 8px; border-radius: 4px; color: #274335; }
.skill-tag--none { color: #8a8f86; }
.crew-capacity { display: grid; gap: 4px; }
.cap-label { display: flex; justify-content: space-between; font-size: 12px; color: #596257; }
.cap-label strong { color: #274335; }
.cap-bar { height: 8px; background: #e4e0d3; border-radius: 999px; overflow: hidden; }
.cap-fill { height: 100%; background: #4a7c59; transition: width 0.3s; }
.cap-fill--full { background: #c0563b; }
.crew-contact { font-size: 12px; color: #8a8f86; }
.crew-actions { display: flex; gap: 8px; }
.btn { flex: 1; padding: 8px 10px; border-radius: 6px; border: 1px solid transparent; font-size: 13px; font-weight: 700; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--ghost { background: transparent; border-color: #b8b09f; color: #274335; }
.btn--primary { background: #274335; color: #f5f1e6; }
.crew-eval { border-radius: 6px; padding: 10px; font-size: 12px; }
.eval--ok { background: #e4efe4; border: 1px solid #b8d8b8; }
.eval--no { background: #fde8e8; border: 1px solid #f5c2c2; }
.eval-title { font-weight: 800; margin-bottom: 4px; }
.eval--ok .eval-title { color: #244b31; }
.eval--no .eval-title { color: #9b1c1c; }
.eval-detail { color: #2c4a3a; }
.eval-reasons { margin: 0; padding-left: 18px; color: #9b1c1c; }
</style>
