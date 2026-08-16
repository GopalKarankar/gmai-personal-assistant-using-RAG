const getRuntimeEnv = (key, fallback = "") => {
  if (typeof window !== "undefined" && window.__APP_CONFIG__?.[key] != null) {
    const value = window.__APP_CONFIG__[key];
    return value === "" ? fallback : value;
  }

  return import.meta.env?.[key] ?? fallback;
};

export { getRuntimeEnv };
