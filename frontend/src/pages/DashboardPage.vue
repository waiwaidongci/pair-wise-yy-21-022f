<script setup lang="ts">
import { mockData } from "../mocks/seedData";
import StatusBadge from "../components/common/StatusBadge.vue";
import StatCard from "../components/common/StatCard.vue";

const entries = Object.entries(mockData);
</script>

<template>
  <section class="metrics">
    <StatCard label="核心模型" :value="entries.length" />
    <StatCard label="共享枚举" :value="3" />
    <StatCard label="本地记录" :value="entries.reduce((s, [, rows]) => s + rows.length, 0)" />
  </section>
  <section class="workbench">
    <div class="panel wide">
      <h2>业务数据</h2>
      <article class="row" v-for="[key, rows] in entries" :key="key">
        <strong>{{ key }}</strong>
        <span>{{ rows.length }} 条</span>
        <StatusBadge value="READY" />
      </article>
    </div>
    <div class="panel">
      <h2>联动检查</h2>
      <p>抢修工单、抢修班组和备件领用已接入「调度台」：按技能、在手任务和备件判断接单，容量不足先排队，派工确认占用名额，班组断网回传恢复后合并，改派后旧回传进入待对账。</p>
    </div>
  </section>
</template>
