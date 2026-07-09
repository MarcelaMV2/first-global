// Polling: pide /api/data.json de inmediato y luego cada REFRESH_MS.
// Preserva el estado abierto/cerrado de los <details> entre repintados.
import type { Payload } from "../lib/types";
import { REFRESH_MS } from "../lib/config";

function setStatus(ok: boolean) {
  const dot = document.getElementById("live-dot");
  if (dot)
    dot.className = `h-2 w-2 rounded-full ${ok ? "bg-green-500 animate-pulse" : "bg-red-500"}`;
}

export function startPolling(render: (d: Payload) => void) {
  let id: number | undefined;

  async function tick() {
    try {
      const res = await fetch("/api/data.json", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && !data.error) {
        render(data as Payload);
        setStatus(true);
      } else {
        setStatus(false);
      }
    } catch {
      setStatus(false);
    }
  }

  function start() {
    stop();
    id = window.setInterval(tick, REFRESH_MS);
  }

  function stop() {
    if (id !== undefined) {
      window.clearInterval(id);
      id = undefined;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      tick(); // trae dato fresco al volver a la pestaña
      start();
    }
  });

  tick();
  start();
  window.addEventListener("beforeunload", stop);
}
