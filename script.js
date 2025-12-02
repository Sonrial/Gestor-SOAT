// script.js
// Versión conectada a Supabase con CRUD básico.
// Tabla utilizada: public.soat_registros

let supabaseClient = null;

// Array en memoria con los registros actuales
let registrosSoat = [];

// Contraseña de administrador (solo para MVP, no es seguro para producción).
const ADMIN_PASSWORD = "admin123";

document.addEventListener("DOMContentLoaded", async function () {
  try {
    inicializarSupabaseCliente();
    await cargarRegistrosDesdeSupabase();

    inicializarFormularioConsulta();
    inicializarLoginAdmin();
    inicializarFiltroAdmin();
    inicializarFormularioAdminCRUD();
    inicializarFormularioContacto();
    mostrarAnioActual();
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error);
    alert("Ocurrió un problema inicializando la página. Revisa la consola del navegador o la configuración de Supabase.");
  }
});

// ============================
// Inicialización de Supabase
// ============================

function inicializarSupabaseCliente() {
  const supabaseUrl = "https://scgukqjcmslzjebedutp.supabase.co";      // Pega aquí tu URL de Supabase
  const supabaseAnonKey = "sb_publishable_Qh2VC4YeOwQrrPSAZJt0RQ_MHEuDA0U";        // Pega aquí tu clave pública

  if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === "TU_ANON_O_PUBLISHABLE_KEY") {
    throw new Error("Debes configurar supabaseUrl y supabaseAnonKey en script.js");
  }

  // supabase viene del script CDN incluido en index.html
  const { createClient } = supabase;
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

// Carga todos los registros desde la tabla soat_registros
async function cargarRegistrosDesdeSupabase() {
  if (!supabaseClient) throw new Error("Supabase no está inicializado");

  const { data, error } = await supabaseClient
    .from("soat_registros")
    .select("*")
    .order("fecha_vencimiento", { ascending: true });

  if (error) {
    console.error("Error al cargar registros desde Supabase:", error);
    throw error;
  }

  registrosSoat = data || [];
  // Si el panel admin ya está abierto, actualizamos la tabla
  renderizarTablaAdmin(registrosSoat);
}

// ============================
// Consulta del cliente
// ============================

function inicializarFormularioConsulta() {
  const formConsulta = document.getElementById("form-consulta");
  const resultadoDiv = document.getElementById("resultado-consulta");

  if (!formConsulta || !resultadoDiv) return;

  formConsulta.addEventListener("submit", function (event) {
    event.preventDefault();

    const placaInput = document.getElementById("placa");
    const correoInput = document.getElementById("correo");

    const placa = placaInput.value.trim().toUpperCase();
    const correo = correoInput.value.trim().toLowerCase();

    if (!placa) {
      mostrarMensajeResultado("Por favor ingresa la placa del vehículo.");
      return;
    }

    const resultado = registrosSoat.find(function (registro) {
      const placaCoincide = (registro.placa || "").toUpperCase() === placa;
      const correoCoincide = correo
        ? (registro.correo || "").toLowerCase() === correo
        : true;
      return placaCoincide && correoCoincide;
    });

    if (!resultado) {
      mostrarMensajeResultado(
        "No encontramos un SOAT registrado con los datos ingresados. " +
        "Verifica la información o contáctanos para ayudarte."
      );
      return;
    }

    mostrarResultadoConsulta(resultado);
  });

  function mostrarMensajeResultado(mensaje) {
    resultadoDiv.classList.remove("hidden");
    resultadoDiv.innerHTML = "<p>" + mensaje + "</p>";
  }

  function mostrarResultadoConsulta(registro) {
    resultadoDiv.classList.remove("hidden");

    const estadoTexto = obtenerTextoEstado(registro.estado);
    const claseEstado = "estado-" + registro.estado;
    const valorFormateado = formatearValorMoneda(registro.valor_renovacion);

    resultadoDiv.innerHTML = `
      <h3>Resultado de la consulta</h3>
      <p class="result-row">Cliente: ${registro.nombre_cliente || ""}</p>
      <p class="result-row">Correo: ${registro.correo || ""}</p>
      <p class="result-row">Placa: ${registro.placa || ""}</p>
      <p class="result-row">Fecha de vencimiento del SOAT: ${registro.fecha_vencimiento || ""}</p>
      <p class="result-row">Valor aproximado de renovación: ${valorFormateado}</p>
      <p class="result-row">
        <span class="estado-chip ${claseEstado}">${estadoTexto}</span>
      </p>
      <p class="result-row">
        ${mensajeRecomendacionPorEstado(registro.estado, registro.fecha_vencimiento)}
      </p>
    `;
  }
}

function obtenerTextoEstado(estado) {
  if (estado === "vigente") return "Vigente";
  if (estado === "por_vencer") return "Por vencer";
  if (estado === "vencido") return "Vencido";
  return "Desconocido";
}

function mensajeRecomendacionPorEstado(estado, fechaVencimiento) {
  if (estado === "vigente") {
    return "Tu SOAT está vigente. Te recomendamos revisar nuevamente unas semanas antes de " + fechaVencimiento + ".";
  }
  if (estado === "por_vencer") {
    return "Tu SOAT está próximo a vencer. Te recomendamos gestionar la renovación antes de " + fechaVencimiento + ".";
  }
  if (estado === "vencido") {
    return "Tu SOAT está vencido. Es importante renovarlo lo antes posible para evitar multas e inconvenientes.";
  }
  return "";
}

function formatearValorMoneda(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  const numero = typeof valor === "number" ? valor : Number(valor);
  if (Number.isNaN(numero)) return String(valor);
  return "$" + numero.toLocaleString("es-CO");
}

// ============================
// Login y panel admin
// ============================

function inicializarLoginAdmin() {
  const formLoginAdmin = document.getElementById("form-login-admin");
  const panelAdmin = document.getElementById("panel-admin");

  if (!formLoginAdmin || !panelAdmin) return;

  formLoginAdmin.addEventListener("submit", function (event) {
    event.preventDefault();

    const passwordInput = document.getElementById("admin-password");
    const password = passwordInput.value;

    if (password === ADMIN_PASSWORD) {
      panelAdmin.classList.remove("hidden");
      formLoginAdmin.classList.add("hidden");
      renderizarTablaAdmin(registrosSoat);
    } else {
      alert("Contraseña incorrecta. Por favor, inténtalo de nuevo.");
    }
  });
}

function renderizarTablaAdmin(datos) {
  const tbody = document.getElementById("tabla-admin-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!datos || datos.length === 0) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");
    celda.colSpan = 7;
    celda.textContent = "No hay registros que coincidan con los filtros actuales.";
    fila.appendChild(celda);
    tbody.appendChild(fila);
    return;
  }

  datos.forEach(function (registro) {
    const fila = document.createElement("tr");

    const celdaCliente = document.createElement("td");
    celdaCliente.textContent = registro.nombre_cliente || "";
    fila.appendChild(celdaCliente);

    const celdaCorreo = document.createElement("td");
    celdaCorreo.textContent = registro.correo || "";
    fila.appendChild(celdaCorreo);

    const celdaPlaca = document.createElement("td");
    celdaPlaca.textContent = registro.placa || "";
    fila.appendChild(celdaPlaca);

    const celdaFecha = document.createElement("td");
    celdaFecha.textContent = registro.fecha_vencimiento || "";
    fila.appendChild(celdaFecha);

    const celdaValor = document.createElement("td");
    celdaValor.textContent = formatearValorMoneda(registro.valor_renovacion);
    fila.appendChild(celdaValor);

    const celdaEstado = document.createElement("td");
    const spanEstado = document.createElement("span");
    spanEstado.classList.add("estado-chip", "estado-" + (registro.estado || ""));
    spanEstado.textContent = obtenerTextoEstado(registro.estado);
    celdaEstado.appendChild(spanEstado);
    fila.appendChild(celdaEstado);

    const celdaAcciones = document.createElement("td");
    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.textContent = "Editar";
    btnEditar.classList.add("btn-accion", "btn-editar");
    btnEditar.addEventListener("click", function () {
      cargarRegistroEnFormulario(registro);
    });

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.classList.add("btn-accion", "btn-eliminar");
    btnEliminar.addEventListener("click", function () {
      eliminarRegistro(registro.id);
    });

    celdaAcciones.appendChild(btnEditar);
    celdaAcciones.appendChild(btnEliminar);
    fila.appendChild(celdaAcciones);

    tbody.appendChild(fila);
  });
}

function inicializarFiltroAdmin() {
  const filtroPlaca = document.getElementById("filtro-placa");
  const filtroNombre = document.getElementById("filtro-nombre");
  const filtroEstado = document.getElementById("filtro-estado");

  if (!filtroPlaca || !filtroNombre || !filtroEstado) return;

  function aplicarFiltros() {
    const placaFiltro = filtroPlaca.value.trim().toUpperCase();
    const nombreFiltro = filtroNombre.value.trim().toLowerCase();
    const estadoFiltro = filtroEstado.value;

    const filtrados = registrosSoat.filter(function (registro) {
      const coincidePlaca = placaFiltro
        ? (registro.placa || "").toUpperCase().includes(placaFiltro)
        : true;

      const coincideNombre = nombreFiltro
        ? (registro.nombre_cliente || "").toLowerCase().includes(nombreFiltro)
        : true;

      const coincideEstado = estadoFiltro
        ? registro.estado === estadoFiltro
        : true;

      return coincidePlaca && coincideNombre && coincideEstado;
    });

    renderizarTablaAdmin(filtrados);
  }

  filtroPlaca.addEventListener("input", aplicarFiltros);
  filtroNombre.addEventListener("input", aplicarFiltros);
  filtroEstado.addEventListener("change", aplicarFiltros);
}

// ============================
// Formulario admin: crear / editar
// ============================

function inicializarFormularioAdminCRUD() {
  const form = document.getElementById("form-admin-registro");
  const btnLimpiar = document.getElementById("btn-limpiar-form-admin");

  if (!form) return;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const idInput = document.getElementById("registro-id");
    const nombreInput = document.getElementById("registro-nombre-cliente");
    const correoInput = document.getElementById("registro-correo");
    const placaInput = document.getElementById("registro-placa");
    const fechaInput = document.getElementById("registro-fecha");
    const valorInput = document.getElementById("registro-valor");
    const estadoSelect = document.getElementById("registro-estado");

    const id = idInput.value || null;
    const nombre_cliente = nombreInput.value.trim();
    const correo = correoInput.value.trim();
    const placa = placaInput.value.trim().toUpperCase();
    const fecha_vencimiento = fechaInput.value;
    const valor_renovacion = Number(valorInput.value);
    const estado = estadoSelect.value;

    if (!nombre_cliente || !correo || !placa || !fecha_vencimiento || !estado) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    if (!supabaseClient) {
      alert("Supabase no está inicializado.");
      return;
    }

    try {
      if (id) {
        // Actualización
        const { error } = await supabaseClient
          .from("soat_registros")
          .update({
            nombre_cliente,
            correo,
            placa,
            fecha_vencimiento,
            valor_renovacion,
            estado
          })
          .eq("id", id);

        if (error) {
          console.error("Error al actualizar registro:", error);
          alert("Ocurrió un error actualizando el registro.");
          return;
        }

        alert("Registro actualizado correctamente.");
      } else {
        // Creación
        const { error } = await supabaseClient
          .from("soat_registros")
          .insert([
            {
              nombre_cliente,
              correo,
              placa,
              fecha_vencimiento,
              valor_renovacion,
              estado
            }
          ]);

        if (error) {
          console.error("Error al crear registro:", error);
          alert("Ocurrió un error creando el registro.");
          return;
        }

        alert("Registro creado correctamente.");
      }

      form.reset();
      idInput.value = "";
      await cargarRegistrosDesdeSupabase();
    } catch (e) {
      console.error("Error en el guardado del registro:", e);
      alert("Ocurrió un error inesperado guardando el registro.");
    }
  });

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", function (event) {
      event.preventDefault();
      form.reset();
      const idInput = document.getElementById("registro-id");
      if (idInput) idInput.value = "";
    });
  }
}

function cargarRegistroEnFormulario(registro) {
  const idInput = document.getElementById("registro-id");
  const nombreInput = document.getElementById("registro-nombre-cliente");
  const correoInput = document.getElementById("registro-correo");
  const placaInput = document.getElementById("registro-placa");
  const fechaInput = document.getElementById("registro-fecha");
  const valorInput = document.getElementById("registro-valor");
  const estadoSelect = document.getElementById("registro-estado");

  if (!idInput || !nombreInput || !correoInput || !placaInput || !fechaInput || !valorInput || !estadoSelect) return;

  idInput.value = registro.id || "";
  nombreInput.value = registro.nombre_cliente || "";
  correoInput.value = registro.correo || "";
  placaInput.value = registro.placa || "";
  fechaInput.value = registro.fecha_vencimiento || "";
  valorInput.value = registro.valor_renovacion ?? "";
  estadoSelect.value = registro.estado || "vigente";
}

async function eliminarRegistro(id) {
  if (!id) return;

  const confirmar = confirm("¿Seguro que deseas eliminar este registro?");
  if (!confirmar) return;

  if (!supabaseClient) {
    alert("Supabase no está inicializado.");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("soat_registros")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar registro:", error);
      alert("Ocurrió un error eliminando el registro.");
      return;
    }

    alert("Registro eliminado correctamente.");
    await cargarRegistrosDesdeSupabase();
  } catch (e) {
    console.error("Error en la eliminación del registro:", e);
    alert("Ocurrió un error inesperado eliminando el registro.");
  }
}

// ============================
// Formulario contacto y footer
// ============================

function inicializarFormularioContacto() {
  const formContacto = document.getElementById("form-contacto");
  if (!formContacto) return;

  formContacto.addEventListener("submit", function (event) {
    event.preventDefault();
    alert("Este es un formulario de prueba. En una versión futura se enviará tu mensaje a nuestro correo.");
    formContacto.reset();
  });
}

function mostrarAnioActual() {
  const spanAnio = document.getElementById("anio-actual");
  if (!spanAnio) return;
  const hoy = new Date();
  spanAnio.textContent = hoy.getFullYear();
}

/*
Notas importantes:

1) Esta estructura usa la clave pública (anon/publishable) directamente en el frontend.
   Es correcto siempre que tengas Row Level Security (RLS) activado y políticas bien definidas.

2) Las políticas que sugerimos arriba permiten acceso completo (select/insert/update/delete) al rol anon.
   Eso es solo recomendable para desarrollo. Para producción, deberías:
   - Definir un sistema de autenticación real (Supabase Auth) para el admin.
   - Restringir las políticas de escritura solo a usuarios autenticados o a un rol concreto.

3) El login actual con ADMIN_PASSWORD se hace solo en frontend.
   No es seguro para un entorno real, pero sirve para separar "vista admin" mientras desarrollas.
*/
