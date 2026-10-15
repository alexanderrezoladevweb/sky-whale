# Sky Bounce

Juego arcade de navegador: lanza al narval volador, rebota en nubes y medusas, recoge monedas y llega lo más lejos posible. HTML5 + Canvas 2D, sin dependencias.

## Jugar
Abre `index.html` en el navegador (no necesita servidor).

- **Lanzar:** toca / clic / Espacio cuando la barra de potencia esté alta.
- **Impulso:** mantén pulsado (Espacio, ↑, W o dedo) para subir; gasta energía.
- **Objetos:** nubes y medusas rebotan, burbujas azules dan energía, orbes naranjas dan turbo, los pájaros te frenan.
- Las monedas se guardan y se gastan en mejoras (potencia, energía, rebote).

## Publicar en GitHub Pages
1. Crea un repositorio y sube estos archivos a la raíz.
2. En **Settings → Pages**, elige la rama `main` y la carpeta `/ (root)`.
3. En un minuto tendrás la URL `https://TU-USUARIO.github.io/TU-REPO/`.

## Personalizar
Todo está en el objeto `CFG` al principio de `game.js`: nombre, colores del narval, colores del cielo y valores de física (gravedad, impulso, rozamiento).
