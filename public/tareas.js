// Gestor de Tareas - Frontend
// Modo oscuro incluido en los estilos

// Variables globales
var messageBox;
var tareasBody;
var serviceIndicator;
var serviceStatus;
var notificationContainer;
var socket;
var notificacionDuration = 5000; // Valor por defecto: 5 segundos
var celdaEnEdicion = null; // Para controlar la edición inline

// ============================================
// NOTIFICACIONES ESTILO DUNST
// ============================================

// Crear contenedor de notificaciones si no existe
function crearContenedorNotificaciones() {
    notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(notificationContainer);
    }
}

// Función para verificar si es horario silencioso (23:59 a 08:59)
function esHorarioSilencioso() {
    var ahora = new Date();
    var hora = ahora.getHours();
    var minutos = ahora.getMinutes();
    var horaActual = hora + (minutos / 100);
    
    // Horario silencioso: 23:59 a 08:59
    var horaInicioSilencio = 23.59;
    var horaFinSilencio = 8.59;
    
    // Rango que cruza la medianoche
    return horaActual >= horaInicioSilencio || horaActual <= horaFinSilencio;
}

// Función para crear una notificación estilo dunst
function crearNotificacion(mensaje, timestamp) {
    var notif = document.createElement('div');
    notif.className = 'dunst-notification';
    
    // Verificar si es horario silencioso
    var silencioso = esHorarioSilencioso();
    
    // Calcular tiempo transcurrido
    var tiempoTranscurrido = Math.floor((Date.now() - timestamp) / 1000);
    var tiempoTexto = tiempoTranscurrido + 's';
    
    // Elegir ícono según horario
    var icono = silencioso ? '🌙' : '🔔';
    var titulo = silencioso ? 'Recordatorio (Modo Silencioso)' : 'Recordatorio';
    var colorBorde = silencioso ? '#9b59b6' : '#66b0ff';
    
    notif.innerHTML = `
        <div class="dunst-icon">${icono}</div>
        <div class="dunst-content">
            <div class="dunst-title">${titulo}</div>
            <div class="dunst-message">${mensaje}</div>
            <div class="dunst-time">Hace ${tiempoTexto}</div>
        </div>
        <div class="dunst-close" onclick="this.parentElement.remove()">✕</div>
    `;
    
    notif.style.cssText = `
        background: #2d2d2d;
        border-left: 4px solid ${colorBorde};
        border-radius: 6px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        min-width: 300px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
        pointer-events: auto;
        border: 1px solid #404040;
        color: #e0e0e0;
        position: relative;
    `;
    
    if (silencioso) {
        notif.title = 'Modo silencioso activo (23:59 - 08:59) - Sin sonidos';
    }
    
    notificationContainer.appendChild(notif);
    
    var duracion = notificacionDuration;
    
    if (duracion > 0) {
        setTimeout(function() {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(function() {
                if (notif.parentNode) {
                    notif.remove();
                }
            }, 300);
        }, duracion);
    }
    
    var interval = setInterval(function() {
        if (!notif.parentNode) {
            clearInterval(interval);
            return;
        }
        var tiempo = Math.floor((Date.now() - timestamp) / 1000);
        var timeElement = notif.querySelector('.dunst-time');
        if (timeElement) {
            timeElement.textContent = 'Hace ' + tiempo + 's';
        }
    }, 1000);
}

// ============================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ============================================

function actualizarDuracionNotificaciones() {
    var select = document.getElementById('notifDuration');
    if (select) {
        notificacionDuration = parseInt(select.value);
        
        var span = document.getElementById('notifDurationValue');
        if (span) {
            var texto = notificacionDuration === 0 ? 'Permanente' : (notificacionDuration/1000) + ' segundos';
            span.textContent = '✓ Duración actual: ' + texto;
            span.style.color = '#51cf66';
            
            setTimeout(function() {
                span.textContent = '';
            }, 3000);
        }
        
        console.log('Duración de notificaciones actualizada a:', notificacionDuration);
    }
}

function probarNotificacion() {
    crearNotificacion('🔔 Notificación de prueba', Date.now());
}

function cargarConfiguracionNotificaciones() {
    var savedDuration = localStorage.getItem('notificacionDuration');
    if (savedDuration !== null) {
        notificacionDuration = parseInt(savedDuration);
        
        var select = document.getElementById('notifDuration');
        if (select) {
            select.value = notificacionDuration;
        }
        
        var span = document.getElementById('notifDurationValue');
        if (span) {
            var texto = notificacionDuration === 0 ? 'Permanente' : (notificacionDuration/1000) + ' segundos';
            span.textContent = '✓ Configuración cargada: ' + texto;
            span.style.color = '#66b0ff';
            
            setTimeout(function() {
                span.textContent = '';
            }, 3000);
        }
    }
}

function guardarConfiguracionNotificaciones() {
    localStorage.setItem('notificacionDuration', notificacionDuration);
    
    var span = document.getElementById('notifDurationValue');
    if (span) {
        span.textContent = '✓ Configuración guardada';
        span.style.color = '#51cf66';
        
        setTimeout(function() {
            span.textContent = '';
        }, 2000);
    }
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR UNA SOLA FILA
// ============================================

function actualizarFila(id) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/tareas/listar', true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var tareas = JSON.parse(xhr.responseText);
            var tarea = tareas.find(t => t.id == id);
            
            if (tarea) {
                var fila = document.querySelector(`#tareasBody tr[data-id="${id}"]`);
                if (fila) {
                    var celdas = fila.cells;
                    celdas[1].textContent = tarea.subject;
                    celdas[2].textContent = tarea.minutosInicio;
                    celdas[3].textContent = tarea.minutosIntervalo;
                    
                    var repeticionesTexto = tarea.repeticiones === 0 ? '∞' : tarea.repeticiones;
                    celdas[4].textContent = repeticionesTexto;
                    
                    // Actualizar botón de activar/desactivar
                    var botonActivar = fila.querySelector('.actions button:first-child');
                    if (botonActivar) {
                        botonActivar.textContent = tarea.activa === 1 ? 'Desactivar' : 'Activar';
                        botonActivar.className = tarea.activa === 1 ? 'warning' : 'success';
                    }
                    
                    // Actualizar estilo de la fila
                    if (tarea.activa === 0) {
                        fila.style.opacity = '0.6';
                        fila.style.backgroundColor = '#2d2d2d';
                    } else {
                        fila.style.opacity = '1';
                        fila.style.backgroundColor = '';
                    }
                }
            }
        }
    };
    
    xhr.send();
}

// ============================================
// FUNCIONES PARA ACTIVAR/DESACTIVAR TAREAS (OPTIMIZADO)
// ============================================

function toggleTarea(id) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/tareas/toggle?id=' + id, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var respuesta = JSON.parse(xhr.responseText);
            mostrarMensaje(respuesta.message, 'success');
            
            // OPTIMIZADO: Actualizar solo la fila en lugar de recargar toda la lista
            actualizarFila(id);
            
            // Actualizar contador de tareas en memoria
            actualizarEstado();
        } else {
            try {
                var error = JSON.parse(xhr.responseText);
                mostrarMensaje('Error: ' + error.Error, 'error');
            } catch (e) {
                mostrarMensaje('Error al cambiar estado de la tarea', 'error');
            }
        }
    };
    
    xhr.onerror = function() {
        mostrarMensaje('Error de conexión', 'error');
    };
    
    xhr.send();
}

// ============================================
// FUNCIÓN PARA ELIMINAR TAREA (OPTIMIZADO)
// ============================================

function eliminarTarea(id) {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) {
        return;
    }
    
    mostrarMensaje('Eliminando tarea...', 'info');
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/tareas/eliminar?id=' + id, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var respuesta = JSON.parse(xhr.responseText);
            mostrarMensaje(respuesta.message, 'success');
            
            // OPTIMIZADO: Eliminar la fila del DOM directamente
            var fila = document.querySelector(`#tareasBody tr[data-id="${id}"]`);
            if (fila) {
                fila.remove();
                
                // Si no quedan filas, mostrar mensaje
                if (document.querySelectorAll('#tareasBody tr').length === 0) {
                    tareasBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay tareas programadas</td></tr>';
                }
            }
            
            actualizarEstado();
        } else {
            try {
                var error = JSON.parse(xhr.responseText);
                mostrarMensaje('Error: ' + error.Error, 'error');
            } catch (e) {
                mostrarMensaje('Error al eliminar tarea', 'error');
            }
        }
    };
    
    xhr.onerror = function() {
        mostrarMensaje('Error de conexión', 'error');
    };
    
    xhr.send();
}

// ============================================
// EDICIÓN INLINE DE TAREAS (OPTIMIZADO)
// ============================================

function hacerEditable(celda, id, campo, valorActual) {
    if (celdaEnEdicion) {
        cancelarEdicion();
    }
    
    celdaEnEdicion = celda;
    
    var input = document.createElement('input');
    input.type = campo === 'subject' ? 'text' : 'number';
    input.value = campo === 'repeticiones' && valorActual === '∞' ? '0' : valorActual;
    input.style.width = '100%';
    input.style.background = '#3d3d3d';
    input.style.color = 'white';
    input.style.border = '2px solid #66b0ff';
    input.style.borderRadius = '4px';
    input.style.padding = '4px';
    input.style.fontSize = '14px';
    
    celda.textContent = '';
    celda.appendChild(input);
    input.focus();
    
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            guardarEdicion(id, campo, input.value);
        }
    });
    
    input.addEventListener('keyup', function(e) {
        if (e.key === 'Escape') {
            cancelarEdicion();
        }
    });
    
    input.addEventListener('blur', function() {
        setTimeout(function() {
            if (celdaEnEdicion) {
                cancelarEdicion();
            }
        }, 200);
    });
}

function cancelarEdicion() {
    if (celdaEnEdicion) {
        var fila = celdaEnEdicion.closest('tr');
        if (fila) {
            var id = fila.dataset.id;
            actualizarFila(id);
        }
        celdaEnEdicion = null;
    }
}

function guardarEdicion(id, campo, nuevoValor) {
    if (campo === 'subject') {
        if (!nuevoValor || nuevoValor.trim() === '') {
            mostrarMensaje('La descripción no puede estar vacía', 'error');
            cancelarEdicion();
            return;
        }
    } else {
        nuevoValor = parseInt(nuevoValor);
        
        if (isNaN(nuevoValor)) {
            mostrarMensaje('El valor debe ser un número', 'error');
            cancelarEdicion();
            return;
        }
        
        if (campo === 'minutosInicio' && nuevoValor < 0) {
            mostrarMensaje('Los minutos de inicio no pueden ser negativos', 'error');
            cancelarEdicion();
            return;
        }
        
        if (campo === 'minutosIntervalo' && nuevoValor < 1) {
            mostrarMensaje('El intervalo debe ser mayor a 0', 'error');
            cancelarEdicion();
            return;
        }
        
        if (campo === 'repeticiones' && nuevoValor < 0) {
            mostrarMensaje('Las repeticiones no pueden ser negativas', 'error');
            cancelarEdicion();
            return;
        }
    }
    
    mostrarMensaje('Guardando cambios...', 'info');
    
    var url = '/tareas/editar?' + 
        'id=' + id +
        '&campo=' + campo +
        '&valor=' + encodeURIComponent(nuevoValor);
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var respuesta = JSON.parse(xhr.responseText);
            mostrarMensaje(respuesta.message, 'success');
            
            if (celdaEnEdicion) {
                var valorMostrar = nuevoValor;
                if (campo === 'repeticiones' && nuevoValor === 0) {
                    valorMostrar = '∞';
                }
                celdaEnEdicion.textContent = valorMostrar;
                celdaEnEdicion = null;
            }
            
        } else {
            try {
                var error = JSON.parse(xhr.responseText);
                mostrarMensaje('Error: ' + error.Error, 'error');
            } catch (e) {
                mostrarMensaje('Error al guardar cambios', 'error');
            }
            cancelarEdicion();
        }
    };
    
    xhr.onerror = function() {
        mostrarMensaje('Error de conexión', 'error');
        cancelarEdicion();
    };
    
    xhr.send();
}

// Inicializar Socket.IO
function inicializarSocketIO() {
    socket = io();
    
    socket.on('notificacion-tarea', function(data) {
        console.log('Notificación recibida:', data);
        crearNotificacion(data.mensaje, data.timestamp);
    });
    
    socket.on('actualizacion-tarea', function(data) {
        console.log('Actualización de tarea recibida:', data);
        
        var fila = document.querySelector(`#tareasBody tr[data-id="${data.id}"]`);
        
        if (fila) {
            var celdas = fila.cells;
            
            if (data.activa !== undefined) {
                if (data.activa === 0) {
                    fila.style.opacity = '0.6';
                    fila.style.backgroundColor = '#2d2d2d';
                } else {
                    fila.style.opacity = '1';
                    fila.style.backgroundColor = '';
                }
                
                var botonActivar = fila.querySelector('.actions button:first-child');
                if (botonActivar) {
                    botonActivar.textContent = data.activa === 1 ? 'Desactivar' : 'Activar';
                    botonActivar.className = data.activa === 1 ? 'warning' : 'success';
                }
                return;
            }
            
            if (data.subject !== undefined) {
                celdas[1].textContent = data.subject;
            }
            if (data.minutosInicio !== undefined) {
                celdas[2].textContent = data.minutosInicio;
            }
            if (data.minutosIntervalo !== undefined) {
                celdas[3].textContent = data.minutosIntervalo;
            }
            if (data.repeticionesRestantes !== undefined) {
                var repeticionesTexto = data.repeticionesRestantes === 0 ? '∞' : data.repeticionesRestantes;
                celdas[4].textContent = repeticionesTexto;
            }
            
        } else {
            console.log('Fila no encontrada, recargando lista...');
            listarTareas();
        }
    });
}

// ============================================
// UTILIDADES
// ============================================

function mostrarMensaje(texto, tipo) {
    messageBox.className = 'message ' + tipo;
    messageBox.textContent = texto;
    messageBox.style.display = 'block';
    
    setTimeout(function() {
        messageBox.style.display = 'none';
    }, 5000);
}

function limpiarFormulario() {
    document.getElementById('subject').value = '';
    document.getElementById('minutosInicio').value = '1';
    document.getElementById('minutosIntervalo').value = '5';
    document.getElementById('repeticiones').value = '3';
}

// ============================================
// CONTROL DEL SERVICIO
// ============================================

function controlServicio(accion) {
    mostrarMensaje('Enviando comando: ' + accion + '...', 'info');
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/tareas/ejecutar?accion=' + accion, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var respuesta = JSON.parse(xhr.responseText);
            mostrarMensaje(respuesta.message, 'success');
            actualizarEstado();
        } else {
            mostrarMensaje('Error al ' + accion + ' el servicio', 'error');
        }
    };
    
    xhr.onerror = function() {
        mostrarMensaje('Error de conexión', 'error');
    };
    
    xhr.send();
}

function actualizarEstado() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/tareas/ejecutar?accion=estado', true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var estado = JSON.parse(xhr.responseText);
            
            if (estado.activo) {
                serviceIndicator.className = 'status-indicator active';
                serviceStatus.textContent = 'Estado: Activo (' + estado.tareasEnMemoria + ' tareas en seguimiento)';
            } else {
                serviceIndicator.className = 'status-indicator';
                serviceStatus.textContent = 'Estado: Detenido';
            }
        }
    };
    
    xhr.send();
}

// ============================================
// CRUD DE TAREAS
// ============================================

function listarTareas() {
    tareasBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Cargando tareas...</td></tr>';
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/tareas/listar', true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var tareas = JSON.parse(xhr.responseText);
            
            if (tareas.length === 0) {
                tareasBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay tareas programadas</td></tr>';
                return;
            }
            
            var html = '';
            tareas.forEach(function(tarea) {
                var repeticionesTexto = tarea.repeticiones === 0 ? '∞' : tarea.repeticiones;
                var filaStyle = tarea.activa === 0 ? 'style="opacity: 0.6; background-color: #2d2d2d;"' : '';
                var botonActivarTexto = tarea.activa === 1 ? 'Desactivar' : 'Activar';
                var botonActivarClase = tarea.activa === 1 ? 'warning' : 'success';
                
                html += `<tr data-id="${tarea.id}" ${filaStyle}>`;
                html += '<td>' + tarea.id + '</td>';
                html += `<td class="editable" ondblclick="hacerEditable(this, ${tarea.id}, 'subject', '${tarea.subject.replace(/'/g, "\\'")}')">${tarea.subject}</td>`;
                html += `<td class="editable" ondblclick="hacerEditable(this, ${tarea.id}, 'minutosInicio', ${tarea.minutosInicio})">${tarea.minutosInicio}</td>`;
                html += `<td class="editable" ondblclick="hacerEditable(this, ${tarea.id}, 'minutosIntervalo', ${tarea.minutosIntervalo})">${tarea.minutosIntervalo}</td>`;
                html += `<td class="editable repeticiones-cell" ondblclick="hacerEditable(this, ${tarea.id}, 'repeticiones', '${tarea.repeticiones}')">${repeticionesTexto}</td>`;
                html += '<td class="actions">';
                html += `<button class="${botonActivarClase}" onclick="toggleTarea(${tarea.id})">${botonActivarTexto}</button>`;
                html += '<button class="danger" onclick="eliminarTarea(' + tarea.id + ')">Eliminar</button>';
                html += '</td>';
                html += '</tr>';
            });
            
            tareasBody.innerHTML = html;
        } else {
            tareasBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error al cargar tareas</td></tr>';
        }
    };
    
    xhr.onerror = function() {
        tareasBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Error de conexión</td></tr>';
    };
    
    xhr.send();
}

function agregarTarea(event) {
    event.preventDefault();
    
    var subject = document.getElementById('subject').value.trim();
    var minutosInicio = parseInt(document.getElementById('minutosInicio').value);
    var minutosIntervalo = parseInt(document.getElementById('minutosIntervalo').value);
    var repeticiones = parseInt(document.getElementById('repeticiones').value);
    
    if (!subject) {
        mostrarMensaje('La descripción no puede estar vacía', 'error');
        return false;
    }
    
    if (isNaN(minutosInicio) || minutosInicio < 0) {
        mostrarMensaje('Minutos de inicio inválido', 'error');
        return false;
    }
    
    if (isNaN(minutosIntervalo) || minutosIntervalo < 1) {
        mostrarMensaje('El intervalo debe ser mayor a 0', 'error');
        return false;
    }
    
    if (isNaN(repeticiones) || repeticiones < 0) {
        mostrarMensaje('Número de repeticiones inválido', 'error');
        return false;
    }
    
    mostrarMensaje('Agregando tarea...', 'info');
    
    var url = '/tareas/agregar?' + 
        'subject=' + encodeURIComponent(subject) +
        '&minutosInicio=' + minutosInicio +
        '&minutosIntervalo=' + minutosIntervalo +
        '&repeticiones=' + repeticiones;
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var respuesta = JSON.parse(xhr.responseText);
            mostrarMensaje('Tarea agregada con éxito (ID: ' + respuesta.id + ')', 'success');
            limpiarFormulario();
            
            // Al agregar, sí necesitamos recargar la lista completa
            listarTareas();
            actualizarEstado();
        } else {
            try {
                var error = JSON.parse(xhr.responseText);
                mostrarMensaje('Error: ' + error.Error, 'error');
            } catch (e) {
                mostrarMensaje('Error al agregar tarea', 'error');
            }
        }
    };
    
    xhr.onerror = function() {
        mostrarMensaje('Error de conexión', 'error');
    };
    
    xhr.send();
    
    return false;
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    messageBox = document.getElementById('messageBox');
    tareasBody = document.getElementById('tareasBody');
    serviceIndicator = document.getElementById('serviceIndicator');
    serviceStatus = document.getElementById('serviceStatus');

    if (!messageBox || !tareasBody || !serviceIndicator || !serviceStatus) {
        console.error('No se encontraron todos los elementos necesarios');
        return;
    }

    crearContenedorNotificaciones();
    cargarConfiguracionNotificaciones();
    
    var durationSelect = document.getElementById('notifDuration');
    if (durationSelect) {
        durationSelect.addEventListener('change', function() {
            actualizarDuracionNotificaciones();
            guardarConfiguracionNotificaciones();
        });
    }
    
    inicializarSocketIO();
    listarTareas();
    actualizarEstado();
    
    setInterval(actualizarEstado, 30000);
    setInterval(function() {
        console.log('Verificando horario...', esHorarioSilencioso() ? 'Modo silencioso' : 'Modo normal');
    }, 60000);
});

(function añadirEstilosAnimaciones() {
    if (!document.getElementById('dunst-styles')) {
        var style = document.createElement('style');
        style.id = 'dunst-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
})();
