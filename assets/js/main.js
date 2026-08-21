/* Reinaldo Lugo Fotografía — comportamiento del sitio */

document.addEventListener("DOMContentLoaded", () => {
  marcarEnlaceActivo();
  configurarMenuMovil();
  configurarEncabezadoAlDesplazar();
  cargarPortadaDinamica();
  cargarGaleriaDinamica();
  protegerImagenes();
});

/* ---------- Protección básica contra descarga fácil ----------
   No es infalible (una captura de pantalla siempre es posible),
   pero evita el clic derecho > Guardar imagen, el arrastrar la
   imagen fuera del navegador, y el guardado por toque largo en
   móvil. */
function protegerImagenes() {
  document.addEventListener("contextmenu", (evento) => {
    if (evento.target.tagName === "IMG") evento.preventDefault();
  });
  document.addEventListener("dragstart", (evento) => {
    if (evento.target.tagName === "IMG") evento.preventDefault();
  });
}

/* Resalta el enlace de la página actual en la navegación */
function marcarEnlaceActivo() {
  const aqui = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-principal a").forEach((enlace) => {
    const destino = enlace.getAttribute("href");
    if (destino === aqui) enlace.classList.add("activo");
  });
}

/* Menú hamburguesa en móvil */
function configurarMenuMovil() {
  const boton = document.querySelector(".boton-menu");
  const nav = document.querySelector(".nav-principal");
  if (!boton || !nav) return;
  boton.addEventListener("click", () => nav.classList.toggle("abierto"));
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => nav.classList.remove("abierto"))
  );
}

/* Fondo sólido en el encabezado al hacer scroll */
function configurarEncabezadoAlDesplazar() {
  const encabezado = document.querySelector(".encabezado");
  if (!encabezado) return;
  const revisar = () => {
    encabezado.classList.toggle("con-fondo", window.scrollY > 40);
  };
  document.addEventListener("scroll", revisar, { passive: true });
  revisar();
}

/* URL base de jsDelivr: sirve los archivos del repo como CDN global,
   rápido y accesible desde cualquier país. */
function urlBaseCDN() {
  const { githubUsuario, githubRepo, githubRama } = SITIO_CONFIG;
  return `https://cdn.jsdelivr.net/gh/${githubUsuario}/${githubRepo}@${githubRama}`;
}

/* Lista los archivos de una carpeta del repositorio usando la API
   pública de GitHub (no requiere clave ni inicio de sesión). */
async function listarCarpeta(carpeta) {
  const { githubUsuario, githubRepo, githubRama } = SITIO_CONFIG;
  const url = `https://api.github.com/repos/${githubUsuario}/${githubRepo}/contents/${carpeta}?ref=${githubRama}`;
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error("No se pudo leer la carpeta " + carpeta);
  const items = await respuesta.json();
  const extensiones = [".jpg", ".jpeg", ".png", ".webp"];
  return items
    .filter((item) => item.type === "file")
    .filter((item) =>
      extensiones.some((ext) => item.name.toLowerCase().endsWith(ext))
    )
    .map((item) => item.name);
}

/* ---------- Portada rotativa (Home) ---------- */
async function cargarPortadaDinamica() {
  const capa = document.querySelector(".hero-imagen");
  if (!capa) return;

  try {
    const archivos = await listarCarpeta(SITIO_CONFIG.carpetaPortada);
    if (archivos.length > 0) {
      const elegido = archivos[Math.floor(Math.random() * archivos.length)];
      capa.src = `${urlBaseCDN()}/${SITIO_CONFIG.carpetaPortada}/${elegido}`;
    }
  } catch (error) {
    console.warn("Portada dinámica no disponible, se usa la imagen por defecto.", error);
  }

  // Revela la imagen (la de respaldo ya está en el HTML como src inicial)
  capa.classList.add("visible");
}

/* ---------- Galería dinámica (Portafolio) ---------- */
async function cargarGaleriaDinamica() {
  const contenedor = document.querySelector("[data-galeria]");
  if (!contenedor) return;

  const limite = Number(contenedor.dataset.limite) || Infinity;

  try {
    const archivos = await listarCarpeta(SITIO_CONFIG.carpetaPortafolio);

    if (archivos.length === 0) {
      contenedor.innerHTML =
        '<p class="galeria-estado">Aún no hay fotos publicadas en el portafolio.</p>';
      return;
    }

    const mostrar = archivos.slice(0, limite);
    const urls = mostrar.map(
      (nombre) => `${urlBaseCDN()}/${SITIO_CONFIG.carpetaPortafolio}/${nombre}`
    );

    contenedor.innerHTML = urls
      .map(
        (url, indice) => `
          <figure>
            <button type="button" class="galeria-boton" data-indice="${indice}" aria-label="Ver foto ${indice + 1} en grande">
              <img src="${url}" alt="Fotografía de Reinaldo Lugo" loading="lazy" oncontextmenu="return false" ondragstart="return false">
            </button>
          </figure>`
      )
      .join("");

    inicializarLightbox(contenedor, urls);
  } catch (error) {
    contenedor.innerHTML =
      '<p class="galeria-estado">No se pudo cargar el portafolio en este momento. Intenta recargar la página.</p>';
    console.error(error);
  }
}

/* ---------- Visor de fotos (lightbox) con navegación ---------- */
function inicializarLightbox(contenedor, urls) {
  // Crea el marcado del visor una sola vez y lo agrega al final del body
  let visor = document.querySelector(".visor-fotos");
  if (!visor) {
    visor = document.createElement("div");
    visor.className = "visor-fotos";
    visor.innerHTML = `
      <button type="button" class="visor-cerrar" aria-label="Cerrar">&times;</button>
      <button type="button" class="visor-flecha visor-anterior" aria-label="Foto anterior">&#8249;</button>
      <img class="visor-imagen" src="" alt="Fotografía de Reinaldo Lugo" oncontextmenu="return false" ondragstart="return false">
      <button type="button" class="visor-flecha visor-siguiente" aria-label="Foto siguiente">&#8250;</button>
      <span class="visor-contador"></span>
    `;
    document.body.appendChild(visor);
  }

  const imagenVisor = visor.querySelector(".visor-imagen");
  const contador = visor.querySelector(".visor-contador");
  let actual = 0;

  const mostrarFoto = (indice) => {
    actual = (indice + urls.length) % urls.length;
    imagenVisor.src = urls[actual];
    contador.textContent = `${actual + 1} / ${urls.length}`;
  };

  const abrir = (indice) => {
    mostrarFoto(indice);
    visor.classList.add("abierto");
    document.body.style.overflow = "hidden";
  };

  const cerrar = () => {
    visor.classList.remove("abierto");
    document.body.style.overflow = "";
  };

  contenedor.querySelectorAll(".galeria-boton").forEach((boton) => {
    boton.addEventListener("click", () => abrir(Number(boton.dataset.indice)));
  });

  visor.querySelector(".visor-cerrar").addEventListener("click", cerrar);
  visor.querySelector(".visor-anterior").addEventListener("click", () => mostrarFoto(actual - 1));
  visor.querySelector(".visor-siguiente").addEventListener("click", () => mostrarFoto(actual + 1));

  // Cierra al hacer clic fuera de la imagen
  visor.addEventListener("click", (evento) => {
    if (evento.target === visor) cerrar();
  });

  // Navegación con teclado
  document.addEventListener("keydown", (evento) => {
    if (!visor.classList.contains("abierto")) return;
    if (evento.key === "Escape") cerrar();
    if (evento.key === "ArrowLeft") mostrarFoto(actual - 1);
    if (evento.key === "ArrowRight") mostrarFoto(actual + 1);
  });
}
