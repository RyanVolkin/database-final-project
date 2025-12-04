<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { getSchools } from '../services/api';

interface SchoolItem {
    chronicabsenteeismrate: number | null;
    enrollment: number | null;
    irn: number;
    name: string | null;
    perfindexscore: number | null;
    studentsaccomplished: number | null;
    studentsadvanced: number | null;
    studentsadvancedplus: number | null;
    studentsbasic: number | null;
    studentslimited: number | null;
    studentsproficient: number | null;
}

const itemsLocal = ref<SchoolItem[]>([]);

const searchName = ref('');
const showFilters = ref(false);

const filters = reactive<Record<string, { min?: number; max?: number }>>({
    enrollment: {},
    chronicabsenteeismrate: {},
    perfindexscore: {},
    studentsbasic: {},
    studentsproficient: {},
    studentsaccomplished: {},
    studentsadvanced: {},
    studentsadvancedplus: {},
});
interface Stat { min: number; max: number; median: number }
function calcStats(field: keyof SchoolItem): Stat {
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

type StatMap = Record<
  | 'chronicabsenteeismrate'
  | 'enrollment'
  | 'perfindexscore'
  | 'studentsaccomplished'
  | 'studentsadvanced'
  | 'studentsadvancedplus'
  | 'studentsbasic'
  | 'studentsproficient',
  Stat
>;

const stats = computed<StatMap>(() => ({
  chronicabsenteeismrate: calcStats('chronicabsenteeismrate'),
  enrollment: calcStats('enrollment'),
  perfindexscore: calcStats('perfindexscore'),
  studentsaccomplished: calcStats('studentsaccomplished'),
  studentsadvanced: calcStats('studentsadvanced'),
  studentsadvancedplus: calcStats('studentsadvancedplus'),
  studentsbasic: calcStats('studentsbasic'),
  studentsproficient: calcStats('studentsproficient'),
}));

// Fetching from server when filters/search change
let fetchTimeout: ReturnType<typeof setTimeout> | null = null;
async function fetchSchools() {
    try {
        const params: Record<string, string | number> = {};
        if (searchName.value) params['name'] = searchName.value;
        for (const k of Object.keys(filters)) {
            const f = (filters as any)[k];
            if (!f) continue;
            if (f.min !== undefined && f.min !== null) params[`${k}_min`] = f.min;
            if (f.max !== undefined && f.max !== null) params[`${k}_max`] = f.max;
        }
        const res = await getSchools(params);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        itemsLocal.value = data;
    } catch (err) {
        console.error('Failed to fetch schools', err);
    }
}

function applyFilters() {
    if (fetchTimeout) {
        clearTimeout(fetchTimeout);
        fetchTimeout = null;
    }
    fetchSchools();
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
onMounted(() => {
    fetchSchools();
});


function color (score: number | string | null | undefined, minScore: number, maxScore: number, medScore: number, higherIsBetter = true): string {
    let sNum: number | null = null;
    if (score === null || score === undefined) sNum = null;
    else if (typeof score === 'number') sNum = score;
    else if (typeof score === 'string') {
        const n = Number(score.replace(/[^0-9.\-eE]/g, ''));
        sNum = Number.isFinite(n) ? n : null;
    }
    if (sNum === null) return '';
    const min = minScore;
    const max = maxScore;
    let med = medScore;
    if (med === null || med === undefined) med = (min + max) / 2;
    if (med < min) med = min;
    if (med > max) med = max;
    if (max === min) {
        return itemsLocal.value.length ? 'rgb(255, 255, 0)' : 'rgb(200,200,200)';
    }
    let r = 0;
    let g = 0;
    if (higherIsBetter) {
        if (sNum <= med) {
            const denom = (med - min) || 1;
            let ratio = (sNum - min) / denom;
            ratio = Math.max(0, Math.min(1, ratio));
            r = 255;
            g = Math.round(255 * ratio);
        } else {
            const denom = (max - med) || 1;
            let ratio = (sNum - med) / denom;
            ratio = Math.max(0, Math.min(1, ratio));
            g = 255;
            r = Math.round(255 * (1 - ratio));
        }
    } else {
        if (sNum <= med) {
            const denom = (med - min) || 1;
            let ratio = (sNum - min) / denom;
            ratio = Math.max(0, Math.min(1, ratio));
            r = Math.round(255 * ratio);
            g = 255;
        } else {
            const denom = (max - med) || 1;
            let ratio = (sNum - med) / denom;
            ratio = Math.max(0, Math.min(1, ratio));
            r = 255;
            g = Math.round(255 * (1 - ratio));
        }
    }
    return `rgb(${r}, ${g}, 0)`;
}

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
    <v-table class="rounded-lg border elevation-1 ">
        <thead>
            <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Enrollment</th>
                <th class="text-left">Chronic Absenteeism %</th>
                <th class="text-left">Performance Index</th>
                <th class="text-left">Students Basic %</th>
                <th class="text-left">Students Proficient %</th>
                <th class="text-left">Students Accomplished %</th>
                <th class="text-left">Students Advanced %</th>
                <th class="text-left">Students Advanced Plus %</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="item in itemsLocal" :key="item.irn">
                <td>{{ item.name ?? '-' }}</td>
                <td>
                   {{ item.enrollment ?? '-' }}
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.chronicabsenteeismrate, stats.chronicabsenteeismrate.min, stats.chronicabsenteeismrate.max, stats.chronicabsenteeismrate.median, false), padding: '6px', borderRadius: '6px' }">{{ item.chronicabsenteeismrate ?? '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.perfindexscore, stats.perfindexscore.min, stats.perfindexscore.max, stats.perfindexscore.median), padding: '6px', borderRadius: '6px' }">{{ item.perfindexscore !== null ? item.perfindexscore : '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.studentsbasic, stats.studentsbasic.min, stats.studentsbasic.max, stats.studentsbasic.median), padding: '6px', borderRadius: '6px' }">{{ item.studentsbasic ?? '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.studentsproficient, stats.studentsproficient.min, stats.studentsproficient.max, stats.studentsproficient.median), padding: '6px', borderRadius: '6px' }">{{ item.studentsproficient ?? '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.studentsaccomplished, stats.studentsaccomplished.min, stats.studentsaccomplished.max, stats.studentsaccomplished.median), padding: '6px', borderRadius: '6px' }">{{ item.studentsaccomplished ?? '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.studentsadvanced, stats.studentsadvanced.min, stats.studentsadvanced.max, stats.studentsadvanced.median), padding: '6px', borderRadius: '6px' }">{{ item.studentsadvanced ?? '-' }}</span>
                </td>
                <td>
                    <span :style="{ backgroundColor: color(item.studentsadvancedplus, stats.studentsadvancedplus.min, stats.studentsadvancedplus.max, stats.studentsadvancedplus.median), padding: '6px', borderRadius: '6px' }">{{ item.studentsadvancedplus ?? '-' }}</span>
                </td>
            </tr>
        </tbody>
    </v-table>
</template>

<style scoped>

</style>
