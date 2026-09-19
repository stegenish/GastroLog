const rememberedPasswordKey = "gastrolog:remembered-password";

export function loadRememberedPassword() {
  try {
    return window.localStorage.getItem(rememberedPasswordKey) ?? "";
  } catch {
    return "";
  }
}

export function saveRememberedPassword(password: string) {
  try {
    window.localStorage.setItem(rememberedPasswordKey, password);
  } catch {
    // Storage can be unavailable; login should still work normally.
  }
}

export function clearRememberedPassword() {
  try {
    window.localStorage.removeItem(rememberedPasswordKey);
  } catch {
    // Storage can be unavailable; login should still work normally.
  }
}
