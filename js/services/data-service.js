/**
 * @file data-service.js
 * @description Servicio desacoplado en ES6 para la carga asíncrona de datos municipales vía Fetch API.
 * Diseñado para compatibilidad nativa en GitHub Pages y servidores estáticos sin dependencias.
 */

/**
 * Función auxiliar interna para realizar peticiones HTTP seguras y parsear JSON.
 * @param {string} endpoint - Ruta relativa o URL del recurso JSON.
 * @returns {Promise<any>}
 */
async function fetchJson(endpoint) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorMsg = `[DataService] Error HTTP ${response.status} (${response.statusText}) al cargar: "${endpoint}"`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    console.error(`[DataService] Falla de red o procesamiento en "${endpoint}":`, error.message);
    throw error;
  }
}

/**
 * Carga el registro general de municipios habilitados en la plataforma.
 * @returns {Promise<{ defaultCity: string, cities: Array<{ id: string, name: string, department: string, heroSubtitle: string, enabled: boolean }> }>}
 */
export async function loadManifest() {
  return await fetchJson('data/manifest.json');
}

/**
 * Carga el archivo histórico estructurado, metadatos y fuentes de un municipio específico.
 * @param {string} cityId - Identificador único del municipio (ej: 'corinto').
 * @returns {Promise<{ cityId: string, cityName: string, department: string, country: string, modules: Array<any> }>}
 */
export async function loadCityHistory(cityId) {
  if (!cityId || typeof cityId !== 'string') {
    const errorMsg = `[DataService] El identificador de municipio es inválido: "${cityId}"`;
    console.error(errorMsg);
    throw new TypeError(errorMsg);
  }
  return await fetchJson(`data/cities/${encodeURIComponent(cityId)}/history.json`);
}

/**
 * Carga el banco de preguntas de trivia correspondiente a un municipio.
 * @param {string} cityId - Identificador único del municipio (ej: 'corinto').
 * @returns {Promise<Array<{ id: number, question: string, options: string[], correctIndex: number, explanation: string, sourceModuleId: string }>>}
 */
export async function loadCityQuiz(cityId) {
  if (!cityId || typeof cityId !== 'string') {
    const errorMsg = `[DataService] El identificador de municipio es inválido: "${cityId}"`;
    console.error(errorMsg);
    throw new TypeError(errorMsg);
  }
  return await fetchJson(`data/cities/${encodeURIComponent(cityId)}/quiz.json`);
}

export default {
  loadManifest,
  loadCityHistory,
  loadCityQuiz
};
