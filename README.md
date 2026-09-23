# 🐹 Tablas de Multiplicar con Peke la Hámster 3D

Aplicación web educativa interactiva diseñada especialmente para **Isabella (10 años, 4° Básico en Chile)** para aprender y dominar las tablas de multiplicar del **1 al 12**.

Funciona **100% sin conexión (offline)**, con **mascota 3D interactiva**, **voz hablada real**, **pedagogía COPISI** y **vales de premios de papá**.

---

## ✨ Características Especiales

1. **Peke la Hámster en 3D 🐹:**
   - Mascota 3D modelada en WebGL con estilo cartoon / Pixar.
   - Sigue suavemente con la mirada el cursor o el dedo en la pantalla táctil.
   - Pestañea, mueve sus orejitas, respira y salta de alegría cuando Isabella acierta.

2. **🗣️ Peke le Habla a Isabella (Voz Real Offline):**
   - Utiliza el motor nativo del navegador (*Web Speech API*) para hablarle con voz tierna en español sin consumir internet ni necesitar APIs externas.
   - La saluda por su nombre: *"¡A practicar, Isabella! ¿Cuánto es 7 por 8?"*.
   - Mueve su boquita mientras habla y le da ánimos: *"¡Seca, Isabella!", "¡Peke está feliz!"*.
   - Botón `🗣️` en la barra superior para activar o silenciar la voz cuando lo desees.

3. **🎯 Gran Desafío Garantizado (Todas las Tablas):**
   - Asegura de forma matemática que aparezca **al menos 1 ejercicio de cada una de las tablas seleccionadas** (ej. las 12 tablas completas o el grupo que configuren).

4. **⚙️ Panel de Ajustes y Control de Tablas:**
   - Botón rápido *"Hasta el 10"* (currículum 4° básico) o *"Hasta el 12"* (completo).
   - 12 botones para encender o apagar tablas individuales.
   - Campo para editar el nombre de la estudiante.

5. **🎁 Vales y Premios de Papá para Isabella:**
   - Sistema de recompensas reales canjeables con estrellas ⭐:
     * 🍦 *Ir por un rico helado con papá* (30 estrellas)
     * 🎬 *Elegir la película de la noche* (50 estrellas)
     * 🎡 *Tarde de paseo o juegos favoritos* (80 estrellas)
   - Formulario para que papá agregue cualquier premio nuevo.
   - Generación de un **Vale Oficial de Peke** dorado y firmado al canjear.

6. **Pedagogía COPISI (Sumo Primero MINEDUC Chile):**
   - Botón *"🌻 ¿Ver con semillitas? (Pista)"* que dibuja instantáneamente una cuadrícula de semillitas de girasol (filas × columnas) para comprender visualmente la multiplicación y la conmutatividad.

7. **100% Offline y Cero Dependencias Externas:**
   - Todo local: HTML5, CSS3, JS Vanilla y Three.js local (`three.min.js`).
   - Efectos de sonido sintetizados en vivo con **Web Audio API**.
   - Teclado numérico táctil en pantalla + compatibilidad con teclado físico.
   - PWA instalable con Service Worker Cache-First.

---

## 🚀 Cómo Usarla en Tu Computador o Tablet (Modo Local Offline)

No necesitas instalar Node.js ni ningún programa:
1. Haz **doble clic en el archivo `index.html`**.
2. ¡Listo! Se abrirá inmediatamente en Chrome, Edge o tu navegador favorito, incluso si desconectas el Wi-Fi.

---

## 🌐 Cómo Subir a Tu Repositorio de GitHub

Tu repositorio oficial ya está configurado en el proyecto (`origin` $\rightarrow$ `https://github.com/Khiira/GameMultipliti.git`) en la rama `main`.

Para subir los cambios a GitHub, solo ejecuta en tu terminal:

```bash
git push -u origin main
```

*(Si se abre una ventana del navegador de GitHub o de Git Credential Manager, simplemente inicia sesión para autorizar la subida).*

---

## ☁️ Cómo Activarlo en la Web Gratis (Para que Isabella entre desde cualquier lugar)

### Opción 1: GitHub Pages (1 Clic)
1. Entra a tu repositorio: [github.com/Khiira/GameMultipliti](https://github.com/Khiira/GameMultipliti)
2. Ve a **Settings** (pestaña superior del repositorio) $\rightarrow$ **Pages** (menú izquierdo).
3. En **Build and deployment > Branch**, selecciona `main` y la carpeta `/(root)`.
4. Haz clic en **Save**.
5. En 1 minuto tendrás tu enlace público oficial gratuito:
   👉 **`https://Khiira.github.io/GameMultipliti/`**

### Opción 2: Vercel (Recomendado, 30 segundos)
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu GitHub.
2. Haz clic en **"Add New... > Project"**.
3. Selecciona tu repositorio `Khiira/GameMultipliti` y haz clic en **Deploy**.
4. ¡Listo! Vercel te dará una URL ultra rápida como `https://gamemultipli.vercel.app`.
