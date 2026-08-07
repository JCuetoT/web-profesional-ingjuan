# Portafolio Ingeniero Juan Cueto

Sitio web profesional de **Juan Luis Cueto Tilano** — Ingeniero Ambiental y Sanitario especializado en gerencia y formulacion de proyectos socioambientales en Colombia.

- **Dominio:** [www.ingenierojuancueto.com](https://www.ingenierojuancueto.com)
- **Stack:** HTML/CSS/JavaScript vanilla (sitio estatico)
- **Hosting:** GitHub Pages + Cloudflare (DNS/CDN)
- **Testing:** Playwright (e2e)

## Proyectos del repositorio

Este repositorio concentra el sitio web y las herramientas digitales que lo acompanan. Cada proyecto tiene su propio codigo y su pagina de acceso en el sitio.

| Proyecto | Descripcion | Acceso | Stack |
|---|---|---|---|
| **Web profesional** | Sitio portafolio personal (este repositorio) | [www.ingenierojuancueto.com](https://www.ingenierojuancueto.com) | HTML, CSS, JavaScript |
| **Chatbot IA** | Asistente virtual del sitio para consultas sobre el perfil y experiencia | Panel flotante en el sitio (`assets/js/chatbot.js`) | Google Apps Script → Groq (LLaMA 3.1 8B) |
| **Analizador de Merma** | Clasificacion de defectos poscosecha de banano en 5 categorias con distribucion porcentual y recomendaciones | [conocimiento/analisis-merma.html](conocimiento/analisis-merma.html) | Python (Streamlit) en Streamlit Cloud, embebido via iframe en el sitio |

### Como agregar un proyecto

1. Poner el codigo de la aplicacion en `tools/<proyecto>/`.
2. Crear una pagina de acceso en `conocimiento/` (o `lab/`) con tarjeta en su `index.html`.
3. Agregar una fila a la tabla de Proyectos de este README.
4. Si es un aplicativo web hospedado por fuera, documentar en la fila su URL y stack.

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
├── tools/merma-analisis/       App de analisis de merma (Streamlit)
├── _headers                    Security headers y CORS
├── CNAME                       Dominio en GitHub Pages
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

1. Push a la rama `master` en GitHub.
2. GitHub Pages detecta el push y despliega automaticamente en el dominio del `CNAME`.
3. DNS/HTTPS gestionado por Cloudflare (proxy + Always Use HTTPS), redirigiendo `ingenierojuancueto.com` → `www`.
4. Security headers y CORS configurados via `_headers`.

## Licencia

Proyecto privado. Todos los derechos reservados.
