import type { Payload, GlobalRow } from "../../lib/types";
import { fmt, esc } from "../format";

type MedalTier = "gold" | "silver" | "bronze";

const RENDER_SIGNATURE_ATTR = "data-global-render-signature";

const MEDAL_THEME: Record<
  MedalTier,
  { light: string; mid: string; dark: string; edge: string; engrave: string; number: string; score: string }
> = {
  gold: {
    light: "#fff6c8",
    mid: "#ffd94a",
    dark: "#c1861a",
    edge: "#a9760f",
    engrave: "#7d5c0e",
    number: "#5a4108",
    score: "#14161d",
  },
  silver: {
    light: "#fbfdff",
    mid: "#dfe5ef",
    dark: "#98a1b0",
    edge: "#828b9c",
    engrave: "#5f6676",
    number: "#3f4653",
    score: "#5a6270",
  },
  bronze: {
    light: "#f7d8b8",
    mid: "#e0a271",
    dark: "#a3663a",
    edge: "#8a5730",
    engrave: "#6f4526",
    number: "#54321a",
    score: "#9c6a3f",
  },
};

function orderedRows(rows: GlobalRow[]): GlobalRow[] {
  return [...rows].sort(
    (a, b) => a.rank - b.rank || b.total - a.total || a.nombre.localeCompare(b.nombre, "es")
  );
}

function renderSignature(rows: GlobalRow[]): string {
  return rows
    .map((row) =>
      [
        row.rank,
        row.nombre,
        row.grupo,
        row.mecanica,
        row.programacion,
        row.comunicacion,
        row.total,
      ].join("|")
    )
    .join("||");
}

function gearPath(cx: number, cy: number, outer: number, inner: number, teeth: number): string {
  let path = "";
  const steps = teeth * 2;
  const step = Math.PI / teeth;

  for (let i = 0; i < steps; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = i * step - Math.PI / 2;
    const x = (cx + Math.cos(angle) * radius).toFixed(1);
    const y = (cy + Math.sin(angle) * radius).toFixed(1);
    path += `${i ? "L" : "M"}${x},${y} `;
  }

  return `${path}Z`;
}

function robotMarkup(color: string): string {
  return `
    <g opacity=".26" transform="translate(70 86) scale(.52) translate(-50 -52)">
      <circle cx="50" cy="10" r="3" fill="${color}"></circle>
      <line x1="50" y1="21" x2="50" y2="13" stroke="${color}" stroke-width="2.6" stroke-linecap="round"></line>
      <rect x="31" y="21" width="38" height="29" rx="7" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></rect>
      <circle cx="42" cy="35" r="3.4" fill="${color}"></circle>
      <circle cx="58" cy="35" r="3.4" fill="${color}"></circle>
      <line x1="44" y1="44" x2="56" y2="44" stroke="${color}" stroke-width="2.6" stroke-linecap="round"></line>
      <line x1="50" y1="50" x2="50" y2="54" stroke="${color}" stroke-width="2.6" stroke-linecap="round"></line>
      <rect x="27" y="54" width="46" height="30" rx="6" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></rect>
      <circle cx="50" cy="69" r="7" fill="none" stroke="${color}" stroke-width="2.6"></circle>
      <line x1="50" y1="62" x2="50" y2="76" stroke="${color}" stroke-width="2.6" stroke-linecap="round"></line>
      <line x1="43" y1="69" x2="57" y2="69" stroke="${color}" stroke-width="2.6" stroke-linecap="round"></line>
      <path d="M27,60 H17 V74" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path>
      <circle cx="17" cy="76" r="2.6" fill="${color}"></circle>
      <path d="M73,60 H83 V74" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path>
      <circle cx="83" cy="76" r="2.6" fill="${color}"></circle>
      <circle cx="41" cy="90" r="5" fill="none" stroke="${color}" stroke-width="2.6"></circle>
      <circle cx="59" cy="90" r="5" fill="none" stroke="${color}" stroke-width="2.6"></circle>
    </g>`;
}

function medalSvg(tier: MedalTier, place: number, champion: boolean): string {
  const theme = MEDAL_THEME[tier];
  const gradientId = `gr-medal-${tier}-${place}-${champion ? "lg" : "sm"}`;

  return `
    <svg class="gr-podium__medal-svg ${champion ? "gr-podium__medal-svg--lg" : "gr-podium__medal-svg--sm"}" viewBox="0 0 140 150" aria-hidden="true">
      <defs>
        <radialGradient id="${gradientId}" cx="38%" cy="30%" r="75%">
          <stop offset="0%" stop-color="${theme.light}"></stop>
          <stop offset="50%" stop-color="${theme.mid}"></stop>
          <stop offset="100%" stop-color="${theme.dark}"></stop>
        </radialGradient>
      </defs>
      <rect x="66" y="14" width="8" height="22" rx="3" fill="${theme.dark}"></rect>
      <circle cx="70" cy="16" r="8" fill="none" stroke="${theme.edge}" stroke-width="4"></circle>
      <path d="${gearPath(70, 84, 49, 44, 16)}" fill="${theme.dark}" stroke="${theme.edge}" stroke-width="2" stroke-linejoin="round"></path>
      <circle cx="70" cy="84" r="38" fill="url(#${gradientId})" stroke="${theme.edge}" stroke-width="2.5"></circle>
      <circle cx="70" cy="84" r="33" fill="none" stroke="${theme.light}" stroke-width="1.4" opacity=".5"></circle>
      <ellipse cx="57" cy="70" rx="16" ry="9" fill="#fff" opacity=".22"></ellipse>
      ${robotMarkup(theme.engrave)}
      <text x="70" y="99" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="800" font-size="40" fill="${theme.number}">${place}</text>
    </svg>`;
}

function podiumSlot(row: GlobalRow | undefined, place: number, tier: MedalTier, champion = false): string {
  const score = row ? fmt(row.total) : "—";
  const name = row ? esc(row.nombre) : "Por definir";
  const placeholder = row ? "" : " gr-podium__slot--placeholder";
  const championLabel = champion
    ? '<span class="gr-podium__champion text-primary">Finalistas</span>'
    : '<span class="gr-podium__champion-spacer" aria-hidden="true"></span>';

  return `
    <article class="gr-podium__slot ${champion ? "gr-podium__slot--champion" : "gr-podium__slot--secondary"}${placeholder}">
      ${championLabel}
      <div class="gr-podium__float">
        <div class="gr-podium__medal-box">
          ${medalSvg(tier, place, champion)}
          <span class="gr-podium__shine" aria-hidden="true"></span>
        </div>
      </div>
      <p class="gr-podium__name text-primary">${name}</p>
      <p class="gr-podium__score gr-podium__score--${tier}">${score}</p>
    </article>`;
}

function badgeTone(rank: number): string {
  if (rank === 1) return " gr-rank-card__badge--gold";
  if (rank === 2) return " gr-rank-card__badge--silver";
  if (rank === 3) return " gr-rank-card__badge--bronze";
  return "";
}

function metric(label: string, value: number): string {
  return `
    <div class="gr-rank-card__metric">
      <span class="gr-rank-card__metric-label text-tertiary">${label}</span>
      <span class="gr-rank-card__metric-value text-primary">${fmt(value)}</span>
    </div>`;
}

function rankCard(row: GlobalRow, index: number): string {
  return `
    <article class="gr-rank-card border border-default bg-surface" style="--gr-row-delay:${Math.min(index, 11) * 0.045}s">
      <div class="gr-rank-card__main">
        <div class="gr-rank-card__identity">
          <span class="gr-rank-card__badge bg-subtle text-secondary${badgeTone(row.rank)}">${row.rank}</span>
          <div class="gr-rank-card__person">
            <p class="gr-rank-card__name text-primary">${esc(row.nombre)}</p>
          </div>
        </div>

        <div class="gr-rank-card__metrics">
          ${metric("Mecán.", row.mecanica)}
          ${metric("Program.", row.programacion)}
          ${metric("Comunic.", row.comunicacion)}
        </div>

        <div class="gr-rank-card__total">
          <span class="gr-rank-card__total-label text-tertiary">Total</span>
          <span class="gr-rank-card__total-value text-primary">${fmt(row.total)}</span>
        </div>
      </div>
    </article>`;
}

function emptyList(): string {
  return `<div class="gr-list__empty border border-default bg-surface text-secondary">Sin datos de ranking por ahora.</div>`;
}

export function renderGlobal(el: HTMLElement, data: Payload) {
  const rows = orderedRows(data.global);
  const signature = renderSignature(rows);

  if (el.getAttribute(RENDER_SIGNATURE_ATTR) === signature) return;
  el.setAttribute(RENDER_SIGNATURE_ATTR, signature);

  el.innerHTML = `
    <section class="gr-module gr-module--animated">
      <header class="gr-module__header">
        <h2 class="gr-module__title text-primary">RANKING</h2>
      </header>

      <section class="gr-panel" aria-label="Global ranking">
        <section class="gr-podium" aria-label="Podio top 3">
          ${podiumSlot(rows[1], 2, "silver")}
          ${podiumSlot(rows[0], 1, "gold", true)}
          ${podiumSlot(rows[2], 3, "bronze")}
        </section>

        <section class="gr-list" aria-label="Ranking completo">
          ${rows.length ? rows.map((row, index) => rankCard(row, index)).join("") : emptyList()}
        </section>
      </section>
    </section>`;
}
