'use strict';
// Módulo para integración con YouTube API
// Dependencies
const https = require('https');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const url = require('url');
const util = require('util');
const debug = util.debuglog('youtube');

// Al principio de youtube.js, después de los requires
const config = require('./config');
const API_KEY = config.youtube.apiKey; // Tu API key
const CHANNEL_ID = config.youtube.channelId; // Echoes_ES

const helpers = require('./helpers'); // <--- ESTA ES LA QUE FALTA

// Configuración (idealmente vendría de config.js)
const DB_PATH = path.join(__dirname, '../youtube.db');

// Container para el módulo
var youtube = {};

// ============================================
// INICIALIZACIÓN
// ============================================

youtube.inicializar = function(callback) {
    const db = new sqlite3.Database(DB_PATH, function(err) {
        if (err) {
            debug('Error al abrir la base de datos:', err);
            callback(err);
            return;
        }
        
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                video_id TEXT UNIQUE NOT NULL,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                fecha_publicacion TEXT,
                thumbnail_url TEXT,
                fecha_obtencion INTEGER DEFAULT (strftime('%s', 'now'))
            )
        `;
        
        db.run(createTableSQL, function(err) {
            db.close();
            if (err) {
                debug('Error al crear tabla:', err);
                callback(err);
            } else {
                debug('Base de datos YouTube inicializada correctamente');
                callback(null);
            }
        });
    });
};

// ============================================
// FUNCIÓN AUXILIAR PARA LLAMADAS A LA API
// ============================================

youtube._llamadaAPI = function(apiUrl, callback) {
    debug('Llamando a API:', apiUrl);

    https.get(apiUrl, function(res) {
        var data = '';

        res.on('data', function(chunk) {
            data += chunk;
        });

        res.on('end', function() {
            try {
                var json = JSON.parse(data);

                if (json.error) {
                    debug('Error en API:', json.error);
                    callback({
                        code: json.error.code,
                        message: json.error.message,
                        errors: json.error.errors
                    }, null);
                } else {
                    callback(null, json);
                }
            } catch (e) {
                debug('Error al parsear JSON:', e);
                debug('Data recibida:', data.substring(0, 200));
                callback('Error al parsear respuesta de la API: ' + e.message, null);
            }
        });

    }).on('error', function(err) {
        debug('Error en petición HTTPS:', err);
        callback({
            message: 'Error de conexión: ' + err.message,
            code: 'CONNECTION_ERROR'
        }, null);
    });
};

// ============================================
// PASO 0: OBTENER CHANNEL ID (si es necesario)
// ============================================

youtube.obtenerChannelId = function(nombreCanal, callback) {
    var apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(nombreCanal)}&key=${API_KEY}`;
    
    youtube._llamadaAPI(apiUrl, function(err, data) {
        if (err) {
            callback(err, null);
            return;
        }
        
        if (data.items && data.items.length > 0) {
            var channelId = data.items[0].snippet.channelId;
            debug('Channel ID encontrado:', channelId);
            callback(null, channelId);
        } else {
            callback('No se encontró el canal', null);
        }
    });
};

// ============================================
// PASO 1: OBTENER UPLOADS PLAYLIST ID
// ============================================

youtube._obtenerUploadsPlaylistId = function(channelId, callback) {
    debug('Obteniendo uploads playlistId para channel:', channelId);

    var apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`;

    youtube._llamadaAPI(apiUrl, function(err, data) {
        if (err) {
            debug('Error en llamada API:', err);
            callback(err, null);
            return;
        }

        if (!data) {
            callback('No se recibieron datos de la API', null);
            return;
        }

        if (data.error) {
            debug('Error en respuesta API:', data.error);
            callback(data.error.message || 'Error desconocido de la API', null);
            return;
        }

        if (data.items && data.items.length > 0) {
            var uploadsPlaylistId = data.items[0].contentDetails.relatedPlaylists.uploads;
            debug('Uploads playlist ID:', uploadsPlaylistId);
            callback(null, uploadsPlaylistId);
        } else {
            debug('No se encontraron items en la respuesta');
            callback('No se encontró el playlist de uploads', null);
        }
    });
};

// ============================================
// PASO 2: OBTENER VIDEOS CON PAGINACIÓN
// ============================================

youtube._obtenerPaginaVideos = function(playlistId, pageToken, callback) {
    var apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${API_KEY}`;
    
    if (pageToken) {
        apiUrl += `&pageToken=${pageToken}`;
    }
    
    youtube._llamadaAPI(apiUrl, function(err, data) {
        if (err) {
            callback(err, null);
            return;
        }
        
        var videos = [];
        
        if (data.items) {
            videos = data.items.map(function(item) {
                return {
                    video_id: item.snippet.resourceId.videoId,
                    titulo: item.snippet.title,
                    descripcion: item.snippet.description,
                    fecha_publicacion: item.snippet.publishedAt,
                    thumbnail_url: item.snippet.thumbnails.high.url
                };
            });
        }
        
        callback(null, {
            videos: videos,
            nextPageToken: data.nextPageToken,
            totalResults: data.pageInfo ? data.pageInfo.totalResults : null
        });
    });
};

// ============================================
// FUNCIÓN PRINCIPAL: OBTENER TODOS LOS VIDEOS
// ============================================

youtube.obtenerTodosVideos = function(callback) {
    debug('Iniciando obtención de todos los videos...');
    
    // Primero obtener el uploads playlistId
    youtube._obtenerUploadsPlaylistId(CHANNEL_ID, function(err, playlistId) {
        if (err) {
            debug('Error al obtener uploads playlistId:', err);
            callback(err, null);
            return;
        }
        
        debug('Playlist ID obtenido:', playlistId);
        
        var todosLosVideos = [];
        var pageToken = null;
        
        // Función recursiva para obtener todas las páginas
        function obtenerPagina() {
            youtube._obtenerPaginaVideos(playlistId, pageToken, function(err, resultado) {
                if (err) {
                    debug('Error al obtener página:', err);
                    callback(err, null);
                    return;
                }
                
                if (resultado && resultado.videos) {
                    todosLosVideos = todosLosVideos.concat(resultado.videos);
                    debug(`Página obtenida: ${resultado.videos.length} videos. Total acumulado: ${todosLosVideos.length}`);
                }
                
                // Si hay más páginas, continuar
                if (resultado && resultado.nextPageToken) {
                    pageToken = resultado.nextPageToken;
                    obtenerPagina();
                } else {
                    // No hay más páginas, terminamos
                    debug(`Obtención completada. Total: ${todosLosVideos.length} videos`);
                    callback(null, todosLosVideos);
                }
            });
        }
        
        // Iniciar la recursión
        obtenerPagina();
    });
};

// ============================================
// GUARDAR VIDEOS EN BASE DE DATOS
// ============================================

youtube.guardarVideos = function(videos, callback) {
    const db = new sqlite3.Database(DB_PATH);
    
    // Usamos una transacción para mejor rendimiento
    db.serialize(function() {
        db.run('BEGIN TRANSACTION');
        
        var insertados = 0;
        var errores = 0;
        
        videos.forEach(function(video) {
            const insertSQL = `
                INSERT OR REPLACE INTO videos 
                (video_id, titulo, descripcion, fecha_publicacion, thumbnail_url, fecha_obtencion)
                VALUES (?, ?, ?, ?, ?, strftime('%s', 'now'))
            `;
            
            db.run(insertSQL, [
                video.video_id,
                video.titulo,
                video.descripcion,
                video.fecha_publicacion,
                video.thumbnail_url
            ], function(err) {
                if (err) {
                    debug('Error al insertar video:', err);
                    errores++;
                } else {
                    insertados++;
                }
            });
        });
        
        db.run('COMMIT', function(err) {
            db.close();
            if (err) {
                callback(err, null);
            } else {
                callback(null, {
                    total: videos.length,
                    insertados: insertados,
                    errores: errores
                });
            }
        });
    });
};

// ============================================
// FUNCIÓN COMBINADA: OBTENER Y GUARDAR
// ============================================


// En la función youtube.actualizarVideos, mejoremos el manejo de errores:

youtube.actualizarVideos = function(callback) {
    debug('Iniciando actualización de videos...');

    youtube.obtenerTodosVideos(function(err, videos) {
        if (err) {
            debug('Error en obtenerTodosVideos:', err);
            // Convertir el error a string legible
            var errorMsg = typeof err === 'object' ? JSON.stringify(err) : err.toString();
            callback(errorMsg, null);
            return;
        }

        if (!videos || videos.length === 0) {
            debug('No se encontraron videos');
            callback(null, {
                mensaje: 'No se encontraron videos nuevos',
                detalles: {
                    total: 0,
                    insertados: 0,
                    errores: 0
                }
            });
            return;
        }

        youtube.guardarVideos(videos, function(err, resultado) {
            if (err) {
                debug('Error en guardarVideos:', err);
                var errorMsg = typeof err === 'object' ? JSON.stringify(err) : err.toString();
                callback(errorMsg, null);
            } else {
                callback(null, {
                    mensaje: 'Videos actualizados correctamente',
                    detalles: resultado
                });
            }
        });
    });
};

// ============================================
// LISTAR VIDEOS DE LA BASE DE DATOS (CON PAGINACIÓN)
// ============================================

youtube.listarVideos = function(pagina, itemsPorPagina, callback) {
    pagina = pagina || 1;
    itemsPorPagina = itemsPorPagina || 20;
    var offset = (pagina - 1) * itemsPorPagina;
    
    const db = new sqlite3.Database(DB_PATH);
    
    // Obtener total de registros
    db.get('SELECT COUNT(*) as total FROM videos', function(err, totalRow) {
        if (err) {
            db.close();
            callback(err, null);
            return;
        }
        
        var total = totalRow.total;
        
        // Obtener videos de la página actual
        db.all(
            'SELECT * FROM videos ORDER BY fecha_publicacion DESC LIMIT ? OFFSET ?',
            [itemsPorPagina, offset],
            function(err, rows) {
                db.close();
                
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, {
                        pagina: pagina,
                        itemsPorPagina: itemsPorPagina,
                        total: total,
                        totalPaginas: Math.ceil(total / itemsPorPagina),
                        videos: rows
                    });
                }
            }
        );
    });
};

// Función de prueba para verificar la API key
youtube.testAPIKey = function(callback) {
    var apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&id=${CHANNEL_ID}&key=${API_KEY}`;

    youtube._llamadaAPI(apiUrl, function(err, data) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, { success: true, data: data });
        }
    });
};

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================

youtube.inicializar(function(err) {
    if (err) {
        console.error('Error al inicializar base de datos de YouTube:', err);
    } else {
        console.log('Módulo de YouTube inicializado correctamente');
    }
});

// Obtener detalles específicos de SEO (Tags y Descripción) - v7.8
youtube.getVideoDetails = function(videoId, callback) {
    // Validar el ID
    videoId = typeof(videoId) == 'string' && videoId.trim().length > 0 ? videoId.trim() : false;

    if (videoId) {
        // Preparar el path de la API
        var path = '/youtube/v3/videos?part=snippet,statistics&id=' + videoId + '&key=' + config.youtube.apiKey;

        var requestDetails = {
            'protocol': 'https:',
            'hostname': 'www.googleapis.com',
            'method': 'GET',
            'path': path,
            'headers': {
                'Content-Type': 'application/json'
            }
        };

        var req = https.request(requestDetails, function(res) {
            var status = res.statusCode;
            if (status == 200) {
                var responsePayload = '';
                res.on('data', function(chunk) {
                    responsePayload += chunk;
                });
                res.on('end', function() {
                    var parsedResponse = helpers.parseJsonToObject(responsePayload);
                    if (parsedResponse && parsedResponse.items && parsedResponse.items.length > 0) {
                        var item = parsedResponse.items[0];
                        var seoData = {
                            'title': item.snippet.title,
                            'tags': item.snippet.tags || [],
                            'description': item.snippet.description,
                            'viewCount': item.statistics.viewCount,
                            'publishedAt': item.snippet.publishedAt
                        };
                        callback(false, seoData);
                    } else {
                        callback('No se encontraron detalles para el video: ' + videoId);
                    }
                });
            } else {
                callback('La API de YouTube respondió con estatus: ' + status);
            }
        });

        req.on('error', function(e) {
            callback(e);
        });

        req.end();
    } else {
        callback('Se requiere un ID de video válido para el extractor de SEO');
    }
};

// Exportar el módulo
module.exports = youtube;
