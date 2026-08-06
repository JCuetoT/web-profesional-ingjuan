/**
 * Chatbot Asistente Virtual
 * Botón flotante → panel de chat → Google Apps Script API
 *
 * Configuración: cambie GOOGLE_SCRIPT_URL por su endpoint de Apps Script.
 * La API acepta POST { message, token, referrer } y devuelve { reply: string }.
 * El token se valida del lado del Apps Script con PropertiesService.
 * El referrer permite verificar que la llamada proviene del dominio autorizado.
 */

var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby6PP-VwO2K5NZ-bd0RSsFVNfXkPd-PNQOLbqG1JkjhEmsbultty96dxUIbRcXhKZ1A/exec";

(function () {
  "use strict";

  var scriptActual = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    return s[s.length - 1];
  })();
  var RUTA_BASE = scriptActual.getAttribute("data-ruta-base") || "";
  if (!RUTA_BASE && scriptActual.src) {
    var m = scriptActual.src.match(/^(.*\/)assets\/js\/chatbot\.js/);
    if (m) RUTA_BASE = m[1];
  }
  function ruta(recurso) { return RUTA_BASE + recurso; }

  var abierto = false;
  var conversacion = [];
  var esperandoRespuesta = false;
  var tooltipTimer = null;
  var tooltipVisible = false;
  var VERSION_HISTORIAL = "3";

  var TEXTO_TOOLTIP = "Pregunta al asistente virtual";
  var TEXTO_BIENVENIDA = "Hola, soy el asistente virtual del Ing. Juan Cueto. ¿En qué proyecto o habilidad estás interesado?";
  var TEXTO_SIN_API = "El asistente aún no está conectado. Pegue la URL de Google Apps Script en chatbot.js.";
  var TEXTO_ERROR = "Error de conexión. Verifique su internet e intente de nuevo.";
  var TEXTO_PLACEHOLDER = "Escriba su mensaje…";

  function crearBoton() {
    var btn = document.createElement("button");
    btn.className = "chatbot-btn";
    btn.setAttribute("aria-label", "Abrir asistente virtual");
    btn.innerHTML = '<img src="' + ruta("assets/img/chatbot-icon.svg") + '" alt="Asistente Virtual" width="60" height="60" style="border-radius:50%">';
    btn.addEventListener("click", toggleChat);
    return btn;
  }

  function crearTooltip() {
    var t = document.createElement("div");
    t.className = "chatbot-tooltip";
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    t.textContent = TEXTO_TOOLTIP;
    return t;
  }

  function crearPanel() {
    var p = document.createElement("div");
    p.className = "chatbot-panel";
    p.setAttribute("role", "dialog");
    p.setAttribute("aria-label", "Asistente Virtual");
    p.innerHTML =
      '<div class="chatbot-header">' +
        '<div class="chatbot-header-info">' +
          '<img src="' + ruta("assets/img/chatbot-icon.svg") + '" alt="" class="chatbot-header-avatar" width="36" height="36">' +
          '<h3 class="chatbot-header-nombre">Asistente Virtual</h3>' +
        '</div>' +
        '<button class="chatbot-close" aria-label="Cerrar chat">&times;</button>' +
      '</div>' +
      '<div class="chatbot-messages" role="log" aria-live="polite"></div>' +
      '<div class="chatbot-input-area">' +
        '<textarea class="chatbot-input" placeholder="' + TEXTO_PLACEHOLDER + '" rows="1" aria-label="Mensaje"></textarea>' +
        '<button class="chatbot-send" aria-label="Enviar mensaje">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</div>';

    p.querySelector(".chatbot-close").addEventListener("click", toggleChat);
    var ta = p.querySelector(".chatbot-input");
    var sb = p.querySelector(".chatbot-send");
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }
      autoResize.call(this);
    });
    ta.addEventListener("input", function () { autoResize.call(this); });
    sb.addEventListener("click", enviarMensaje);
    return p;
  }

  function autoResize() {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 100) + "px";
  }

  function mostrarTooltip() {
    if (abierto || tooltipVisible) return;
    var t = document.querySelector(".chatbot-tooltip");
    if (t) { t.classList.add("visible"); tooltipVisible = true; }
  }

  function ocultarTooltip() {
    var t = document.querySelector(".chatbot-tooltip");
    if (t) { t.classList.remove("visible"); tooltipVisible = false; }
  }

  function toggleChat() {
    abierto = !abierto;
    var p = document.querySelector(".chatbot-panel");
    var b = document.querySelector(".chatbot-btn");
    var ta = document.querySelector(".chatbot-input");
    ocultarTooltip();
    if (tooltipTimer) clearInterval(tooltipTimer);
    if (abierto) {
      p.classList.add("abierto");
      b.classList.add("activo");
      b.setAttribute("aria-label", "Cerrar asistente virtual");
      setTimeout(function () { ta.focus(); }, 350);
      
      // SOLO agrega bienvenida si el contenedor de mensajes está totalmente vacío
      var c = document.querySelector(".chatbot-messages");
      if (c && c.children.length === 0 && !yaExisteBienvenida()) {
        agregarMensaje("asistente", TEXTO_BIENVENIDA);
      }
    } else {
      p.classList.remove("abierto");
      b.classList.remove("activo");
      b.setAttribute("aria-label", "Abrir asistente virtual");
      b.focus();
      iniciarCicloTooltip();
    }
  }

  function atraparFoco(e) {
    if (!abierto) return;
    if (e.key === "Escape") { toggleChat(); return; }
    if (e.key !== "Tab") return;
    var panel = document.querySelector(".chatbot-panel");
    if (!panel) return;
    var focos = panel.querySelectorAll(
      'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focos.length) return;
    var primero = focos[0];
    var ultimo = focos[focos.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    } else {
      if (document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  }

  function iniciarCicloTooltip() {
    if (tooltipTimer) clearInterval(tooltipTimer);
    var ciclo = function () {
      if (abierto) { ocultarTooltip(); return; }
      if (!tooltipVisible) { mostrarTooltip(); setTimeout(function () { ocultarTooltip(); }, 3000); }
    };
    ciclo();
    tooltipTimer = setInterval(ciclo, 6000);
  }

  function agregarMensaje(tipo, texto) {
    var c = document.querySelector(".chatbot-messages");
    if (!c) return;
    var msg = document.createElement("div");
    msg.className = "chatbot-mensaje " + tipo;
    msg.textContent = texto;
    c.appendChild(msg);
    c.scrollTop = c.scrollHeight;
    conversacion.push({ role: tipo === "usuario" ? "user" : "assistant", content: texto });
  }

  function mostrarTyping() {
    var c = document.querySelector(".chatbot-messages");
    if (!c) return;
    var t = document.createElement("div");
    t.className = "chatbot-typing";
    t.innerHTML = "<span></span><span></span><span></span>";
    t.setAttribute("data-typing", "true");
    c.appendChild(t);
    c.scrollTop = c.scrollHeight;
  }

  function quitarTyping() {
    var t = document.querySelector('[data-typing="true"]');
    if (t) t.remove();
  }

  function enviarMensaje() {
    if (esperandoRespuesta) return;
    var ta = document.querySelector(".chatbot-input");
    var sb = document.querySelector(".chatbot-send");
    var msg = ta.value.trim();
    if (!msg) return;
    agregarMensaje("usuario", msg);
    ta.value = "";
    ta.style.height = "auto";
    esperandoRespuesta = true;
    sb.disabled = true;

    if (!GOOGLE_SCRIPT_URL) {
      mostrarTyping();
      setTimeout(function () {
        quitarTyping();
        agregarMensaje("asistente", TEXTO_SIN_API);
        esperandoRespuesta = false;
        sb.disabled = false;
      }, 1200);
      return;
    }

    mostrarTyping();
    fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ message: msg, token: "jcp-K8x2Rf7nQp3Wm9Lv", referrer: window.location.href }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        quitarTyping();
        agregarMensaje("asistente", d.reply || d.response || d.text || "No pude procesar su consulta.");
        esperandoRespuesta = false;
        sb.disabled = false;
      })
      .catch(function () {
        quitarTyping();
        agregarMensaje("error", TEXTO_ERROR);
        esperandoRespuesta = false;
        sb.disabled = false;
      });
  }

  function limpiarHistorialObsoleto() {
    try {
      var ver = localStorage.getItem("chatbot-version");
      var ts = parseInt(localStorage.getItem("chatbot-timestamp") || "0", 10);
      var ahora = Date.now();
      var EXPIRACION = 48 * 60 * 60 * 1000;

      if (ver !== VERSION_HISTORIAL || (ts && ahora - ts > EXPIRACION)) {
        localStorage.removeItem("chatbot-conversacion");
        localStorage.removeItem("chatbot-timestamp");
        localStorage.setItem("chatbot-version", VERSION_HISTORIAL);
      }
    } catch (_) {}
  }

  function yaExisteBienvenida() {
    for (var i = 0; i < conversacion.length; i++) {
      if (conversacion[i].role === "assistant" && conversacion[i].content === TEXTO_BIENVENIDA) return true;
    }
    return false;
  }

  function colapsarPeriodo(mensajes) {
    var n = mensajes.length;
    if (n < 9) return mensajes;
    var clave = mensajes.map(function (m) { return m.role + "|" + m.content; });
    for (var p = 1; p <= Math.min(5, Math.floor(n / 2)); p++) {
      if (n < p * 3) continue;
      var periodico = true;
      for (var i = p; i < n; i++) {
        if (clave[i] !== clave[i % p]) { periodico = false; break; }
      }
      if (periodico) return mensajes.slice(-p);
    }
    return mensajes;
  }

  function init() {
    if (document.querySelector(".chatbot-btn")) return;
    limpiarHistorialObsoleto();
    document.body.appendChild(crearBoton());
    document.body.appendChild(crearPanel());
    document.body.appendChild(crearTooltip());
    document.addEventListener("keydown", atraparFoco);

    // Carga de historial limpia sin duplicados en el DOM
    try {
      var g = localStorage.getItem("chatbot-conversacion");
      if (g) {
        var guardados = JSON.parse(g);
        if (Array.isArray(guardados) && guardados.length > 0) {
          var c = document.querySelector(".chatbot-messages");
          var previo = null;
          var limpio = [];
          guardados.forEach(function (m) {
            if (!c || !m || typeof m.content !== "string") return;
            if (previo && previo.role === m.role && previo.content === m.content) return;
            previo = m;
            limpio.push(m);
          });
          limpio = colapsarPeriodo(limpio);
          limpio.forEach(function (m) {
            var tipo = m.role === "user" ? "usuario" : "asistente";
            var msg = document.createElement("div");
            msg.className = "chatbot-mensaje " + tipo;
            msg.textContent = m.content;
            c.appendChild(msg);
          });
          conversacion = limpio;
        }
      }
    } catch (_) {}

    iniciarCicloTooltip();
  }

  window.addEventListener("beforeunload", function () {
    try {
      localStorage.setItem("chatbot-conversacion", JSON.stringify(conversacion));
      localStorage.setItem("chatbot-timestamp", Date.now().toString());
    } catch (_) {}
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
