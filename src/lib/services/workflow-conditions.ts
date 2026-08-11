/**
 * Avaliador de Condition dos Workflows. Função pura — sem I/O — pra ser testável
 * isoladamente do WorkflowEngine (que depende de banco).
 *
 * Formato suportado (MVP, ver Módulo 8):
 *   { field: "toStage", operator: "equals", value: "123" }
 *   { field: "ownerId", operator: "isNull" }
 *   { operator: "anyNull", value: ["email", "phone"] } // "field" não é usado nesse operador
 */
export interface WorkflowCondition {
  field?: string;
  operator?: "equals" | "isNull" | "notEquals" | "gte" | "lte" | "anyNull";
  value?: unknown;
}

export function evaluateCondition(condition: WorkflowCondition | null | undefined, data: Record<string, unknown>): boolean {
  if (!condition || Object.keys(condition).length === 0) return true;

  // anyNull não usa `field` — `value` é a lista de campos a checar (ex: cadastro incompleto).
  if (condition.operator === "anyNull") {
    if (!Array.isArray(condition.value)) return true; // Malformado -> não bloqueia
    return condition.value.some((f) => typeof f === "string" && (data[f] === null || data[f] === undefined));
  }

  if (!condition.field) return true; // Fallback: condição malformada não bloqueia (comportamento pré-existente)

  const fieldValue = data[condition.field];

  switch (condition.operator) {
    case "isNull":
      return fieldValue === null || fieldValue === undefined;
    case "notEquals":
      return fieldValue !== condition.value;
    case "equals":
      return fieldValue === condition.value;
    case "gte":
      return typeof fieldValue === "number" && typeof condition.value === "number" && fieldValue >= condition.value;
    case "lte":
      return typeof fieldValue === "number" && typeof condition.value === "number" && fieldValue <= condition.value;
    default:
      return true; // Operador desconhecido -> não bloqueia (mesmo fallback de antes)
  }
}
