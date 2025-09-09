// URL del webhook
const WEBHOOK_URL = 'https://primary-production-e1c81.up.railway.app/webhook/ce2177d6-7da8-44b6-9781-107ad6844bf1';

// Contadores y estado
let hijoCounter = 0;
let conyugeAdded = false;

// Función para generar UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('cotizadorForm');
    const addConyugeBtn = document.getElementById('addConyuge');
    const addHijoBtn = document.getElementById('addHijo');
    const conyugeContainer = document.getElementById('conyugeContainer');
    const hijosContainer = document.getElementById('hijosContainer');
    const submitBtn = document.getElementById('submitBtn');
    const status = document.getElementById('status');

    // Agregar cónyuge
    addConyugeBtn.addEventListener('click', function() {
        if (!conyugeAdded) {
            const conyugeCard = createConyugeCard();
            conyugeContainer.appendChild(conyugeCard);
            conyugeAdded = true;
            addConyugeBtn.disabled = true;
            addConyugeBtn.textContent = '✓ Cónyuge Agregado';
        }
    });

    // Agregar hijo
    addHijoBtn.addEventListener('click', function() {
        hijoCounter++;
        const hijoCard = createHijoCard(hijoCounter);
        hijosContainer.appendChild(hijoCard);
    });

    // Envío del formulario
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar formulario
        if (!validateForm()) {
            return;
        }

        // Recopilar datos
        const formData = collectFormData();
        
        // Mostrar estado de carga
        showStatus('Enviando cotización...', 'loading');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            // Enviar datos al webhook
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showStatus('¡Cotización enviada correctamente! Te contactaremos pronto.', 'success');
                form.reset();
                resetForm();
            } else {
                throw new Error(`Error del servidor: ${response.status}`);
            }
        } catch (error) {
            console.error('Error:', error);
            showStatus('Error al enviar la cotización. Por favor, inténtalo de nuevo.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Cotizar Seguro';
        }
    });

    function createConyugeCard() {
        const card = document.createElement('div');
        card.className = 'asegurado-card';
        card.innerHTML = `
            <button type="button" class="btn-remove" onclick="removeConyuge(this)">×</button>
            <h3>Cónyuge</h3>
            <div class="asegurado-fields">
                <div class="form-group">
                    <label>Edad *</label>
                    <input type="number" name="conyuge-edad" min="18" max="99" required>
                </div>
                <div class="form-group">
                    <label>Sexo *</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="conyuge-sexo" value="HOMBRE" required>
                            <span>Hombre</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="conyuge-sexo" value="MUJER" required>
                            <span>Mujer</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    function createHijoCard(id) {
        const card = document.createElement('div');
        card.className = 'asegurado-card';
        card.innerHTML = `
            <button type="button" class="btn-remove" onclick="removeHijo(this)">×</button>
            <h3>Hijo ${id}</h3>
            <div class="asegurado-fields">
                <div class="form-group">
                    <label>Edad *</label>
                    <input type="number" name="hijo-edad-${id}" min="0" max="25" required>
                </div>
                <div class="form-group">
                    <label>Sexo *</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="hijo-sexo-${id}" value="HOMBRE" required>
                            <span>Hombre</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="hijo-sexo-${id}" value="MUJER" required>
                            <span>Mujer</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    function validateForm() {
        // Validar edad del titular
        const titularEdad = parseInt(document.getElementById('titular-edad').value);
        if (titularEdad < 0 || titularEdad > 99) {
            showStatus('La edad del titular debe estar entre 0 y 99 años.', 'error');
            return false;
        }

        // Validar edad del cónyuge si existe
        const conyugeEdad = document.querySelector('input[name="conyuge-edad"]');
        if (conyugeEdad) {
            const edad = parseInt(conyugeEdad.value);
            if (edad < 18 || edad > 99) {
                showStatus('La edad del cónyuge debe estar entre 18 y 99 años.', 'error');
                return false;
            }
        }

        // Validar edad de hijos
        const hijosEdades = document.querySelectorAll('input[name^="hijo-edad-"]');
        for (let input of hijosEdades) {
            const edad = parseInt(input.value);
            if (edad < 0 || edad > 25) {
                showStatus('La edad de los hijos debe estar entre 0 y 25 años.', 'error');
                return false;
            }
        }

        return true;
    }

    function collectFormData() {
        const asegurados = [];
        
        // Titular
        const titularEdad = parseInt(document.getElementById('titular-edad').value);
        const titularSexo = document.querySelector('input[name="titular-sexo"]:checked').value;
        asegurados.push({
            edad: titularEdad,
            sexo: titularSexo,
            perfil: "TITULAR"
        });

        // Cónyuge
        const conyugeEdad = document.querySelector('input[name="conyuge-edad"]');
        if (conyugeEdad && conyugeEdad.value) {
            const conyugeSexo = document.querySelector('input[name="conyuge-sexo"]:checked').value;
            asegurados.push({
                edad: parseInt(conyugeEdad.value),
                sexo: conyugeSexo,
                perfil: "TITULAR"
            });
        }

        // Hijos
        const hijosEdades = document.querySelectorAll('input[name^="hijo-edad-"]');
        hijosEdades.forEach(input => {
            const id = input.name.split('-')[2];
            const hijoSexo = document.querySelector(`input[name="hijo-sexo-${id}"]:checked`).value;
            asegurados.push({
                edad: parseInt(input.value),
                sexo: hijoSexo,
                perfil: "DEPENDIENTE"
            });
        });

        return {
            id: generateUUID(),
            continuidad: document.querySelector('input[name="continuidad"]:checked').value,
            internacional: document.querySelector('input[name="cobertura"]:checked').value === "true",
            aseguradora: document.getElementById('aseguradora').value,
            nombre: document.getElementById('nombre').value.toUpperCase(),
            apellidos: document.getElementById('apellidos').value.toUpperCase(),
            email: document.getElementById('email').value.toLowerCase(),
            asegurados: asegurados
        };
    }

    function resetForm() {
        conyugeContainer.innerHTML = '';
        hijosContainer.innerHTML = '';
        hijoCounter = 0;
        conyugeAdded = false;
        addConyugeBtn.disabled = false;
        addConyugeBtn.textContent = '+ Agregar Cónyuge';
        status.classList.add('hidden');
    }

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;
        status.classList.remove('hidden');
        
        if (type === 'success') {
            setTimeout(() => {
                status.classList.add('hidden');
            }, 8000);
        }
    }
});

// Funciones globales para remover elementos
function removeConyuge(btn) {
    btn.parentElement.remove();
    conyugeAdded = false;
    document.getElementById('addConyuge').disabled = false;
    document.getElementById('addConyuge').textContent = '+ Agregar Cónyuge';
}

function removeHijo(btn) {
    btn.parentElement.remove();
}