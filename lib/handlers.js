'use strict';
// Request handlers
// Dependencies
//var config = require('./config');
var crypto = require('crypto');
var querystring	= require('querystring');
var helpers = require('./helpers');
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
let Gpio = require('onoff').Gpio;
var servidores = require('./servidores');
const sqlite3 = require('sqlite3').verbose();

// Define the handlers
var handlers = {};

// Status de la aplicación
handlers.statusDeLaAplicacion = 0;

// Favicon
handlers.favicon = function(data,callback) {
	// Reject any request that isn't a GET
	if (data.method == 'get') {
		// Read in the favicon's data
		helpers.getStaticAsset('favicon.ico',function(err,data) {
			if (!err && data) {
				// Callback the data
				callback(200,data,'favicon');
				}
			else {
				callback(500);
				}
			});
		}
	else {
		callback(405,undefined,'html'); // 405 is that method is not allowed
		}
	};
/* HTML handlers */

// Index handler
handlers.index = function(data,callback) {
	// Reject any request that isn't a GET
	if (data.method == 'get') {
		// Prepare data for interpolation
		var templateData = {
			'head.title': 'This is the title',
			'head.description': 'This is the meta description',
			'body.title': 'Hello templated world!',
			};
		// Read in the index template as a string
		helpers.getTemplate('index',templateData,function(err,str) {
			if (!err && str) { // Aquí el string ya está "interpolado", porque helpers.getTemplate incluye la interpolación del objeto "global" configurado en config.js 
				// Add the universal header and footer
				helpers.addUniversalTemplates(str,templateData,function(err,str) {
					if (!err && str) {
						// Return that page as HTML
						callback(200,str,'html');
						}
					else {
						callback(500,undefined,'html');
						}
					});
				}
			else {
				callback(500,undefined,'html');
				}
			});
		}
	else {
		callback(405,undefined,'html'); // 405 is that method is not allowed
		}
	};

// Public assets
handlers.public = function(data,callback) {
	// Reject any request that isn't a GET
	if (data.method == 'get') {
		// Get the filename beging requested
		var trimmedAssetName = data.trimmedPath.replace('public/','').trim();
		if (trimmedAssetName.length > 0) {
			// Read in the asset's data
			helpers.getStaticAsset(trimmedAssetName,function(err,data) {
				if (!err && data) {
					// Determine the content type (default to plain text)
					var contentType = 'plain';
					if (trimmedAssetName.indexOf('.css') > -1) {
						contentType = 'css';
						}
					if (trimmedAssetName.indexOf('.js') > -1) {
						contentType = 'js';
						}
					if (trimmedAssetName.indexOf('.png') > -1) {
						contentType = 'png';
						}
					if (trimmedAssetName.indexOf('.jpeg') > -1) {
						contentType = 'jpeg';
						}
					if (trimmedAssetName.indexOf('.jpg') > -1) {
						contentType = 'jpg';
						}
					if (trimmedAssetName.indexOf('.ico') > -1) {
						contentType = 'favicon';
						}
					if (trimmedAssetName.indexOf('.json') > -1) { // Agregado por nosotros para "leer" mercantil.json
						contentType = 'toJson';
						}
					// Callback the data
					callback(200,data,contentType);
					}
				else {
					callback(404);
					}
				});
			}
		else {
			callback(404);
			}
		}
	else {
		callback(405,undefined,'html'); // 405 is that method is not allowed
		}
	};
    
handlers.SocketIoJs = function(data,callback) {
	// Reject any request that isn't a GET
	if (data.method == 'get') {
		// Get the filename beging requested
		var trimmedAssetName = data.trimmedPath.trim();
		if (trimmedAssetName.length > 0) {
			// Read in the asset's data
			helpers.getStaticAssetSocketIoJs(trimmedAssetName,function(err,data) {
				if (!err && data) {
					// Determine the content type (default to plain text)
					var contentType = 'plain';
					if (trimmedAssetName.indexOf('.css') > -1) {
						contentType = 'css';
						}
					if (trimmedAssetName.indexOf('.js') > -1) {
						contentType = 'js';
						}
					if (trimmedAssetName.indexOf('.png') > -1) {
						contentType = 'png';
						}
					if (trimmedAssetName.indexOf('.jpeg') > -1) {
						contentType = 'jpeg';
						}
					if (trimmedAssetName.indexOf('.ico') > -1) {
						contentType = 'favicon';
						}
					if (trimmedAssetName.indexOf('.json') > -1) { // Agregado por nosotros para "leer" mercantil.json
						contentType = 'toJson';
						}
					// Callback the data
					callback(200,data,contentType);
					}
				else {
					callback(404, data);
					}
				});
			}
		else {
			callback(404);
			}
		}
	else {
		callback(405,undefined,'html'); // 405 is that method is not allowed
		}
	};


// Sonidos
handlers.sonidos = function(data,callback) {
	var acceptableMethods = ['get'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._sonidos[data.method](data,callback); // Sub enrrutamiento de acuerdo al método. 
		}
	else {
		// 405 is the http status code for method not allowed
		callback(405);
		}
	};
// Container for all the sonidos methods
handlers._sonidos = {};
// Sonidos - get
// Require data: sound
// Optional data: none
handlers._sonidos.baseDir = path.join(__dirname,'/../sonidos/');
handlers._sonidos.sonidos = ['TodaLaLuz.ogg',
'Robot_blip_2-Marianne_Gagnon-299056732.ogg',
'Radio Interruption-SoundBible.com-1434341263.ogg',
'A-Tone-His_Self-1266414414.ogg',
'Beep Ping-SoundBible.com-217088958.ogg',
'Music Censor-SoundBible.com-818434396.ogg',
'House Fire Alarm-SoundBible.com-1609046789.ogg',
'Bleep-SoundBible.com-1927126940.ogg',
'Electronic_Chime-KevanGC-495939803.ogg',
'Short Beep Tone-SoundBible.com-1937840853.ogg',
'Computer Error Alert-SoundBible.com-783113881.ogg',
'Robot_blip-Marianne_Gagnon-120342607.ogg',
'Beep-SoundBible.com-1689177436.ogg',
'Beep-SoundBible.com-923660219.ogg',
'Beep 2-SoundBible.com-1798581971.ogg',
'Fuzzy Beep-SoundBible.com-1580329899.ogg',
'Answering Machine Beep-SoundBible.com-1804176620.ogg',
'Censor Beep-SoundBible.com-250233510.ogg',
'Censored_Beep-Mastercard-569981218.ogg',
'Radar Detector Beeps-SoundBible.com-892148482.ogg',
'Pager Beeps-SoundBible.com-260751720.ogg',
'Strange Beeping-SoundBible.com-2088039238.ogg',
'Checkout Scanner Beep-SoundBible.com-593325210.ogg',
'front-desk-bells-daniel_simon.ogg',
'sms-alert-5-daniel_simon.ogg',
'sms-alert-4-daniel_simon.ogg',
'sms-alert-3-daniel_simon.ogg',
'sms-alert-2-daniel_simon.ogg',
'sms-alert-1-daniel_simon.ogg',
'fire_bow_sound-mike-koenig.ogg',
'glass_ping-Go445-1207030150.ogg',
'Blop-Mark_DiAngelo-79054334.ogg',
'Metal_Gong-Dianakc-109711828.ogg',
'Buzzer-SoundBible.com-188422102.ogg',
'expansion_imagenes_lista.ogg',
'Deep_cinematic_bass__1-1771252978509.ogg'];
handlers._sonidos.antiguoGet = function(data,callback) { // 30.08.2022 11:18:19. Ya no se usará esta sino la siguiente función directamente en Node.js 🙂
	// Nos estamos basando en .../masterclass/lib/workers.js
	// También en tarea 1485: https://nodejs.org/en/knowledge/HTTP/clients/how-to-create-a-HTTP-request/
	var sound = Number(data.queryStringObject.sound) == Number(data.queryStringObject.sound) && Number(data.queryStringObject.sound) > 0 && Number(data.queryStringObject.sound) < 35 ? Number(data.queryStringObject.sound) : false;
	if (sound) {
		var requestDetails = {
			'protocol': 'http:',
			'hostname': '172.31.1.192',
			'method': 'GET',
			'path': '/sounds/?sound='+sound,
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
				callback(200, str, 'plain');
				});
			});
		// Bind to the error event so it doesn't get thrown
		/*req.on('error', function(e) {
			callback(500, typeof(e) == 'object' ? e : {'Error': 'Error al momento de reproducir el sonido en 192'});
			});*/
		// Bind to the timeout event
		/*req.on('timeout',function(e) {
			callback(500, typeof(e) == 'object' ? e : {'Error': 'Timeout al momento de reproducir el sonido en 192'});
			});*/
		// End the request
		req.end();
		}
	else {
		callback(400,{'Error': 'Missing required field'}); // 400 Bad Request
		}
	};
handlers._sonidos.get = function(data,callback) { // 30.08.2022 11:18:19. Ahora se realizará directamente desde Node.js 😁
	// Nos estamos basando en .../masterclass/lib/workers.js
	// También en tarea 1485: https://nodejs.org/en/knowledge/HTTP/clients/how-to-create-a-HTTP-request/
	var sonido = Number(data.queryStringObject.sonido) == Number(data.queryStringObject.sonido) && Number(data.queryStringObject.sonido) > 0 && Number(data.queryStringObject.sonido) < 37 ? Number(data.queryStringObject.sonido) : false;
	if (sonido) {
		// XDG_RUNTIME_DIR=/run/user/1000 /usr/bin/paplay
		var comando = 'XDG_RUNTIME_DIR=/run/user/1000 /usr/bin/paplay "'+this.baseDir+this.sonidos[sonido-1]+'"';
		var self = this;
		exec(comando,function(err, stdout, stderr) {
			if (!err)	{
				callback(200, {'OK': self.sonidos[sonido-1]});
				}
			else {
				callback(500, err);
				}
			});
		}
	else {
		callback(400,{'Error': 'Missing required field'}); // 400 Bad Request
		}
	};

// miércoles 01 diciembre 2021 12:09
handlers.notificacion = function(data,callback) {
	var acceptableMethods = ['get'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._notificacion[data.method](data,callback); // Sub enrrutamiento de acuerdo al método. 
		}
	else {
		// 405 is the http status code for method not allowed
		callback(405);
		}
	};
// Container for all the notificacion methods
handlers._notificacion = {};
handlers._notificacion.get = function(data, callback) {
	var mensaje = typeof(data.queryStringObject.mensaje) == 'string' && data.queryStringObject.mensaje.trim().length > 0 ? data.queryStringObject.mensaje.trim() : false;
	var myArray = mensaje.split('~');
	var nombre = myArray[0].replace(/<\/?[^>]+(>|$)/g, "");
	var elMensaje = myArray[1] ? myArray[1].replace(/<\/?[^>]+(>|$)/g, "") : 'No hay mensaje';
    if (mensaje) {
        exec('notify-send -i info '+nombre+' "'+elMensaje+'"', (err, stdout, stderr) => {
            if (!err) {
                callback(200, {'OK': mensaje});
                }
            else {
                callback(500, {'Error': 'Problemas con la notificación'});
                }
            });
        }
    else {
        callback(400, {'Error': 'Missing required field'}); // 400 Bad Request
        }
	};

handlers.subir = function(data,callback) {
	var acceptableMethods = ['get'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._subir[data.method](data,callback); // Sub enrrutamiento de acuerdo al método. 
		}
	else {
		// 405 is the http status code for method not allowed
		callback(405);
		}
	};
handlers._subir = {};
handlers._subir.get = function(data,callback) {
	var dbname = data.queryStringObject.dbname.trim().length > 3 ? data.queryStringObject.dbname.trim() : false;
	if (dbname) {
		var comando = `mysql -u root -ptrilobites01 ${dbname} < /var/www/${dbname}/${dbname}.sql`;
		exec(comando,function(err, stdout, stderr) {
			if (!err)	{
				callback(200, {'dbname': dbname});
				}
			else {
				callback(500, err);
				}
			});
		}
	else {
		callback(400, {'Error': 'Missing required field'}); // 400 Bad Request
		}
	};

handlers.bajar = function(data,callback) {
	var acceptableMethods = ['get'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._bajar[data.method](data,callback); // Sub enrrutamiento de acuerdo al método. 
		}
	else {
		// 405 is the http status code for method not allowed
		callback(405);
		}
	};
handlers._bajar = {};
handlers._bajar.get = function(data,callback) {
	var dbname = data.queryStringObject.dbname.trim().length > 3 ? data.queryStringObject.dbname.trim() : false;
	if (dbname) {
		var comando = `mysqldump -u root -ptrilobites01 ${dbname} > /var/www/${dbname}/${dbname}.sql`;
		exec(comando,function(err, stdout, stderr) {
			if (!err)	{
				callback(200, {'dbname': dbname});
				}
			else {
				callback(500, err);
				}
			});
		}
	else {
		callback(400, {'Error': 'Missing required field'}); // 400 Bad Request
		}
	};
handlers.luz = function(data, callback) {
	let acceptableMethods = ['get'];
	if (acceptableMethods.indexOf(data.method) > -1) {
		handlers._luz[data.method](data, callback); // Sub enrrutamiento de acuerdo al método. 
		}
	else {
		// 405 is the http status code for method not allowed
		callback(405);
		}
	};
handlers._luz = {};
handlers._luz.estado = 0;
handlers._luz.get = function(data, callback) {
	let acceptableBombillos = [16, 12, 21, 20];
	let bombillo = Number(data.queryStringObject.bombillo) == Number(data.queryStringObject.bombillo) ? Number(data.queryStringObject.bombillo) : false;
	let comando = false;
	if (data.queryStringObject.comando) {
		comando = data.queryStringObject.comando.trim().length > 3 ? data.queryStringObject.comando.trim() : false;
		}
	if (bombillo) {
		let LED = new Gpio(bombillo, 'out');
		if (acceptableBombillos.indexOf(bombillo) > -1) {
			if (comando) {
				if (comando == 'encender') {
					LED.writeSync(1);
					}
				else {
					LED.writeSync(0);
					}
				LED.unexport();
				callback(200, {bombillo: bombillo, comando: comando});
				}
			else {
				if (this.estado) {
					LED.writeSync(0);
					this.estado = 0;
					}
				else {
					LED.writeSync(1);
					this.estado = 1;
					}
				callback(200, {bombillo: bombillo});

				(function() {
					LED.writeSync(1);
					setTimeout(function() {
						LED.writeSync(0);
						LED.unexport();
						callback(200, {bombillo: bombillo, queryStringObject: data.queryStringObject});
						}, 3000);
					});
				}
			}
		else {
			callback(400,{'Error': 'Missing required field'}); // 400 Bad Request
			}
		}
	else {
		callback(400,{'Error': 'Missing required field'}); // 400 Bad Request
		}
	};

// ============================================
// HANDLERS PARA TAREAS PROGRAMADAS
// ============================================

// Cargar el módulo de tareas
var tareas = require('./tareas');

// Página principal de tareas (interfaz HTML)
handlers.tareasPagina = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method == 'get') {
        // Prepare data for interpolation
        var templateData = {
            'head.title': 'Gestor de Tareas Programadas',
            'head.description': 'Sistema de recordatorios y tareas programadas',
            'body.title': 'Gestor de Tareas',
            };
        // Read in the tareas template as a string
        helpers.getTemplate('tareas', templateData, function(err, str) {
            if (!err && str) {
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, str) {
                    if (!err && str) {
                        // Return that page as HTML
                        callback(200, str, 'html');
                    } else {
                        callback(500, undefined, 'html');
                    }
                });
            } else {
                callback(500, undefined, 'html');
            }
        });
    } else {
        callback(405, undefined, 'html'); // 405 is that method is not allowed
    }
};

// API: Listar todas las tareas
handlers.tareasListar = function(data, callback) {
    var acceptableMethods = ['get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tareasListar[data.method](data, callback);
    } else {
        callback(405, { 'Error': 'Method not allowed' });
    }
};

// Container for tareasListar methods
handlers._tareasListar = {};

handlers._tareasListar.get = function(data, callback) {
    tareas._metodos.listar(function(err, tareasList) {
        if (!err) {
            callback(200, tareasList, 'json');
        } else {
            callback(500, { 'Error': 'Error al listar tareas', 'Detalle': err.toString() }, 'json');
        }
    });
};

// API: Agregar una tarea
handlers.tareasAgregar = function(data, callback) {
    var acceptableMethods = ['post', 'get']; // Aceptamos GET para facilitar pruebas, pero idealmente POST
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tareasAgregar[data.method](data, callback);
    } else {
        callback(405, { 'Error': 'Method not allowed' });
    }
};

// Container for tareasAgregar methods
handlers._tareasAgregar = {};

handlers._tareasAgregar.post = function(data, callback) {
    // Extraer parámetros del payload (para POST con JSON)
    var params = {
        subject: data.payload.subject,
        minutosInicio: data.payload.minutosInicio,
        minutosIntervalo: data.payload.minutosIntervalo,
        repeticiones: data.payload.repeticiones
    };

    tareas._metodos.agregar(params, function(err, resultado) {
        if (!err) {
            callback(200, resultado, 'json');
        } else {
            callback(400, { 'Error': 'Error al agregar tarea', 'Detalle': err.toString() }, 'json');
        }
    });
};

handlers._tareasAgregar.get = function(data, callback) {
    // Para pruebas vía GET con query string
    var params = {
        subject: data.queryStringObject.subject,
        minutosInicio: parseInt(data.queryStringObject.minutosInicio),
        minutosIntervalo: parseInt(data.queryStringObject.minutosIntervalo),
        repeticiones: parseInt(data.queryStringObject.repeticiones)
    };

    tareas._metodos.agregar(params, function(err, resultado) {
        if (!err) {
            callback(200, resultado, 'json');
        } else {
            callback(400, { 'Error': 'Error al agregar tarea', 'Detalle': err.toString() }, 'json');
        }
    });
};

// API: Eliminar una tarea
handlers.tareasEliminar = function(data, callback) {
    var acceptableMethods = ['get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tareasEliminar[data.method](data, callback);
    } else {
        callback(405, { 'Error': 'Method not allowed' });
    }
};

// Container for tareasEliminar methods
handlers._tareasEliminar = {};

handlers._tareasEliminar.get = function(data, callback) {
    var id = parseInt(data.queryStringObject.id);

    if (isNaN(id) || id <= 0) {
        callback(400, { 'Error': 'ID inválido' }, 'json');
        return;
    }

    tareas._metodos.eliminar(id, function(err, resultado) {
        if (!err) {
            callback(200, resultado, 'json');
        } else {
            callback(400, { 'Error': 'Error al eliminar tarea', 'Detalle': err.toString() }, 'json');
        }
    });
};

// API: Controlar el servicio de ejecución de tareas
handlers.tareasEjecutar = function(data, callback) {
    var acceptableMethods = ['get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tareasEjecutar[data.method](data, callback);
    } else {
        callback(405, { 'Error': 'Method not allowed' });
    }
};

// Container for tareasEjecutar methods
handlers._tareasEjecutar = {};

handlers._tareasEjecutar.get = function(data, callback) {
    var accion = data.queryStringObject.accion;

    if (accion == 'iniciar') {
        tareas.iniciarServicio(function(err, resultado) {
            if (!err) {
                callback(200, resultado, 'json');
            } else {
                callback(500, { 'Error': 'Error al iniciar servicio', 'Detalle': err.toString() }, 'json');
            }
        });
    } else if (accion == 'detener') {
        tareas.detenerServicio(function(err, resultado) {
            if (!err) {
                callback(200, resultado, 'json');
            } else {
                callback(500, { 'Error': 'Error al detener servicio', 'Detalle': err.toString() }, 'json');
            }
        });
    } else if (accion == 'estado') {
        tareas.estadoServicio(function(err, resultado) {
            if (!err) {
                callback(200, resultado, 'json');
            } else {
                callback(500, { 'Error': 'Error al obtener estado', 'Detalle': err.toString() }, 'json');
            }
        });
    } else {
        callback(400, { 'Error': 'Acción no válida. Use: iniciar, detener, estado' }, 'json');
    }
};

// ============================================
// NUEVO HANDLER: Activar/Desactivar tarea
// ============================================
handlers.tareasToggle = function(data, callback) {
    var acceptableMethods = ['get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tareasToggle[data.method](data, callback);
    } else {
        callback(405, { 'Error': 'Method not allowed' });
    }
};

handlers._tareasToggle = {};

handlers._tareasToggle.get = function(data, callback) {
    var id = parseInt(data.queryStringObject.id);

    if (isNaN(id) || id <= 0) {
        callback(400, { 'Error': 'ID inválido' }, 'json');
        return;
    }

    tareas._metodos.toggleActiva(id, function(err, resultado) {
        if (!err) {
            callback(200, resultado, 'json');
        } else {
            callback(400, { 'Error': 'Error al cambiar estado', 'Detalle': err.toString() }, 'json');
        }
    });
};

// ============================================
// NUEVO HANDLER: Editar tarea
// ============================================
handlers.tareasEditar = function(data, callback) {
    var acceptableMethods = ['get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tareasEditar[data.method](data, callback);
    } else {
        callback(405, { 'Error': 'Method not allowed' });
    }
};

handlers._tareasEditar = {};

handlers._tareasEditar.get = function(data, callback) {
    var params = {
        id: parseInt(data.queryStringObject.id),
        campo: data.queryStringObject.campo,
        valor: data.queryStringObject.valor
    };

    // Para campos numéricos, convertimos a número
    if (params.campo !== 'subject') {
        params.valor = parseInt(params.valor);
    }

    tareas._metodos.editar(params, function(err, resultado) {
        if (!err) {
            callback(200, resultado, 'json');
        } else {
            callback(400, { 'Error': 'Error al editar tarea', 'Detalle': err.toString() }, 'json');
        }
    });
};

// Añadir al final de handlers.js, antes de module.exports

// API interna para notificaciones websocket (no expuesta al router)
handlers._notificarWebsocket = function(data, callback) {
    var mensaje = typeof(data.queryStringObject.mensaje) == 'string' ?
                  decodeURIComponent(data.queryStringObject.mensaje) : 'Recordatorio';

    // Emitir a todos los clientes conectados
    // Nota: Necesitamos acceso a io. Lo obtendremos mediante el objeto global o require
    try {
        var io = require('socket.io').sockets; // Esto puede no funcionar directamente
        io.emit('notificacion-tarea', {
            mensaje: mensaje,
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        });
        callback(200, { ok: true });
    } catch (e) {
        debug('Error al emitir notificación:', e);
        callback(500, { error: e.message });
    }
};


// ============================================
// HANDLERS PARA YOUTUBE
// ============================================

// Cargar el módulo de youtube
var youtube = require('./youtube');

// Página principal de videos (interfaz HTML)
handlers.videosPagina = function(data, callback) {
    // Reject any request that isn't a GET
    if (data.method == 'get') {
        // Prepare data for interpolation
        var templateData = {
            'head.title': 'Videos de Echoes ES',
            'head.description': 'Lista de videos del canal Echoes ES',
            'body.title': 'Videos de Echoes ES',
            };
        // Read in the videos template as a string
        helpers.getTemplate('videos', templateData, function(err, str) {
            if (!err && str) {
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function(err, str) {
                    if (!err && str) {
                        // Return that page as HTML
                        callback(200, str, 'html');
                    } else {
                        callback(500, undefined, 'html');
                    }
                });
            } else {
                callback(500, undefined, 'html');
            }
        });
    } else {
        callback(405, undefined, 'html');
    }
};

// API: Listar videos con paginación
handlers.videosListar = function(data, callback) {
    var acceptableMethods = ['get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._videosListar[data.method](data, callback);
    } else {
        callback(405, { 'Error': 'Method not allowed' });
    }
};

// Container for videosListar methods
handlers._videosListar = {};

handlers._videosListar.get = function(data, callback) {
    // Obtener parámetros de paginación
    var pagina = parseInt(data.queryStringObject.pagina) || 1;
    var itemsPorPagina = parseInt(data.queryStringObject.items) || 20;

    // Validar valores
    if (pagina < 1) pagina = 1;
    if (itemsPorPagina < 1) itemsPorPagina = 20;
    if (itemsPorPagina > 100) itemsPorPagina = 100; // Límite razonable

    youtube.listarVideos(pagina, itemsPorPagina, function(err, resultado) {
        if (!err) {
            callback(200, resultado, 'json');
        } else {
            callback(500, {
                'Error': 'Error al listar videos',
                'Detalle': err.toString()
            }, 'json');
        }
    });
};

// API: Actualizar videos desde YouTube
handlers.videosActualizar = function(data, callback) {
    var acceptableMethods = ['get', 'post'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._videosActualizar[data.method](data, callback);
    } else {
        callback(405, { 'Error': 'Method not allowed' });
    }
};

// Container for videosActualizar methods
handlers._videosActualizar = {};

handlers._videosActualizar.get = function(data, callback) {
    // GET simple (para pruebas o triggers manuales)
    youtube.actualizarVideos(function(err, resultado) {
        if (!err) {
            callback(200, resultado, 'json');
        } else {
            callback(500, {
                'Error': 'Error al actualizar videos',
                'Detalle': err.toString()
            }, 'json');
        }
    });
};

handlers._videosActualizar.post = function(data, callback) {
    // POST (para uso programático, igual que GET por ahora)
    youtube.actualizarVideos(function(err, resultado) {
        if (!err) {
            callback(200, resultado, 'json');
        } else {
            callback(500, {
                'Error': 'Error al actualizar videos',
                'Detalle': err.toString()
            }, 'json');
        }
    });
};

// API: Obtener estadísticas de YouTube (opcional)
handlers.videosEstadisticas = function(data, callback) {
    var acceptableMethods = ['get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._videosEstadisticas[data.method](data, callback);
    } else {
        callback(405, { 'Error': 'Method not allowed' });
    }
};

// Container for videosEstadisticas methods
handlers._videosEstadisticas = {};

handlers._videosEstadisticas.get = function(data, callback) {
    const db = new sqlite3.Database(path.join(__dirname, '../youtube.db'));

    db.get('SELECT COUNT(*) as total FROM videos', function(err, totalRow) {
        if (err) {
            db.close();
            callback(500, { 'Error': 'Error al obtener estadísticas' }, 'json');
            return;
        }

        db.get('SELECT MAX(fecha_obtencion) as ultima_actualizacion FROM videos', function(err, fechaRow) {
            db.close();

            if (err) {
                callback(500, { 'Error': 'Error al obtener estadísticas' }, 'json');
                return;
            }

            callback(200, {
                totalVideos: totalRow.total,
                ultimaActualizacion: fechaRow.ultima_actualizacion || null
            }, 'json');
        });
    });
};

// API: Buscar videos por título (opcional)
handlers.videosBuscar = function(data, callback) {
    var acceptableMethods = ['get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._videosBuscar[data.method](data, callback);
    } else {
        callback(405, { 'Error': 'Method not allowed' });
    }
};

handlers._videosBuscar = {};

handlers._videosBuscar.get = function(data, callback) {
    var query = data.queryStringObject.q;

    if (!query || query.trim().length === 0) {
        callback(400, { 'Error': 'Parámetro de búsqueda requerido' }, 'json');
        return;
    }

    var pagina = parseInt(data.queryStringObject.pagina) || 1;
    var itemsPorPagina = parseInt(data.queryStringObject.items) || 20;
    var offset = (pagina - 1) * itemsPorPagina;

    const db = new sqlite3.Database(path.join(__dirname, '../youtube.db'));

    // Buscar videos que contengan la query en el título (case insensitive)
    var searchPattern = '%' + query + '%';

    db.get(
        'SELECT COUNT(*) as total FROM videos WHERE titulo LIKE ?',
        [searchPattern],
        function(err, totalRow) {
            if (err) {
                db.close();
                callback(500, { 'Error': 'Error al buscar videos' }, 'json');
                return;
            }

            var total = totalRow.total;

            db.all(
                'SELECT * FROM videos WHERE titulo LIKE ? ORDER BY fecha_publicacion DESC LIMIT ? OFFSET ?',
                [searchPattern, itemsPorPagina, offset],
                function(err, rows) {
                    db.close();

                    if (err) {
                        callback(500, { 'Error': 'Error al buscar videos' }, 'json');
                    } else {
                        callback(200, {
                            query: query,
                            pagina: pagina,
                            itemsPorPagina: itemsPorPagina,
                            total: total,
                            totalPaginas: Math.ceil(total / itemsPorPagina),
                            videos: rows
                        }, 'json');
                    }
                }
            );
        }
    );
};


// Ping handler
handlers.ping = function(data,callback) {
	// Callback a http status code, and a payload object
	callback(200);
	};
// Not found handler
handlers.notFound = function(data,callback) {
	callback(404);
	};
// Export the module
module.exports = handlers;
