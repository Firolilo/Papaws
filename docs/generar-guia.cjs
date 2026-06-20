/*
 * Genera "Guia-de-Defensa-Papaws.pdf": una guia de estudio en formato
 * pregunta -> respuesta -> donde mirar, pensada para repasar y buscar.
 * Usa el jsPDF que ya esta instalado en el front.
 */
const path = require("path");
const fs = require("fs");
const { jsPDF } = require(path.join(
  __dirname,
  "..",
  "Pawpaws-Front",
  "node_modules",
  "jspdf",
  "dist",
  "jspdf.node.min.js"
));

// ---- Paleta (tono "moss" de la app) ----
const MOSS = [47, 84, 60];      // verde oscuro
const MOSS2 = [90, 124, 92];    // verde medio
const CLAY = [176, 92, 64];     // terracota (preguntas)
const INK = [55, 60, 55];       // texto
const MUTE = [120, 128, 120];   // gris
const BAND = [235, 240, 232];   // fondo suave

const doc = new jsPDF({ unit: "pt", format: "a4" });
const W = doc.internal.pageSize.getWidth();
const H = doc.internal.pageSize.getHeight();
const M = 54;                 // margen
const CW = W - M * 2;         // ancho util
let y = M;
let page = 1;

function setColor(c) { doc.setTextColor(c[0], c[1], c[2]); }
function setFill(c) { doc.setFillColor(c[0], c[1], c[2]); }

function footer() {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(MUTE);
  doc.text("Papaws - Guia de defensa", M, H - 28);
  doc.text("Pagina " + page, W - M, H - 28, { align: "right" });
}

function newPage() {
  footer();
  doc.addPage();
  page++;
  y = M;
}

function need(h) {
  if (y + h > H - 48) newPage();
}

function gap(h) { y += h; }

// Escribe un parrafo con ajuste de linea. opts: {size, style, color, indent, lineH, bullet}
function para(text, opts = {}) {
  const size = opts.size || 10.5;
  const style = opts.style || "normal";
  const color = opts.color || INK;
  const indent = opts.indent || 0;
  const lineH = opts.lineH || size * 1.38;
  const x = M + indent;
  const maxW = CW - indent - (opts.bullet ? 12 : 0);
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  setColor(color);
  const lines = doc.splitTextToSize(text, maxW);
  for (let i = 0; i < lines.length; i++) {
    need(lineH);
    if (opts.bullet && i === 0) {
      setColor(MOSS2);
      doc.text("•", x, y + size);
      setColor(color);
      doc.text(lines[i], x + 12, y + size);
    } else {
      doc.text(lines[i], x + (opts.bullet ? 12 : 0), y + size);
    }
    y += lineH;
  }
}

function h1(num, text) {
  need(46);
  gap(8);
  setFill(MOSS);
  doc.roundedRect(M, y, CW, 30, 5, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text((num ? num + ".  " : "") + text, M + 12, y + 20);
  y += 30 + 10;
}

function h2(text) {
  need(30);
  gap(6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  setColor(MOSS);
  const lines = doc.splitTextToSize(text, CW);
  for (const ln of lines) { need(16); doc.text(ln, M, y + 11); y += 16; }
  // subrayado suave
  doc.setDrawColor(BAND[0], BAND[1], BAND[2]);
  doc.setLineWidth(2);
  doc.line(M, y + 1, M + 40, y + 1);
  y += 8;
}

function pregunta(text) {
  need(20);
  gap(4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  setColor(CLAY);
  const lines = doc.splitTextToSize("P:  " + text, CW);
  for (const ln of lines) { need(15); doc.text(ln, M, y + 10.5); y += 15; }
  y += 2;
}

function respuesta(text) {
  para(text, { size: 10.5, color: INK });
}

function donde(text) {
  need(16);
  gap(2);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.2);
  setColor(MOSS2);
  const lines = doc.splitTextToSize("Donde mirar: " + text, CW);
  for (const ln of lines) { need(13); doc.text(ln, M, y + 9.2); y += 13; }
  y += 4;
}

function bullet(text) { para(text, { bullet: true, indent: 6 }); }

// ---------- PORTADA ----------
setFill(MOSS);
doc.rect(0, 0, W, 200, "F");
setFill(MOSS2);
doc.rect(0, 200, W, 6, "F");
doc.setFont("helvetica", "bold");
doc.setFontSize(30);
doc.setTextColor(255, 255, 255);
doc.text("Guia de Defensa", M, 96);
doc.setFontSize(20);
doc.text("Papaws", M, 128);
doc.setFont("helvetica", "normal");
doc.setFontSize(12);
doc.text("Sistema de microservicios distribuidos (.NET + Cassandra + React)", M, 158);

y = 240;
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
setColor(MOSS);
doc.text("Como usar esta guia", M, y); y += 20;
para(
  "Esta guia esta en formato pregunta -> respuesta. Cada tema tiene primero una explicacion " +
  "clara del concepto y despues las preguntas que te pueden hacer, con la respuesta lista para " +
  "decir y el lugar exacto del codigo donde se ve. Buscala por seccion o por palabra clave.",
  { color: INK }
);
gap(6);
para("Estructura de cada bloque:", { style: "bold", color: MOSS });
bullet("P:  la pregunta probable del docente.");
bullet("Respuesta:  lo que conviene responder, explicado en simple.");
bullet("Donde mirar:  archivo y metodo para mostrarlo en vivo si lo piden.");
gap(8);

para("Indice de temas", { style: "bold", color: MOSS });
const indice = [
  "1.  La arquitectura en una frase",
  "2.  Los tres flujos clave (quien llama a quien)",
  "3.  Modelado en Cassandra (query-first)",
  "4.  Trazabilidad e historial (eventos)",
  "5.  Integridad entre servicios (sin foreign keys)",
  "6.  Concurrencia: el stock de productos (LWT)",
  "7.  Gastos y precios (refugio sin fines de lucro)",
  "8.  Refugio y cupo de rescatistas",
  "9.  Seguridad: JWT y roles",
  "10. Reglas de negocio",
  "11. Paginacion",
  "12. Reportes (el servicio agregador)",
  "13. Ver las queries reales en Cassandra",
  "14. Resumen: quien llama a quien",
  "15. Preguntas trampa y como salir bien",
];
for (const it of indice) bullet(it);

newPage();

// ---------- 1 ----------
h1("1", "La arquitectura en una frase");
para(
  "Papaws son TRES microservicios .NET independientes, cada uno con su PROPIA base de datos " +
  "Cassandra (keyspace propio), mas un frontend React que los consume. Ningun servicio entra a la " +
  "base de otro: si necesita datos ajenos, los pide por la API REST.",
);
gap(4);
bullet("Animales (puerto 8080): rescatistas, organizaciones y animales. Es el dueno de esos datos. Tambien hace el login y emite el JWT.");
bullet("Consulta (puerto 8081): veterinarios, servicios, productos (inventario) y consultas clinicas.");
bullet("Reportes (puerto 8082): NO tiene datos propios. Es un AGREGADOR: arma los reportes pidiendo datos por HTTP a los otros dos.");
bullet("Front (Pawpaws-Front, React + Vite): decide a que servicio ir por una 'zona' (animales / consulta) o la base de reportes.");

pregunta("Por que microservicios y no un monolito?");
respuesta(
  "Para desacoplar dominios: cada servicio se despliega, escala y falla por separado. El precio a " +
  "pagar es que no hay JOINs ni transacciones entre servicios; la consistencia se cuida a mano al " +
  "escribir (seccion 5). Es la decision central a defender."
);

pregunta("Como sabe el front a que microservicio pegar?");
respuesta(
  "Cada llamada declara su 'zona'. La funcion baseFor() traduce la zona a la URL del servicio. Los " +
  "endpoints concretos (que ruta, que metodo) estan centralizados en un solo archivo."
);
donde("Pawpaws-Front/src/api/client.ts (baseFor / apiGet / apiPost) y Pawpaws-Front/src/api/endpoints.ts");

pregunta("La regla de oro de la arquitectura?");
respuesta(
  "Un servicio NUNCA lee ni escribe la base de datos de otro. Toda dependencia cruzada pasa por la " +
  "API REST del dueno, reenviando el token JWT del usuario."
);

// ---------- 2 ----------
h1("2", "Los tres flujos clave (quien llama a quien)");
para(
  "Estas son las tres preguntas de recorrido 'de punta a punta' mas probables. Conviene poder " +
  "trazarlas: front -> controlador -> servicio -> tabla de Cassandra."
);

h2("2.1  Donde llaman los reportes a los rescatistas? (C1 / C2)");
respuesta("Recorrido:");
bullet("Front: en Reportes.tsx se elige el reporte y se llama reportesApi.c1_rescatistaPorId(id) o c2_animalesPorRescatista(id). Pegan al servicio de REPORTES, no a Animales.");
bullet("Reportes: entra por RescatistasReportesController.cs y llama a ReporteService (C1_RescatistaPorIdAsync / C2_AnimalesPorRescatistaAsync).");
bullet("Aqui 'los reportes llaman a los rescatistas': ReporteService no tiene base; usa el cliente HTTP AnimalesClient.GetRescatistaByIdAsync(id) -> GET api/rescatistas/{id} contra Animales. Para C2 ademas GetAnimalesByRescatistaAsync(id) -> GET api/animales/rescatista/{id}.");
bullet("Animales responde desde RescatistasController -> RescatistaService, leyendo la tabla rescatistas_by_id.");
donde("Pawpaws-Reportes/Services/AnimalesClient.cs y ReporteService.cs; Pawpaws-Animales/Services/RescatistaService.cs");
pregunta("Y la autenticacion no se pierde al saltar de servicio?");
respuesta(
  "No. El cliente de Reportes REENVIA el token JWT del usuario (copia el header Authorization), asi " +
  "Animales sigue exigiendo login y rol. Ese reenvio esta en el metodo que arma el request del cliente."
);
donde("Pawpaws-Reportes/Services/AnimalesClient.cs (CrearRequest copia Authorization)");

h2("2.2  Donde llaman los rescatistas a los animales? (clic en 'Ver ficha')");
bullet("Front: el boton 'Ver ficha' en Rescatistas.tsx navega a /rescatistas/:id (ruta en App.tsx) y la pinta RescatistaDetalle.tsx.");
bullet("Aqui 'el rescatista llama a sus animales': RescatistaDetalle.tsx hace animalesApi.porRescatista(id) -> GET /api/animales/rescatista/{id} contra Animales.");
bullet("Animales: AnimalesController.ObtenerPorRescatista -> AnimalService.ObtenerPorRescatistaAsync, que lee la tabla animales_by_rescatista.");
donde("Pawpaws-Front/src/pages/RescatistaDetalle.tsx; Pawpaws-Animales/Services/AnimalService.cs");
pregunta("Por que existe una tabla animales_by_rescatista aparte de animales_by_id?");
respuesta(
  "Esta DESNORMALIZADA y PARTICIONADA por rescatista_id justo para que 'dame todos los animales de " +
  "este rescatista' sea UNA sola lectura de una particion, sin JOIN ni scan. El mismo animal se " +
  "guarda tambien en animales_by_id para buscarlo por su propio id. Ambas se escriben juntas en un " +
  "BatchStatement para que no se desincronicen."
);
donde("Pawpaws-Animales/Data/CassandraSchema.cs y GuardarAnimalAsync en AnimalService.cs");

h2("2.3  Donde llaman los animales a sus consultas?");
bullet("Front: AnimalDetalle.tsx hace consultasApi.porAnimal(id) -> GET /api/consultas/animal/{id} contra el servicio de CONSULTA (las consultas viven en otro microservicio).");
bullet("Consulta: ConsultasController.ObtenerPorAnimal -> ConsultaService.ObtenerPorAnimalAsync.");
bullet("En Cassandra: primero lee la tabla indice consulta_codigos_by_animal (particionada por animal_id) para sacar los codigos; luego trae cada consulta de consultas_by_codigo. Es el patron 'tabla indice + lectura por clave'.");
donde("Pawpaws-Front/src/pages/AnimalDetalle.tsx; Pawpaws-Consulta/Services/ConsultaService.cs");
pregunta("Si el animal y la consulta estan en servicios distintos, como se relacionan sin foreign key?");
respuesta(
  "La consulta guarda el animal_id. No hay FK que cruce servicios; la relacion se sostiene por ese id " +
  "y la consistencia se cuida al CREAR la consulta, validando el animal por HTTP (seccion 5)."
);

// ---------- 3 ----------
h1("3", "Modelado en Cassandra (query-first)");
para(
  "Cassandra no hace JOINs ni filtra eficiente por columnas que no sean la clave de particion. " +
  "Por eso se modela 'una tabla por consulta de lectura' (query-first) y el mismo dato se guarda " +
  "varias veces (desnormalizacion). La clave de particion define donde vive el dato y por que campo " +
  "se puede leer rapido."
);
gap(2);
para("Ejemplos en el sistema:", { style: "bold", color: MOSS });
bullet("Animales: animales_by_id (por id) y animales_by_rescatista (por rescatista).");
bullet("Consultas: consultas_by_codigo (por codigo); consulta_codigos_by_animal y consulta_codigos_by_veterinario (indices para listar); consulta_servicios_by_codigo y consulta_productos_by_codigo (relaciones de la consulta).");
donde("Pawpaws-Animales/Data/CassandraSchema.cs y Pawpaws-Consulta/Data/CassandraSchema.cs");

pregunta("Y si quiero saber en que consultas se uso un servicio? (consulta inversa)");
respuesta(
  "No se puede con consulta_servicios_by_codigo, porque esa tabla esta particionada por codigo (solo " +
  "responde 'que servicios tiene ESTA consulta'). Por eso se agrego una tabla de INDICE INVERSO, " +
  "consulta_codigos_by_servicio, particionada por servicio_id, que se mantiene sincronizada al crear, " +
  "editar y borrar una consulta. La usa la ficha de servicio."
);
donde("ObtenerPorServicioAsync y los INSERT/DELETE del indice en Pawpaws-Consulta/Services/ConsultaService.cs");

pregunta("No es peligroso duplicar datos?");
respuesta(
  "El riesgo es la desincronizacion. Se controla escribiendo TODAS las copias en la misma operacion " +
  "(BatchStatement) para que entren juntas, y manteniendo los indices en cada alta/baja/edicion."
);

// ---------- 4 ----------
h1("4", "Trazabilidad e historial (eventos inmutables)");
para(
  "Para no perder historia, los cambios se guardan como EVENTOS INMUTABLES en tablas ordenadas por " +
  "fecha descendente (clustering). En vez de pisar un valor, se agrega un evento nuevo."
);
bullet("eventos_custodia_by_animal: ingreso del animal y cada reasignacion entre rescatistas.");
bullet("eventos_organizacion_by_rescatista: alta y cambios de organizacion del rescatista.");
bullet("eventos_adopcion_by_animal: adopciones y devoluciones.");
donde("Tablas y backfill en Pawpaws-Animales/Data/CassandraSchema.cs; registro en AnimalService.cs y RescatistaService.cs; lineas de tiempo en AnimalDetalle.tsx y RescatistaDetalle.tsx");
pregunta("Por que el evento guarda el nombre y no solo el id?");
respuesta(
  "Para que el historial siga siendo legible aunque despues se de de baja ese rescatista u " +
  "organizacion. Si guardara solo el id, al borrarse quedaria un id muerto sin sentido. Es un " +
  "'snapshot' del nombre en el momento del evento."
);
pregunta("Que es el backfill?");
respuesta(
  "Un proceso idempotente que siembra los eventos iniciales para los datos que ya existian antes de " +
  "tener el historial, sin duplicar si se corre dos veces."
);

// ---------- 5 ----------
h1("5", "Integridad entre servicios (sin foreign keys)");
para(
  "Como cada servicio tiene su base, no hay claves foraneas que crucen servicios. La consistencia se " +
  "cuida al ESCRIBIR:"
);
bullet("Al crear una consulta, Consulta valida el animal LLAMANDO POR HTTP a Animales (con reintentos). Si el animal no existe, rechaza.");
bullet("Esa misma validacion trae el ESTADO del animal y rechaza agendar si esta 'Adoptado' (un adoptado no recibe consultas hasta que se registre su devolucion).");
donde("Pawpaws-Consulta/Services/AnimalReferenceService.cs (ObtenerEstadoAsync) usado en CrearAsync de ConsultaService.cs");
pregunta("Y si el servicio de Animales esta caido cuando creo la consulta?");
respuesta(
  "El cliente reintenta con backoff. Si aun asi no hay respuesta, la creacion FALLA con un error " +
  "controlado, en lugar de crear una consulta que apunte a un animal que no se pudo verificar. Se " +
  "prefiere fallar a dejar datos inconsistentes."
);
pregunta("Como se borra un animal sin dejar consultas huerfanas?");
respuesta(
  "El animal se borra fisicamente y, en cascada, se borran sus consultas. Si la baja de la cascada " +
  "falla, se propaga el error y el animal NO se borra, para no dejar consultas apuntando a un animal " +
  "inexistente."
);
donde("EliminarAsync en Pawpaws-Animales/Services/AnimalService.cs (cascada cross-servicio)");

// ---------- 6 ----------
h1("6", "Concurrencia: el stock de productos (LWT)");
para(
  "Si dos consultas descuentan stock del mismo producto a la vez, un UPDATE normal podria pisar el " +
  "valor del otro (lost update). Se resolvio con COMPARE-AND-SET usando LWT (transacciones ligeras) " +
  "de Cassandra: UPDATE ... IF stock_disponible = ?. Si otro proceso cambio el stock entremedio, el " +
  "IF falla, se lee el valor real que devuelve Cassandra y se reintenta."
);
donde("AjustarStockAsync en Pawpaws-Consulta/Services/ProductoService.cs");
pregunta("Por que no usar solo un UPDATE comun?");
respuesta(
  "Porque dos UPDATE concurrentes no se enteran uno del otro: el ultimo gana y se pierde un descuento. " +
  "El LWT agrega una condicion (IF) que solo aplica si el valor sigue siendo el que lei; si cambio, " +
  "reintento con el valor nuevo. Es control de concurrencia optimista."
);
pregunta("Es caro el LWT?");
respuesta(
  "Si, mas que un write normal porque usa consenso (Paxos) entre replicas. Se justifica solo donde " +
  "hay riesgo real de carrera, como el stock. No se usa para todo."
);

// ---------- 7 ----------
h1("7", "Gastos y precios (refugio sin fines de lucro)");
para(
  "El reporte de gastos lo calcula EL SERVICIO DE CONSULTA, porque ahi viven los precios: precio_base " +
  "de los servicios y costo_unitario de los productos. Por cada consulta suma el costo de sus " +
  "servicios mas el de los productos consumidos (costo_unitario x cantidad). El front lo agrupa por mes."
);
bullet("Endpoint: GET /api/consultas/gastos (ObtenerGastosAsync en ConsultaService.cs).");
bullet("Las consultas canceladas se EXCLUYEN: devuelven el stock y no representan gasto real.");
bullet("Los precios son en bolivianos (Bs) y a precio de costo, porque es un refugio sin fines de lucro: no hay margen comercial.");
donde("Pawpaws-Consulta/Services/ConsultaService.cs (ObtenerGastosAsync); Pawpaws-Front/src/pages/Gastos.tsx");
pregunta("Por que el calculo de gastos no esta en Reportes?");
respuesta(
  "Porque todos los datos necesarios (precio de servicios y costo de productos) viven en Consulta. " +
  "Calcularlo ahi evita que Reportes tenga que pedir y recombinar todo por HTTP: se hace donde estan " +
  "los datos."
);
pregunta("Por que los numeros se muestran sin punto de miles?");
respuesta(
  "Decision de formato: el punto se reserva para decimales. La moneda se muestra como 'Bs' con el " +
  "locale es-BO y agrupacion desactivada, para que no se confunda 1.000 (mil) con 1.000 (uno coma cero)."
);

// ---------- 8 ----------
h1("8", "Refugio y cupo de rescatistas");
para(
  "Existe un rescatista interno llamado 'Refugio' (oculto de la gestion) que actua como destino " +
  "institucional de los animales. Cada rescatista normal tiene un CUPO MAXIMO de animales; el Refugio " +
  "no tiene limite."
);
bullet("Al dar de baja un rescatista, sus animales se reasignan: llenan el cupo del rescatista elegido y lo que sobra se deriva automaticamente al Refugio.");
bullet("Al reasignar un animal suelto, se bloquea si el rescatista destino ya esta en su cupo. Asi se reparten los animales del Refugio sin sobrecargar a nadie.");
donde("ReasignarAnimalesAsync y la validacion de cupo en ActualizarAsync de Pawpaws-Animales/Services/AnimalService.cs; constante CapacidadMaxima en Models/Rescatista.cs");
pregunta("Por que no asignar todos los animales a un solo rescatista al dar de baja?");
respuesta(
  "Porque un rescatista no puede hacerse cargo de mas animales de los que su cupo permite. El sistema " +
  "respeta ese limite y manda el excedente al Refugio, desde donde luego se reparten de a poco a quienes " +
  "tengan lugar."
);

// ---------- 9 ----------
h1("9", "Seguridad: JWT y roles");
para(
  "Login con JWT y autorizacion por ROLES (Administrador, Encargado de consultas, Encargado de " +
  "rescatistas). Cada endpoint se protege con [Authorize(Roles = ...)]. Cuando un servicio llama a " +
  "otro, REENVIA el token del usuario, asi la autorizacion se respeta en toda la cadena."
);
bullet("El secreto de firma del JWT y la contrasena NO estan en el repositorio: se leen de variables de entorno / user-secrets, y appsettings.json queda en blanco (fail-fast si faltan).");
bullet("La misma clave de firma es identica en los tres servicios: Animales firma, los demas validan.");
donde("Carpetas Security/ de cada servicio; emision del token en Pawpaws-Animales (AuthController / JwtService)");
pregunta("Como respeta Reportes los permisos si no tiene los usuarios?");
respuesta(
  "No necesita la base de usuarios: confia en el JWT firmado. Valida la firma con la clave compartida y " +
  "lee los roles del token. Ademas reenvia ese token a Animales/Consulta, que vuelven a validar."
);

// ---------- 10 ----------
h1("10", "Reglas de negocio");
para("Ejemplos concretos que conviene tener a mano:");
bullet("Una consulta no puede nacer 'Completada'.");
bullet("Un animal 'Adoptado' solo puede pasar a 'Devuelto al refugio', no directo a 'Disponible'.");
bullet("No se permiten productos (ni organizaciones) con nombre repetido entre los activos.");
bullet("La fecha de ingreso de un animal no puede ser futura.");
bullet("Un rescatista no puede superar su cupo de animales (seccion 8).");
pregunta("Borrado fisico o logico?");
respuesta(
  "Rescatistas, veterinarios, servicios, productos y organizaciones usan BORRADO LOGICO (activo = " +
  "false) para no romper referencias historicas. Los animales SI se borran fisicamente, y al hacerlo " +
  "se borran en cascada sus consultas."
);

// ---------- 11 ----------
h1("11", "Paginacion");
para(
  "Hay paginacion en dos niveles. En el BACKEND, los listados aceptan ?pagina= y ?tamano= y devuelven " +
  "un objeto con los items de esa pagina. En el FRONT, ademas, las listas largas se paginan del lado " +
  "del cliente: 10 elementos por pagina con controles numerados (1, 2, 3 ...)."
);
bullet("Backend: helper Paginar() y un tamano por defecto; el front pide la primera pagina con tamano alto.");
bullet("Front: hook usePaginated y componente Pagination, aplicados a animales, productos, rescatistas, servicios, veterinarios, organizaciones, consultas y gastos.");
donde("apiList en Pawpaws-Front/src/api/client.ts; Pawpaws-Front/src/hooks/usePaginated.ts y components/Pagination.tsx; Common/Paginacion.cs en cada servicio");
pregunta("Por que paginar tambien en el front si el backend ya pagina?");
respuesta(
  "Porque el front trae la lista y la filtra/ordena en memoria para una UX fluida; paginar ahi evita " +
  "renderizar listas gigantes de cientos de tarjetas. Son dos optimizaciones que se complementan."
);

// ---------- 12 ----------
h1("12", "Reportes (el servicio agregador)");
para(
  "Reportes no tiene base propia: cada reporte combina llamadas HTTP a Animales y/o Consulta. El " +
  "ejemplo mas completo es C20 ('Rescatistas y animales por organizacion'): pide la organizacion, " +
  "luego sus rescatistas, y para CADA rescatista sus animales; el 'join' organizacion -> rescatistas " +
  "-> animales se arma EN MEMORIA en el servicio de Reportes, porque los datos viven en servicios " +
  "distintos."
);
bullet("Un reporte util de rendimiento es el ranking de veterinarios por cantidad de consultas (C22), paginado.");
donde("Pawpaws-Reportes/Services/ReporteService.cs (C20_OrganizacionDetalleAsync, C22_VeterinariosPorConsultasAsync)");
pregunta("Y los datos huerfanos en los reportes?");
respuesta(
  "Se resuelven los nombres a prueba de huerfanos: si una consulta apunta a un veterinario dado de " +
  "baja se muestra '(dado de baja)', y si ya no existe, '(eliminado)', nunca un GUID suelto."
);
donde("ResolverNombresVetAsync / ResolverNombresAnimalAsync en ReporteService.cs");
pregunta("Por que el listado de consultas no trae servicios ni productos?");
respuesta(
  "Para evitar un problema N+1 caro en una lista. El listado es liviano; los servicios y productos se " +
  "cargan solo al abrir el detalle de una consulta."
);
donde("ObtenerPorCodigoAsync en Pawpaws-Consulta/Services/ConsultaService.cs");

// ---------- 13 ----------
h1("13", "Ver las queries reales en Cassandra");
para(
  "Cassandra corre en dos contenedores Docker: papaws-cassandra-animales (keyspace papaws_animales) y " +
  "papaws-cassandra-consulta (keyspace papaws_consulta). Cassandra NO loguea cada query por defecto; " +
  "para 'verlas' se activa TRACING."
);
h2("Forma A - Una query puntual (cqlsh)");
para("docker exec -it papaws-cassandra-animales cqlsh", { style: "bold", size: 9.5, color: MOSS });
para("USE papaws_animales;  TRACING ON;  SELECT * FROM animales_by_rescatista WHERE rescatista_id = <uuid>;", { size: 9.5, color: INK });
h2("Forma B - Capturar TODAS las queries (la que mas sirve)");
bullet("Activar al 100%:  docker exec papaws-cassandra-animales nodetool settraceprobability 1");
bullet("Usar la app (abrir una ficha, generar un reporte).");
bullet("Leer:  docker exec papaws-cassandra-animales cqlsh -e \"SELECT started_at, request, parameters FROM system_traces.sessions LIMIT 50;\"  (la columna parameters trae el CQL real).");
bullet("APAGARLO al terminar (al 100% es caro):  nodetool settraceprobability 0");
h2("Forma C - Inspeccionar datos directos (demostrar la desnormalizacion)");
bullet("docker exec papaws-cassandra-animales cqlsh -e \"SELECT * FROM papaws_animales.animales_by_rescatista LIMIT 20;\"");
bullet("DESCRIBE KEYSPACE papaws_animales;  -> muestra todas las tablas con su clave de particion y clustering.");
h2("Forma D - Logs");
bullet("docker logs -f papaws-animales  (requests HTTP que llegan al microservicio .NET).");
bullet("Cruzado con la Forma B muestra el camino completo: request HTTP -> servicio -> query a Cassandra.");

// ---------- 14 ----------
h1("14", "Resumen: quien llama a quien");
bullet("Front -> Animales: rescatistas, organizaciones, animales y sus historiales.");
bullet("Front -> Consulta: veterinarios, servicios, productos, consultas y gastos.");
bullet("Front -> Reportes: todos los reportes.");
bullet("Consulta -> Animales (HTTP): solo para validar el animal y su estado al crear una consulta.");
bullet("Reportes -> Animales y Reportes -> Consulta (HTTP): para armar cada reporte combinando datos.");
bullet("Ningun servicio entra a la base de otro: siempre por la API REST, con el token JWT reenviado.");

// ---------- 15 ----------
h1("15", "Preguntas trampa y como salir bien");
pregunta("Esto es realmente distribuido o son tres apps cualquiera?");
respuesta(
  "Es distribuido: tres servicios con bases independientes, comunicados por red (HTTP/REST), con " +
  "fallas y consistencia gestionadas explicitamente (reintentos, validacion al escribir, eventos). " +
  "No comparten base ni memoria."
);
pregunta("Que pasa si dos servicios se desincronizan (un id que ya no existe)?");
respuesta(
  "Se asume y se maneja: los reportes resuelven nombres a prueba de huerfanos, y las escrituras " +
  "criticas validan antes de crear. La consistencia es eventual y defendida en cada punto de escritura."
);
pregunta("Por que Cassandra y no PostgreSQL?");
respuesta(
  "Por escala de escritura y disponibilidad: Cassandra reparte por particiones y no depende de un " +
  "unico nodo. El costo es modelar query-first y desnormalizar, que es justamente lo que mostramos."
);
pregunta("Donde esta el punto unico de falla?");
respuesta(
  "Se evita: cada servicio y cada base son independientes. Si Animales cae, Consulta no puede crear " +
  "consultas nuevas (porque valida el animal) pero el resto sigue; la caida se traduce en un error " +
  "controlado, no en datos corruptos."
);
pregunta("Como demuestro en vivo que un servicio no toca la base de otro?");
respuesta(
  "Mostrando que Reportes no tiene cadena de conexion a ninguna base (solo clientes HTTP) y que cada " +
  "keyspace solo lo abre su propio servicio. Con la Forma B del tracing se ve que las queries de " +
  "papaws_consulta solo salen del servicio de Consulta."
);

footer();

const out = path.join(__dirname, "Guia-de-Defensa-Papaws.pdf");
fs.writeFileSync(out, Buffer.from(doc.output("arraybuffer")));
console.log("PDF generado:", out, "(" + page + " paginas)");
