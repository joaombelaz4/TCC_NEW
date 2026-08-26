/**
 * Limiares padrão usados para classificar uma medição ao ser registrada.
 * Espelham os valores padrão de app_settings (ph_min/ph_max/cl_min/cl_max).
 * Mantidos como constantes simples, no nível de um TCC — se no futuro
 * as rotas de /api/settings passarem a alterar esses limites de fato,
 * este módulo pode ler de app_settings em vez de constantes fixas.
 */
export const PH_MIN = 7.2;
export const PH_MAX = 7.8;
export const CL_MIN = 0.5;
export const CL_MAX = 3.0;

export function phStatus(v) {
  if (v < PH_MIN - 0.5 || v > PH_MAX + 0.5) return 'danger';
  if (v < PH_MIN || v > PH_MAX) return 'warn';
  return 'ok';
}

export function clStatus(v) {
  if (v < CL_MIN - 0.2 || v > CL_MAX + 0.5) return 'danger';
  if (v < CL_MIN || v > CL_MAX) return 'warn';
  return 'ok';
}
