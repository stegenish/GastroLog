export function usesLocalStorage() {
  return process.env.NODE_ENV === "development" && !process.env.DATABASE_URL;
}
