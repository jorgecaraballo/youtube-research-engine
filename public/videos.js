// public/videos.js - Lógica para la página de videos

// ============================================
// VARIABLES GLOBALES
// ============================================

var paginaActual = 1;
var itemsPorPagina = 20;
var totalPaginas = 1;
var totalVideos = 0;
var modoBusqueda = false;
var queryBusqueda = '';
var socket;

// Elementos del DOM
var videosGrid = document.getElementById('videosGrid');
var messageBox = document.getElementById('messageBox');
var totalVideosSpan = document.getElementById('totalVideos');
var ultimaActualizacionSpan = document.getElementById('ultimaActualizacion');
var paginacionInfo = document.getElementById('paginacionInfo');
var totalResultados = document.getElementById('totalResultados');
var paginaActualSpan = document.getElementById('paginaActual');
var paginaActualBottomSpan = document.getElementById('paginaActualBottom');

// Botones de paginación
var btnPrimera = document.getElementById('btnPrimera');
var btnAnterior = document.getElementById('btnAnterior');
var btnSiguiente = document.getElementById('btnSiguiente');
var btnUltima = document.getElementById('btnUltima');
var btnPrimeraBottom = document.getElementById('btnPrimeraBottom');
var btnAnteriorBottom = document.getElementById('btnAnteriorBottom');
var btnSiguienteBottom = document.getElementById('btnSiguienteBottom');
var btnUltimaBottom = document.getElementById('btnUltimaBottom');
var btnClearSearch = document.getElementById('clearSearchBtn');

// Selector de items por página
var itemsPorPaginaSelect = document.getElementById('itemsPorPagina');

// Input de búsqueda
var searchInput = document.getElementById('searchInput');

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function mostrarMensaje(texto, tipo) {
    messageBox.className = 'message ' + tipo;
    messageBox.textContent = texto;
    messageBox.style.display = 'block';
    
    setTimeout(function() {
        messageBox.style.display = 'none';
    }, 5000);
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return 'Fecha desconocida';
    
    var fecha = new Date(fechaISO);
    var ahora = new Date();
    var diffHoras = Math.floor((ahora - fecha) / (1000 * 60 * 60));
    
    if (diffHoras < 24) {
        return 'Hoy';
    } else if (diffHoras < 48) {
        return 'Ayer';
    } else {
        return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function formatearTimestamp(timestamp) {
    if (!timestamp) return 'Nunca';
    
    var fecha = new Date(timestamp * 1000);
    return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// FUNCIONES DE PAGINACIÓN
// ============================================

function actualizarBotonesPaginacion() {
    // Habilitar/deshabilitar botones según la página actual
    var esPrimera = paginaActual === 1;
    var esUltima = paginaActual === totalPaginas;
    
    // Botones superiores
    btnPrimera.disabled = esPrimera;
    btnAnterior.disabled = esPrimera;
    btnSiguiente.disabled = esUltima;
    btnUltima.disabled = esUltima;
    
    // Botones inferiores
    btnPrimeraBottom.disabled = esPrimera;
    btnAnteriorBottom.disabled = esPrimera;
    btnSiguienteBottom.disabled = esUltima;
    btnUltimaBottom.disabled = esUltima;
    
    // Actualizar texto de página actual
    var paginaTexto = 'Página ' + paginaActual + ' de ' + totalPaginas;
    paginaActualSpan.textContent = paginaTexto;
    paginaActualBottomSpan.textContent = paginaTexto;
}

function cambiarPagina(accion) {
    var nuevaPagina = paginaActual;
    
    switch(accion) {
        case 'primera':
            nuevaPagina = 1;
            break;
        case 'anterior':
            nuevaPagina = Math.max(1, paginaActual - 1);
            break;
        case 'siguiente':
            nuevaPagina = Math.min(totalPaginas, paginaActual + 1);
            break;
        case 'ultima':
            nuevaPagina = totalPaginas;
            break;
        default:
            return;
    }
    
    if (nuevaPagina !== paginaActual) {
        paginaActual = nuevaPagina;
        cargarVideos();
    }
}

function cambiarItemsPorPagina() {
    itemsPorPagina = parseInt(itemsPorPaginaSelect.value);
    paginaActual = 1; // Volver a la primera página
    cargarVideos();
}

// ============================================
// CARGA DE VIDEOS
// ============================================

function cargarVideos() {
    videosGrid.innerHTML = '<div class="loading">Cargando videos...</div>';
    
    var url;
    if (modoBusqueda && queryBusqueda) {
        url = '/videos/buscar?q=' + encodeURIComponent(queryBusqueda) +
              '&pagina=' + paginaActual +
              '&items=' + itemsPorPagina;
    } else {
        url = '/videos/listar?pagina=' + paginaActual + '&items=' + itemsPorPagina;
    }
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var respuesta = JSON.parse(xhr.responseText);
            mostrarVideos(respuesta);
        } else {
            videosGrid.innerHTML = '<div class="no-videos"><p>Error al cargar videos</p>' +
                                  '<button onclick="cargarVideos()">Reintentar</button></div>';
        }
    };
    
    xhr.onerror = function() {
        videosGrid.innerHTML = '<div class="no-videos"><p>Error de conexión</p>' +
                              '<button onclick="cargarVideos()">Reintentar</button></div>';
    };
    
    xhr.send();
}

function mostrarVideos(data) {
    // Actualizar variables de paginación
    totalVideos = data.total;
    totalPaginas = data.totalPaginas;
    
    // Actualizar información en la interfaz
    totalVideosSpan.textContent = totalVideos;
    
    var inicio = ((data.pagina - 1) * data.itemsPorPagina) + 1;
    var fin = Math.min(inicio + data.videos.length - 1, totalVideos);
    paginacionInfo.innerHTML = `Mostrando ${inicio}-${fin} de <span id="totalResultados">${totalVideos}</span> videos`;
    totalResultados.textContent = totalVideos;
    
    actualizarBotonesPaginacion();
    
    if (data.videos.length === 0) {
        if (modoBusqueda) {
            videosGrid.innerHTML = '<div class="no-videos"><p>No se encontraron videos para "' + queryBusqueda + '"</p>' +
                                  '<button onclick="limpiarBusqueda()">Limpiar búsqueda</button></div>';
        } else {
            videosGrid.innerHTML = '<div class="no-videos"><p>No hay videos disponibles</p>' +
                                  '<button class="success" onclick="actualizarVideos()">Actualizar desde YouTube</button></div>';
        }
        return;
    }
    
    var html = '';
    data.videos.forEach(function(video) {
        html += crearTarjetaVideo(video);
    });
    
    videosGrid.innerHTML = html;
}

function crearTarjetaVideo(video) {
    var fechaFormateada = formatearFecha(video.fecha_publicacion);
    var thumbnail = video.thumbnail_url || 'https://img.youtube.com/vi/' + video.video_id + '/maxresdefault.jpg';
    
    return `
        <div class="video-card" data-video-id="${video.video_id}">
            <div class="video-thumbnail">
                <img src="${thumbnail}" alt="${video.titulo}" loading="lazy">
                <span class="video-duration">▶️</span>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.titulo}</h3>
                <div class="video-meta">
                    <span class="video-date">${fechaFormateada}</span>
                </div>
                <div class="video-actions">
                    <button class="watch-button" onclick="verVideo('${video.video_id}')">▶ Ver en YouTube</button>
                    <button onclick="copiarEnlace('${video.video_id}')">🔗 Copiar enlace</button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// ACCIONES DE VIDEOS
// ============================================

function verVideo(videoId) {
    window.open('https://www.youtube.com/watch?v=' + videoId, '_blank');
}

function copiarEnlace(videoId) {
    var enlace = 'https://www.youtube.com/watch?v=' + videoId;
    
    // Usar la API del portapapeles moderna
    navigator.clipboard.writeText(enlace).then(function() {
        mostrarMensaje('✅ Enlace copiado al portapapeles', 'success');
    }).catch(function(err) {
        // Fallback para navegadores antiguos
        var textarea = document.createElement('textarea');
        textarea.value = enlace;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        mostrarMensaje('✅ Enlace copiado al portapapeles', 'success');
    });
}

// ============================================
// ACTUALIZACIÓN DESDE YOUTUBE
// ============================================

function actualizarVideos() {
    var btn = document.getElementById('btnActualizar');
    var textoOriginal = btn.innerHTML;
    btn.innerHTML = '⏳ Actualizando...';
    btn.disabled = true;
    
    mostrarMensaje('Iniciando actualización desde YouTube...', 'info');
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/videos/actualizar', true);
    
    xhr.onload = function() {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
        
        if (xhr.status === 200) {
            var respuesta = JSON.parse(xhr.responseText);
            mostrarMensaje(respuesta.mensaje + ' (' + respuesta.detalles.insertados + ' videos)', 'success');
            
            // Recargar estadísticas y videos
            cargarEstadisticas();
            cargarVideos();
        } else {
            try {
                var error = JSON.parse(xhr.responseText);
                mostrarMensaje('Error: ' + error.Error, 'error');
            } catch (e) {
                mostrarMensaje('Error al actualizar videos', 'error');
            }
        }
    };
    
    xhr.onerror = function() {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
        mostrarMensaje('Error de conexión', 'error');
    };
    
    xhr.send();
}

// ============================================
// ESTADÍSTICAS
// ============================================

function cargarEstadisticas() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/videos/estadisticas', true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            var stats = JSON.parse(xhr.responseText);
            totalVideosSpan.textContent = stats.totalVideos;
            
            if (stats.ultimaActualizacion) {
                ultimaActualizacionSpan.textContent = formatearTimestamp(stats.ultimaActualizacion);
            } else {
                ultimaActualizacionSpan.textContent = 'Nunca';
            }
        }
    };
    
    xhr.send();
}

// ============================================
// BÚSQUEDA
// ============================================

function buscarVideos() {
    var query = searchInput.value.trim();
    
    if (query === '') {
        mostrarMensaje('Ingresa un término de búsqueda', 'info');
        return;
    }
    
    modoBusqueda = true;
    queryBusqueda = query;
    paginaActual = 1;
    
    btnClearSearch.style.display = 'inline-block';
    cargarVideos();
}

function limpiarBusqueda() {
    searchInput.value = '';
    modoBusqueda = false;
    queryBusqueda = '';
    paginaActual = 1;
    
    btnClearSearch.style.display = 'none';
    cargarVideos();
}

// ============================================
// RECARGAR LISTA
// ============================================

function recargarVideos() {
    modoBusqueda = false;
    queryBusqueda = '';
    searchInput.value = '';
    btnClearSearch.style.display = 'none';
    paginaActual = 1;
    cargarVideos();
}

// ============================================
// SOCKET.IO PARA NOTIFICACIONES
// ============================================

function inicializarSocketIO() {
    socket = io();
    
    socket.on('notificacion-tarea', function(data) {
        // Si la notificación es de actualización de videos, mostrar un indicador
        if (data.id && data.id.startsWith('youtube-')) {
            mostrarMensaje('📹 ' + data.mensaje, 'info');
            // Recargar estadísticas y videos después de una actualización automática
            cargarEstadisticas();
            cargarVideos();
        } else {
            // Crear notificación estilo dunst (podemos reutilizar la función si existe)
            if (typeof crearNotificacion === 'function') {
                crearNotificacion(data.mensaje, data.timestamp);
            } else {
                // Fallback simple
                console.log('Notificación:', data);
            }
        }
    });
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar estadísticas iniciales
    cargarEstadisticas();
    
    // Cargar primera página de videos
    cargarVideos();
    
    // Inicializar Socket.IO
    inicializarSocketIO();
    
    // Configurar evento de enter en el campo de búsqueda
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarVideos();
        }
    });
    
    // Actualizar estadísticas cada 5 minutos
    setInterval(cargarEstadisticas, 5 * 60 * 1000);
});
