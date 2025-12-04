<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { getHighSchoolAchievement } from '../services/api';

interface HighSchoolItem {
  irn: number;
  name: string | null;
  pathcompletedpc: number | null;
  satsatisfactorypc: number | null;
  honordiplomapc: number | null;
  apiboutstandingpc: number | null;
  careerreadypc: number | null;
  dualreadypc: number | null;
  militaryenlistedpc: number | null;
  techproficiencypc: number | null;
  wblcompletionpc: number | null;
  fouryeargradrate: number | null;
}

const itemsLocal = ref<HighSchoolItem[]>([]);

const searchName = ref('');
const showFilters = ref(false);

const filters = reactive<Record<string, { min?: number; max?: number }>>({
  pathcompletedpc: {},
  satsatisfactorypc: {},
  honordiplomapc: {},
  apiboutstandingpc: {},
  careerreadypc: {},
  dualreadypc: {},
  militaryenlistedpc: {},
  techproficiencypc: {},
  wblcompletionpc: {},
  fouryeargradrate: {},
});

interface Stat { min: number; max: number; median: number }
function calcStats(field: keyof HighSchoolItem): Stat {
  const raw = itemsLocal.value.map(item => item[field]);
  const vals = raw
    .map(v => {
      if (v === null || v === undefined) return NaN;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = Number(v.replace(/[^0-9.\-eE]/g, ''));
        return Number.isFinite(n) ? n : NaN;
      }
      return NaN;
    })
    .filter(n => Number.isFinite(n)) as number[];
  if (!vals.length) return { min: 0, max: 0, median: 0 };
  const s = vals.slice().sort((a, b) => a - b);
  const min = s[0]!;
  const max = s[s.length - 1]!;
  const mid = Math.floor(s.length / 2);
  const median = s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
  return { min, max, median };
}

const stats = computed(() => ({
  pathcompletedpc: calcStats('pathcompletedpc'),
  satsatisfactorypc: calcStats('satsatisfactorypc'),
  honordiplomapc: calcStats('honordiplomapc'),
  apiboutstandingpc: calcStats('apiboutstandingpc'),
  careerreadypc: calcStats('careerreadypc'),
  dualreadypc: calcStats('dualreadypc'),
  militaryenlistedpc: calcStats('militaryenlistedpc'),
  techproficiencypc: calcStats('techproficiencypc'),
  wblcompletionpc: calcStats('wblcompletionpc'),
  fouryeargradrate: calcStats('fouryeargradrate'),
} as Record<string, Stat>));

function color (score: number | string | null | undefined, minScore: number, maxScore: number, medScore: number, higherIsBetter = true): string {
  let sNum: number | null = null;
  if (score === null || score === undefined) sNum = null;
  else if (typeof score === 'number') sNum = score;
  else if (typeof score === 'string') {
    const n = Number(score.replace(/[^0-9.\-eE]/g, ''));
    sNum = Number.isFinite(n) ? n : null;
  }
  if (sNum === null) return '';
  let med = medScore;
  if (med === null || med === undefined) med = (minScore + maxScore) / 2;
  if (med < minScore) med = minScore;
  if (med > maxScore) med = maxScore;
  if (maxScore === minScore) return itemsLocal.value.length ? 'rgb(255,255,0)' : 'rgb(200,200,200)';
  let r = 0; let g = 0;
  if (higherIsBetter) {
    if (sNum <= med) {
      const denom = (med - minScore) || 1;
      let ratio = (sNum - minScore) / denom;
      ratio = Math.max(0, Math.min(1, ratio));
      r = 255;
      g = Math.round(255 * ratio);
    } else {
      const denom = (maxScore - med) || 1;
      let ratio = (sNum - med) / denom;
      ratio = Math.max(0, Math.min(1, ratio));
      g = 255;
      r = Math.round(255 * (1 - ratio));
    }
  } else {
    if (sNum <= med) {
      const denom = (med - minScore) || 1;
      let ratio = (sNum - minScore) / denom;
      ratio = Math.max(0, Math.min(1, ratio));
      r = Math.round(255 * ratio);
      g = 255;
    } else {
      const denom = (maxScore - med) || 1;
      let ratio = (sNum - med) / denom;
      ratio = Math.max(0, Math.min(1, ratio));
      r = 255;
      g = Math.round(255 * (1 - ratio));
    }
  }
  return `rgb(${r}, ${g}, 0)`;
}

let fetchTimeout: ReturnType<typeof setTimeout> | null = null;
async function fetchHighSchools() {
  try {
    const params: Record<string, string | number> = {};
    if (searchName.value) params['name'] = searchName.value;
    for (const k of Object.keys(filters)) {
      const f = (filters as any)[k];
      if (!f) continue;
      if (f.min !== undefined && f.min !== null) params[`${k.replace(/pc$/,'')}_min`] = f.min;
      if (f.max !== undefined && f.max !== null) params[`${k.replace(/pc$/,'')}_max`] = f.max;
    }
    // Note: server expects keys like pathcompleted_min etc. Our api.ts expects keys we use directly, so keep keys matching server mapping.
    // The above replacement removes trailing 'pc' so keys align with server mapping which used names like pathcompleted_min
    const res = await getHighSchoolAchievement(params);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    itemsLocal.value = data;
  } catch (err) {
    console.error('Failed to fetch high schools', err);
  }
}

function applyFilters() {
  if (fetchTimeout) {
    clearTimeout(fetchTimeout);
    fetchTimeout = null;
  }
  fetchHighSchools();
}

function resetFilters() {
  searchName.value = '';
  for (const k of Object.keys(filters)) {
    (filters as any)[k] = {};
  }
  applyFilters();
}

function toggleFilters() {
  showFilters.value = !showFilters.value;
}

onMounted(() => fetchHighSchools());
</script>

<template>
  <div class="mb-4">
    <v-row class="mb-2" align="center" dense>
      <v-col cols="12" sm="6" md="4">
        <v-text-field v-model="searchName" label="Search name" clearable />
      </v-col>
      <v-col cols="auto">
        <v-btn text @click="toggleFilters">{{ showFilters ? 'Hide' : 'Show' }} Filters</v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" @click="applyFilters">Apply</v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn text @click="resetFilters">Reset</v-btn>
      </v-col>
    </v-row>
    <v-dialog v-model="showFilters" max-width="900">
      <v-card>
        <v-card-title class="text-h6">Filters</v-card-title>
        <v-card-text>
          <v-row dense>
            <template v-for="k in Object.keys(filters)">
              <v-col :cols="12" :sm="6" :md="4" :lg="3">
                <div class="text-caption mb-1">{{ k }}</div>
                <v-text-field v-model.number="(filters as any)[k].min" type="number" label="Min" hide-details dense />
                <v-text-field v-model.number="(filters as any)[k].max" type="number" label="Max" hide-details dense />
              </v-col>
            </template>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="showFilters = false">Close</v-btn>
          <v-btn color="primary" @click="applyFilters">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
  <v-table class="rounded-lg border elevation-1">
    <thead>
      <tr>
        <th class="text-left">Name</th>
        <th class="text-left">Path Completed %</th>
        <th class="text-left">SAT Satisfactory %</th>
        <th class="text-left">Honor Diploma %</th>
        <th class="text-left">APIB Outstanding %</th>
        <th class="text-left">Career Ready %</th>
        <th class="text-left">Dual Ready %</th>
        <th class="text-left">Military Enlisted %</th>
        <th class="text-left">Tech Proficiency %</th>
        <th class="text-left">WBL Completion %</th>
        <th class="text-left">4yr Grad Rate %</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in itemsLocal" :key="item.irn">
        <td>{{ item.name ?? '-' }}</td>
        <td>
          <span :style="{ backgroundColor: color(item.pathcompletedpc, stats.pathcompletedpc.min, stats.pathcompletedpc.max, stats.pathcompletedpc.median), padding: '6px', borderRadius: '6px' }">{{ item.pathcompletedpc ?? '-' }}</span>
        </td>
        <td>
          <span :style="{ backgroundColor: color(item.satsatisfactorypc, stats.satsatisfactorypc.min, stats.satsatisfactorypc.max, stats.satsatisfactorypc.median), padding: '6px', borderRadius: '6px' }">{{ item.satsatisfactorypc ?? '-' }}</span>
        </td>
        <td>
          <span :style="{ backgroundColor: color(item.honordiplomapc, stats.honordiplomapc.min, stats.honordiplomapc.max, stats.honordiplomapc.median), padding: '6px', borderRadius: '6px' }">{{ item.honordiplomapc ?? '-' }}</span>
        </td>
        <td>
          <span :style="{ backgroundColor: color(item.apiboutstandingpc, stats.apiboutstandingpc.min, stats.apiboutstandingpc.max, stats.apiboutstandingpc.median), padding: '6px', borderRadius: '6px' }">{{ item.apiboutstandingpc ?? '-' }}</span>
        </td>
        <td>
          <span :style="{ backgroundColor: color(item.careerreadypc, stats.careerreadypc.min, stats.careerreadypc.max, stats.careerreadypc.median), padding: '6px', borderRadius: '6px' }">{{ item.careerreadypc ?? '-' }}</span>
        </td>
        <td>
          <span :style="{ backgroundColor: color(item.dualreadypc, stats.dualreadypc.min, stats.dualreadypc.max, stats.dualreadypc.median), padding: '6px', borderRadius: '6px' }">{{ item.dualreadypc ?? '-' }}</span>
        </td>
        <td>
          <span :style="{ backgroundColor: color(item.militaryenlistedpc, stats.militaryenlistedpc.min, stats.militaryenlistedpc.max, stats.militaryenlistedpc.median), padding: '6px', borderRadius: '6px' }">{{ item.militaryenlistedpc ?? '-' }}</span>
        </td>
        <td>
          <span :style="{ backgroundColor: color(item.techproficiencypc, stats.techproficiencypc.min, stats.techproficiencypc.max, stats.techproficiencypc.median), padding: '6px', borderRadius: '6px' }">{{ item.techproficiencypc ?? '-' }}</span>
        </td>
        <td>
          <span :style="{ backgroundColor: color(item.wblcompletionpc, stats.wblcompletionpc.min, stats.wblcompletionpc.max, stats.wblcompletionpc.median), padding: '6px', borderRadius: '6px' }">{{ item.wblcompletionpc ?? '-' }}</span>
        </td>
        <td>
          <span :style="{ backgroundColor: color(item.fouryeargradrate, stats.fouryeargradrate.min, stats.fouryeargradrate.max, stats.fouryeargradrate.median), padding: '6px', borderRadius: '6px' }">{{ item.fouryeargradrate ?? '-' }}</span>
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<style scoped>

</style>
