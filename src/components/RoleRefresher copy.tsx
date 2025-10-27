"use client";
import * as React from "react";
export default function RoleRefresher() {
  React.useEffect(() => {
    const hasRole = document.cookie.split("; ").some(s => s.startsWith("role="));
    if (!hasRole) fetch("/api/session/refresh-role").catch(() => {});
  }, []);
  return null;
}
