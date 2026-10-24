/**
 * @file quiz-engine.js
 * @description Motor interactivo de evaluación formativa y trivia histórica sin recargas.
 * Plataforma de Divulgación Histórica - Nicaragua.
 */

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
 * Inicializa el motor de trivia dentro del contenedor especificado.
 * @param {Array<Object>} quizData - Arreglo de preguntas estructuradas desde quiz.json.
 * @param {HTMLElement} containerElement - Elemento DOM contenedor (#quiz-display).
 * @param {Function} [onReturnToHistory] - Callback para alternar a la pestaña de historia.
 */
export function initQuizEngine(quizData, containerElement, onReturnToHistory) {
  if (!Array.isArray(quizData) || quizData.length === 0) {
    console.error('[QuizEngine] Datos de preguntas inválidos o vacíos:', quizData);
    if (containerElement) {
      containerElement.innerHTML = `
        <div class="quiz-card">
          <p>No se encontraron preguntas de trivia disponibles.</p>
        </div>
      `;
    }
    return;
  }

  // Estado reactivo interno
  const state = {
    questions: quizData,
    currentIndex: 0,
    score: 0,
    isAnswered: false
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  /**
   * Renderiza la pregunta actual y sus opciones interactivas.
   */
  function renderQuestion() {
    state.isAnswered = false;
    const currentQ = state.questions[state.currentIndex];
    const totalQ = state.questions.length;
    const progressPercent = Math.round(((state.currentIndex) / totalQ) * 100);

    const card = document.createElement('div');
    card.className = 'quiz-card';

    card.innerHTML = `
      <div class="quiz-header-meta">
        <span class="quiz-step-counter">Pregunta ${state.currentIndex + 1} de ${totalQ}</span>
        <span class="quiz-score-badge">Aciertos: ${state.score}</span>
      </div>

      <div class="quiz-progress-track" role="progressbar" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso de la trivia">
        <div class="quiz-progress-bar" style="width: ${progressPercent}%;"></div>
      </div>

      <h3 class="quiz-question" id="quiz-question-title">${escapeHtml(currentQ.question)}</h3>

      <div class="quiz-options" role="group" aria-labelledby="quiz-question-title">
        ${currentQ.options.map((option, idx) => `
          <button 
            type="button" 
            class="quiz-option-btn" 
            data-index="${idx}"
            aria-label="Opción ${optionLetters[idx]}: ${escapeHtml(option)}"
          >
            <span class="quiz-option-text">${escapeHtml(option)}</span>
            <span class="quiz-option-marker">${optionLetters[idx]}</span>
          </button>
        `).join('')}
      </div>

      <div id="quiz-feedback-container" aria-live="polite"></div>
      <div id="quiz-action-container"></div>
    `;

    // Asignación de listeners a las opciones
    const optionButtons = card.querySelectorAll('.quiz-option-btn');
    optionButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selectedIndex = parseInt(btn.getAttribute('data-index'), 10);
        selectAnswer(selectedIndex, optionButtons, card);
      });
    });

    containerElement.innerHTML = '';
    containerElement.appendChild(card);
  }

  /**
   * Procesa la selección del usuario, califica y muestra retroalimentación inmediata.
   * @param {number} selectedIndex
   * @param {NodeList} optionButtons
   * @param {HTMLElement} card
   */
  function selectAnswer(selectedIndex, optionButtons, card) {
    if (state.isAnswered) return;
    state.isAnswered = true;

    const currentQ = state.questions[state.currentIndex];
    const isCorrect = selectedIndex === currentQ.correctIndex;

    if (isCorrect) {
      state.score += 1;
    }

    // Actualizar estados visuales de los botones
    optionButtons.forEach((btn) => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      btn.disabled = true;

      if (idx === currentQ.correctIndex) {
        btn.classList.add('correct');
        const marker = btn.querySelector('.quiz-option-marker');
        if (marker) marker.innerHTML = '&#10003;'; // Checkmark
      } else if (idx === selectedIndex && !isCorrect) {
        btn.classList.add('incorrect');
        const marker = btn.querySelector('.quiz-option-marker');
        if (marker) marker.innerHTML = '&#10007;'; // Cruz
      }
    });

    // Desplegar retroalimentación inmediata
    const feedbackContainer = card.querySelector('#quiz-feedback-container');
    if (feedbackContainer) {
      feedbackContainer.innerHTML = `
        <div class="quiz-feedback ${isCorrect ? 'is-correct' : 'is-incorrect'}">
          <p class="feedback-title">
            ${isCorrect ? '&#10003; ¡Respuesta Correcta!' : '&#10007; Respuesta Incorrecta'}
          </p>
          <p class="feedback-explanation">${escapeHtml(currentQ.explanation)}</p>
        </div>
      `;
    }

    // Botón de avance
    const actionContainer = card.querySelector('#quiz-action-container');
    const isLastQuestion = state.currentIndex === state.questions.length - 1;

    if (actionContainer) {
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'btn-next';
      nextBtn.innerHTML = `
        <span>${isLastQuestion ? 'Ver Resultados Finales' : 'Siguiente Pregunta'}</span>
        <span aria-hidden="true">&rarr;</span>
      `;
      nextBtn.addEventListener('click', () => {
        nextQuestion();
      });

      actionContainer.innerHTML = '';
      actionContainer.appendChild(nextBtn);
      nextBtn.focus();
    }
  }

  /**
   * Avanza a la siguiente pregunta o finaliza hacia los resultados.
   */
  function nextQuestion() {
    state.currentIndex += 1;
    if (state.currentIndex >= state.questions.length) {
      renderResults();
    } else {
      renderQuestion();
    }
  }

  /**
   * Renderiza la pantalla final de evaluación y opciones de reintento/repaso.
   */
  function renderResults() {
    const totalQ = state.questions.length;
    const score = state.score;

    let evaluationText = '';
    let resultIcon = '🏛️';

    if (score === 5) {
      evaluationText = '¡Excelente! Conoces a fondo la historia de Corinto y su patrimonio marítimo.';
      resultIcon = '🏆';
    } else if (score >= 3) {
      evaluationText = '¡Buen trabajo! Tienes sólidos conocimientos sobre los hitos históricos de la ciudad.';
      resultIcon = '⚓';
    } else {
      evaluationText = 'Te invitamos a repasar las fichas históricas para fortalecer el conocimiento de nuestro patrimonio.';
      resultIcon = '📖';
    }

    const card = document.createElement('div');
    card.className = 'quiz-card';

    card.innerHTML = `
      <div class="quiz-results">
        <div class="results-icon" aria-hidden="true">${resultIcon}</div>
        <h3 class="results-title">Evaluación de Trivia</h3>
        <p class="results-score">${score} / ${totalQ} Aciertos</p>
        <p class="results-message">${evaluationText}</p>

        <div class="results-actions">
          <button type="button" class="btn-retry" id="btn-quiz-retry">
            Reintentar Trivia
          </button>
          <button type="button" class="btn-review" id="btn-quiz-review">
            Repasar Historia
          </button>
        </div>
      </div>
    `;

    // Listener para reintentar la trivia
    const retryBtn = card.querySelector('#btn-quiz-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        state.currentIndex = 0;
        state.score = 0;
        state.isAnswered = false;
        renderQuestion();
      });
    }

    // Listener para repasar la historia
    const reviewBtn = card.querySelector('#btn-quiz-review');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => {
        if (typeof onReturnToHistory === 'function') {
          onReturnToHistory();
        }
      });
    }

    containerElement.innerHTML = '';
    containerElement.appendChild(card);
  }

  // Iniciar directamente con la primera pregunta
  renderQuestion();
}

export default initQuizEngine;
