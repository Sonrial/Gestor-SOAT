// script.js
// Lógica básica de la interfaz.
// En esta versión se usan datos simulados en memoria (array) para no depender de un backend real.
// Más adelante, estos datos pueden obtenerse desde una API o una base de datos externa.

// Datos simulados de clientes / vehículos / SOAT.
// En una versión real, esto vendría de un backend o de un archivo JSON seguro.
const registrosSoat = [
    {
        nombreCliente: "Juan Pérez",
        correo: "juan.perez@example.com",
        placa: "ABC123",
        fechaVencimiento: "2025-02-10",
        valorRenovacion: 600000,
        estado: "por_vencer" // vigente, por_vencer, vencido
    },
    {
        nombreCliente: "María Gómez",
        correo: "maria.gomez@example.com",
        placa: "XYZ789",
        fechaVencimiento: "2025-11-30",
        valorRenovacion: 580000,
        estado: "vigente"
    },
    {
        nombreCliente: "Carlos López",
        correo: "carlos.lopez@example.com",
        placa: "JKL456",
        fechaVencimiento: "2024-12-01",
        valorRenovacion: 620000,
        estado: "vencido"
    }
];

// Contraseña de administrador para el MVP.
// En una versión real, esta verificación nunca debe hacerse en el frontend.
const ADMIN_PASSWORD = "admin123";

// Función para inicializar eventos al cargar la página.
document.addEventListener("DOMContentLoaded", function () {
    inicializarFormularioConsulta();
    inicializarLoginAdmin();
    inicializarFiltroAdmin();
    inicializarFormularioContacto();
    mostrarAnioActual();
});

// Manejo del formulario de consulta de cliente.
function inicializarFormularioConsulta() {
    const formConsulta = document.getElementById("form-consulta");
    const resultadoDiv = document.getElementById("resultado-consulta");

    if (!formConsulta) return;

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

        // Buscar coincidencias en los registros simulados.
        const resultado = registrosSoat.find(function (registro) {
            const placaCoincide = registro.placa.toUpperCase() === placa;
            // Si el usuario proporciona correo, también se verifica; si no, solo placa.
            const correoCoincide = correo ? registro.correo.toLowerCase() === correo : true;
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

        resultadoDiv.innerHTML = `
            <h3>Resultado de la consulta</h3>
            <p class="result-row"><strong>Cliente:</strong> ${registro.nombreCliente}</p>
            <p class="result-row"><strong>Correo:</strong> ${registro.correo}</p>
            <p class="result-row"><strong>Placa:</strong> ${registro.placa}</p>
            <p class="result-row"><strong>Fecha de vencimiento del SOAT:</strong> ${registro.fechaVencimiento}</p>
            <p class="result-row"><strong>Valor aproximado de renovación:</strong> $${registro.valorRenovacion.toLocaleString("es-CO")}</p>
            <p class="result-row">
                <span class="estado-chip ${claseEstado}">${estadoTexto}</span>
            </p>
            <p class="result-row">
                ${mensajeRecomendacionPorEstado(registro.estado, registro.fechaVencimiento)}
            </p>
        `;
    }
}

// Devuelve un texto legible para el estado.
function obtenerTextoEstado(estado) {
    if (estado === "vigente") return "Vigente";
    if (estado === "por_vencer") return "Por vencer";
    if (estado === "vencido") return "Vencido";
    return "Desconocido";
}

// Genera un mensaje de recomendación según el estado del SOAT.
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

// Manejo del login de administrador.
function inicializarLoginAdmin() {
    const formLoginAdmin = document.getElementById("form-login-admin");
    const panelAdmin = document.getElementById("panel-admin");

    if (!formLoginAdmin || !panelAdmin) return;

    formLoginAdmin.addEventListener("submit", function (event) {
        event.preventDefault();

        const passwordInput = document.getElementById("admin-password");
        const password = passwordInput.value;

        if (password === ADMIN_PASSWORD) {
            // Mostrar panel admin y ocultar el formulario de login.
            panelAdmin.classList.remove("hidden");
            formLoginAdmin.classList.add("hidden");
            renderizarTablaAdmin(registrosSoat);
        } else {
            alert("Contraseña incorrecta. Por favor, inténtalo de nuevo.");
        }
    });
}

// Renderiza la tabla del panel admin.
function renderizarTablaAdmin(datos) {
    const tbody = document.getElementById("tabla-admin-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (datos.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 6;
        celda.textContent = "No hay registros que coincidan con los filtros actuales.";
        fila.appendChild(celda);
        tbody.appendChild(fila);
        return;
    }

    datos.forEach(function (registro) {
        const fila = document.createElement("tr");

        const celdaCliente = document.createElement("td");
        celdaCliente.textContent = registro.nombreCliente;
        fila.appendChild(celdaCliente);

        const celdaCorreo = document.createElement("td");
        celdaCorreo.textContent = registro.correo;
        fila.appendChild(celdaCorreo);

        const celdaPlaca = document.createElement("td");
        celdaPlaca.textContent = registro.placa;
        fila.appendChild(celdaPlaca);

        const celdaFecha = document.createElement("td");
        celdaFecha.textContent = registro.fechaVencimiento;
        fila.appendChild(celdaFecha);

        const celdaValor = document.createElement("td");
        celdaValor.textContent = "$" + registro.valorRenovacion.toLocaleString("es-CO");
        fila.appendChild(celdaValor);

        const celdaEstado = document.createElement("td");
        const spanEstado = document.createElement("span");
        spanEstado.classList.add("estado-chip", "estado-" + registro.estado);
        spanEstado.textContent = obtenerTextoEstado(registro.estado);
        celdaEstado.appendChild(spanEstado);
        fila.appendChild(celdaEstado);

        tbody.appendChild(fila);
    });
}

// Filtros del panel admin.
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
                ? registro.placa.toUpperCase().includes(placaFiltro)
                : true;

            const coincideNombre = nombreFiltro
                ? registro.nombreCliente.toLowerCase().includes(nombreFiltro)
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

// Formulario de contacto (solo simulación).
function inicializarFormularioContacto() {
    const formContacto = document.getElementById("form-contacto");
    if (!formContacto) return;

    formContacto.addEventListener("submit", function (event) {
        event.preventDefault();
        alert("Este es un formulario de prueba. En una versión futura se enviará tu mensaje a nuestro correo.");
        formContacto.reset();
    });
}

// Mostrar año actual en el footer.
function mostrarAnioActual() {
    const spanAnio = document.getElementById("anio-actual");
    if (!spanAnio) return;
    const hoy = new Date();
    spanAnio.textContent = hoy.getFullYear();
}

/*
Notas sobre futuras integraciones:

1) En lugar de usar "registrosSoat" como array estático, se podría hacer una petición fetch()
   a un endpoint que devuelva los datos en formato JSON (por ejemplo, una API de Google Apps Script,
   Firebase o cualquier backend).

2) La lógica de estados (vigente, por_vencer, vencido) podría calcularse dinámicamente
   comparando la fecha de vencimiento con la fecha actual, en lugar de almacenarse como texto.

3) El login de administrador debe migrarse a un backend seguro con sesiones o tokens;
   este ejemplo solo es ilustrativo para la estructura de la interfaz.

4) Los recordatorios automáticos por correo o WhatsApp no pueden ejecutarse desde GitHub Pages
   directamente; deben programarse en un servidor o servicio externo con tareas programadas (cron).
*/
