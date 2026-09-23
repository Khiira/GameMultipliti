# 🐹 Tablas de Multiplicar con Peke la Hámster

Aplicación web educativa interactiva diseñada a medida para estudiar y dominar las tablas de multiplicar del **1 al 12**, especialmente pensada para niñas y niños de **4° Básico en Chile (10 años)**.

Funciona **100% sin conexión (offline)**, carga de manera instantánea y está lista para ser subida a **GitHub** y desplegada gratis en **Vercel, Netlify o GitHub Pages**.

---

## ✨ Características Principales

1. **Peke la Hámster 🐹:**
   - Mascota animada que acompaña en todo momento.
   - Refuerzo positivo: por cada acierto, Peke come semillitas de girasol 🌻 y celebra con frases motivadoras chilenas (*"¡Seca!", "¡Excelente!", "¡Muy bien!"*).
   - **Sin frustración:** Intentos ilimitados. Si hay un error, Peke no castiga ni quita vidas; ofrece cariño y muestra la pista visual.

2. **Pedagogía COPISI (Sumo Primero MINEDUC Chile):**
   - Botón *"🌻 ¿Ver con semillitas? (Pista)"* que dibuja al instante un arreglo rectangular de semillitas de girasol (filas × columnas).
   - Permite que la niña entienda la multiplicación como un área y visualice la propiedad conmutativa ($6 \times 7 = 7 \times 6$).

3. **Modos de Aprendizaje:**
   - **Tablas 1 al 12:** Selector con tarjetas interactivas y medidor de dominio con estrellas (1 a 3 estrellas por tabla).
   - **🎯 Gran Desafío de Peke:** 12 ejercicios sorpresa con las combinaciones clave de 4° básico (tablas del 6, 7, 8, 9, 11 y 12).
   - **📊 Tabla Pitagórica Mágica ($12 \times 12$):** Cuadrícula completa interactiva. Al tocar cualquier celda se iluminan la fila y la columna, mostrando el cálculo y los cuadrados perfectos.
   - **🏆 Vitrina de Premios:** Medallas coleccionables por esfuerzo y constancia (*"Primera Semilla"*, *"Doble del Doble"*, *"Reina del 7"*, etc.).

4. **100% Offline y Cero Dependencias:**
   - Cero CDNs externos ni llamadas a internet.
   - Efectos de sonido sintetizados en tiempo real con **Web Audio API** (sin archivos de audio que descargar ni problemas de CORS).
   - Teclado numérico táctil en pantalla (ideal para tablets/iPad/móviles sin que el teclado del sistema tape la pantalla) + compatibilidad total con teclado físico en PC.
   - Persistencia automática de progreso en `localStorage`.

---

## 🚀 Cómo Usarla en Tu Computador o Tablet (Modo Local Offline)

No necesitas instalar Node.js ni ningún programa:
1. Haz **doble clic en el archivo `index.html`**.
2. ¡Listo! Se abrirá inmediatamente en Chrome, Edge o tu navegador favorito, incluso si desconectas el Wi-Fi.
3. Puedes crear un acceso directo a `index.html` en el Escritorio para que tu hija ingrese con un solo clic.

---

## 🌐 Cómo Subirla a Internet (GitHub, Vercel, Netlify o GitHub Pages)

### Opción A: Despliegue en GitHub Pages (Gratis y Permanente)
1. Abre la terminal en esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "Tablas de multiplicar con Peke la Hamster"
   ```
2. Crea un repositorio en tu cuenta de GitHub (por ejemplo `tablas-peke`) y sube el código:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/tablas-peke.git
   git branch -M main
   git push -u origin main
   ```
3. En GitHub, entra a tu repositorio $\rightarrow$ **Settings** $\rightarrow$ **Pages** $\rightarrow$ En **Source** selecciona `main` y guarda.
4. En 1 minuto tendrás tu enlace público (ejemplo: `https://TU_USUARIO.github.io/tablas-peke/`).

### Opción B: Despliegue en Vercel (Recomendado, 30 segundos)
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New Project"** e importa el repositorio `tablas-peke`.
3. Haz clic en **"Deploy"** (el archivo `vercel.json` ya está configurado).
4. Vercel te dará un enlace ultra rápido tipo `https://tablas-peke.vercel.app`.

### Opción C: Despliegue en Netlify (Arrastrar y Soltar)
1. Entra a [netlify.com](https://netlify.com).
2. Ve a la sección **"Sites"** y simplemente **arrastra toda esta carpeta** sobre el navegador.
3. Se publicará al instante con un enlace web activo.

---

## 🧩 Cómo Agregar Más Módulos en el Futuro

La arquitectura fue construida para ser sumamente extensible:
* Para agregar un módulo de **Divisiones**: solo añades un botón en la barra de navegación (`main-nav`) con su sección correspondiente en `index.html` y la lógica de preguntas inversas en `app.js`.
* Para agregar **Fracciones** o **Problemas de texto**: puedes duplicar el patrón de tarjetas y vistas sin tocar la estructura base.

¡A disfrutar aprendiendo junto a Peke! 🐹🌻⭐
