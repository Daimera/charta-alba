/**
 * Ownership enforcement helpers.
 * Use assertOwnership() in every route that reads or mutates a resource
 * that belongs to a specific user.
 */

/**
 * Throws a 403 Response if resourceUserId !== sessionUserId.
 * Usage:
 *   const err = assertOwnership(resource.userId, session.user.id);
 *   if (err) return err;
 */
export function assertOwnership(
  resourceUserId: string | null | undefined,
  sessionUserId: string,
): Response | null {
  if (!resourceUserId || resourceUserId !== sessionUserId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * Assert that the requesting user is the owner OR has the given role.
 * Useful for admin overrides.
 */
export function assertOwnershipOrRole(
  resourceUserId: string | null | undefined,
  sessionUserId: string,
  sessionRole: string | undefined,
  allowedRoles: string[],
): Response | null {
  if (sessionRole && allowedRoles.includes(sessionRole)) return null;
  return assertOwnership(resourceUserId, sessionUserId);
}
