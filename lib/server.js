'use strict';
// Server-related tasks
// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var util = require('util');
var debug = util.debuglog('server');

var config = require('./config');
var handlers = require('./handlers');
var helpers = require('./helpers');
var fs = require('fs');
var path = require('path');
var servidores = require('./servidores');
let exec = require('child_process').exec;
let automaticoAlarma = 1;
let estadoAlarma = 1;

// Instantiate the server module object;
var server = {};

// Instantiate the http server
server.httpServer = http.createServer(function(req,res) {
	server.unifiedServer(req,res);
	});

// wake up
function alarma() {
	let comando = "XDG_RUNTIME_DIR=/run/user/1000 /usr/bin/paplay '/home/jorge/auxiliar/sonidos/Radar Detector Beeps-SoundBible.com-892148482.ogg'";
	exec(comando, function(err, stdout, stderr) {
		if (err) console.log(err); 
		});
	}
function wake_up() {
	//console.log('Estado Alarma:', estadoAlarma);
	let d = new Date();
	let hora = d.getHours();
	if (hora == 9 || hora == 10 || hora == 11 || hora == 12) {
		if (estadoAlarma) {
			//console.log('Alarma');
			alarma();
			}
		else {
			console.log('La alarma no sonará porque está deactivada.');
			}
		}
	}
setInterval(wake_up, 1000 * 60 * 3);

// Notificación
var laDireccionIPParche = '192.168.11.199';
var notificacion = {};
notificacion.ipAddress = 'localhost';
notificacion.notifyd = function(tarea) {
	var self = this;
	console.log(tarea);
    var requestDetails = {
        'protocol': 'http:',
        //'hostname': self.ipAddress,
        'hostname': laDireccionIPParche,
        'port': 8090,
        'method': 'GET',
        //'path': '/notificacion?mensaje='+tarea.replace(/<\/?[^>]+(>|$)/g, ""),
        'path': '/notificacion?mensaje='+tarea,
        'timeout': 5000
        };
    // Instantiate the request object
    var req = http.request(requestDetails,function(res) {
        // Grab the status of the sent request
        //callback(res.statusCode);
        var str = '';
        // Another chunk of data has been received, so append it to str
        res.on('data', function(chunk) {
            str += chunk;
            });
        // The whole response has been received
        res.on('end', function() {
            
            });
        });
    // Bind to the error event so it doesn't get thrown
    req.on('error', function(e) {
        console.log(typeof(e) == 'object' ? e : {'Error': 'Error al momento de mostrar la notificación en '+ipAddress});
        });
    // Bind to the timeout event
    req.on('timeout',function(e) {
        console.log(typeof(e) == 'object' ? e : {'Error': 'Timeout al momento de mostrar la notificación en '+ipAddress});
        });
    // End the request
    req.end();
	};
notificacion.sonido = function(callback) {
	var self = this;
	var requestDetails = {
		'protocol': 'http:',
		//'hostname': self.ipAddress,
		'hostname': laDireccionIPParche,
		'port': 8090,
		'method': 'GET',
		'path': '/sonidos?sonido=6',
		'timeout': 5000
		};
	var req = http.request(requestDetails,function(res) {
		var str = '';
		res.on('data', function(chunk) {
			str += chunk;
			});
		res.on('end', function() {
			callback();
			});
		});
	req.on('error', function(e) {
		console.log(typeof(e) == 'object' ? e : {'Error': 'Error al momento de reproducir el sonido en '+ipAddress});
		});
	req.on('timeout',function(e) {
		console.log(typeof(e) == 'object' ? e : {'Error': 'Timeout al momento de reproducir el sonido en '+ipAddress});
		});
	req.end();
	};
notificacion.cadaIteracion = function(mensaje) {
	var self = this;
	this.sonido(function() {
		self.notifyd(encodeURI(mensaje));
		var d = new Date();
		console.log(d.toString());
		});
	};

// Fin notificación


// Comienzo Chat

var io = require('socket.io')(server.httpServer); //require socket.io module and pass the http object (server)

// Hacer io global para que otros módulos puedan acceder
global.io = io;

var messages = [];

io.sockets.on('connection', function (socket) {// WebSocket Connection
	console.log('WebSocket establecido.');

    let lightvalue = 0; // static variable for current status
    socket.on('light', function(data) { //get light switch status from client
        lightvalue = data;
        //if (lightvalue) {
            console.log(lightvalue); //turn LED on or off, for now we will just show it in console.log
           //console.log(typeof(lightvalue));
            //}
	
	estadoAlarma = lightvalue; 
    
        //socket.emit('light', lightvalue); //send button status to client            
        io.sockets.emit("light", lightvalue);
        });


    let automaticovalue = 0; // static variable for current status
    socket.on('automatico', function(data) { //get light switch status from client
        automaticovalue = data;
        //if (lightvalue) {
            console.log('automaticovalue', automaticovalue); //turn LED on or off, for now we will just show it in console.log
           //console.log(typeof(lightvalue));
            //}
	
	automaticoAlarma = automaticovalue; 
    
        //socket.emit('light', lightvalue); //send button status to client            
        io.sockets.emit("automatico", automaticovalue);
        });

/* Chat */
    console.log("Un cliente se ha conectado");
    socket.emit("messages", messages);

    socket.on("new-message", function (data) {
        messages.push(data);

	    //console.log(data);
	   // console.log(typeof(data));

	notificacion.cadaIteracion(data.author+'~'+data.text);
	//notificacion.notifyd(encodeURI(data.author+'~'+data.text));



// Lunes 01 Noviembre 2021 desde las ocho de la mañana más o menos, todo el cuento del "Chat"
// https://carlosazaustre.es/websockets-como-utilizar-socket-io-en-tu-aplicacion-web
// Y ahora para notificar a los clientes conectados tenemos que avisarles de alguna forma. Si lo hacemos con socket.emit estamos creando una comunicación 1:1, pero una sala de chat no es así, no es una comunicación privada. Tenemos que notificar a todos los clientes conectados. Esto lo conseguimos con io.sockets.emit que notificará a todos los sockets conectados.


        io.sockets.emit("messages", messages);
        });
/* Fin Chat */

	});

// Fin chat

let activaAlarma = () => {
	function laFuncion() {
		let d = new Date();
		let hora = d.getHours();
		//if (hora > 9 || hora < 7) {
		if (automaticoAlarma) {
			if (!estadoAlarma) {
				estadoAlarma = 1;
				io.sockets.emit("light", estadoAlarma);
				console.log('Se activó la alarma automáticamente');
				}
			}
		}
	setInterval(laFuncion, 1000 * 60 * 20); // Cada veinte minutos 
	};
activaAlarma();

let activaAutomatico = () => {
	function laFuncion() {
		let d = new Date();
		let hora = d.getHours();
		if (hora < 7) {
			if (!automaticoAlarma) {
				automaticoAlarma = 1;
				io.sockets.emit("automatico", automaticoAlarma);
				console.log('Se activó el automatico automáticamente');
				}
			}
		}
	setInterval(laFuncion, 1000 * 60 * 60); // Cada hora
	};
activaAutomatico();

// ============================================
// FUNCIÓN PARA NOTIFICACIONES WEBSOCKET (INTERNA)
// ============================================

// Endpoint interno para notificaciones (no expuesto en el router público)
server.notificarWebsocket = function(mensaje) {
    if (global.io) {
        global.io.emit('notificacion-tarea', {
            mensaje: mensaje,
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        });
        debug('Notificación websocket enviada:', mensaje);
    } else {
        debug('Error: io no está disponible');
    }
};

// Manejador para notificaciones internas (solo desde localhost)
server.handleNotificacionInterna = function(req, res) {
    var parseUrl = url.parse(req.url, true);
    var mensaje = parseUrl.query.mensaje || 'Recordatorio';
    
    // Decodificar el mensaje
    try {
        mensaje = decodeURIComponent(mensaje);
    } catch (e) {
        debug('Error decodificando mensaje:', e);
    }
    
    server.notificarWebsocket(mensaje);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
};

// ============================================
// NUEVO: MANEJADOR PARA ACTUALIZACIONES DE TAREAS
// ============================================

// Manejador para actualizaciones de tareas (solo desde localhost)
server.handleActualizacionTarea = function(req, res) {
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });
    
    req.on('end', function() {
        buffer += decoder.end();
        
        try {
            var actualizacion = JSON.parse(buffer);
            
            // Emitir a todos los clientes conectados
            if (global.io) {
                global.io.emit('actualizacion-tarea', actualizacion);
                debug('Actualización de tarea emitida:', actualizacion);
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        } catch (e) {
            debug('Error al procesar actualización:', e);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
    });
};

// All the server logic for both the http and https server
server.unifiedServer = function(req,res) {
	console.log(req.origin)
	// Get the URL and parse it
	var parseUrl = url.parse(req.url,true);
	// Get the path
	var path = parseUrl.pathname;
	// Quita los slashes al principio y al final:
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');
	
	// ============================================
	// VERIFICACIÓN ESPECIAL PARA NOTIFICACIONES INTERNAS
	// ============================================
	// Detectar si es una notificación interna (solicitudes desde localhost)
	var clientIp = req.socket.remoteAddress;
	var isLocalhost = clientIp === '::ffff:127.0.0.1' || clientIp === '127.0.0.1' || clientIp === '::1';
	
	if (trimmedPath === 'api/notificar-websocket' && isLocalhost) {
		server.handleNotificacionInterna(req, res);
		return; // Importante: salir para no procesar más
	}
	
	// ============================================
	// NUEVO: Verificación para actualizaciones de tareas
	// ============================================
	if (trimmedPath === 'api/actualizar-tarea' && isLocalhost) {
		server.handleActualizacionTarea(req, res);
		return;
	}
	
	// Get the query string as an object
	var queryStringObject = parseUrl.query;
	// Get the HTTP Method
	var method = req.method.toLowerCase();
	// Get the headers as an object
	var headers = req.headers;
	// Get the payload, if any
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data',function(data) {
		buffer += decoder.write(data);
		});
	req.on('end',function() {
		buffer += decoder.end();
		// Choose the handler this request should go to
		// If one is not found, use the notFound handler
		var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;
		
		// If the request is within the public directory, use the public handler instead
		chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;
		
		// If the request is within the bootstrap/css directory, use the public handler instead
		chosenHandler = trimmedPath.indexOf('bootstrap/css/') > -1 ? handlers.bootstrapCss : chosenHandler;
		
		// If the request is within the bootstrap/js directory, use the public handler instead
		chosenHandler = trimmedPath.indexOf('bootstrap/js/') > -1 ? handlers.bootstrapJs : chosenHandler;
		
		// If the request is within the jquery directory, use the public handler instead
		chosenHandler = trimmedPath.indexOf('jquery/') > -1 ? handlers.jquery : chosenHandler;
        
		// Construct the data object to send to the handler
		// A veces en buffer recibimos un queryString, a veces un objeto, por lo tanto...
		var data;
		try {
			data = {
				'trimmedPath': trimmedPath,
				'queryStringObject': queryStringObject,
				'method': method,
				'headers': headers,
				'payload': JSON.parse(buffer), // En caso de recibir un objeto. 07.02.2021 18:07:41. Acabamos de aprender que para que siempre se envíe un objeto y no un queryString, se debe "setear" el "Content-Type" en el header como "application/json"
				};
			}
		catch(e) {
			data = {
				'trimmedPath': trimmedPath,
				'queryStringObject': queryStringObject,
				'method': method,
				'headers': headers,
				'payload': helpers.parseQueryStringToObject(buffer), // En caso de recibir un queryString
				};
			}
		finally {
			server.restante(chosenHandler,data,buffer,req,res);
			}
		});
};

server.restante = function(chosenHandler,data,buffer,req,res) {
	// Route the request to the handler specified in the router
	chosenHandler(data,function(statusCode,payload,contentType) {
		try {
			// Determine the type of response (fallback to JSON)
			contentType = typeof(contentType) == 'string' ? contentType : 'json';
			// Use the status code called back by the handler, or default to 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
			
			// Return the response-parts that are content-specific
			var payloadString = '';
			if (contentType == 'json') {
				res.setHeader('Content-Type','application/json');
				payload = typeof(payload) == 'object' ? payload : {};
				payloadString = JSON.stringify(payload,null,2);
				}
			if (contentType == 'html') {
				res.setHeader('Content-Type','text/html');
				payloadString = typeof(payload) !== 'undefined' ? payload : '';
				}
			if (contentType == 'favicon') {
				res.setHeader('Content-Type','image/x-icon');
				payloadString = typeof(payload) !== 'undefined' ? payload : '';
				}
			if (contentType == 'css') {
				res.setHeader('Content-Type','text/css');
				payloadString = typeof(payload) !== 'undefined' ? payload : '';
				}
			if (contentType == 'js') {
				res.setHeader('Content-Type','text/javascript');
				payloadString = typeof(payload) !== 'undefined' ? payload : '';
				}
			if (contentType == 'png') {
				res.setHeader('Content-Type','image/png');
				payloadString = typeof(payload) !== 'undefined' ? payload : '';
				}
			if (contentType == 'jpg') {
				res.setHeader('Content-Type','image/jpeg');
				payloadString = typeof(payload) !== 'undefined' ? payload : '';
				}
			if (contentType == 'plain') {
				res.setHeader('Content-Type','text/plain');
				payloadString = typeof(payload) !== 'undefined' ? payload : '';
				}
			if (contentType == 'toJson') { // Agregado por nosotros
				res.setHeader('Content-Type','application/json');
				payloadString = typeof(payload) !== 'undefined' ? payload : '';
				}
			// Return the response-parts that are common to all content-types
			
			res.writeHead(statusCode);
			res.end(payloadString);
			}
		catch (e) {
			console.log(e);
			}

		
		/*console.log(path);
		console.log(trimmedPath);
		console.log('queryStringObject:',queryStringObject);
		console.log(method);
		console.log(headers);
		console.log('buffer:',buffer);
		//console.log(decodeURI(buffer));
		if (buffer == '') {
			var objeto = {};
			}
		else {
			// https://stackoverflow.com/questions/8648892/how-to-convert-url-parameters-to-a-javascript-object
			var objeto = JSON.parse('{"' + decodeURI(buffer).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}'); 
			}
		console.log(objeto);*/
		//debug(buffer);
		//console.log(buffer);
		//debug(data);

		console.log(data);
		
		console.log(statusCode);
		console.log(payloadString);
		
		// If the response is 200, print green, otherwise print red
		if (statusCode == 200) {
			debug('\x1b[32m%s\x1b[0m',data.method.toUpperCase()+' /'+data.trimmedPath+' '+statusCode);
			}
		else {
			debug('\x1b[31m%s\x1b[0m',data.method.toUpperCase()+' /'+data.trimmedPath+' '+statusCode);
			}
		
		});
};

// Define a request router
server.router = {
	'': handlers.index,
	'ping':  handlers.ping,
	'favicon.ico': handlers.favicon,
	'socket.io.min.js': handlers.SocketIoJs,
	'socket.io.min.js.map': handlers.SocketIoJs,
	'public': handlers.public,
	'sonidos': handlers.sonidos,
	'notificacion': handlers.notificacion,
	'api/chat': borraChat,
	'subir': handlers.subir,
	'bajar': handlers.bajar,
	'luz': handlers.luz,
	// Nuevas rutas para el gestor de tareas
	'tareas': handlers.tareasPagina,        // Interfaz HTML
	'tareas/listar': handlers.tareasListar,  // API JSON (GET)
	'tareas/agregar': handlers.tareasAgregar, // API JSON (POST/GET)
	'tareas/eliminar': handlers.tareasEliminar, // API JSON (GET)
	'tareas/ejecutar': handlers.tareasEjecutar, // API JSON (GET)
	'tareas/toggle': handlers.tareasToggle,  // NUEVA RUTA
	'tareas/editar': handlers.tareasEditar,  // NUEVA RUTA

	// ============================================
	// NUEVAS RUTAS PARA YOUTUBE
	// ============================================
	'videos': handlers.videosPagina,              // Interfaz HTML
	'videos/listar': handlers.videosListar,       // API con paginación (GET)
	'videos/actualizar': handlers.videosActualizar, // API para actualizar (GET/POST)
	'videos/estadisticas': handlers.videosEstadisticas, // API estadísticas (GET)
	'videos/buscar': handlers.videosBuscar,       // API búsqueda (GET)
	
	// SEO
	'api/seo': handlers.apiSeo // <--- Nueva ruta añadida
};

// Se deja esta función sin efecto porque inicialmente no queremos ese setTimeout
(function() {
// ============================================
// TAREA PROGRAMADA PARA ACTUALIZAR VIDEOS AUTOMÁTICAMENTE
// ============================================

// Actualizar videos cada 6 horas (21600000 ms)
setInterval(function() {
	console.log('Ejecutando actualización automática de videos...');
	
	// Usar el módulo youtube directamente
	var youtube = require('./youtube');
	
	youtube.actualizarVideos(function(err, resultado) {
		if (!err) {
			console.log('Videos actualizados automáticamente:', resultado.detalles);
			
			// Notificar por WebSocket a los clientes conectados
			if (global.io) {
				global.io.emit('notificacion-tarea', {
					mensaje: '📹 Videos de YouTube actualizados',
					timestamp: Date.now(),
					id: 'youtube-' + Date.now()
				});
			}
		} else {
			console.error('Error en actualización automática de videos:', err);
		}
	});
}, 6 * 60 * 60 * 1000); // 6 horas

// También ejecutar una vez al iniciar el servidor (con un pequeño retraso)
setTimeout(function() {
	console.log('Ejecutando actualización inicial de videos...');
	
	var youtube = require('./youtube');
	
	youtube.actualizarVideos(function(err, resultado) {
		if (!err) {
			console.log('Videos actualizados inicialmente:', resultado.detalles);
		} else {
			console.error('Error en actualización inicial de videos:', err);
		}
	});
}, 5000); // 5 segundos después de iniciar
});

/*
 * Características principales YouTube:
✅ Paginación completa con botones primera/anterior/siguiente/última

✅ Búsqueda en tiempo real de videos por título

✅ Estadísticas (total videos, última actualización)

✅ Actualización manual desde YouTube

✅ Notificaciones en tiempo real vía Socket.IO

✅ Copiar enlace al portapapeles

✅ Abrir video en YouTube

✅ Formato de fechas legible

✅ Recarga automática después de actualización
 * */


// Borra Chat
function borraChat(data,callback) {
    messages = [];
    io.sockets.emit("messages", messages);
    callback(200);
}

// Init script
server.init = function() {
	// Start the http server
	server.httpServer.listen(config.httpPort, function() {
		console.log('\x1b[36m%s\x1b[0m','The server is listening on port '+config.httpPort+' in '+config.envName+' mode.');
		});
    };
    
// Export the module
module.exports = server;
