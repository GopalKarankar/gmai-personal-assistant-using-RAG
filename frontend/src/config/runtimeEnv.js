const getRuntimeEnv = (key, fallback = "") => {
  if (typeof window !== "undefined" && window.__APP_CONFIG__?.[key]) {
    return window.__APP_CONFIG__[key];
  }

  return import.meta.env?.[key] ?? fallback;
};

export { getRuntimeEnv };
