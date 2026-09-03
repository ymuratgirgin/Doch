"use client";

import { useEffect } from "react";

const INTERVAL_MS = 30_000;

export default function ActivityHeartbeat() {
  useEffect(() => {
    function ping() {
      if (document.visibilityState !== "visible") return;
      fetch("/api/activity/heartbeat", { method: "POST" }).catch(() => {});
    }
    ping();
    const id = setInterval(ping, INTERVAL_MS);
    document.addEventListener("visibilitychange", ping);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  return null;
}
