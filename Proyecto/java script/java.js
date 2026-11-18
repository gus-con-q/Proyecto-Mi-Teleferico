// Arreglos persistentes en localStorage
let listaMantenimiento = JSON.parse(localStorage.getItem('simtele_mantenimiento')) || [];
let bitacoraLogs = JSON.parse(localStorage.getItem('simtele_bitacora')) || [];
let listaSensores = [];

// Referencias principales
const pantallaLogin = document.getElementById('pantalla-login');
const appPrincipal = document.getElementById('app-principal');
const badgeOperador = document.getElementById('badge-operador');
const btnMenu = document.getElementById('btn-menu');
const navMenu = document.getElementById('nav-menu');

// --- FUNCIÓN PARA REGISTRAR FECHA Y HORA EN LOCALSTORAGE ---
function registrarEnBitacora(usuario, accion) {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString('es-BO');
  const hora = ahora.toLocaleTimeString('es-BO');

  const registro = {
    usuario,
    accion,
    fechaHora: `${fecha} - ${hora}`
  };

  bitacoraLogs.unshift(registro); // Agrega al inicio
  localStorage.setItem('simtele_bitacora', JSON.stringify(bitacoraLogs));
  renderizarBitacora();
}

function renderizarBitacora() {
  const ul = document.getElementById('lista-bitacora');
  ul.innerHTML = '';

  bitacoraLogs.forEach(log => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span><strong>[${log.usuario}]</strong> ${log.accion}</span>
      <span style="color:#666; font-size:0.85rem;">🕒 ${log.fechaHora}</span>
    `;
    ul.appendChild(li);
  });
}

// --- CONTROL DE SESIÓN AL CARGAR LA PÁGINA ---
function verificarSesion() {
  const sesionActiva = JSON.parse(localStorage.getItem('simtele_sesion_activa'));
  if (sesionActiva && sesionActiva.usuario) {
    pantallaLogin.classList.add('oculto');
    appPrincipal.classList.remove('oculto');
    badgeOperador.textContent = `Operador: ${sesionActiva.usuario} (Ingreso: ${sesionActiva.horaIngreso})`;
    renderizarMantenimiento();
    renderizarBitacora();
  } else {
    pantallaLogin.classList.remove('oculto');
    appPrincipal.classList.add('oculto');
  }
}

// Iniciar Sesión
document.getElementById('form-login').addEventListener('submit', function(e) {
  e.preventDefault();
  const usuario = document.getElementById('usuario').value.trim();
  const clave = document.getElementById('clave').value.trim();
  const msg = document.getElementById('msg-login');

  if (usuario.length < 3 || clave.length < 4) {
    msg.textContent = 'Ingrese un ID válido (mín. 3 letras) y clave (mín. 4 caracteres).';
    return;
  }

  const ahora = new Date();
  const fechaHoraIngreso = `${ahora.toLocaleDateString('es-BO')} ${ahora.toLocaleTimeString('es-BO')}`;

  // Guardar sesión actual en localStorage
  localStorage.setItem('simtele_sesion_activa', JSON.stringify({
    usuario: usuario,
    horaIngreso: fechaHoraIngreso
  }));

  registrarEnBitacora(usuario, 'Inicio de sesión en el sistema');
  msg.textContent = '';
  this.reset();
  verificarSesion();
});

// Cerrar Sesión
document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
  const sesion = JSON.parse(localStorage.getItem('simtele_sesion_activa'));
  if (sesion) {
    registrarEnBitacora(sesion.usuario, 'Cierre de sesión');
  }
  localStorage.removeItem('simtele_sesion_activa');
  verificarSesion();
});

// Limpiar historial de bitácora
document.getElementById('btn-limpiar-log').addEventListener('click', () => {
  bitacoraLogs = [];
  localStorage.removeItem('simtele_bitacora');
  renderizarBitacora();
});

// Menú móvil
btnMenu.addEventListener('click', () => {
  navMenu.classList.toggle('activo');
});

// --- MÓDULO 1: DETENCIÓN DE EMERGENCIA ---
document.getElementById('form-detencion').addEventListener('submit', function(e) {
  e.preventDefault();
  const v = parseFloat(document.getElementById('velocidad').value);
  const t = parseFloat(document.getElementById('tiempo').value);
  const resDiv = document.getElementById('res-detencion');

  if (isNaN(v) || isNaN(t) || v < 0 || t < 0) {
    resDiv.className = 'resultado alerta-peligro';
    resDiv.textContent = 'Error: Ingrese valores numéricos positivos válidos.';
    return;
  }

  const distancia = (v / 3.6) * t;
  const sesion = JSON.parse(localStorage.getItem('simtele_sesion_activa'));

  if (distancia > 50) {
    resDiv.className = 'resultado alerta-peligro';
    resDiv.textContent = `Distancia: ${distancia.toFixed(2)} m. ⚠️ Supera el umbral de 50 m.`;
  } else {
    resDiv.className = 'resultado alerta-ok';
    resDiv.textContent = `Distancia: ${distancia.toFixed(2)} m. ✅ Dentro del rango seguro.`;
  }

  if (sesion) registrarEnBitacora(sesion.usuario, `Calculó detención: ${distancia.toFixed(2)} m`);
});

// --- MÓDULO 2: MANTENIMIENTO ---
function renderizarMantenimiento() {
  const tbody = document.getElementById('tabla-mantenimiento');
  tbody.innerHTML = '';

  listaMantenimiento.forEach((item, index) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${item.componente}</td>
      <td>${item.horas} hrs</td>
      <td><strong>${item.estado}</strong></td>
      <td><button class="btn-eliminar" onclick="eliminarMantenimiento(${index})">Eliminar</button></td>
    `;
    tbody.appendChild(fila);
  });

  localStorage.setItem('simtele_mantenimiento', JSON.stringify(listaMantenimiento));
}

document.getElementById('form-mantenimiento').addEventListener('submit', function(e) {
  e.preventDefault();
  const componente = document.getElementById('componente').value.trim();
  const horas = parseFloat(document.getElementById('horas').value);
  const estado = document.getElementById('estado').value;
  const msg = document.getElementById('msg-mantenimiento');

  if (componente === '' || isNaN(horas) || horas < 0) {
    msg.textContent = 'Error: Complete el nombre del componente y horas válidas.';
    return;
  }

  msg.textContent = '';
  listaMantenimiento.push({ componente, horas, estado });
  renderizarMantenimiento();

  const sesion = JSON.parse(localStorage.getItem('simtele_sesion_activa'));
  if (sesion) registrarEnBitacora(sesion.usuario, `Registró mantenimiento: ${componente} (${estado})`);

  this.reset();
});

function eliminarMantenimiento(indice) {
  const eliminado = listaMantenimiento[indice].componente;
  listaMantenimiento.splice(indice, 1);
  renderizarMantenimiento();

  const sesion = JSON.parse(localStorage.getItem('simtele_sesion_activa'));
  if (sesion) registrarEnBitacora(sesion.usuario, `Eliminó registro: ${eliminado}`);
}

// --- MÓDULO 3: VIENTO Y OSCILACIÓN ---
document.getElementById('form-viento').addEventListener('submit', function(e) {
  e.preventDefault();
  const inputs = document.querySelectorAll('.input-viento');
  const resDiv = document.getElementById('res-viento');
  let mediciones = [];

  for (let input of inputs) {
    const val = parseFloat(input.value);
    if (isNaN(val) || val < 0) {
      resDiv.className = 'resultado alerta-peligro';
      resDiv.textContent = 'Error: Las 5 mediciones deben ser números válidos (0 o mayor).';
      return;
    }
    mediciones.push(val);
  }

  let suma = 0;
  let maximo = mediciones;

  mediciones.forEach(m => {
    suma += m;
    if (m > maximo) maximo = m;
  });

  const promedio = suma / mediciones.length;
  let clasificacion = '';

  if (promedio < 25) {
    clasificacion = 'Normal';
    resDiv.className = 'resultado alerta-ok';
  } else if (promedio <= 40) {
    clasificacion = 'Precaución';
    resDiv.className = 'resultado alerta-peligro';
  } else {
    clasificacion = 'Alerta';
    resDiv.className = 'resultado alerta-peligro';
  }

  resDiv.textContent = `Promedio: ${promedio.toFixed(1)} km/h | Máximo: ${maximo} km/h | Estado: ${clasificacion}`;

  const sesion = JSON.parse(localStorage.getItem('simtele_sesion_activa'));
  if (sesion) registrarEnBitacora(sesion.usuario, `Analizó viento (Prom: ${promedio.toFixed(1)} km/h - ${clasificacion})`);
});

// --- MÓDULO 4: SENSORES ---
document.getElementById('form-sensores').addEventListener('submit', function(e) {
  e.preventDefault();
  const codigo = document.getElementById('cod-sensor').value.trim();
  const tipo = document.getElementById('tipo-sensor').value;
  const lectura = parseFloat(document.getElementById('lectura-sensor').value);
  const msg = document.getElementById('msg-sensor');
  const regexSensor = /^SEN-\d{3}$/;

  if (!regexSensor.test(codigo)) {
    msg.textContent = 'Error: El código debe cumplir el formato SEN-000 (ej: SEN-001).';
    return;
  }

  if (isNaN(lectura)) {
    msg.textContent = 'Error: La lectura debe ser un valor numérico.';
    return;
  }

  msg.textContent = '';
  listaSensores.push({ codigo, tipo, lectura });

  const ul = document.getElementById('lista-sensores');
  const li = document.createElement('li');
  li.textContent = `[${codigo}] ${tipo}: ${lectura} unidades`;
  ul.appendChild(li);

  const sesion = JSON.parse(localStorage.getItem('simtele_sesion_activa'));
  if (sesion) registrarEnBitacora(sesion.usuario, `Validó sensor ${codigo} (${lectura})`);

  this.reset();
});

// Ejecutar verificación al abrir la página
verificarSesion();
