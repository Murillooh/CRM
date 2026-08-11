export type Role = "OWNER" | "ADMIN" | "MANAGER" | "SALES_REP" | "VIEWER";
export type Action = "create" | "read" | "update" | "delete";
export type Resource = "Company" | "Contact" | "Deal" | "Task" | "Settings" | "Billing";

export class AuthorizationError extends Error {
  constructor(message = "403 Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Retorna `true` se a role tiver permissão para realizar a ação no recurso.
 * O Ownership (Sales Rep) só dá permissão a nível lógico; 
 * é a query no banco de dados que impõe o filtro (ownerId = userId).
 */
export function can(role: Role, action: Action, resource: Resource): boolean {
  if (role === "OWNER") return true;

  if (role === "ADMIN") {
    if (resource === "Billing") return false;
    return true;
  }

  if (role === "MANAGER") {
    if (resource === "Settings" || resource === "Billing") return false;
    return true;
  }

  if (role === "SALES_REP") {
    if (resource === "Settings" || resource === "Billing") return false;
    if (action === "delete") return false; // Sales reps não deletam nada (apenas admin/manager ou owner)
    // Para Update e Read, é permitido, mas a query do DB deve filtrar `ownerId: userId`
    return true;
  }

  if (role === "VIEWER") {
    if (action !== "read") return false;
    if (resource === "Settings" || resource === "Billing") return false;
    return true;
  }

  return false;
}

/**
 * Helper usado nos Server Actions. 
 * Lança um erro (403) caso o usuário não possua acesso.
 */
export function requirePermission(role: Role, action: Action, resource: Resource) {
  if (!can(role, action, resource)) {
    throw new AuthorizationError(`Access denied: Cannot ${action} ${resource} as ${role}`);
  }
}
