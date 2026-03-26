'use strict';
var http = require('http');
var servidores = require('./servidores');
var sonidos = {};
sonidos.sonido = function(sonido) {
	if (sonido) {
		var requestDetails = {
			protocol: 'http:',
			hostname: servidores.ipAddress,
			method: 'GET',
			path: '/sonidos/?sonido='+sonido,
			port: 8092,
			timeout: 5000
			};
		var req = http.request(requestDetails,function(res) { // res.statusCode
			var str = '';
			res.on('data', function(chunk) {
				str += chunk;
				});
			res.on('end', function() {});
			});
		req.on('error', function(e) {
			console.log('Error al momento de reproducir el sonido en tercerservidor');
			});
		req.on('timeout',function(e) {
			console.log('Timeout al momento de reproducir el sonido en tercerservidor');
			});
		req.end();
		}
	else {
		console.log('sonido inválido');
		}
	};
module.exports = sonidos;
