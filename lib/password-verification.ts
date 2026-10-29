/**
 * Helpers for the "confirm your email before changing password" gate.
 *
 * A short-lived httpOnly cookie marks the account as verified so the password
 * form can't be reached directly — visiting /account/profile/password/change
 * without it bounces back to the verification step.
 */
export const PASSWORD_VERIFICATION_COOKIE = "lp_password_verified";

/** How long the verification stays valid (seconds). */
export const PASSWORD_VERIFICATION_MAX_AGE = 60 * 10;

/** "karan.mobile@example.com" → "ka•••••@example.com" */
export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(3, local.length - 2))}@${domain}`;
}
