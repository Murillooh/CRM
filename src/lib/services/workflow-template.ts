/**
 * Interpolação simples de template pros títulos de Task/Activity gerados por automação
 * (ex: "Completar cadastro de {{name}}"). Função pura.
 */
export function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = data[key];
    return value != null ? String(value) : "";
  });
}
