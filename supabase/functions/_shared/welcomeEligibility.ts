export const WELCOME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isWelcomeEligible(createdAt: string, now = new Date()): boolean {
  const signedUp = new Date(createdAt).getTime();
  const age = now.getTime() - signedUp;
  return Number.isFinite(signedUp) && age >= 0 && age <= WELCOME_WINDOW_MS;
}
