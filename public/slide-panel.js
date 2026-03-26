/*
 * martes 7 octubre 2025 15:42
 * Extraido de ../Asssets/js/datatables/slide-panel.js del Esequibo
 * Se modificó para adecuarlo para nuestros propósitos acá, ya que estaba adaptado a funciones propias del Esequibo
 * */
class SlidePanel extends HTMLElement {
	debounceTimeout = null; // Propiedad de clase (no necesitas this en el constructor)
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					position: relative;
					overflow: hidden;
				}

				#panel {
					overflow: hidden;
					max-height: 0;
					transition: max-height 0.5s ease;
				}

				.close-btn {
					position: absolute;
					top: 10px;
					right: 10px;
					background: transparent;
					color: white;
					border: none;
					font-size: 20px;
					cursor: pointer;
					z-index: 10;
				}
			</style>
			<div id="panel">
				<button class="close-btn" title="Cerrar panel">&times;</button>
				<slot></slot>
			</div>
		`;

		this.panel = this.shadowRoot.querySelector('#panel');
		this.btnCerrar = this.shadowRoot.querySelector('.close-btn');
		this.btnCerrar.addEventListener('click', () => this.ocultar());

		// Esperar a que el contenido del slot esté listo
		this.shadowRoot.querySelector('slot').addEventListener('slotchange', () => {
			this._configurarBotonBuscar();
		});
	}

	_configurarBotonBuscar() {
		const slot = this.shadowRoot.querySelector('slot');
		// sirve para obtener los elementos que están "asignados" al <slot> dentro de tu Web Component. 
		// Cuando usas <slot> en un componente Web Component, ese slot actúa como un punto donde el contenido del Light DOM (el contenido que metes entre las etiquetas de tu componente) se "inyecta" dentro del Shadow DOM.
		// assignedElements() devuelve los elementos que se han pasado al slot desde fuera del componente.
		// El parámetro { flatten: true } le dice a la función que busque recursivamente a través de todos los slots anidados. Es útil si tienes slots dentro de otros slots (caso raro, pero posible). Con flatten: true, te aseguras de obtener todos los elementos visibles finales que realmente están renderizados en ese slot.
		const elementosAsignados = slot.assignedElements({ flatten: true });

		// Buscar el botón "Search" dentro del contenido "distribuido"
		// usa el operador de encadenamiento opcional (?.), también conocido como "optional chaining" en JavaScript.
		// Este operador te permite acceder a propiedades o métodos de un objeto solo si ese objeto no es null ni undefined. Si lo es, retorna undefined automáticamente en lugar de lanzar un error.
		// "Si elementosAsignados[1] existe (no es undefined o null), entonces ejecuto .querySelector('.btn.btn-primary') sobre él.
		// Si no existe, entonces botonBuscar será undefined y no lanza error."
		}
	expandir() { // Es usado por view.js cuando el componente dropdown-menu despacha el evento chat-click
		// .scrollHeight. Es una propiedad de elementos DOM que representa la altura total del contenido interno, incluyendo el contenido que no cabe a simple vista (por ejemplo, si hay scroll); incluso si parte de ese contenido no está visible por desbordamiento (overflow)
		const scrollHeight = this.panel.scrollHeight;
		this.panel.style.maxHeight = scrollHeight + 'px'; // La altura del contenido interno de this.panel
		this.dispatchEvent(new CustomEvent('slide-down-end', {
			bubbles: true,
			composed: true
			}));
		}
	ocultar() {
		this.panel.style.maxHeight = '0';
		this.dispatchEvent(new CustomEvent('slide-up-end', {
			bubbles: true,
			composed: true
			}));
		}
}

customElements.define('slide-panel', SlidePanel);
