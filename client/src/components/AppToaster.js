"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "@/context/ThemeContext";

/**
 * react-toastify needs exactly one <ToastContainer /> mounted to catch
 * toast(...) calls. It used to live inside page.js, which meant a toast
 * fired while the user was on /devlogs (e.g. a peer connecting) had nowhere
 * to render and was silently dropped. Mounting it here, in the layout,
 * keeps it present on every route.
 */
export function AppToaster() {
  const { theme } = useTheme();
  return <ToastContainer position="top-center" theme={theme.mode === "light" ? "light" : "dark"} />;
}
