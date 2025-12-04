<script setup lang="ts">
import { computed, ref, onMounted, reactive } from 'vue';
import { getDistrict } from '../services/api';

interface DistrictItem {
  irn: number;
  name: string | null;
  perfindexscore: number | null;
  studentslimited: number | null;
  studentsbasic: number | null;
  studentsproficient: number | null;
  studentsaccomplished: number | null;
  studentsadvanced: number | null;
  studentsadvancedplus: number | null;
  schoolcount: number | null;
}

const itemsLocal = ref<DistrictItem[]>([]);

const searchName = ref('');
const showFilters = ref(false);
const filters = reactive<Record<string, { min?: number; max?: number }>>({
    perfindexscore: {},
    studentslimited: {},
    studentsbasic: {},
    studentsproficient: {},
    studentsaccomplished: {},
    studentsadvanced: {},
    studentsadvancedplus: {},
    schoolcount: {},
});

let fetchTimeout: ReturnType<typeof setTimeout> | null = null;

interface Stat { min: number; max: number; median: number }
function calcStats(field: keyof DistrictItem): Stat {
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
  perfindexscore: calcStats('perfindexscore'),
  studentslimited: calcStats('studentslimited'),
  studentsbasic: calcStats('studentsbasic'),
  studentsproficient: calcStats('studentsproficient'),
  studentsaccomplished: calcStats('studentsaccomplished'),
  studentsadvanced: calcStats('studentsadvanced'),
  studentsadvancedplus: calcStats('studentsadvancedplus'),
  schoolcount: calcStats('schoolcount'),
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

async function fetchDistricts() {
    try {
        const params: Record<string, string | number> = {};
        if (searchName.value) params['name'] = searchName.value;
        for (const k of Object.keys(filters)) {
            const f = (filters as any)[k];
            if (!f) continue;
            if (f.min !== undefined && f.min !== null) params[`${k}_min`] = f.min;
            if (f.max !== undefined && f.max !== null) params[`${k}_max`] = f.max;
        }
        const res = await getDistrict(params);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        itemsLocal.value = data;
    } catch (err) {
        console.error('Failed to fetch districts', err);
    }
}

function applyFilters() {
    if (fetchTimeout) {
        clearTimeout(fetchTimeout);
        fetchTimeout = null;
    }
    fetchDistricts();
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

onMounted(() => fetchDistricts());
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
                <th class="text-left"># Schools</th>
                <th class="text-left">Performance Index</th>
                <th class="text-left">Students Limited</th>
                <th class="text-left">Students Basic</th>
                <th class="text-left">Students Proficient</th>
                <th class="text-left">Students Accomplished</th>
                <th class="text-left">Students Advanced</th>
                <th class="text-left">Students Advanced Plus</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in itemsLocal" :key="item.irn">
                <td>{{ item.name ?? '-' }}</td>
                <td>
                    {{ item.schoolcount ?? '-' }}
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.perfindexscore, stats?.perfindexscore?.min ?? 0, stats?.perfindexscore?.max ?? 0, stats?.perfindexscore?.median ?? 0), padding: '6px', borderRadius: '6px' }">{{ item.perfindexscore ?? '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.studentslimited, stats?.studentslimited?.min ?? 0, stats?.studentslimited?.max ?? 0, stats?.studentslimited?.median ?? 0, false), padding: '6px', borderRadius: '6px' }">{{ item.studentslimited ?? '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.studentsbasic, stats?.studentsbasic?.min ?? 0, stats?.studentsbasic?.max ?? 0, stats?.studentsbasic?.median ?? 0), padding: '6px', borderRadius: '6px' }">{{ item.studentsbasic ?? '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.studentsproficient, stats?.studentsproficient?.min ?? 0, stats?.studentsproficient?.max ?? 0, stats?.studentsproficient?.median ?? 0), padding: '6px', borderRadius: '6px' }">{{ item.studentsproficient ?? '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.studentsaccomplished, stats?.studentsaccomplished?.min ?? 0, stats?.studentsaccomplished?.max ?? 0, stats?.studentsaccomplished?.median ?? 0), padding: '6px', borderRadius: '6px' }">{{ item.studentsaccomplished ?? '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.studentsadvanced, stats?.studentsadvanced?.min ?? 0, stats?.studentsadvanced?.max ?? 0, stats?.studentsadvanced?.median ?? 0), padding: '6px', borderRadius: '6px' }">{{ item.studentsadvanced ?? '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.studentsadvancedplus, stats?.studentsadvancedplus?.min ?? 0, stats?.studentsadvancedplus?.max ?? 0, stats?.studentsadvancedplus?.median ?? 0), padding: '6px', borderRadius: '6px' }">{{ item.studentsadvancedplus ?? '-' }}</span>
                </td>
            </tr>
        </tbody>
    </v-table>
</template>

<style scoped>

</style>
