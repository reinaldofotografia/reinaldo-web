/* Reinaldo Lugo Fotografía — comportamiento del sitio */

document.addEventListener("DOMContentLoaded", () => {
  marcarEnlaceActivo();
  configurarMenuMovil();
  configurarEncabezadoAlDesplazar();
  cargarPortadaDinamica();
  cargarGaleriaDinamica();
});

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
    contenedor.innerHTML = mostrar
      .map((nombre) => {
        const url = `${urlBaseCDN()}/${SITIO_CONFIG.carpetaPortafolio}/${nombre}`;
        return `
          <figure>
            <a href="${url}" target="_blank" rel="noopener">
              <img src="${url}" alt="Fotografía de Reinaldo Lugo" loading="lazy">
            </a>
          </figure>`;
      })
      .join("");
  } catch (error) {
    contenedor.innerHTML =
      '<p class="galeria-estado">No se pudo cargar el portafolio en este momento. Intenta recargar la página.</p>';
    console.error(error);
  }
}
