<template>
  <div class="chart">
    <div class="row-between" style="margin-bottom: 10px;">
      <div class="h2">Sales Trend</div>
      <span class="badge">{{ points.length }} titik</span>
    </div>

    <svg :viewBox="`0 0 ${w} ${h}`" class="svg">
      <path :d="path" class="line" />
      <path :d="area" class="area" />
    </svg>

    <div class="legend">
      <span class="dot"></span>
      <span class="p">Realtime update dari socket + auto refresh</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  points: { type: Array, default: () => [] }, // [{x,label,y}]
})

const w = 600
const h = 220
const pad = 18

const normalized = computed(() => {
  const pts = props.points.map(p => ({ ...p, y: Number(p.y || 0) }))
  const maxY = Math.max(1, ...pts.map(p => p.y))
  const minY = Math.min(...pts.map(p => p.y))

  const span = Math.max(1, maxY - minY)
  const n = pts.length || 1

  return pts.map((p, idx) => {
    const x = pad + (idx * (w - pad*2)) / Math.max(1, n - 1)
    const y = h - pad - ((p.y - minY) * (h - pad*2)) / span
    return { x, y }
  })
})

const path = computed(() => {
  const pts = normalized.value
  if (!pts.length) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
})

const area = computed(() => {
  const pts = normalized.value
  if (!pts.length) return ''
  const first = pts[0]
  const last = pts[pts.length - 1]
  return `M ${first.x} ${h-pad} ` + pts.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${last.x} ${h-pad} Z`
})
</script>

<style scoped>
.chart{
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px;
  background: rgba(255,255,255,.03);
}
.svg{
  width: 100%;
  height: 220px;
  display:block;
}
.line{
  fill: none;
  stroke: #ffffff;
  stroke-width: 2.2;
  opacity: .92;
}
.area{
  fill: rgba(255,255,255,.10);
  stroke: none;
}
.legend{
  display:flex;
  gap: 10px;
  align-items:center;
  margin-top: 10px;
}
.dot{
  width: 10px;
  height: 10px;
  border-radius: 99px;
  background: #fff;
  display:inline-block;
}
</style>
