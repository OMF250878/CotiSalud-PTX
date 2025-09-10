// === Configuración ===
// Si tienes UPSTREAM_WEBHOOK en el servidor, usa el proxy:
const USE_PROXY = true;
// Si no usas proxy, pon USE_PROXY = false y usa tu webhook externo aquí:
const WEBHOOK_URL = 'https://primary-production-e1c81.up.railway.app/webhook/ce2177d6-7da8-44b6-9781-107ad6844bf1';

// Estado dinámico
let hijoCounter = 0;
let conyugeAdded = false;

// Utilidad: UUID simple
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ====== DOM Ready ======
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cotizadorForm');
  const submitBtn = document.getElementById('submitBtn');
  const status = document.getElementById('status');

  const addConyugeBtn = document.getElementById('addConyuge');
  const addHijoBtn = document.getElementById('addHijo');
  const conyugeContainer = document.getElementById('conyugeContainer');
  const hijosContainer = document.getElementById('hijosContainer');

  // Crear tarjeta Cónyuge
  function createConyugeCard() {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
        <h3 class="card__title">Cónyuge</h3>
        <button type="button" class="btn-secondary" onclick="removeConyuge(this)">Eliminar</button>
      </div>
      <div class="grid-3">
        <div class="form-group">
          <label>Edad *</label>
          <input type="number" name="conyuge-edad" min="0" max="100" required />
        </div>
        <div class="form-group">
          <label>Sexo *</label>
          <div class="radio-group">
            <label class="radio-label"><input type="radio" name="conyuge-sexo" value="HOMBRE" required /><span>Hombre</span></label>
            <label class="radio-label"><input type="radio" name="conyuge-sexo" value="MUJER" required /><span>Mujer</span></label>
          </div>
        </div>
      </div>
    `;
    return wrapper;
  }

  // Crear tarjeta Hijo
  function createHijoCard(id) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
        <h3 class="card__title">Hijo ${id}</h3>
        <button type="button" class="btn-secondary" onclick="removeHijo(this)">Eliminar</button>
      </div>
      <div class="grid-3">
        <div class="form-group">
          <label>Edad *</label>
          <input type="number" name="hijo-edad-${id}" min="0" max="100" required />
        </div>
        <div class="form-group">
          <label>Sexo *</label>
          <div class="radio-group">
            <label class="radio-label"><input type="radio" name="hijo-sexo-${id}" value="HOMBRE" required /><span>Hombre</span></label>
            <label class="radio-label"><input type="radio" name="hijo-sexo-${id}" value="MUJER" required /><span>Mujer</span></label>
          </div>
        </div>
      </div>
    `;
    return wrapper;
  }

  // Eventos para agregar
  addConyugeBtn.addEventListener('click', () => {
    if (!conyugeAdded) {
      conyugeContainer.appendChild(createConyugeCard());
      conyugeAdded = true;
      addConyugeBtn.disabled = true;
      addConyugeBtn.textContent = '✓ Cónyuge agregado';
    }
  });

  addHijoBtn.addEventListener('click', () => {
    hijoCounter += 1;
    hijosContainer.appendChild(createHijoCard(hijoCounter));
  });

  // Validación mínima
  function validateForm() {
    const titularEdad = document.getElementById('titular-edad').value;
    const titularSexo = document.querySelector('input[name="titular-sexo"]:checked');
    const nombre = document.getElementById('nombre').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!titularEdad || !titularSexo || !nombre || !apellidos || !email) {
      showStatus('Completa los campos requeridos (*)', 'error');
      return false;
    }
    return true;
  }

  // Construir payload
  function collectFormData() {
    const asegurados = [];

    // Titular
    asegurados.push({
      edad: parseInt(document.getElementById('titular-edad').value, 10),
      sexo: document.querySelector('input[name="titular-sexo"]:checked').value,
      perfil: "TITULAR",
    });

    // Cónyuge
    const cEdad = document.querySelector('input[name="conyuge-edad"]');
    if (cEdad && cEdad.value) {
      asegurados.push({
        edad: parseInt(cEdad.value, 10),
        sexo: document.querySelector('input[name="conyuge-sexo"]:checked').value,
        perfil: "DEPENDIENTE",
      });
    }

    // Hijos
    const hijosEdades = document.querySelectorAll('input[name^="hijo-edad-"]');
    hijosEdades.forEach(input => {
      const idx = input.name.split('-')[2];
      const sexo = document.querySelector(`input[name="hijo-sexo-${idx}"]:checked`)?.value;
      if (input.value && sexo) {
        asegurados.push({ edad: parseInt(input.value, 10), sexo, perfil: "DEPENDIENTE" });
      }
    });

    return {
      id: generateUUID(),
      continuidad: document.querySelector('input[name="continuidad"]:checked').value,
      internacional: document.querySelector('input[name="cobertura"]:checked').value === "true",
      aseguradora: document.getElementById('aseguradora').value, // puede ser "TODAS"
      nombre: document.getElementById('nombre').value.toUpperCase(),
      apellidos: document.getElementById('apellidos').value.toUpperCase(),
      email: document.getElementById('email').value.toLowerCase(),
      asegurados
    };
  }

  // Estado UI
  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.classList.remove('hidden');
  }

  // Enviar a API (proxy si está activo; si falla, intenta directo)
  async function sendPayload(payload) {
    const urls = [];
    if (USE_PROXY) urls.push('/api/cotizar');
    urls.push(WEBHOOK_URL);
    let lastErr = null;
    for (const url of urls) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (r.ok) return await r.json();
        lastErr = new Error(`HTTP ${r.status} en ${url}`);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('No se pudo enviar');
  }

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = collectFormData();
    showStatus('Enviando cotización...', 'loading');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
      const data = await sendPayload(payload);
      // Guardar resultados y redirigir a la página de resultados
      sessionStorage.setItem('cotisalud_resultados', JSON.stringify(data));
      window.location.href = 'resultado.html';
    } catch (err) {
      console.error(err);
      showStatus('Error al enviar la cotización. Inténtalo nuevamente.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Cotizar Seguro';
    }
  });
});

// Funciones globales para eliminar tarjetas
function removeConyuge(btn){
  btn.closest('.card').remove();
  const addBtn = document.getElementById('addConyuge');
  addBtn.disabled = false;
  addBtn.textContent = '+ Agregar Cónyuge';
  // reset flag
  window.conyugeAdded = false;
}
function removeHijo(btn){ btn.closest('.card').remove(); }
