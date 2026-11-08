export function canCreateOfferCompany(adminRoles: { role: string }[], ownerRoles: { role: string }[]) {
  return adminRoles.some(role => role.role === "admin") && ownerRoles.some(role => role.role === "employer");
}