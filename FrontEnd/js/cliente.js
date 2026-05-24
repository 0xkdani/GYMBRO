(() => {
  function initProgresoCliente() {
    const isProgresoPage = document.querySelector('.progreso-cliente-page');
    if (!isProgresoPage) return;

    const API_BASE_URL = 'http://127.0.0.1:5000';
    const currentUser = JSON.parse(localStorage.getItem('fittracker_user') || 'null');
    if (!currentUser) return;

    const formProgreso = document.getElementById('form-progreso');
    const inputFecha = document.getElementById('input-fecha');
    const inputPeso = document.getElementById('input-peso');
    const inputNotas = document.getElementById('input-notas');
    const feedbackEl = document.getElementById('progresoFeedback');
    const submitBtn = formProgreso.querySelector('button[type="submit"]');
    const tbodyHistorial = document.getElementById('historialProgresoBody');

    if (!formProgreso || !inputFecha || !inputPeso) return;

    // Actualizar nombre/avatar del sidebar al usuario real
    const fullName = `${currentUser.nombre} ${currentUser.apellido}`;
    const initials = (currentUser.nombre.charAt(0) + (currentUser.apellido.charAt(0) || '')).toUpperCase();
    const sidebarName = document.querySelector('.coach-sidebar .fw-semibold');
    if (sidebarName) sidebarName.textContent = fullName;
    const sidebarAvatar = document.querySelector('.coach-sidebar .coach-user-avatar');
    if (sidebarAvatar) sidebarAvatar.textContent = initials;

    // Fecha por defecto: Hoy
    const today = new Date().toISOString().split('T')[0];
    inputFecha.value = today;

    function setFeedback(message, type) {
      feedbackEl.textContent = message;
      feedbackEl.style.display = 'block';
      feedbackEl.style.color = type === 'error' ? '#ff8f8f' : '#89f5c8';
    }

    async function loadHistorial() {
      if (!tbodyHistorial) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/progresos/${currentUser.id}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error('Error al cargar');

        if (data.length === 0) {
          tbodyHistorial.innerHTML = '<tr><td colspan="3" class="text-center coach-text-soft py-4">No hay registros aún.</td></tr>';
          return;
        }

        data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        tbodyHistorial.innerHTML = data.map(registro => {
          const fechaFormateada = new Date(registro.fecha).toLocaleDateString('es-ES', { 
            year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' 
          });
          const notas = registro.notas ? registro.notas : '<span class="text-muted">-</span>';
          
          return `
            <tr>
              <td class="align-middle">${fechaFormateada}</td>
              <td class="align-middle fw-bold text-white">${registro.peso} kg</td>
              <td class="align-middle small coach-text-soft">${notas}</td>
            </tr>
          `;
        }).join('');

      } catch (error) {
        tbodyHistorial.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Error al cargar el historial.</td></tr>';
      }
    }

    formProgreso.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fecha = inputFecha.value;
      const peso = inputPeso.value;
      const notas = inputNotas.value;

      if (!fecha || !peso) {
        setFeedback('La fecha y el peso son obligatorios', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
      feedbackEl.style.display = 'none';

      try {
        const response = await fetch(`${API_BASE_URL}/api/progresos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteId: currentUser.id,
            fecha,
            peso,
            notas
          })
        });

        const data = await response.json();
        if (!response.ok) {
          setFeedback(data.message || 'Error al guardar progreso', 'error');
          return;
        }

        setFeedback('¡Progreso guardado exitosamente!', 'success');
        inputPeso.value = '';
        inputNotas.value = '';
        
        setTimeout(() => {
          feedbackEl.style.display = 'none';
        }, 3000);

        loadHistorial();

      } catch (error) {
        setFeedback('No se pudo conectar con el servidor', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-floppy me-2"></i> Guardar Progreso';
      }
    });

    loadHistorial();
  }

  window.initProgresoCliente = initProgresoCliente;
})();
