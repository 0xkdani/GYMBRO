(() => {
  // Función auxiliar para inyectar scripts en la cabecera dinámicamente
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Error cargando script: ${src}`));
      document.head.appendChild(script);
    });
  }

  // Determinar la ruta relativa al directorio js.
  // Como todos los archivos HTML están en FrontEnd/html/,
  // las llamadas a los scripts secundarios se resuelven con '../js/'
  const basePath = '../js';

  Promise.all([
    loadScript(`${basePath}/auth.js`),
    loadScript(`${basePath}/coach.js`),
    loadScript(`${basePath}/cliente.js`)
  ]).then(() => {
    // Una vez que todos los módulos están cargados de forma asíncrona, ejecutamos sus inicializadores:
    if (typeof window.initLoginPage === 'function') window.initLoginPage();
    if (typeof window.initRegisterPage === 'function') window.initRegisterPage();
    if (typeof window.initProfilePage === 'function') window.initProfilePage();
    if (typeof window.initPasswordChange === 'function') window.initPasswordChange();
    if (typeof window.initProgresoCliente === 'function') window.initProgresoCliente();
    if (typeof window.initLogout === 'function') window.initLogout();
    if (typeof window.initGestionRutinaCoach === 'function') window.initGestionRutinaCoach();
    if (typeof window.initCrearRutinaCoach === 'function') window.initCrearRutinaCoach();
  }).catch(err => {
    console.error('Error al inicializar módulos de GYMBRO:', err);
  });
})();
