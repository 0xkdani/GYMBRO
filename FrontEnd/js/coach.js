(() => {
  function initGestionRutinaCoach() {
    // 1. Catálogo de ejercicios modal (Código original del compañero)
    const catalogoModalEl = document.getElementById('catalogoEjerciciosModal');
    const formModalEl = document.getElementById('formEjercicioModal');
    if (!catalogoModalEl || !formModalEl || typeof bootstrap === 'undefined') return;

    const formModal = new bootstrap.Modal(formModalEl);
    const catalogoModal = new bootstrap.Modal(catalogoModalEl);

    const cardsContainer = document.getElementById('catalogoCards');
    const form = document.getElementById('formEjercicio');
    const editIndexInput = document.getElementById('exerciseEditIndex');
    const currentHasVideoInput = document.getElementById('exerciseCurrentHasVideo');
    const nameInput = document.getElementById('exerciseName');
    const groupInput = document.getElementById('exerciseGroup');
    const videoFileInput = document.getElementById('exerciseVideoFile');
    const formTitle = document.getElementById('formEjercicioLabel');
    const registerBtn = document.getElementById('btnRegistrarEjercicio');
    if (!cardsContainer || !form || !editIndexInput || !currentHasVideoInput || !nameInput || !groupInput || !videoFileInput || !formTitle || !registerBtn) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';

    function readCardData(cardEl) {
      const name = cardEl.querySelector('h3').textContent.trim();
      const group = cardEl.querySelector('strong').textContent.trim();
      const hasVideo = cardEl.querySelector('.catalog-video-ok') ? 'si' : 'no';
      return { name, group, hasVideo };
    }

    function fillCard(cardColEl, data) {
      const card = cardColEl.querySelector('.catalog-card');
      card.querySelector('h3').textContent = data.name;
      card.querySelector('strong').textContent = data.group;
      const videoLine = card.querySelector('.catalog-video-ok, .catalog-video-miss');
      if (data.hasVideo === 'si') {
        videoLine.className = 'catalog-video-ok mb-0';
        videoLine.innerHTML = '<i class="bi bi-camera-video me-2"></i>Video disponible';
      } else {
        videoLine.className = 'catalog-video-miss mb-0';
        videoLine.innerHTML = '<i class="bi bi-camera-video-off me-2"></i>Sin video';
      }
    }

    function createCard(data) {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-xl-4 catalog-item';
      col.innerHTML = `
        <article class="catalog-card p-4 h-100">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
            <h3 class="h4 mb-0"></h3>
            <button class="btn coach-icon-btn coach-icon-btn-muted" title="Editar ejercicio" data-edit-exercise><i class="bi bi-pencil-square"></i></button>
          </div>
          <p class="coach-text-soft mb-2">Grupo muscular: <strong class="text-white"></strong></p>
          <p class="mb-0"></p>
        </article>
      `;
      fillCard(col, data);
      return col;
    }

    function openFormModal() {
      const onHidden = () => {
        catalogoModalEl.removeEventListener('hidden.bs.modal', onHidden);
        formModal.show();
      };
      catalogoModalEl.addEventListener('hidden.bs.modal', onHidden);
      catalogoModal.hide();
    }

    registerBtn.addEventListener('click', () => {
      form.reset();
      editIndexInput.value = '-1';
      currentHasVideoInput.value = 'no';
      videoFileInput.value = '';
      formTitle.textContent = 'Registrar ejercicio';
      openFormModal();
    });

    cardsContainer.addEventListener('click', (event) => {
      const editBtn = event.target.closest('[data-edit-exercise]');
      if (!editBtn) return;

      const cardCol = editBtn.closest('.catalog-item');
      const cards = Array.from(cardsContainer.querySelectorAll('.catalog-item'));
      const index = cards.indexOf(cardCol);
      const data = readCardData(cardCol);

      editIndexInput.value = index;
      nameInput.value = data.name;
      groupInput.value = data.group;
      currentHasVideoInput.value = data.hasVideo;
      videoFileInput.value = '';
      formTitle.textContent = 'Editar ejercicio';
      openFormModal();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const uploadedFile = videoFileInput.files[0];
      const hasVideo = uploadedFile ? 'si' : currentHasVideoInput.value;
      const data = {
        name: nameInput.value.trim(),
        group: groupInput.value,
        hasVideo
      };
      if (!data.name || !data.group) return;

      const editIndex = Number(editIndexInput.value);
      const cards = Array.from(cardsContainer.querySelectorAll('.catalog-item'));
      if (editIndex >= 0 && cards[editIndex]) {
        fillCard(cards[editIndex], data);
      } else {
        cardsContainer.appendChild(createCard(data));
      }

      formModal.hide();
      catalogoModal.show();
    });

    // 2. Cargar y gestionar listado de rutinas dinámicamente
    const rutinasContainer = document.querySelector('main.col > section.gap-3');
    if (!rutinasContainer) return;

    async function cargarRutinas() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/rutinas`);
        if (!response.ok) throw new Error('Error al obtener rutinas');
        const rutinas = await response.json();

        rutinasContainer.innerHTML = '';

        if (rutinas.length === 0) {
          rutinasContainer.innerHTML = `
            <div class="text-center p-5 coach-card">
              <i class="bi bi-clipboard-x display-4 text-muted mb-3 d-block"></i>
              <p class="coach-text-soft">No tienes ninguna rutina creada todavía.</p>
              <a class="btn coach-btn-accent mt-2" href="CrearRutina-coach.html">Crear mi primera rutina</a>
            </div>
          `;
          return;
        }

        rutinas.forEach(rutina => {
          const card = document.createElement('article');
          card.className = 'coach-card p-4';
          
          const fechaStr = new Date(rutina.fechaCreacion).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });

          card.innerHTML = `
            <div class="d-flex flex-column flex-xl-row justify-content-between gap-3">
              <div>
                <h2 class="h3 mb-3">${rutina.nombreRutina}</h2>
                <div class="d-flex flex-wrap gap-2 mb-3">
                  <span class="coach-pill coach-pill-accent">${rutina.objetivo}</span>
                  <span class="coach-pill coach-pill-muted">${rutina.nivel}</span>
                </div>
                <div class="d-flex flex-wrap gap-4 coach-text-soft">
                  <span><strong class="text-white">${rutina.ejercicios.length}</strong> ejercicios</span>
                  <span>Creada el ${fechaStr}</span>
                </div>
              </div>

              <div class="d-flex gap-2 align-items-start">
                <button class="btn coach-icon-btn coach-icon-btn-success" title="Asignar usuarios"><i class="bi bi-person-plus"></i></button>
                <button class="btn coach-icon-btn coach-icon-btn-muted" title="Editar rutina" data-id="${rutina._id}"><i class="bi bi-pencil-square"></i></button>
                <button class="btn coach-icon-btn coach-icon-btn-danger" title="Eliminar rutina" data-id="${rutina._id}"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          `;
          rutinasContainer.appendChild(card);
        });

      } catch (error) {
        console.error('Error al listar rutinas:', error);
        rutinasContainer.innerHTML = `
          <div class="alert alert-danger" role="alert">
            No se pudo conectar con el servidor para cargar las rutinas.
          </div>
        `;
      }
    }
    cargarRutinas();

    // 3. Manejar eliminación y edición de rutinas
    rutinasContainer.addEventListener('click', async (event) => {
      // 3a. Manejar edición de rutinas
      const editBtn = event.target.closest('button.coach-icon-btn-muted[title="Editar rutina"]');
      if (editBtn) {
        const rutinaId = editBtn.getAttribute('data-id');
        if (rutinaId) {
          window.location.href = `CrearRutina-coach.html?id=${rutinaId}`;
        }
        return;
      }

      // 3b. Manejar eliminación de rutinas
      const deleteBtn = event.target.closest('button.coach-icon-btn-danger');
      if (!deleteBtn) return;

      const rutinaId = deleteBtn.getAttribute('data-id');
      if (!rutinaId) return;

      if (!confirm('¿Estás seguro de que deseas eliminar esta rutina? Esta acción no se puede deshacer.')) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/rutinas/${rutinaId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const data = await response.json();
          alert(data.message || 'Error al eliminar la rutina');
          return;
        }

        alert('¡Rutina eliminada exitosamente!');
        cargarRutinas();

      } catch (error) {
        alert('No se pudo conectar con el servidor.');
      }
    });
  }

  function initCrearRutinaCoach() {
    const body = document.body;
    if (!body || !body.classList.contains('crear-rutina-coach-page')) return;

    const inputDia = document.getElementById('inputDia');
    const inputEjercicio = document.getElementById('inputEjercicio');
    const inputSeries = document.getElementById('inputSeries');
    const inputRepeticiones = document.getElementById('inputRepeticiones');
    const inputDescanso = document.getElementById('inputDescanso');
    const btnAgregar = document.getElementById('btnAgregarEjercicio');
    const tablaBody = document.getElementById('tablaEjerciciosBody');
    const btnGuardar = document.getElementById('btnGuardarRutina');
    const rutinaNombre = document.getElementById('rutinaNombre');
    const rutinaObjetivo = document.getElementById('rutinaObjetivo');
    const rutinaNivel = document.getElementById('rutinaNivel');
    const rutinaNotas = document.getElementById('rutinaNotas');

    if (!inputDia || !inputEjercicio || !inputSeries || !inputRepeticiones || !inputDescanso || !btnAgregar || !tablaBody || !btnGuardar || !rutinaNombre || !rutinaObjetivo || !rutinaNivel) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';
    let editingRow = null;

    // Detectar si estamos en modo edición (si hay un ID en la URL)
    const urlParams = new URLSearchParams(window.location.search);
    const rutinaId = urlParams.get('id');

    if (rutinaId) {
      // Cambiar encabezado y botón dinámicamente
      const pageTitle = document.querySelector('main h1');
      const pageDesc = document.querySelector('main p');
      if (pageTitle) pageTitle.textContent = 'Editar Rutina';
      if (pageDesc) pageDesc.textContent = 'Modifica los detalles y ejercicios de la rutina';
      btnGuardar.innerHTML = '<i class="bi bi-floppy me-2"></i>Actualizar Rutina';
    }

    // Limpiar tabla al inicio
    tablaBody.innerHTML = '';

    // Cargar catálogo de ejercicios dinámicamente desde el backend
    async function cargarEjerciciosDropdown() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ejercicios`);
        if (!response.ok) throw new Error('Error al cargar catálogo de ejercicios');
        const ejercicios = await response.json();

        inputEjercicio.innerHTML = '<option value="">Seleccionar ejercicio</option>';
        ejercicios.forEach(ej => {
          const opt = document.createElement('option');
          opt.value = ej.nombreEjercicio;
          opt.textContent = ej.nombreEjercicio;
          inputEjercicio.appendChild(opt);
        });

        // Una vez cargado el dropdown, si estamos editando, cargar los datos de la rutina
        if (rutinaId) {
          await cargarRutinaEdicion();
        }
      } catch (error) {
        console.error('Error al cargar catálogo de ejercicios:', error);
      }
    }
    cargarEjerciciosDropdown();

    async function cargarRutinaEdicion() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/rutinas/${rutinaId}`);
        if (!response.ok) throw new Error('Error al obtener la rutina');
        const rutina = await response.json();

        // Rellenar campos principales
        rutinaNombre.value = rutina.nombreRutina;
        rutinaObjetivo.value = rutina.objetivo;
        rutinaNivel.value = rutina.nivel;
        if (rutinaNotas) rutinaNotas.value = rutina.notes || rutina.notas || '';

        // Rellenar ejercicios en la tabla
        tablaBody.innerHTML = '';
        rutina.ejercicios.forEach(ej => {
          const row = document.createElement('tr');
          fillRow(row, {
            dia: ej.dia,
            ejercicio: ej.ejercicio,
            series: ej.series,
            repeticiones: ej.repeticiones,
            descanso: ej.descanso
          });
          tablaBody.appendChild(row);
        });

      } catch (error) {
        alert('No se pudo cargar la rutina para editar.');
        window.location.href = 'GestionRutina-coach.html';
      }
    }

    function clearExerciseInputs() {
      inputDia.value = 'Lunes';
      inputEjercicio.value = '';
      inputSeries.value = '';
      inputRepeticiones.value = '';
      inputDescanso.value = '';
    }

    function readExerciseInputs() {
      return {
        dia: inputDia.value.trim(),
        ejercicio: inputEjercicio.value.trim(),
        series: inputSeries.value.trim(),
        repeticiones: inputRepeticiones.value.trim(),
        descanso: inputDescanso.value.trim() || '-'
      };
    }

    function validateExercise(data) {
      return data.ejercicio && data.series && data.repeticiones;
    }

    // Usar la función fillRow de forma globalizada
    function buildActionsCell() {
      return `
        <button class="btn coach-icon-btn coach-icon-btn-muted me-1" type="button" data-action="editar"><i class="bi bi-pencil-square"></i></button>
        <button class="btn coach-icon-btn coach-icon-btn-danger" type="button" data-action="eliminar"><i class="bi bi-trash"></i></button>
      `;
    }

    function fillRow(row, data) {
      row.innerHTML = `
        <td>${data.dia}</td>
        <td>${data.ejercicio}</td>
        <td>${data.series}</td>
        <td>${data.repeticiones}</td>
        <td>${data.descanso}</td>
        <td>${buildActionsCell()}</td>
      `;
    }

    btnAgregar.addEventListener('click', () => {
      const data = readExerciseInputs();
      if (!validateExercise(data)) {
        alert('Completa Ejercicio, Series y Repeticiones para agregar.');
        return;
      }

      if (editingRow) {
        fillRow(editingRow, data);
        editingRow = null;
        btnAgregar.innerHTML = '<i class="bi bi-plus-lg me-2"></i>Agregar ejercicio';
      } else {
        const row = document.createElement('tr');
        fillRow(row, data);
        tablaBody.appendChild(row);
      }

      clearExerciseInputs();
    });

    tablaBody.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const row = btn.closest('tr');
      if (!row) return;

      if (action === 'eliminar') {
        row.remove();
        if (editingRow === row) {
          editingRow = null;
          clearExerciseInputs();
          btnAgregar.innerHTML = '<i class="bi bi-plus-lg me-2"></i>Agregar ejercicio';
        }
        return;
      }

      if (action === 'editar') {
        const cells = row.querySelectorAll('td');
        inputDia.value = cells[0].textContent.trim();
        inputEjercicio.value = cells[1].textContent.trim();
        inputSeries.value = cells[2].textContent.trim();
        inputRepeticiones.value = cells[3].textContent.trim();
        inputDescanso.value = cells[4].textContent.trim() === '-' ? '' : cells[4].textContent.trim();
        editingRow = row;
        btnAgregar.innerHTML = '<i class="bi bi-check2 me-2"></i>Actualizar ejercicio';
      }
    });

    btnGuardar.addEventListener('click', async () => {
      const nombre = rutinaNombre.value.trim();
      const objetivo = rutinaObjetivo.value;
      const nivel = rutinaNivel.value;
      const notas = rutinaNotas ? rutinaNotas.value.trim() : '';

      if (!nombre || !objetivo || !nivel) {
        alert('Completa Nombre, Objetivo y Nivel antes de guardar la rutina.');
        return;
      }

      const rows = Array.from(tablaBody.querySelectorAll('tr'));
      if (rows.length === 0) {
        alert('Agrega al menos un ejercicio antes de guardar la rutina.');
        return;
      }

      const ejercicios = rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          dia: cells[0].textContent.trim(),
          ejercicio: cells[1].textContent.trim(),
          series: parseInt(cells[2].textContent.trim(), 10),
          repeticiones: cells[3].textContent.trim(),
          descanso: cells[4].textContent.trim()
        };
      });

      const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
      const coachId = currentUser ? currentUser.id : '6a124a584aa0ab34922bfddb';

      btnGuardar.disabled = true;
      btnGuardar.innerHTML = rutinaId 
        ? '<span class="spinner-border spinner-border-sm me-2"></span>Actualizando...'
        : '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

      const method = rutinaId ? 'PUT' : 'POST';
      const endpoint = rutinaId ? `${API_BASE_URL}/api/rutinas/${rutinaId}` : `${API_BASE_URL}/api/rutinas`;

      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coachId,
            nombreRutina: nombre,
            objetivo,
            nivel,
            notes: notas, // Mapear notas
            notas: notas,
            ejercicios
          })
        });

        const data = await response.json();
        if (!response.ok) {
          const errMsg = data.errores ? data.errores.join('\n') : (data.message || 'Error al guardar la rutina');
          alert(errMsg);
          return;
        }

        alert(rutinaId ? '¡Rutina actualizada exitosamente!' : '¡Rutina creada exitosamente!');
        window.location.href = 'GestionRutina-coach.html';

      } catch (error) {
        alert('No se pudo conectar con el servidor.');
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="bi bi-floppy me-2"></i>Guardar Rutina';
      }
    });
  }

  function cargarPerfilSidebar() {
    const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return;

    const isCoachPage = document.body && document.body.classList.contains('coach-page');
    if (!isCoachPage) return;

    const avatar = document.querySelector('.coach-sidebar .coach-user-avatar');
    const nombreEl = document.querySelector('.coach-sidebar .fw-semibold');
    const rolEl = document.querySelector('.coach-sidebar .coach-text-soft');

    if (nombreEl) {
      nombreEl.textContent = `${currentUser.nombre} ${currentUser.apellido}`;
    }
    if (avatar) {
      avatar.textContent = (currentUser.nombre.charAt(0) + (currentUser.apellido ? currentUser.apellido.charAt(0) : '')).toUpperCase();
    }
    if (rolEl) {
      rolEl.textContent = currentUser.rol === 'coach' ? 'Entrenador' : 'Usuario';
    }
  }

  // Cargar perfil en la barra lateral automáticamente
  cargarPerfilSidebar();

  window.initGestionRutinaCoach = initGestionRutinaCoach;
  window.initCrearRutinaCoach = initCrearRutinaCoach;
})();
