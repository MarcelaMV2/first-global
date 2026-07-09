// ==========================================================================
//  Contrato de datos: lo que devuelve /api/data.json
// ==========================================================================

export interface GlobalRow {
  rank: number;
  nombre: string;
  grupo: string;
  mecanica: number;       // Área 1 · Robot y Pista (/40)
  programacion: number;   // Área 2 (/30)
  comunicacion: number;   // Área 3 (/30)
  total: number;          // (/100)
}

export interface ProgRow {
  rank: number;
  nombre: string;
  grupo: string;
  genero: string;
  cumpl: number;    // Cumplimiento de los retos (/15)
  modular: number;  // Modularidad y uso de funciones (/5)
  escala: number;   // Escalabilidad y organización (/5)
  efic: number;     // Eficiencia de la solución (/5)
  total: number;    // (/30)
}

export interface ComRow {
  rank: number;
  nombre: string;
  genero: string;
  video1: number;   // (/10)
  video2: number;   // (/10)
  video3: number;   // (/10)
  total: number;    // (/30)
}

export interface MecTeam {
  equipo: string;
  integrantes: string[];
  exposicion: number;  // Total exposición (/10)
  rondas: number;      // Puntos de rondas normalizados (sobre 30)
  total: number;       // Total Mecánica (/40)
}

export interface AlianzaEquipo {
  letra: string;           // "A", "D", "F"
  integrantes: string[];   // nombres derivados del roster (vacío si aún no asignado)
}

export interface Alianza {
  equipos: AlianzaEquipo[];
  score: number;           // Score final de la alianza
  totalRegional: number;   // "Alianza Regional" (Total Rojo / Azul)
  buddy: number;           // Puntos Buddy
  escalada: string[];      // Zonas de escalada de cada equipo
}

export interface Ronda {
  n: number;
  estado: string;          // "Finalizada" | "En curso" | ""
  descansa: string;        // equipo que descansa
  rojo: Alianza;
  azul: Alianza;
  wildfireExt: number;     // Extintor global
  robotsZona3: number;
  coopBonus: number;       // Coopertition
  hasData: boolean;        // false = card "pendiente"
}

export interface Payload {
  updatedAt: string;
  global: GlobalRow[];
  ingenieria: {
    rondas: Ronda[];
    tabla: MecTeam[];
  };
  programacion: ProgRow[];
  comunicacion: ComRow[];
}
