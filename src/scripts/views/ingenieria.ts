import type { Payload, Ronda, AlianzaEquipo, MecTeam } from "../../lib/types";
import { fmt, esc } from "../format";
import { paintKeepingOpen } from "../dom";

let activeSub: "rondas" | "tabla" = "rondas";
let latest: Payload | null = null;

const LOW_POLY_BACKDROP = buildStageBackdrop();

const seenOpenRounds = new Set<string>();
const metricSnapshot = new Map<string, number>();
const activeMetricFrames = new Set<number>();

function estadoBadge(estado: string): string {
  const label = estado || "Pendiente";
  const tone =
    estado === "Finalizada"
      ? "round-badge round-badge--dark"
      : estado === "En curso"
        ? "round-badge round-badge--green"
        : "round-badge round-badge--muted";

  return `<span class="${tone}">${esc(label)}</span>`;
}

function caretIcon(className: string): string {
  return `
    <svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>`;
}

function buildStageBackdrop(): string {
  let seed = 987654321;
  const rand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };

  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const W = 1000;
  const H = 560;
  const cols = 17;
  const rows = 10;
  const cw = W / cols;
  const ch = H / rows;
  const pts: Array<Array<{ x: number; y: number }>> = [];

  for (let r = 0; r <= rows; r++) {
    pts[r] = [];
    for (let c = 0; c <= cols; c++) {
      const edge = r === 0 || c === 0 || r === rows || c === cols;
      const jx = edge ? 0 : (rand() - 0.5) * cw * 0.72;
      const jy = edge ? 0 : (rand() - 0.5) * ch * 0.72;
      pts[r][c] = { x: c * cw + jx, y: r * ch + jy };
    }
  }

  const polygons: string[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = pts[r][c];
      const b = pts[r][c + 1];
      const d = pts[r + 1][c];
      const e = pts[r + 1][c + 1];
      const quads = [
        [a, b, d],
        [b, e, d],
      ];

      for (const tri of quads) {
        const cx = (tri[0].x + tri[1].x + tri[2].x) / 3;
        const cy = (tri[0].y + tri[1].y + tri[2].y) / 3;
        const tx = cx / W;
        const vy = cy / H;
        const redAmt = Math.max(0, 1 - tx * 1.85);
        const blueAmt = Math.max(0, (tx - 0.06) * 1.15);

        let R = 246;
        let G = 243;
        let B = 248;

        R += redAmt * 6;
        G += redAmt * (-20 * (0.4 + vy * 0.7));
        B += redAmt * (-14 * (0.4 + vy * 0.7));
        R += blueAmt * (-22 * (0.4 + vy * 0.7));
        G += blueAmt * -8;
        B += blueAmt * 6;

        const variance = (rand() - 0.5) * 10;
        const fill = `rgb(${clamp(R + variance)},${clamp(G + variance)},${clamp(B + variance)})`;
        const animate = rand() < 0.24;
        const duration = (4 + rand() * 6).toFixed(2);
        const delay = (rand() * 6).toFixed(2);

        polygons.push(
          `<polygon class="round-stage__facet${animate ? " round-stage__facet--animated" : ""}" points="${tri
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(" ")}" style="fill:${fill};--facet-duration:${duration}s;--facet-delay:${delay}s" />`
        );
      }
    }
  }

  return `
    <div class="round-stage__backdrop" aria-hidden="true">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="round-stage__mesh">
        ${polygons.join("")}
      </svg>
      <span class="round-stage__shine"></span>
      <span class="round-stage__orb round-stage__orb--red"></span>
      <span class="round-stage__orb round-stage__orb--blue"></span>
      <span class="round-stage__orb round-stage__orb--white"></span>
    </div>`;
}

function renderMetric(key: string, value: number, extraClass = "", prefix = "", suffix = ""): string {
  return `<span class="js-round-metric ${extraClass}" data-metric="${key}" data-value="${value}" data-prefix="${esc(prefix)}" data-suffix="${esc(suffix)}">${prefix}${fmt(value, 0)}${suffix}</span>`;
}

function teamCard(n: number, side: "rojo" | "azul", e: AlianzaEquipo): string {
  const red = side === "rojo";
  const tone = red ? "round-team-card round-team-card--red" : "round-team-card round-team-card--blue";
  const accent = red
    ? `<span class="round-team-card__meta">${caretIcon("round-team-card__caret")}<span class="round-team-card__dot"></span></span>`
    : `<span class="round-team-card__meta"><span class="round-team-card__dot"></span>${caretIcon("round-team-card__caret")}</span>`;

  const members = e.integrantes.length
    ? e.integrantes
        .map((m) =>
          red
            ? `<li class="round-team-card__member"><span class="round-team-card__member-dot"></span><span>${esc(m)}</span></li>`
            : `<li class="round-team-card__member round-team-card__member--blue"><span>${esc(m)}</span><span class="round-team-card__member-dot"></span></li>`
        )
        .join("")
    : `<li class="round-team-card__empty">Integrantes por asignar</li>`;

  const header = red
    ? `<span class="round-team-card__name">Equipo ${esc(e.letra)}</span>${accent}`
    : `${accent}<span class="round-team-card__name">Equipo ${esc(e.letra)}</span>`;

  return `
    <details data-key="ronda-${n}-${side}-${e.letra}" class="${tone}">
      <summary class="round-team-card__summary">${header}</summary>
      <div class="round-team-card__body">
        <div class="round-team-card__divider"></div>
        <ul class="round-team-card__members">${members}</ul>
      </div>
    </details>`;
}

function regionalBox(side: "rojo" | "azul", val: number, round: number): string {
  const red = side === "rojo";
  return `
    <div class="round-regional ${red ? "round-regional--red" : "round-regional--blue"}">
      <p class="round-regional__label">Alianza Regional ${red ? "Rojo" : "Azul"}</p>
      <p class="round-regional__value">${renderMetric(`ronda-${round}-${side}-regional`, val, "", "")}</p>
    </div>`;
}

function buddyPill(side: "rojo" | "azul", val: number, round: number): string {
  return `
    <div class="round-buddy-wrap ${side === "rojo" ? "round-buddy-wrap--left" : "round-buddy-wrap--right"}">
      <span class="round-buddy ${side === "rojo" ? "round-buddy--red" : "round-buddy--blue"}">${renderMetric(`ronda-${round}-${side}-buddy`, val, "", "+", " Buddy climb")}</span>
    </div>`;
}

function penaltyPill(side: "rojo" | "azul", val: number, obs: string): string {
  if (!val) return "";
  const hasObs = obs.trim().length > 0;
  const warnIcon = `<svg class="round-penalty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  return `
    <div class="round-penalty-wrap ${side === "rojo" ? "round-penalty-wrap--left" : "round-penalty-wrap--right"}">
      <span class="round-penalty round-penalty--${side === "rojo" ? "red" : "blue"}" tabindex="0" role="note"
        aria-label="Penalización de ${fmt(val, 0)} puntos${hasObs ? `: ${esc(obs)}` : ""}">
        ${warnIcon}
        <span class="round-penalty__value">−${fmt(val, 0)} pts</span>
        ${hasObs ? `<span class="round-penalty__tip" role="tooltip">${esc(obs)}</span>` : ""}
      </span>
    </div>`;
}

function centerChip(label: string, metricKey: string, val: number, prefix = ""): string {
  return `
    <div class="round-chip">
      <p class="round-chip__label">${esc(label)}</p>
      <p class="round-chip__value">${renderMetric(metricKey, val, "", prefix)}</p>
    </div>`;
}

function emptyAlliance(side: "rojo" | "azul"): string {
  return `
    <div class="round-alliance-empty ${side === "rojo" ? "round-alliance-empty--red" : "round-alliance-empty--blue"}">
      Alianza por definir
    </div>`;
}

function roundScorePreview(r: Ronda): string {
  if (!r.hasData) {
    return `<span class="round-accordion__score-preview round-accordion__score-preview--muted">Sin datos</span>`;
  }

  return `
    <span class="round-accordion__score-preview">
      <span class="round-score-preview__red">${fmt(r.rojo.score, 0)}</span>
      <span class="round-score-preview__vs">vs</span>
      <span class="round-score-preview__blue">${fmt(r.azul.score, 0)}</span>
    </span>`;
}

function roundHeader(r: Ronda): string {
  return `
    <div class="round-stage__header">
      <p class="round-stage__subtitle">RONDA ${r.n}${r.descansa ? ` · DESCANSA ${esc(r.descansa).toUpperCase()}` : ""}</p>
    </div>`;
}

function roundBody(r: Ronda): string {
  if (!r.hasData) {
    return `
      <div class="round-stage">
        <div class="round-stage__panel">
          ${LOW_POLY_BACKDROP}
          <div class="round-stage__surface">
            ${roundHeader(r)}
            <div class="round-stage__empty">Esta ronda aún no tiene datos cargados.</div>
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="round-stage">
      <div class="round-stage__panel">
        ${LOW_POLY_BACKDROP}
        <div class="round-stage__surface">
          ${roundHeader(r)}

          <div class="round-stage__grid">
            <div class="round-stage__column round-stage__column--red">
              ${r.rojo.equipos.length ? r.rojo.equipos.map((e) => teamCard(r.n, "rojo", e)).join("") : emptyAlliance("rojo")}
              ${regionalBox("rojo", r.rojo.totalRegional, r.n)}
              ${buddyPill("rojo", r.rojo.buddy, r.n)}
              ${penaltyPill("rojo", r.rojo.penal, r.rojo.penalObs)}
            </div>

            <div class="round-stage__center">
              <p class="round-score-card__label">SCORE TOTAL</p>
              <div class="round-score-card">
                <div class="round-score-card__inner">
                  <span class="round-score-card__value round-score-card__value--red">
                    ${renderMetric(`ronda-${r.n}-rojo-score`, r.rojo.score)}
                  </span>
                  <span class="round-score-card__middle">
                    <span class="round-score-card__line"></span>
                    <span class="round-score-card__vs">VS</span>
                    <span class="round-score-card__line round-score-card__line--bottom"></span>
                  </span>
                  <span class="round-score-card__value round-score-card__value--blue">
                    ${renderMetric(`ronda-${r.n}-azul-score`, r.azul.score)}
                  </span>
                </div>
              </div>

              <div class="round-chip-grid">
                ${centerChip("EXTINTOR GLOBAL", `ronda-${r.n}-extintor`, r.wildfireExt)}
                ${centerChip("COOPERTITION", `ronda-${r.n}-coop`, r.coopBonus, "+")}
              </div>
            </div>

            <div class="round-stage__column round-stage__column--blue">
              ${r.azul.equipos.length ? r.azul.equipos.map((e) => teamCard(r.n, "azul", e)).join("") : emptyAlliance("azul")}
              ${regionalBox("azul", r.azul.totalRegional, r.n)}
              ${buddyPill("azul", r.azul.buddy, r.n)}
              ${penaltyPill("azul", r.azul.penal, r.azul.penalObs)}
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function roundCard(r: Ronda): string {
  const openByDefault = r.hasData && r.estado === "En curso";

  return `
    <details data-key="ronda-${r.n}" ${openByDefault ? "open" : ""} class="round-accordion ${r.hasData ? "" : "round-accordion--muted"}">
      <summary class="round-accordion__summary">
        <div class="round-accordion__summary-left">
          <span class="round-accordion__number">${r.n}</span>
          <div>
            <p class="round-accordion__title">Ronda ${r.n}</p>
            <p class="round-accordion__meta">
              ${estadoBadge(r.estado)}
              ${r.descansa ? `<span class="round-accordion__rest">· Descansa ${esc(r.descansa)}</span>` : ""}
            </p>
          </div>
        </div>

        <div class="round-accordion__summary-right">
          ${roundScorePreview(r)}
          <span class="round-accordion__caret">${caretIcon("round-accordion__caret-icon")}</span>
        </div>
      </summary>
      ${roundBody(r)}
    </details>`;
}

function mecTable(tabla: MecTeam[]): string {
  const rows = tabla
    .map(
      (t) => `
      <tr class="border-t border-default">
        <td class="px-3 py-3 font-bold">${esc(t.equipo)}</td>
        <td class="px-3 py-3 text-secondary">${t.integrantes.length ? t.integrantes.map(esc).join(", ") : `<span class="italic text-tertiary">Por asignar</span>`}</td>
        <td class="px-3 py-3 text-right tabular-nums">${fmt(t.exposicion)}</td>
        <td class="px-3 py-3 text-right tabular-nums">${fmt(t.rondas)}</td>
        <td class="px-3 py-3 text-right font-heading text-2xl tabular-nums">${fmt(t.total)}</td>
      </tr>`
    )
    .join("");

  return `
    <div class="overflow-x-auto">
      <table class="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr class="text-left text-xs font-semibold uppercase tracking-wide text-tertiary">
            <th class="px-3 pb-2">Equipo</th>
            <th class="px-3 pb-2">Integrantes</th>
            <th class="px-3 pb-2 text-right">Exposición <span class="text-[10px]">/10</span></th>
            <th class="px-3 pb-2 text-right">Rondas <span class="text-[10px]">/30</span></th>
            <th class="px-3 pb-2 text-right">Total <span class="text-[10px]">/40</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function subTab(id: "rondas" | "tabla", label: string): string {
  const on = activeSub === id;
  return `<button data-sub="${id}" class="rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${on ? "bg-brand text-inverse" : "text-secondary hover:text-primary"}">${label}</button>`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cancelMetricAnimations() {
  activeMetricFrames.forEach((id) => window.cancelAnimationFrame(id));
  activeMetricFrames.clear();
}

function setMetricText(node: HTMLElement, value: number) {
  const prefix = node.dataset.prefix ?? "";
  const suffix = node.dataset.suffix ?? "";
  node.textContent = `${prefix}${fmt(value, 0)}${suffix}`;
}

function animateMetric(node: HTMLElement, from: number, to: number, duration = 1300) {
  const prefix = node.dataset.prefix ?? "";
  const suffix = node.dataset.suffix ?? "";
  const start = performance.now();

  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const next = Math.round(from + (to - from) * eased);
    node.textContent = `${prefix}${fmt(next, 0)}${suffix}`;

    if (progress < 1) {
      const nextId = window.requestAnimationFrame((frameNow) => {
        activeMetricFrames.delete(nextId);
        tick(frameNow);
      });
      activeMetricFrames.add(nextId);
    } else {
      setMetricText(node, to);
    }
  };

  const id = window.requestAnimationFrame((now) => {
    activeMetricFrames.delete(id);
    tick(now);
  });
  activeMetricFrames.add(id);
}

function hydrateRoundMetrics(root: HTMLElement) {
  const reduced = prefersReducedMotion();
  const rounds = Array.from(root.querySelectorAll<HTMLDetailsElement>(".round-accordion[open]"));
  const freshRounds = new Set(
    rounds
      .filter((round) => {
        const key = round.dataset.key;
        return Boolean(key && !round.dataset.restoredOpen && !seenOpenRounds.has(key));
      })
      .map((round) => round.dataset.key!)
  );

  rounds.forEach((round) => {
    const roundKey = round.dataset.key;
    if (!roundKey) return;

    round.querySelectorAll<HTMLElement>(".js-round-metric").forEach((node) => {
      const metricKey = node.dataset.metric;
      if (!metricKey) return;

      const value = Number(node.dataset.value ?? "0");
      const prev = metricSnapshot.get(metricKey);
      const shouldAnimate = !reduced && (freshRounds.has(roundKey) || prev === undefined || prev !== value);

      if (shouldAnimate) {
        animateMetric(node, prev ?? 0, value);
      } else {
        setMetricText(node, value);
      }

      metricSnapshot.set(metricKey, value);
    });

    seenOpenRounds.add(roundKey);
  });
}

function viewSignature(data: Payload): string {
  return activeSub === "rondas"
    ? JSON.stringify(data.ingenieria.rondas)
    : JSON.stringify(data.ingenieria.tabla);
}

function paint(el: HTMLElement, data: Payload) {
  const signature = `${activeSub}:${viewSignature(data)}`;
  if (el.dataset.viewSignature === signature) return;

  cancelMetricAnimations();

  const content =
    activeSub === "rondas"
      ? `<div class="space-y-4">${data.ingenieria.rondas.map(roundCard).join("")}</div>`
      : mecTable(data.ingenieria.tabla);

  paintKeepingOpen(
    el,
    `
    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Área 1</p>
    <h2 class="font-heading text-4xl tracking-wide sm:text-5xl">Robot, Pista e Ingeniería</h2>
    <p class="mt-2 max-w-2xl text-sm text-secondary">
      Competencia por rondas entre 6 equipos y evaluación de la exposición mecánica por grupo.
    </p>
    <div class="mt-5 mb-6 inline-flex rounded-full border border-default bg-canvas p-1">
      ${subTab("rondas", "Rondas")}
      ${subTab("tabla", "Tabla Mecánica")}
    </div>
    ${content}`
  );

  el.dataset.viewSignature = signature;

  if (activeSub === "rondas") {
    hydrateRoundMetrics(el);
  }
}

export function renderIngenieria(el: HTMLElement, data: Payload) {
  latest = data;

  if (!el.dataset.bound) {
    el.dataset.bound = "1";
    el.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest("[data-sub]") as HTMLElement | null;

      if (btn) {
        activeSub = btn.dataset.sub as "rondas" | "tabla";
        if (latest) paint(el, latest);
        return;
      }

      const summary = target.closest("summary");
      const round = summary?.closest(".round-accordion") as HTMLDetailsElement | null;
      if (!round) return;

      if (round.dataset.restoredOpen === "1") {
        delete round.dataset.restoredOpen;
      }

      window.requestAnimationFrame(() => hydrateRoundMetrics(el));
    });
  }

  paint(el, data);
}
