/**
 * @file history-viewer.js
 * @description Módulo de visualización editorial para fichas didácticas históricas y navegación por ejes.
 * Plataforma de Divulgación Histórica - Nicaragua.
 */

/**
 * Plantilla de icono náutico decorativo en SVG para el placeholder de imagen
 * @returns {string} Código SVG
 */
function getPlaceholderSvg() {
  return `
    <svg class="media-fallback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="2" x2="12" y2="22"></line>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <circle cx="12" cy="12" r="3"></circle>
      <path d="m4.93 4.93 4.24 4.24"></path>
      <path d="m14.83 14.83 4.24 4.24"></path>
      <path d="m14.83 9.17 4.24-4.24"></path>
      <path d="m4.93 19.07 4.24-4.24"></path>
    </svg>
  `;
}

/**
 * Genera el marcado HTML para la lista de fuentes consultadas.
 * @param {Array<{ title: string, author: string, year: string, type: string }>} sources
 * @returns {string} Marcado HTML
 */
function renderSourcesHtml(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return '';
  }

  const itemsHtml = sources.map((source) => `
    <li class="source-item">
      <span class="source-title">${escapeHtml(source.title)}</span>
      <span class="source-meta">${escapeHtml(source.author)} (${escapeHtml(source.year)})</span>
      <span class="source-badge">${escapeHtml(source.type || 'Referencia')}</span>
    </li>
  `).join('');

  return `
    <div class="sources-container">
      <details class="sources-details">
        <summary class="sources-summary">
          <span>Fuentes Historiográficas y Archivos Consultados (${sources.length})</span>
        </summary>
        <ul class="sources-list">
          ${itemsHtml}
        </ul>
      </details>
    </div>
  `;
}

/**
 * Escapa caracteres HTML para prevenir inyecciones.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renderiza la sección de historia municipal con sus pestañas temáticas y fichas detalladas.
 * @param {Object} historyData - Objeto que contiene el arreglo de módulos temáticos.
 * @param {HTMLElement} containerElement - Contenedor DOM para la ficha activa (#history-display).
 * @param {HTMLElement} tabsNavElement - Contenedor DOM para los botones de pestañas (#module-tabs).
 */
export function renderHistorySection(historyData, containerElement, tabsNavElement) {
  if (!historyData || !Array.isArray(historyData.modules) || historyData.modules.length === 0) {
    console.error('[HistoryViewer] Datos de historia inválidos o sin módulos:', historyData);
    if (containerElement) {
      containerElement.innerHTML = `
        <div class="history-card">
          <p class="history-paragraphs">No fue posible cargar el contenido histórico en este momento.</p>
        </div>
      `;
    }
    return;
  }

  const { modules } = historyData;

  // 1. Limpiar y generar la barra de botones de navegación temática
  tabsNavElement.innerHTML = '';
  tabsNavElement.setAttribute('role', 'tablist');

  const tabButtons = [];

  modules.forEach((module, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `module-tab-btn ${index === 0 ? 'active' : ''}`;
    button.id = `tab-mod-${module.id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    button.setAttribute('aria-controls', 'history-display');
    button.innerHTML = `
      <span>${escapeHtml(module.title)}</span>
      <span class="tab-btn-period">(${escapeHtml(module.period)})</span>
    `;

    button.addEventListener('click', () => {
      showModule(module.id);
    });

    tabsNavElement.appendChild(button);
    tabButtons.push({ id: module.id, element: button });
  });

  /**
   * Muestra la ficha correspondiente al id de módulo indicado.
   * @param {string} moduleId
   */
  function showModule(moduleId) {
    const selectedModule = modules.find((m) => m.id === moduleId);
    if (!selectedModule) return;

    // Actualizar estado activo en los botones de navegación
    tabButtons.forEach(({ id, element }) => {
      const isActive = id === moduleId;
      element.classList.toggle('active', isActive);
      element.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Párrafos de lectura
    const paragraphsHtml = (selectedModule.content || [])
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join('');

    // Fuentes consultadas
    const sourcesHtml = renderSourcesHtml(selectedModule.sources);

    // Contenedor multimedia
    const media = selectedModule.media || {};
    const mediaSrc = escapeHtml(media.src || '');
    const mediaAlt = escapeHtml(media.alt || selectedModule.title);
    const mediaCaption = escapeHtml(media.caption || '');
    const mediaCredit = escapeHtml(media.credit || 'Archivo Patrimonial');

    // Construcción del DOM de la tarjeta
    const cardElement = document.createElement('article');
    cardElement.className = 'history-card fade-in';
    cardElement.id = `history-card-${selectedModule.id}`;

    cardElement.innerHTML = `
      <!-- Columna Multimedia -->
      <div class="history-media-col">
        <div class="media-frame" id="media-frame-${selectedModule.id}">
          <img 
            src="${mediaSrc}" 
            alt="${mediaAlt}" 
            loading="lazy"
            id="img-${selectedModule.id}"
          />
        </div>
        ${mediaCaption ? `<p class="media-caption">${mediaCaption} ${mediaCredit ? `<span class="media-credit">${mediaCredit}</span>` : ''}</p>` : ''}
      </div>

      <!-- Columna de Contenido Editorial -->
      <div class="history-content-col">
        <div class="period-badge">
          <span>Época: ${escapeHtml(selectedModule.period)}</span>
        </div>

        <h2 class="history-card-title">${escapeHtml(selectedModule.title)}</h2>

        <div class="history-paragraphs">
          ${paragraphsHtml}
        </div>

        ${selectedModule.keyFact ? `
          <div class="key-fact-box" role="note" aria-label="Dato Clave Histórico">
            <span class="key-fact-label">&#9733; Dato Clave</span>
            <span class="key-fact-text">${escapeHtml(selectedModule.keyFact)}</span>
          </div>
        ` : ''}

        ${sourcesHtml}
      </div>
    `;

    // Gestión del fallback visual en caso de que la imagen aún no exista físicamente en assets
    const imgElement = cardElement.querySelector(`#img-${selectedModule.id}`);
    const mediaFrame = cardElement.querySelector(`#media-frame-${selectedModule.id}`);

    if (imgElement && mediaFrame) {
      imgElement.addEventListener('error', () => {
        mediaFrame.innerHTML = `
          <div class="media-fallback" role="img" aria-label="${mediaAlt}">
            ${getPlaceholderSvg()}
            <p class="media-fallback-title">${escapeHtml(selectedModule.title)}</p>
            <p class="media-fallback-desc">${mediaAlt}</p>
          </div>
        `;
      });
    }

    // Renderizar en el contenedor principal
    containerElement.innerHTML = '';
    containerElement.appendChild(cardElement);
  }

  // 2. Activar por defecto el primer módulo al inicializar
  showModule(modules[0].id);
}

export default renderHistorySection;
