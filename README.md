# Portafolio Ingeniero Juan Cueto

Sitio web profesional de **Juan Luis Cueto Tilano** — Ingeniero Ambiental y Sanitario especializado en gerencia y formulacion de proyectos socioambientales en Colombia.

- **Dominio:** [www.ingenierojuancueto.com](https://www.ingenierojuancueto.com)
- **Stack:** HTML5, CSS3, JavaScript vanilla (sitio estatico)
- **Hosting:** Cloudflare Pages
- **Testing:** Playwright (e2e)

## Estructura del proyecto

```
/
├── index.html                  Home
├── sobre-mi.html               Perfil profesional
├── contacto.html               Contacto
├── academia/                   Cursos y modulos formativos
├── conocimiento/               Centro de conocimiento
├── lab/                        Laboratorio de experimentacion IA
├── proyectos/                  Portafolio de proyectos (16 fichas)
├── assets/
│   ├── css/                    Hojas de estilo
│   ├── js/                     Scripts (chatbot, componentes, moneda)
│   ├── img/                    Imagenes e iconos SVG/WebP
│   └── docs/                   Documentos descargables (CV)
├── tests/e2e/                  Tests end-to-end con Playwright
├── tools/                      Herramientas auxiliares (Streamlit, etc.)
├── _headers                    Cloudflare Pages headers
├── robots.txt
└── sitemap.xml
```

## Desarrollo local

```bash
# Servidor de desarrollo (puerto 3000)
npm run dev

# Tests e2e
npm run test:e2e
npm run test:e2e:ui       # modo visual
npm run test:e2e:report    # ver reporte
```

## Chatbot

El asistente virtual usa:
- **Frontend:** `assets/js/chatbot.js` (boton flotante + panel de chat)
- **Backend:** Google Apps Script → Groq API (LLaMA 3.1 8B)

### Seguridad del endpoint

El Apps Script valida:
1. **Origin** — solo peticiones desde `www.ingenierojuancueto.com`
2. **Token** — secreto en `PropertiesService.getScriptProperties().getProperty("CHATBOT_TOKEN")`
3. **Referrer** — la URL de origen de la llamada
4. **Rate limiting** — max 10 mensajes/minuto por IP
5. **Anti-injection** — deteccion de patrones de jailbreak/prompt injection

## Deploy

1. Push a la rama `main` en GitHub
2. Cloudflare Pages detecta el push y despliega automaticamente
3. Headers de seguridad y cache configurados via `_headers`

## Licencia

Proyecto privado. Todos los derechos reservados.
