const API_BASE = "/api";

function authHeaders(extra = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...extra };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function authFetch(url, options = {}) {
  const headers = authHeaders(options.headers);
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  return res;
}

/** 列出所有 Prep 会话 */
export async function listCopilotPreps() {
  const res = await authFetch(`${API_BASE}/copilot/preps`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** 删除 Prep 会话 */
export async function deleteCopilotPrep(prepId) {
  const res = await authFetch(`${API_BASE}/copilot/prep/${prepId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** 启动 Copilot Prep Phase */
export async function startCopilotPrep({ jdText, company, position }) {
  const form = new FormData();
  form.append("jd_text", jdText);
  if (company) form.append("company", company);
  if (position) form.append("position", position);

  const res = await authFetch(`${API_BASE}/copilot/prep`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** 查询 Prep 进度 */
export async function getCopilotPrepStatus(prepId) {
  const res = await authFetch(`${API_BASE}/copilot/prep/${prepId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** 获取策略树 */
export async function getCopilotStrategyTree(prepId) {
  const res = await authFetch(`${API_BASE}/copilot/prep/${prepId}/tree`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
