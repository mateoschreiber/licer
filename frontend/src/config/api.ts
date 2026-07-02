export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ??
  `${window.location.origin}/api/v1`;
