const BASE = "http://localhost:3000/api";

export async function getDistrict(params?: Record<string, string | number | boolean | null | undefined>) {
  const qp = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === null || v === undefined) continue;
      qp.set(k, String(v));
    }
  }
  const url = `${BASE}/district` + (qp.toString() ? `?${qp.toString()}` : '');
  return fetch(url, {
    method: 'get',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function getSchools(params?: Record<string, string | number | boolean | null | undefined>) {
  const qp = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === null || v === undefined) continue;
      qp.set(k, String(v));
    }
  }
  const url = `${BASE}/schools` + (qp.toString() ? `?${qp.toString()}` : '');
  return fetch(url, {
    method: 'get',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function getHighSchoolAchievement(params?: Record<string, string | number | boolean | null | undefined>) {
  const qp = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === null || v === undefined) continue;
      qp.set(k, String(v));
    }
  }
  const url = `${BASE}/highschoolachievement` + (qp.toString() ? `?${qp.toString()}` : '');
  return fetch(url, {
    method: 'get',
    headers: { 'Content-Type': 'application/json' },
  });
}