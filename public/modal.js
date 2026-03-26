'use strict';
var modal = {};
modal.modal = function(td, contenedorModal) {
	var modal = document.createElement('div');
	modal.id = 'modal';
	modal.style.position = 'fixed';
	modal.style.left = '0';
	modal.style.top = '0';
	modal.style.width = '100%';
	modal.style.height = '100%';
	modal.style.overflow = 'auto';
	modal.style.backgroundColor = 'rgba(0,0,0,0.4)';
	modal.style.zIndex = '1';
		var modalContent = document.createElement('div');
		modalContent.style.backgroundColor = '#343a40';
		modalContent.style.margin = '6% auto';
		modalContent.style.width = '80%';
		modalContent.style.border = '1px solid #888';
		modalContent.style.borderRadius = '0.5em';
		modalContent.style.padding = '20px';
		modalContent.style.textAlign = 'center';
			var fila = document.createElement('div');
			fila.className = "clearfix";
				var columna = document.createElement('div');
				columna.className = 'float-end';
					var botonCerrar = document.createElement('span');
					//botonCerrar.className = "close botonClose";
					botonCerrar.innerHTML = '&times;';
					botonCerrar.style.fontSize = '3em';
					botonCerrar.style.fontWeight = 'bold';
					botonCerrar.style.color = '#aaa';
					botonCerrar.style.cursor = 'pointer';
					botonCerrar.addEventListener('mouseover', function() {
						this.style.color = 'cyan';
						});
					botonCerrar.addEventListener('mouseleave', function() {
						this.style.color = '#aaa';
						});
					botonCerrar.addEventListener('click', function() {
						modal.remove();
						});
				columna.appendChild(botonCerrar);
			fila.appendChild(columna);
			
		modalContent.appendChild(fila);
		
		
		// Aquí el contenido
			// domingo 11 diciembre 2022 09:48. 
			// Lo primero que hay que hacer es consultar si el contact_id tiene
			// un registro asociado en la tabla binance_orders
			// Si lo tiene, muestra la información y no da la opción de comprar 
			// Bitcoin "manualmente" en Binance. Si no tiene registro asociado, 
			// entonces sí dará la opción de comprar Bitcoin en Binance. 
			
			fila = document.createElement('div');
			fila.className = 'row';
				columna = document.createElement('div');
				columna.className = 'col';
					var span = document.createElement('span');
					span.textContent = 'contact_id: ';
				columna.appendChild(span);
					var b = document.createElement('b');
					b.className = 'text-info';
					b.textContent = td.textContent;
					var contact_id = td.textContent;
				columna.appendChild(b);
			fila.appendChild(columna);
				columna = document.createElement('div');
				columna.className = 'col';
					span = document.createElement('span');
					span.textContent = 'amount_btc: ';
				columna.appendChild(span);
					b = document.createElement('b');
					b.className = 'text-info';
					b.textContent = td.amount_btc;
					var amount_btc = td.amount_btc;
				columna.appendChild(b);
			fila.appendChild(columna);
		modalContent.appendChild(fila);
		
			var filaSpinner = document.createElement('div');
			filaSpinner.className = 'row';
				var columnaSpinner = document.createElement('div');
				columnaSpinner.className = 'col';
				var $columnaSpinner = $(columnaSpinner);
					var spinner = document.createElement('div');
					spinner.className = 'spinner-border';
					spinner.style.height = '3em';
					spinner.style.width = '3em';
				columnaSpinner.appendChild(spinner);
			filaSpinner.appendChild(columnaSpinner);
		modalContent.appendChild(filaSpinner);
		
			
			app.client.request(undefined,'api/binance_orders','GET',{contact_id: td.textContent},undefined,function(statusCode, payload) {
				$columnaSpinner.empty();
				if (statusCode == 200) {
					if (payload.length > 0) { // Tiene un registro en binance_orders
						var titulo = document.createElement('h5');
						titulo.className = 'text-info';
						titulo.textContent = 'binance_orders';
						$columnaSpinner.append(titulo);
						var contenedorTabla = document.createElement('div');
						contenedorTabla.className = 'table-responsive';
							var tabla = document.createElement('table');
							tabla.className = 'table table-dark table-hover';
								var thead = document.createElement('thead');
									var tr = document.createElement('tr');
										var th = document.createElement('th');
										th.textContent = 'id';
									tr.appendChild(th);
										th = document.createElement('th');
										th.textContent = 'usdt_promedio';
									tr.appendChild(th);
										th = document.createElement('th');
										th.textContent = 'contact_id';
									tr.appendChild(th);
										th = document.createElement('th');
										th.textContent = 'symbol';
									tr.appendChild(th);
										th = document.createElement('th');
										th.textContent = 'orderId';
									tr.appendChild(th);
										th = document.createElement('th');
										th.textContent = 'transactTime';
									tr.appendChild(th);
										th = document.createElement('th');
										th.textContent = 'price';
									tr.appendChild(th);
										th = document.createElement('th');
										th.textContent = 'origQty';
									tr.appendChild(th);
										th = document.createElement('th');
										th.textContent = 'cummulativeQuoteQty';
									tr.appendChild(th);
										th = document.createElement('th');
										th.textContent = 'status';
									tr.appendChild(th);
										th = document.createElement('th');
										th.textContent = 'type';
									tr.appendChild(th);
										th = document.createElement('th');
										th.textContent = 'side';
									tr.appendChild(th);
								thead.appendChild(tr);
							tabla.appendChild(thead);
								var tbody = document.createElement('tbody');
								var meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
									for (var i = 0, d, orderId, abbr; i < payload.length; i++) {
										tr = document.createElement('tr');
											var td = document.createElement('td');
											td.textContent = payload[i].id;
										tr.appendChild(td);
											td = document.createElement('td');
											td.textContent = payload[i].usdt_promedio;
										tr.appendChild(td);
											td = document.createElement('td');
											td.textContent = payload[i].contact_id;
										tr.appendChild(td);
											td = document.createElement('td');
											td.textContent = payload[i].symbol;
										tr.appendChild(td);
											td = document.createElement('td');
											td.textContent = payload[i].orderId;
											orderId = payload[i].orderId;
										tr.appendChild(td);
											td = document.createElement('td');
											d = new Date(payload[i].transactTime);
											//td.textContent = d.toString();
												abbr = document.createElement('abbr');
												abbr.textContent = d.getFullYear()+' '+meses[d.getMonth()]+' '+d.getDate();
												abbr.title = (d.getHours() < 10 ? '0'+d.getHours() : d.getHours())+':'+(d.getMinutes() < 10 ? '0'+d.getMinutes() : d.getMinutes())+':'+(d.getSeconds() < 10 ? '0'+d.getSeconds() : d.getSeconds())
											td.appendChild(abbr);
										tr.appendChild(td);
											td = document.createElement('td');
											td.textContent = payload[i].price;
										tr.appendChild(td);
											td = document.createElement('td');
											td.textContent = payload[i].origQty;
										tr.appendChild(td);
											td = document.createElement('td');
											td.textContent = payload[i].cummulativeQuoteQty;
										tr.appendChild(td);
											td = document.createElement('td');
											td.textContent = payload[i].status;
										tr.appendChild(td);
											td = document.createElement('td');
											td.textContent = payload[i].type;
										tr.appendChild(td);
											td = document.createElement('td');
											td.textContent = payload[i].side;
										tr.appendChild(td);
										tbody.appendChild(tr);
										} 
							tabla.appendChild(tbody);
						contenedorTabla.appendChild(tabla);
						$columnaSpinner.append(contenedorTabla);
						
						// binance_orders_fills
						app.client.request(undefined,'api/binance_orders_fills','GET',{orderId: orderId},undefined,function(statusCode, payload) {
							if (statusCode == 200) {
								if (payload.length > 0) { // Tiene un registro en binance_orders_fills
									var titulo = document.createElement('h5');
									titulo.className = 'text-info';
									titulo.textContent = 'binance_orders_fills';
									$columnaSpinner.append(titulo);
									var contenedorTabla = document.createElement('div');
									contenedorTabla.className = 'table-responsive';
										var tabla = document.createElement('table');
										tabla.className = 'table table-dark table-hover';
											var thead = document.createElement('thead');
												var tr = document.createElement('tr');
													var th = document.createElement('th');
													th.textContent = 'id';
												tr.appendChild(th);
													th = document.createElement('th');
													th.textContent = 'orderId';
												tr.appendChild(th);
													th = document.createElement('th');
													th.textContent = 'price';
												tr.appendChild(th);
													th = document.createElement('th');
													th.textContent = 'qty';
												tr.appendChild(th);
													th = document.createElement('th');
													th.textContent = 'commission';
												tr.appendChild(th);
													th = document.createElement('th');
													th.textContent = 'commissionAsset';
												tr.appendChild(th);
											thead.appendChild(tr);
										tabla.appendChild(thead);
											var tbody = document.createElement('tbody');
												for (var i = 0, d, abbr; i < payload.length; i++) {
													tr = document.createElement('tr');
														var td = document.createElement('td');
														td.textContent = payload[i].id;
													tr.appendChild(td);
														td = document.createElement('td');
														td.textContent = payload[i].orderId;
													tr.appendChild(td);
														td = document.createElement('td');
														td.textContent = payload[i].price;
													tr.appendChild(td);
														td = document.createElement('td');
														td.textContent = payload[i].qty;
													tr.appendChild(td);
														td = document.createElement('td');
														td.textContent = payload[i].commission;
													tr.appendChild(td);
														td = document.createElement('td');
														td.textContent = payload[i].commissionAsset;
													tr.appendChild(td);
													tbody.appendChild(tr);
													} 
										tabla.appendChild(tbody);
									contenedorTabla.appendChild(tabla);
									$columnaSpinner.append(contenedorTabla);
									}
								else { // No tiene registro en binance_orders_fills
									var mensaje = document.createElement('div');
									mensaje.className = 'alert alert-warning';
									mensaje.textContent = 'No tiene registro asociado en binance_orders_fills';
									$columnaSpinner.append(mensaje);
									}
								}
							else {
								console.log(statusCode);
								console.log(payload);
								}
							});
						
						}
					else { // No tiene registro en binance_orders
						var mensaje = document.createElement('div');
						mensaje.className = 'alert alert-warning';
						mensaje.textContent = 'No tiene registro asociado en binance_orders';
						$columnaSpinner.append(mensaje);
						var $mensaje = $(mensaje);
						$mensaje.delay(3000).slideUp("fast", function() {});
						
						var filaPizarron = document.createElement('div');
						filaPizarron.className = 'row mt-2';
							var columnaPizarron = document.createElement('div');
							columnaPizarron.className = 'col';
								var span = document.createElement('span');
								span.textContent = 'amount Bitcoin a comprar en Binance: ';
							columnaPizarron.appendChild(span);
								var b = document.createElement('b');
								b.className = 'text-info';
								var btc_a_comprar_en_binance = amount_btc * 1.004;
								b.textContent = btc_a_comprar_en_binance;
							columnaPizarron.appendChild(b);
						filaPizarron.appendChild(columnaPizarron);
						$columnaSpinner.append(filaPizarron);

						filaPizarron = document.createElement('div');
						filaPizarron.className = 'row';
							columnaPizarron = document.createElement('div'); // Aquí decidiremos cual banco vamos a usar.
							columnaPizarron.className = 'col-4 mx-auto';
								var contenedor = document.createElement('div');
									var abbr = document.createElement('abbr');
									abbr.textContent = 'Banco:';
									abbr.title = 'Banco del cual se sacará el usdtPromedio';
								contenedor.appendChild(abbr);
							columnaPizarron.appendChild(contenedor);
								contenedor = document.createElement('div');
								contenedor.className = 'form-check';
									var input = document.createElement('input');
									input.type = 'radio';
									input.id = 'venezuela';
									input.value = 'venezuela';
									input.name = 'bancoSeleccionado';
									input.className = 'form-check-input';
								contenedor.appendChild(input);
									var label = document.createElement('label');
									label.htmlFor = 'venezuela';
									label.textContent = 'venezuela';
									label.className = 'form-check-label';
								contenedor.appendChild(label);
							columnaPizarron.appendChild(contenedor);
								contenedor = document.createElement('div');
								contenedor.className = 'form-check';
									input = document.createElement('input');
									input.type = 'radio';
									input.id = 'mercantil';
									input.value = 'mercantil';
									input.name = 'bancoSeleccionado';
									input.className = 'form-check-input';
								contenedor.appendChild(input);
									label = document.createElement('label');
									label.htmlFor = 'mercantil';
									label.textContent = 'mercantil';
									label.className = 'form-check-label';
								contenedor.appendChild(label);
							columnaPizarron.appendChild(contenedor);
								contenedor = document.createElement('div');
								contenedor.className = 'form-check';
									input = document.createElement('input');
									input.type = 'radio';
									input.id = 'provincial';
									input.value = 'provincial';
									input.name = 'bancoSeleccionado';
									input.className = 'form-check-input';
								contenedor.appendChild(input);
									label = document.createElement('label');
									label.htmlFor = 'provincial';
									label.textContent = 'provincial';
									label.className = 'form-check-label';
								contenedor.appendChild(label);
							columnaPizarron.appendChild(contenedor);
						filaPizarron.appendChild(columnaPizarron);
						$columnaSpinner.append(filaPizarron);

						filaPizarron = document.createElement('div');
						filaPizarron.className = 'row';
							columnaPizarron = document.createElement('div');
							columnaPizarron.className = 'col';
								var botonComprarBtcEnBinance = document.createElement('span');
								botonComprarBtcEnBinance.className = 'btn btn-outline-info';
								botonComprarBtcEnBinance.textContent = 'Proceder con la compra';
								botonComprarBtcEnBinance.addEventListener('click', function() {
									var confirmacion = confirm('¿Seguro que desea realizar la compra de Bitcoin en Binance?');
									if (confirmacion) {
										// Procede con la compra de Bitcoin en Binance.
										var bancoSeleccionado = document.getElementsByClassName('form-check-input');
										var verificaBancoSeleccionado = false, elBancoSeleccionadoFue = false;
										for (var i = 0; i < bancoSeleccionado.length; i++) {
											if (bancoSeleccionado[i].checked) {
												elBancoSeleccionadoFue = bancoSeleccionado[i].value;
												verificaBancoSeleccionado = true;
												}
											}
										if (verificaBancoSeleccionado && elBancoSeleccionadoFue) {
											var filaSpinner = document.createElement('div');
											filaSpinner.className = 'row';
												var columnaSpinner = document.createElement('div');
												columnaSpinner.className = 'col';
													var spinner = document.createElement('div');
													spinner.className = 'spinner-border';
													spinner.style.height = '3em';
													spinner.style.width = '3em';
												columnaSpinner.appendChild(spinner);
											filaSpinner.appendChild(columnaSpinner);
											$columnaSpinner.append(filaSpinner);
											app.client.request(undefined,'api/comprabtcbinance','POST',undefined,{amount: btc_a_comprar_en_binance, banco: elBancoSeleccionadoFue, contact_id: contact_id},function(statusCode, payload) {
												if (statusCode == 200) {
													spinner.remove();
													console.log(payload);
													}
												else {
													console.log(statusCode);
													console.log(payload);
													}
												});
											}
										else {
											alert('No se seleccionó ningún banco!');
											}
										}
									});
							columnaPizarron.appendChild(botonComprarBtcEnBinance);
						filaPizarron.appendChild(columnaPizarron);
						$columnaSpinner.append(filaPizarron);
						}
					}
				else {
					console.log(statusCode);
					console.log(payload);
					}
				});
				
		// Fin contenido

		
	modal.appendChild(modalContent);
	
	contenedorModal.appendChild(modal);

	};
