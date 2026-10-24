/**
 * @file main.js
 * @description Orquestador principal de la plataforma Nicaragua Histórica.
 * Gestiona el ciclo de vida de la aplicación, navegación accesible por pestañas,
 * carga asíncrona de datos desacoplados y control de errores.
 */

import { loadManifest, loadCityHistory, loadCityQuiz } from './services/data-service.js';
import { renderHistorySection } from './modules/history-viewer.js';
import { initQuizEngine } from './modules/quiz-engine.js';

// Elementos clave del DOM
let tabHistory;
let tabQuiz;
let historySection;
let quizSection;
let historyDisplay;
let moduleTabs;
let quizDisplay;
let citySubtitle;

/**
 * Alterna la vista activa entre las secciones de Historia y Trivia con accesibilidad WAI-ARIA.
 * @param {'history' | 'quiz'} targetTab - Identificador de la pestaña de destino.
 */
function switchTab(targetTab) {
  const isHistory = targetTab === 'history';

  if (tabHistory && tabQuiz && historySection && quizSection) {
    // Actualizar clases y atributos de los botones de pestañas
    tabHistory.classList.toggle('active', isHistory);
    tabHistory.setAttribute('aria-selected', isHistory ? 'true' : 'false');

    tabQuiz.classList.toggle('active', !isHistory);
    tabQuiz.setAttribute('aria-selected', !isHistory ? 'true' : 'false');

    // Alternar visibilidad de las secciones
    if (isHistory) {
      historySection.classList.remove('hidden');
      quizSection.classList.add('hidden');
    } else {
      historySection.classList.add('hidden');
      quizSection.classList.remove('hidden');
    }

    // Desplazamiento suave a la parte superior del contenido
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Inicializa los eventos de navegación por pestañas en el header.
 */
function setupNavigationEvents() {
  if (tabHistory) {
    tabHistory.addEventListener('click', () => switchTab('history'));
  }

  if (tabQuiz) {
    tabQuiz.addEventListener('click', () => switchTab('quiz'));
  }
}

/**
 * Función principal asíncrona de arranque y orquestación.
 */
async function bootstrap() {
  // Inicializar referencias al DOM
  tabHistory = document.getElementById('tab-history');
  tabQuiz = document.getElementById('tab-quiz');
  historySection = document.getElementById('history-section');
  quizSection = document.getElementById('quiz-section');
  historyDisplay = document.getElementById('history-display');
  moduleTabs = document.getElementById('module-tabs');
  quizDisplay = document.getElementById('quiz-display');
  citySubtitle = document.getElementById('city-subtitle');

  setupNavigationEvents();

  // Indicador visual temporal de carga
  if (historyDisplay) {
    historyDisplay.innerHTML = `
      <div class="history-card" style="text-align: center; padding: 3rem 1.5rem;" role="status">
        <p style="font-size: 1.15rem; font-weight: 600; color: var(--color-primary); margin: 0;">
          Cargando patrimonio histórico...
        </p>
      </div>
    `;
  }

  try {
    // 1. Cargar el manifiesto general de municipios
    const manifest = await loadManifest();
    const defaultCityId = manifest.defaultCity || 'corinto';

    // 2. Cargar en paralelo la historia y la trivia del municipio activo
    const [historyData, quizData] = await Promise.all([
      loadCityHistory(defaultCityId),
      loadCityQuiz(defaultCityId)
    ]);

    // 3. Actualizar el subtítulo institucional si existe en la metadata
    const cityMeta = manifest.cities?.find((c) => c.id === defaultCityId);
    if (cityMeta && citySubtitle) {
      citySubtitle.textContent = cityMeta.heroSubtitle
        ? `${cityMeta.name}: ${cityMeta.heroSubtitle}`
        : cityMeta.name;
    }

    // 4. Inicializar visor de fichas didácticas de historia
    if (historyDisplay && moduleTabs) {
      renderHistorySection(historyData, historyDisplay, moduleTabs);
    }

    // 5. Inicializar motor de trivia con callback de retorno a historia
    if (quizDisplay) {
      initQuizEngine(quizData, quizDisplay, () => switchTab('history'));
    }

  } catch (error) {
    console.error('[Bootstrap] Error crítico al inicializar la plataforma:', error);

    // Mensaje visual amigable para el usuario en caso de falla
    if (historyDisplay) {
      historyDisplay.innerHTML = `
        <div class="history-card" style="text-align: center; padding: 2.5rem 1.5rem; border-left: 4px solid var(--color-danger);" role="alert">
          <h3 style="color: var(--color-danger); margin-bottom: 0.75rem;">Aviso de Conexión</h3>
          <p style="color: var(--color-text); font-size: 1rem; max-width: 500px; margin: 0 auto 1.25rem;">
            No se pudo cargar la información histórica. Por favor, recarga la página o verifica la conexión.
          </p>
          <button 
            type="button" 
            onclick="window.location.reload()" 
            style="padding: 0.65rem 1.5rem; background-color: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer;"
          >
            Reintentar Carga
          </button>
        </div>
      `;
    }
  }
}

// Ejecución del arranque al estar listo el DOM
document.addEventListener('DOMContentLoaded', () => {
  bootstrap();
});
