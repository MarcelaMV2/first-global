// ==========================================================================
//  Construye el Payload normalizado a partir de las pestañas del Sheet.
//  Regla: se confía en los totales ya calculados por el Sheet; aquí solo
//  se ordena, se rankea y se agrupa.
// ==========================================================================

import { fetchTab, num } from "./gviz";
import { TABS, TOTAL_RONDAS } from "./config";
import type {
  Payload, GlobalRow, ProgRow, ComRow, MecTeam, Ronda, Alianza,
} from "./types";

const clean = (v: string | undefined) => (v ?? "").trim();
const norm = (letra: string) => letra.replace(/equipo/i, "").trim().toUpperCase();

// ---- Roster (Area #1 - Ingeniería): col A = nombre, col B = grupo ---------
class Roster {
  private byName = new Map<string, string>();
  private byTeam = new Map<string, string[]>();

  constructor(rows: string[][]) {
    for (const r of rows) {
      const nombre = clean(r[0]);
      const grupo = norm(clean(r[1]));
      if (!nombre || !grupo) continue;
      this.byName.set(nombre, grupo);
      if (!this.byTeam.has(grupo)) this.byTeam.set(grupo, []);
      this.byTeam.get(grupo)!.push(nombre);
    }
  }

  team(nombre: string): string {
    return this.byName.get(nombre.trim()) ?? "";
  }

  members(equipo: string): string[] {
    return this.byTeam.get(norm(equipo)) ?? [];
  }
}

// ---- Global (Vista Centralizada) -----------------------------------------
// cols: 0 Nombre | 1 Área1(/40) | 2 Área2(/30) | 3 Área3(/30) | 4 Total(/100)
function buildGlobal(rows: string[][], roster: Roster): GlobalRow[] {
  return rows
    .filter((r) => clean(r[0]))
    .map((r) => ({
      rank: 0,
      nombre: clean(r[0]),
      grupo: roster.team(clean(r[0])),
      mecanica: num(r[1]),
      programacion: num(r[2]),
      comunicacion: num(r[3]),
      total: num(r[4]),
    }))
    .sort((a, b) => b.total - a.total)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

// ---- Programación (Area #2) ----------------------------------------------
// cols: 0 Nombre | 1 Género | 2 Cumpl(/15) | 3 Modular(/5) | 4 Escala(/5) | 5 Efic(/5) | 6 Total(/30)
function buildProgramacion(rows: string[][], roster: Roster): ProgRow[] {
  return rows
    .filter((r) => clean(r[0]))
    .map((r) => ({
      rank: 0,
      nombre: clean(r[0]),
      grupo: roster.team(clean(r[0])),
      genero: clean(r[1]),
      cumpl: num(r[2]),
      modular: num(r[3]),
      escala: num(r[4]),
      efic: num(r[5]),
      total: num(r[6]),
    }))
    .sort((a, b) => b.total - a.total)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

// ---- Comunicación (Area #3) ----------------------------------------------
// cols: 0 Nombre | 1 Género | 7 Total V1 | 13 Total V2 | 19 Total V3 | 20 Total área(/30)
function buildComunicacion(rows: string[][]): ComRow[] {
  return rows
    .filter((r) => clean(r[0]))
    .map((r) => ({
      rank: 0,
      nombre: clean(r[0]),
      genero: clean(r[1]),
      video1: num(r[7]),
      video2: num(r[13]),
      video3: num(r[19]),
      total: num(r[20]),
    }))
    .sort((a, b) => b.total - a.total)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

// ---- Tabla Mecánica (Exposición Mecánica) --------------------------------
// cols: 0 Equipo | 7 Total exposición(/10) | 9 sobre 30 (rondas) | 10 Total Mecánica(/40)
function buildMecanica(rows: string[][], roster: Roster): MecTeam[] {
  return rows
    .filter((r) => clean(r[0]))
    .map((r) => ({
      equipo: clean(r[0]),
      integrantes: roster.members(clean(r[0])),
      exposicion: num(r[7]),
      rondas: num(r[9]),
      total: num(r[10]),
    }));
}

// ---- Rondas Oficiales -----------------------------------------------------
// Se generan siempre TOTAL_RONDAS cards; cada una toma datos si su fila existe.
// cols (letra→idx): A0 N° | B1 Estado | C2 Descansa
//   ROJO  D3 E4 F5 equipos | H7 I8 J9 escalada | O14 Puntos Buddy | P15 Total Rojo
//   AZUL  Q16 R17 S18 equipos | U20 V21 W22 escalada | AB27 Puntos Buddy | AC28 Total Azul
//   GLOBAL AD29 Wildfire Ext | AE30 Robots Zona3 | AF31 Coop Bonus
//   RESULTADO AG32 Score Rojo | AH33 Score Azul
function alianza(
  r: string[],
  roster: Roster,
  base: { eq: number; esc: number; buddy: number; total: number; score: number }
): Alianza {
  const letras = [r[base.eq], r[base.eq + 1], r[base.eq + 2]].map(clean).filter(Boolean);
  return {
    equipos: letras.map((letra) => ({ letra: norm(letra), integrantes: roster.members(letra) })),
    score: num(r[base.score]),
    totalRegional: num(r[base.total]),
    buddy: num(r[base.buddy]),
    escalada: [r[base.esc], r[base.esc + 1], r[base.esc + 2]].map(clean),
  };
}

function buildRondas(rows: string[][], roster: Roster): Ronda[] {
  const byN = new Map<number, string[]>();
  for (const r of rows) {
    const n = parseInt(clean(r[0]), 10);
    if (n >= 1 && n <= TOTAL_RONDAS) byN.set(n, r);
  }

  const out: Ronda[] = [];
  for (let n = 1; n <= TOTAL_RONDAS; n++) {
    const r = byN.get(n);
    if (!r) {
      out.push(emptyRonda(n));
      continue;
    }
    const rojo = alianza(r, roster, { eq: 3, esc: 7, buddy: 14, total: 15, score: 32 });
    const azul = alianza(r, roster, { eq: 16, esc: 20, buddy: 27, total: 28, score: 33 });
    out.push({
      n,
      estado: clean(r[1]),
      descansa: clean(r[2]),
      rojo,
      azul,
      wildfireExt: num(r[29]),
      robotsZona3: num(r[30]),
      coopBonus: num(r[31]),
      hasData: rojo.equipos.length > 0 || azul.equipos.length > 0,
    });
  }
  return out;
}

function emptyRonda(n: number): Ronda {
  const vacia = (): Alianza => ({ equipos: [], score: 0, totalRegional: 0, buddy: 0, escalada: [] });
  return { n, estado: "", descansa: "", rojo: vacia(), azul: vacia(), wildfireExt: 0, robotsZona3: 0, coopBonus: 0, hasData: false };
}

// ---- Ensamblado -----------------------------------------------------------
export async function buildPayload(): Promise<Payload> {
  const [global, rondas, mecanica, ingenieria, programacion, comunicacion] = await Promise.all([
    fetchTab(TABS.global),
    fetchTab(TABS.rondas),
    fetchTab(TABS.mecanica),
    fetchTab(TABS.ingenieria),
    fetchTab(TABS.programacion),
    fetchTab(TABS.comunicacion),
  ]);

  const roster = new Roster(ingenieria);

  return {
    updatedAt: new Date().toISOString(),
    global: buildGlobal(global, roster),
    ingenieria: {
      rondas: buildRondas(rondas, roster),
      tabla: buildMecanica(mecanica, roster),
    },
    programacion: buildProgramacion(programacion, roster),
    comunicacion: buildComunicacion(comunicacion),
  };
}
