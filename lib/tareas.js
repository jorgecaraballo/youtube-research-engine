'use strict';
// Módulo para gestión de tareas programadas
// Dependencies
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const util = require('util');
const debug = util.debuglog('tareas');

// Definir la ruta de la base de datos
const DB_PATH = path.join(__dirname, '../tareas.db');

// Container para el módulo
var tareas = {};

// Inicializar la base de datos
tareas.inicializar = function(callback) {
    const db = new sqlite3.Database(DB_PATH, function(err) {
        if (err) {
            debug('Error al abrir la base de datos:', err);
            callback(err);
            return;
        }
        
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS tareas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subject TEXT NOT NULL,
                minutosInicio INTEGER NOT NULL,
                minutosIntervalo INTEGER NOT NULL,
                repeticiones INTEGER NOT NULL,
                activa INTEGER DEFAULT 1
            )
        `;
        
        db.run(createTableSQL, function(err) {
            db.close();
            if (err) {
                debug('Error al crear tabla:', err);
                callback(err);
            } else {
                debug('Base de datos inicializada correctamente');
                callback(null);
            }
        });
    });
};

// Container para los métodos internos (por verbo HTTP o funcionalidad)
tareas._metodos = {};

// ============================================
// MÉTODOS CRUD (para usar desde handlers)
// ============================================

// Listar todas las tareas
tareas._metodos.listar = function(callback) {
    const db = new sqlite3.Database(DB_PATH);
    
    db.all('SELECT * FROM tareas ORDER BY id', function(err, rows) {
        db.close();
        if (err) {
            debug('Error al listar tareas:', err);
            callback(err, null);
        } else {
            callback(null, rows);
        }
    });
};

// Agregar una nueva tarea
tareas._metodos.agregar = function(params, callback) {
    // Validar parámetros
    var subject = typeof(params.subject) == 'string' && params.subject.trim().length > 0 ? params.subject.trim() : false;
    var minutosInicio = typeof(params.minutosInicio) == 'number' && params.minutosInicio >= 0 ? params.minutosInicio : false;
    var minutosIntervalo = typeof(params.minutosIntervalo) == 'number' && params.minutosIntervalo > 0 ? params.minutosIntervalo : false;
    var repeticiones = typeof(params.repeticiones) == 'number' && params.repeticiones >= 0 ? params.repeticiones : false;
    
    if (!(subject && minutosInicio !== false && minutosIntervalo && repeticiones !== false)) {
        callback('Parámetros inválidos', null);
        return;
    }
    
    const db = new sqlite3.Database(DB_PATH);
    
    const insertSQL = `
        INSERT INTO tareas (subject, minutosInicio, minutosIntervalo, repeticiones)
        VALUES (?, ?, ?, ?)
    `;
    
    db.run(insertSQL, [subject, minutosInicio, minutosIntervalo, repeticiones], function(err) {
        db.close();
        if (err) {
            debug('Error al agregar tarea:', err);
            callback(err, null);
        } else {
            callback(null, { id: this.lastID, message: 'Tarea agregada con éxito' });
        }
    });
};

// Eliminar una tarea
tareas._metodos.eliminar = function(id, callback) {
    id = typeof(id) == 'number' && id > 0 ? id : false;
    
    if (!id) {
        callback('ID inválido', null);
        return;
    }
    
    const db = new sqlite3.Database(DB_PATH);
    
    db.run('DELETE FROM tareas WHERE id = ?', id, function(err) {
        db.close();
        if (err) {
            debug('Error al eliminar tarea:', err);
            callback(err, null);
        } else if (this.changes === 0) {
            callback('Tarea no encontrada', null);
        } else {
            callback(null, { message: 'Tarea eliminada con éxito' });
        }
    });
};

// ============================================
// NUEVO MÉTODO: Activar/Desactivar tarea
// ============================================
tareas._metodos.toggleActiva = function(id, callback) {
    id = typeof(id) == 'number' && id > 0 ? id : false;
    
    if (!id) {
        callback('ID inválido', null);
        return;
    }
    
    const db = new sqlite3.Database(DB_PATH);
    
    // Primero obtener el estado actual
    db.get('SELECT activa FROM tareas WHERE id = ?', id, function(err, row) {
        if (err) {
            db.close();
            debug('Error al obtener estado de tarea:', err);
            callback(err, null);
            return;
        }
        
        if (!row) {
            db.close();
            callback('Tarea no encontrada', null);
            return;
        }
        
        var nuevoEstado = row.activa === 1 ? 0 : 1;
        
        db.run('UPDATE tareas SET activa = ? WHERE id = ?', [nuevoEstado, id], function(err) {
            db.close();
            if (err) {
                debug('Error al cambiar estado de tarea:', err);
                callback(err, null);
            } else {
                // Si estamos reactivando una tarea, necesitamos reiniciar su estado en memoria
                if (nuevoEstado === 1 && tareas._estadoTareas && tareas._estadoTareas[id]) {
                    // Obtener la tarea para reiniciar sus repeticiones
                    const db2 = new sqlite3.Database(DB_PATH);
                    db2.get('SELECT repeticiones FROM tareas WHERE id = ?', id, function(err, tarea) {
                        db2.close();
                        if (!err && tarea) {
                            tareas._estadoTareas[id].repeticionesRestantes = tarea.repeticiones;
                            debug('Estado de tarea reiniciado en memoria:', id);
                        }
                    });
                }
                
                // Emitir actualización
                tareas._emitirActualizacionTarea({
                    id: id,
                    activa: nuevoEstado
                });
                
                callback(null, { 
                    id: id, 
                    activa: nuevoEstado,
                    message: nuevoEstado === 1 ? 'Tarea activada' : 'Tarea desactivada'
                });
            }
        });
    });
};

// ============================================
// NUEVO MÉTODO: Editar tarea
// ============================================
tareas._metodos.editar = function(params, callback) {
    // Validar parámetros
    var id = typeof(params.id) == 'number' && params.id > 0 ? params.id : false;
    var campo = typeof(params.campo) == 'string' ? params.campo : false;
    var valor = params.valor;

    if (!id || !campo) {
        callback('Parámetros inválidos', null);
        return;
    }

    // Validar campos permitidos
    var camposPermitidos = ['subject', 'minutosInicio', 'minutosIntervalo', 'repeticiones'];
    if (camposPermitidos.indexOf(campo) === -1) {
        callback('Campo no válido', null);
        return;
    }

    // Validar según el tipo de campo
    if (campo === 'subject') {
        if (typeof(valor) != 'string' || valor.trim().length === 0) {
            callback('Descripción inválida', null);
            return;
        }
        valor = valor.trim();
    } else {
        // Campos numéricos
        valor = parseInt(valor);
        if (isNaN(valor)) {
            callback('Valor debe ser numérico', null);
            return;
        }

        if (campo === 'minutosInicio' && valor < 0) {
            callback('Minutos de inicio no pueden ser negativos', null);
            return;
        }

        if (campo === 'minutosIntervalo' && valor < 1) {
            callback('Intervalo debe ser mayor a 0', null);
            return;
        }

        if (campo === 'repeticiones' && valor < 0) {
            callback('Repeticiones no pueden ser negativas', null);
            return;
        }
    }

    const db = new sqlite3.Database(DB_PATH);

    // Si se están cambiando las repeticiones y la tarea está activa, actualizar también en memoria
    if (campo === 'repeticiones' && tareas._estadoTareas && tareas._estadoTareas[id]) {
        tareas._estadoTareas[id].repeticionesRestantes = valor;
    }

    // Si se cambia el intervalo o minutos de inicio, podríamos necesitar recalcular
    if ((campo === 'minutosIntervalo' || campo === 'minutosInicio') && tareas._estadoTareas && tareas._estadoTareas[id]) {
        // No recalculamos la próxima ejecución para no interrumpir el ciclo actual
        // Pero guardamos el nuevo valor para futuras iteraciones
        debug('Parámetros de tiempo actualizados para tarea:', id);
    }

    const updateSQL = `UPDATE tareas SET ${campo} = ? WHERE id = ?`;

    db.run(updateSQL, [valor, id], function(err) {
        db.close();
        if (err) {
            debug('Error al editar tarea:', err);
            callback(err, null);
        } else if (this.changes === 0) {
            callback('Tarea no encontrada', null);
        } else {
            // Emitir actualización para que el frontend se entere
            tareas._emitirActualizacionTarea({
                id: id,
                [campo]: valor
            });

            callback(null, {
                id: id,
                campo: campo,
                valor: valor,
                message: 'Tarea actualizada con éxito'
            });
        }
    });
};

// ============================================
// SERVICIO DE EJECUCIÓN DE TAREAS (background)
// ============================================

// Estado del servicio
tareas.servicioActivo = false;
tareas.intervaloId = null;

// Función para ejecutar una notificación de tarea
tareas._ejecutarNotificacion = function(subject) {
    debug('Ejecutando notificación:', subject);
    
    const http = require('http');
    const { exec } = require('child_process');
    
    const mensaje = encodeURIComponent('Recordatorio: ' + subject);
    
    // ============================================
    // VERIFICAR HORARIO PARA SONIDOS (23:59 a 08:59)
    // ============================================
    var ahora = new Date();
    var hora = ahora.getHours();
    var minutos = ahora.getMinutes();
    var horaActual = hora + (minutos / 100); // Para comparación más precisa
    
    // Definir horario silencioso: 23:59 a 08:59
    var horaInicioSilencio = 23.59; // 23:59
    var horaFinSilencio = 8.59;      // 08:59
    
    var esHorarioSilencioso;
    
    // Rango que cruza la medianoche (23:59 a 08:59)
    esHorarioSilencioso = horaActual >= horaInicioSilencio || horaActual <= horaFinSilencio;
    
    debug('Hora actual:', horaActual, 'Horario silencioso:', esHorarioSilencioso);
    
    // Opción 1: Notificación local (siempre, incluso en horario silencioso)
    exec(`notify-send 'Recordatorio' '${subject}'`, (err) => {
        if (err) debug('Error en notify-send:', err);
    });
    
    // Opción 2: Notificación web (siempre, incluso en horario silencioso)
    const req3 = http.request({
        hostname: 'localhost',
        port: 8090,
        path: '/api/notificar-websocket?mensaje=' + encodeURIComponent(subject),
        method: 'GET',
        timeout: 3000
    }, (res) => {
        debug('Notificación web enviada, status:', res.statusCode);
    });
    
    req3.on('error', (err) => {
        debug('Error al enviar notificación web:', err);
    });
    
    req3.end();
    
    // ============================================
    // SOLO REPRODUCIR SONIDOS FUERA DEL HORARIO SILENCIOSO
    // ============================================
    if (!esHorarioSilencioso) {
        debug('Reproduciendo sonidos (fuera de horario silencioso)');
        
        // Opción 3: Sonido remoto
        const req = http.request({
            hostname: 'localhost',
            port: 8090,
            path: '/sonidos?sonido=31',
            method: 'GET',
            timeout: 3000
        }, (res) => {
            debug('Sonido reproducido, status:', res.statusCode);
        });
        
        req.on('error', (err) => {
            debug('Error al reproducir sonido:', err);
        });
        
        req.end();
        
        // Opción 4: Notificación por el otro sistema (opcional)
        const req2 = http.request({
            hostname: 'localhost',
            port: 8090,
            path: '/notificacion?mensaje=' + mensaje,
            method: 'GET',
            timeout: 3000
        }, (res) => {
            debug('Notificación enviada, status:', res.statusCode);
        });
        
        req2.on('error', (err) => {
            debug('Error al enviar notificación:', err);
        });
        
        req2.end();
    } else {
        debug('Horario silencioso activo: sonidos omitidos');
    }
};


// Función para emitir actualizaciones de tareas (mejorada)
tareas._emitirActualizacionTarea = function(actualizacion) {
    const http = require('http');

    const data = JSON.stringify(actualizacion);

    const req = http.request({
        hostname: 'localhost',
        port: 8090,
        path: '/api/actualizar-tarea',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        },
        timeout: 3000
    }, (res) => {
        debug('Actualización de tarea enviada, status:', res.statusCode);
    });

    req.on('error', (err) => {
        debug('Error al enviar actualización de tarea:', err);
    });

    req.write(data);
    req.end();
};

// Verificar tareas pendientes
tareas._verificarTareas = function() {
    debug('Verificando tareas pendientes...');
    
    const db = new sqlite3.Database(DB_PATH);
    const ahora = Math.floor(Date.now() / 1000); // Timestamp actual en segundos
    
    // Necesitamos almacenar el estado de las tareas entre verificaciones
    // Para simplificar, usaremos un objeto global en memoria
    if (!tareas._estadoTareas) {
        tareas._estadoTareas = {};
    }
    
    db.all('SELECT * FROM tareas WHERE activa = 1', function(err, rows) {
        if (err) {
            debug('Error al verificar tareas:', err);
            db.close();
            return;
        }
        
        rows.forEach(function(tarea) {
            const id = tarea.id;
            
            // Inicializar estado si no existe
            if (!tareas._estadoTareas[id]) {
                tareas._estadoTareas[id] = {
                    proximaEjecucion: ahora + (tarea.minutosInicio * 60),
                    repeticionesRestantes: tarea.repeticiones
                };
            }
            
            const estado = tareas._estadoTareas[id];
            
            // Verificar si es momento de ejecutar
            if (ahora >= estado.proximaEjecucion && estado.repeticionesRestantes > 0) {
                debug('Ejecutando tarea:', tarea.subject);
                
                // Ejecutar notificación
                tareas._ejecutarNotificacion(tarea.subject);
                
                // Actualizar estado
                estado.proximaEjecucion = ahora + (tarea.minutosIntervalo * 60);
                estado.repeticionesRestantes--;
                
                // Emitir actualización de repeticiones
                tareas._emitirActualizacionTarea({
                    id: id,
                    repeticionesRestantes: estado.repeticionesRestantes,
                    activa: estado.repeticionesRestantes > 0 ? 1 : 0
                });
                
                // Si ya no quedan repeticiones, desactivar la tarea
                if (estado.repeticionesRestantes <= 0) {
                    db.run('UPDATE tareas SET activa = 0 WHERE id = ?', id, function(err) {
                        if (err) debug('Error al desactivar tarea:', err);
                    });
                } else {
                    // Si aún quedan repeticiones, actualizar la base de datos
                    db.run('UPDATE tareas SET repeticiones = ? WHERE id = ?', 
                        [estado.repeticionesRestantes, id], 
                        function(err) {
                            if (err) debug('Error al actualizar repeticiones:', err);
                        }
                    );
                }
            }
        });
        
        db.close();
    });
};

// Iniciar el servicio de ejecución de tareas
tareas.iniciarServicio = function(callback) {
    if (tareas.servicioActivo) {
        callback(null, { message: 'El servicio ya está activo' });
        return;
    }
    
    // Verificar cada 10 segundos (como en tu app C)
    tareas.intervaloId = setInterval(tareas._verificarTareas, 10000);
    tareas.servicioActivo = true;
    
    debug('Servicio de tareas iniciado');
    callback(null, { message: 'Servicio iniciado correctamente' });
};

// Detener el servicio
tareas.detenerServicio = function(callback) {
    if (!tareas.servicioActivo) {
        callback(null, { message: 'El servicio ya está detenido' });
        return;
    }
    
    clearInterval(tareas.intervaloId);
    tareas.intervaloId = null;
    tareas.servicioActivo = false;
    
    debug('Servicio de tareas detenido');
    callback(null, { message: 'Servicio detenido correctamente' });
};

// Obtener estado del servicio
tareas.estadoServicio = function(callback) {
    callback(null, {
        activo: tareas.servicioActivo,
        tareasEnMemoria: tareas._estadoTareas ? Object.keys(tareas._estadoTareas).length : 0
    });
};

// Inicializar automáticamente al cargar el módulo
tareas.inicializar(function(err) {
    if (err) {
        console.error('Error al inicializar base de datos de tareas:', err);
    } else {
        console.log('Módulo de tareas inicializado correctamente');
    }
});

// Exportar el módulo
module.exports = tareas;
