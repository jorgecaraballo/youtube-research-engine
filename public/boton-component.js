/* 
 * martes 07 octubre 2025 17:06
 * Deriva de comentario-button.js (tarea 3480)
 * */
class BotonComponent extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({mode: 'open'});
		this.shadowRoot.append(BotonComponent.template.content.cloneNode(true));
		this.button = this.shadowRoot.children[1].children[0];
		this.button.addEventListener('click', () => {
			this.dispatchEvent(new CustomEvent('click-boton-component', {
				bubbles: true,
				composed: true
				}));
			});
		}
	}
BotonComponent.template = document.createElement('template');
BotonComponent.template.innerHTML = `
<style>
/* Estilos base para todos los botones */
.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

/* Estilos para botones con borde secundario */
.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
  background-color: #2a3357;
}

/* Hover effect */
.btn:hover {
  text-decoration: none;
  background-color: #2a3357;
}

.btn-outline-secondary:hover {
  background-color: #303775;
  border-color: #6c757d;
  color: #aaa;
}
.text-info {
  color: #17a2b8;
}
h3 {
	margin-top: 1rem;
}
a {
	color: cornflowerblue;
}
a:hover {
	color: DodgerBlue;
}
</style>
<div>
	<button class="btn btn-outline-secondary">
		<slot>Botón</slot>
	</button>
</div>
`;
customElements.define("boton-component", BotonComponent);
