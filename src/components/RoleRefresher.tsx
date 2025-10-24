"use client";
import { useEffect } from "react";

export default function RoleRefresher() {
  useEffect(() => {
    const roleCookie = document.cookie
      .split("; ")
      .find((s) => s.startsWith("role="));

    if (!roleCookie) {
      fetch("/api/session/refresh-role").catch(() => {});
    }
  }, []);

  return null;
}
