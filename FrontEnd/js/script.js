(() => {
  function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('loginSubmitBtn');
    const feedbackEl = document.getElementById('loginFeedback');
    if (!loginForm || !emailInput || !passwordInput || !submitBtn || !feedbackEl) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';

    function setFeedback(message, type) {
      feedbackEl.textContent = message;
      feedbackEl.style.display = 'block';
      feedbackEl.style.color = type === 'error' ? '#ff8f8f' : '#89f5c8';
    }

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!email || !password) {
        setFeedback('Completa correo y contraseña.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Entrando...';
      feedbackEl.style.display = 'none';

      try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) {
          setFeedback(data.message || 'No fue posible iniciar sesión.', 'error');
          return;
        }

        const usuario = data.Usuario;
        const token = data.token;

        if (!usuario || !token) {
          setFeedback('Respuesta de login incompleta.', 'error');
          return;
        }

        localStorage.setItem('fittracker_token', token);
        localStorage.setItem('fittracker_user', JSON.stringify(usuario));

        setFeedback('Login exitoso. Redirigiendo...', 'success');

        if (usuario.rol === 'coach') {
          window.location.href = 'dashboard-coach.html';
        } else {
          window.location.href = 'dashboard-cliente.html';
        }
      } catch (error) {
        setFeedback('No se pudo conectar con el servidor.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
      }
    });
  }

  function initRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const emailInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const rolInput = document.getElementById('rol');
    const termsCheck = document.getElementById('termsCheck');
    const submitBtn = document.getElementById('registerSubmitBtn');
    const feedbackEl = document.getElementById('registerFeedback');

    if (!registerForm || !nombreInput || !emailInput) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';

    function setFeedback(message, type) {
      feedbackEl.textContent = message;
      feedbackEl.style.display = 'block';
      feedbackEl.style.color = type === 'error' ? '#ff8f8f' : '#89f5c8';
    }

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nombre = nombreInput.value.trim();
      const apellido = apellidoInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const rol = rolInput.value;

      if (!nombre || !apellido || !email || !password || !confirmPassword) {
        setFeedback('Todos los campos son obligatorios.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        setFeedback('Las contraseñas no coinciden.', 'error');
        return;
      }

      if (rol === 'Selecciona una opción') {
        setFeedback('Por favor selecciona un rol válido.', 'error');
        return;
      }

      if (!termsCheck.checked) {
        setFeedback('Debes aceptar los términos y condiciones.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Registrando...';
      feedbackEl.style.display = 'none';

      try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nombre, apellido, email, password, rol })
        });

        const data = await response.json();
        if (!response.ok) {
          setFeedback(data.message || 'Error al registrar la cuenta.', 'error');
          return;
        }

        setFeedback('¡Registro exitoso! Redirigiendo al login...', 'success');
        
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);

      } catch (error) {
        setFeedback('No se pudo conectar con el servidor.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear cuenta';
      }
    });
  }

  function initGestionRutinaCoach() {
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

    if (!inputDia || !inputEjercicio || !inputSeries || !inputRepeticiones || !inputDescanso || !btnAgregar || !tablaBody || !btnGuardar || !rutinaNombre || !rutinaObjetivo || !rutinaNivel) return;

    let editingRow = null;

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

    btnGuardar.addEventListener('click', () => {
      if (!rutinaNombre.value.trim() || !rutinaObjetivo.value || !rutinaNivel.value) {
        alert('Completa Nombre, Objetivo y Nivel antes de guardar la rutina.');
        return;
      }

      if (!tablaBody.querySelector('tr')) {
        alert('Agrega al menos un ejercicio antes de guardar la rutina.');
        return;
      }

      alert('Rutina guardada (demo frontend).');
    });
  }

  function initProfilePage() {
    const nombreInput = document.getElementById('profileNombre');
    const apellidoInput = document.getElementById('profileApellido');
    const correoInput = document.getElementById('profileCorreo');
    const btnEdit = document.getElementById('btnEditProfile');
    const btnSave = document.getElementById('btnSaveProfile');
    const feedbackEl = document.getElementById('profileFeedback');

    if (!nombreInput || !btnEdit || !btnSave) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';

    let currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return; // Si no hay usuario en sesión, no hacer nada

    // Función para pintar los datos en pantalla
    function renderUserData(user) {
      nombreInput.value = user.nombre || '';
      apellidoInput.value = user.apellido || '';
      correoInput.value = user.email || '';

      // Intentar actualizar también las tarjetas/headers si existen en la página
      const fullName = `${user.nombre} ${user.apellido}`;
      const initials = (user.nombre.charAt(0) + user.apellido.charAt(0)).toUpperCase();
      
      const headerNames = document.querySelectorAll('.h3.mb-1, .fw-semibold');
      headerNames.forEach(el => {
        if (el.textContent.includes('Admin') || el.textContent.includes('Juan') || el.textContent.includes(currentUser.nombre)) {
            el.textContent = fullName;
        }
      });

      const avatars = document.querySelectorAll('.coach-user-avatar, .cliente-profile-avatar, .profile-avatar');
      avatars.forEach(el => el.textContent = initials);

      const headerEmails = document.querySelectorAll('.bi-envelope');
      headerEmails.forEach(el => {
        if (el.parentNode.tagName === 'SPAN') {
          el.parentNode.innerHTML = `<i class="bi bi-envelope me-1"></i>${user.email}`;
        }
      });
    }

    renderUserData(currentUser);

    function setFeedback(message, type) {
      feedbackEl.textContent = message;
      feedbackEl.style.display = 'block';
      feedbackEl.style.color = type === 'error' ? '#ff8f8f' : '#89f5c8';
      setTimeout(() => { feedbackEl.style.display = 'none'; }, 4000);
    }

    btnEdit.addEventListener('click', () => {
      nombreInput.removeAttribute('readonly');
      apellidoInput.removeAttribute('readonly');
      correoInput.removeAttribute('readonly');
      
      btnEdit.classList.add('d-none');
      btnSave.classList.remove('d-none');
    });

    btnSave.addEventListener('click', async () => {
      const nombre = nombreInput.value.trim();
      const apellido = apellidoInput.value.trim();
      const email = correoInput.value.trim();

      if (!nombre || !apellido || !email) {
        setFeedback('Todos los campos son obligatorios', 'error');
        return;
      }

      btnSave.disabled = true;
      btnSave.textContent = 'Guardando...';

      try {
        const response = await fetch(`${API_BASE_URL}/api/perfil/${currentUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, apellido, email })
        });

        const data = await response.json();
        if (!response.ok) {
          setFeedback(data.message || 'Error al actualizar', 'error');
          return;
        }

        // Actualizar localStorage con los nuevos datos
        currentUser = data.Usuario;
        localStorage.setItem('fittracker_user', JSON.stringify(currentUser));
        
        // Refrescar la pantalla y bloquear inputs
        renderUserData(currentUser);
        nombreInput.setAttribute('readonly', 'true');
        apellidoInput.setAttribute('readonly', 'true');
        correoInput.setAttribute('readonly', 'true');

        btnSave.classList.add('d-none');
        btnEdit.classList.remove('d-none');
        setFeedback('¡Perfil actualizado con éxito!', 'success');

      } catch (error) {
        setFeedback('No se pudo conectar con el servidor', 'error');
      } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Guardar Cambios';
      }
    });
  }

  function initPasswordChange() {
    const btnSavePassword = document.getElementById('btnSavePassword');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const feedbackEl = document.getElementById('passwordFeedback');

    if (!btnSavePassword || !currentPasswordInput || !newPasswordInput || !confirmNewPasswordInput) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';
    const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return;

    function setFeedback(message, type) {
      feedbackEl.textContent = message;
      feedbackEl.style.display = 'block';
      feedbackEl.style.color = type === 'error' ? '#ff8f8f' : '#89f5c8';
    }

    // Limpiar modal al cerrarlo
    const modalEl = document.getElementById('changePasswordModal');
    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmNewPasswordInput.value = '';
        feedbackEl.style.display = 'none';
      });
    }

    btnSavePassword.addEventListener('click', async () => {
      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;
      const confirmNewPassword = confirmNewPasswordInput.value;

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setFeedback('Todos los campos son obligatorios', 'error');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setFeedback('La nueva contraseña no coincide', 'error');
        return;
      }

      btnSavePassword.disabled = true;
      btnSavePassword.textContent = 'Actualizando...';
      feedbackEl.style.display = 'none';

      try {
        const response = await fetch(`${API_BASE_URL}/api/perfil/${currentUser.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();
        if (!response.ok) {
          setFeedback(data.message || 'Error al cambiar la contraseña', 'error');
          return;
        }

        setFeedback('Contraseña actualizada con éxito', 'success');
        
        // Cerrar modal tras éxito (opcional, o dejar que el usuario lo cierre)
        setTimeout(() => {
          if (typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
          }
        }, 2000);

      } catch (error) {
        setFeedback('No se pudo conectar con el servidor', 'error');
      } finally {
        btnSavePassword.disabled = false;
        btnSavePassword.textContent = 'Actualizar';
      }
    });
  }

  function initLogout() {
    const btnLogout = document.getElementById('btnLogout');
    if (!btnLogout) return;

    btnLogout.addEventListener('click', () => {
      // Eliminar credenciales del localStorage
      localStorage.removeItem('fittracker_token');
      localStorage.removeItem('fittracker_user');
      
      // Redirigir al inicio o login
      window.location.href = 'GYMBRO.html';
    });
  }

  initLoginPage();
  initRegisterPage();
  initProfilePage();
  initPasswordChange();
  initLogout();
  initGestionRutinaCoach();
  initCrearRutinaCoach();
})();
