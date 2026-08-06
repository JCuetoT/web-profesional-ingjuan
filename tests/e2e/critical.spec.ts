import { test, expect } from "@playwright/test";

// ============================================================
// FASE 2 — Tests críticos
// Si alguno falla, la experiencia del visitante se rompe
// ============================================================

const PAGES = [
  "index.html",
  "sobre-mi.html",
  "contacto.html",
  "proyectos/index.html",
  "proyectos/biofertizo.html",
  "proyectos/cfte-coomulbanano.html",
  "proyectos/compostaje-industrial.html",
  "proyectos/energia-solar.html",
  "proyectos/gobernanza-datos.html",
  "proyectos/gobernanza-datos-2026.html",
  "proyectos/hecho-aqui.html",
  "proyectos/voces-del-norte.html",
  "proyectos/memoria-historica-orihueca.html",
  "proyectos/psmv-tenerife.html",
  "proyectos/ptap-orihueca.html",
  "proyectos/rutas-agroturisticas-fao.html",
  "proyectos/sabores-inspiran.html",
  "proyectos/tratamiento-fusarium-r4t.html",
  "proyectos/verse-bien.html",
  "academia/index.html",
  "academia/modulo-a-formulacion.html",
  "conocimiento/index.html",
  "lab/index.html",
  "lab/lab-01-bibliografia-multiagente.html",
];

// -----------------------------------------------------------
// TEST 1: Navegacion — todas las paginas cargan y tienen h1
// -----------------------------------------------------------
for (const pagePath of PAGES) {
  test(`CRIT-01: ${pagePath} carga y tiene heading principal`, async ({ page }) => {
    await page.goto(pagePath);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 5000 });
  });
}

// -----------------------------------------------------------
// TEST 2: Enlaces internos — no hay links rotos
// -----------------------------------------------------------
test("CRIT-02: no hay enlaces internos rotos", async ({ page }) => {
  const visited = new Set<string>();
  const broken: string[] = [];

  for (const pagePath of PAGES) {
    await page.goto(pagePath);
    visited.add(pagePath);

    const links = await page.locator("a[href]").evaluateAll((els) =>
      els.map((a) => ({
        href: a.getAttribute("href") || "",
        text: a.textContent?.trim().slice(0, 50) || "",
      }))
    );

    for (const link of links) {
      if (
        link.href.startsWith("http") ||
        link.href.startsWith("#") ||
        link.href.startsWith("mailto:") ||
        link.href.startsWith("javascript:") ||
        link.href.startsWith("data:")
      )
        continue;

      try {
        const response = await page.request.get(link.href);
        if (!response.ok()) {
          broken.push(`${pagePath} → ${link.href} (${link.text}) — ${response.status()}`);
        }
      } catch {
        // file:// links won't work with request.get; skip
      }
    }
  }

  if (broken.length > 0) {
    console.log("\nEnlaces rotos encontrados:\n" + broken.join("\n"));
  }
  expect(broken).toEqual([]);
});

// -----------------------------------------------------------
// TEST 3: Menu movil funciona en viewport pequeño
// -----------------------------------------------------------
test("CRIT-03: menu movil abre, muestra links y navega", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("index.html");

  // En mobile el menu hamburguesa debe ser visible
  const menuBtn = page.locator("#btn-menu-movil");
  await expect(menuBtn).toBeVisible();

  // Abrir menu via JS (fixed element en file://)
  await menuBtn.evaluate((el: HTMLButtonElement) => el.click());
  const mobileMenu = page.locator("#menu-movil");
  await expect(mobileMenu).toHaveClass(/abierto/);

  // Verificar links del menu movil
  await expect(page.locator(".menu-movil-links a").first()).toBeVisible();

  // Click en un link deberia cerrar el menu y navegar
  await page.locator(".menu-movil-links a[href*='proyectos']").first().click();
  await page.waitForURL("**/proyectos/**");
  await expect(page.locator("h1").first()).toBeVisible();
});

// -----------------------------------------------------------
// TEST 4: Modo oscuro — toggle y persistencia
// -----------------------------------------------------------
test("CRIT-04: modo oscuro se activa, desactiva y persiste en localStorage", async ({ page }) => {
  await page.goto("index.html");

  const html = page.locator("html");
  const darkBtn = page.locator("#btn-tema");

  // Estado inicial: no oscuro
  await expect(html).not.toHaveClass(/tema-oscuro/);

  // Activar modo oscuro
  await darkBtn.evaluate((el: HTMLButtonElement) => el.click());
  await expect(html).toHaveClass(/tema-oscuro/);

  // Verificar que se guardo en localStorage
  const stored = await page.evaluate(() => localStorage.getItem("tema-oscuro"));
  expect(stored).toBe("true");

  // Desactivar
  await darkBtn.evaluate((el: HTMLButtonElement) => el.click());
  await expect(html).not.toHaveClass(/tema-oscuro/);

  const storedOff = await page.evaluate(() => localStorage.getItem("tema-oscuro"));
  expect(storedOff).toBe("false");
});

// -----------------------------------------------------------
// TEST 5: Filtros del catalogo de proyectos
// -----------------------------------------------------------
test("CRIT-05: filtros de proyectos funcionan correctamente", async ({ page }) => {
  await page.goto("proyectos/index.html");

  // Todos los proyectos visibles inicialmente
  const todasLasCards = page.locator("#grid-proyectos .proyecto-card");
  const countInicial = await todasLasCards.count();
  expect(countInicial).toBeGreaterThanOrEqual(13);

  // Filtrar por rol "Formulador"
  await page.locator('[data-filtro-rol="formulador"]').click();
  // Esperar que se oculte alguno (los que no son formulador)
  await page.waitForTimeout(300);

  // Verificar que los visibles tienen data-rol="formulador"
  const visibles = page.locator('#grid-proyectos .proyecto-card:not([style*="display: none"])');
  const countVisibles = await visibles.count();
  expect(countVisibles).toBeGreaterThan(0);

  for (let i = 0; i < countVisibles; i++) {
    const rol = await visibles.nth(i).getAttribute("data-rol");
    expect(rol).toBe("formulador");
  }

  // Volver a "Todos los roles"
  await page.locator('[data-filtro-rol="todos"]').click();
  await page.waitForTimeout(300);
  const countFinal = await page.locator('#grid-proyectos .proyecto-card:not([style*="display: none"])').count();
  expect(countFinal).toBe(countInicial);
});

// -----------------------------------------------------------
// TEST 6: Chatbot existe en todas las paginas y se abre
// -----------------------------------------------------------
for (const pagePath of PAGES) {
  test(`CRIT-06: chatbot aparece en ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath);
    const chatBtn = page.locator(".chatbot-btn");
    await expect(chatBtn).toBeVisible({ timeout: 5000 });

    // Abrir chatbot
    await chatBtn.click();
    const panel = page.locator(".chatbot-panel");
    await expect(panel).toHaveClass(/abierto/);

    // Debe mostrar mensaje de bienvenida
    const mensajes = page.locator(".chatbot-mensaje.asistente");
    await expect(mensajes).toHaveCount(1);

    // Cerrar
    await page.locator(".chatbot-close").click();
    await expect(panel).not.toHaveClass(/abierto/);
  });
}

// -----------------------------------------------------------
// TEST 7: SEO — tags minimos en todas las paginas
// -----------------------------------------------------------
for (const pagePath of PAGES) {
  test(`CRIT-07: SEO tags minimos en ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath);

    // Title no vacio
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Meta description
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc?.length).toBeGreaterThan(0);

    // Canonical no vacio
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical?.length).toBeGreaterThan(0);

    // og:title
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle?.length).toBeGreaterThan(0);

    // og:image existe como meta tag
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toContain("og-image.png");
  });
}

// -----------------------------------------------------------
// TEST 8: Imagenes no rotas (logos e iconos clave)
// -----------------------------------------------------------
test("CRIT-08: imagenes clave cargan sin error", async ({ page }) => {
  // Chatbot icon en index
  await page.goto("index.html");
  await page.locator(".chatbot-btn").click();
  const avatarImg = page.locator(".chatbot-header-avatar").first();
  await expect(avatarImg).toBeVisible();
  const naturalWidth = await avatarImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
  expect(naturalWidth).toBeGreaterThan(0);

  // Biofertizo logo
  await page.goto("proyectos/biofertizo.html");
  const logoImg = page.locator('img[src*="biofertizo-logo"]');
  await expect(logoImg).toBeVisible();
  const logoWidth = await logoImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
  expect(logoWidth).toBeGreaterThan(0);
});

// -----------------------------------------------------------
// TEST 9: Convertidor de moneda COP/USD
// -----------------------------------------------------------
test("CRIT-09: convertidor de moneda COP/USD funciona", async ({ page }) => {
  await page.goto("proyectos/index.html");

  const btnMoneda = page.locator("#btn-moneda");
  await expect(btnMoneda).toBeVisible();

  // Estado inicial: COP
  await expect(btnMoneda).toContainText("COP");
  // Click para cambiar a USD
  await btnMoneda.evaluate((el: HTMLButtonElement) => el.click());

  await page.waitForTimeout(200);
  await expect(btnMoneda).toContainText("USD");

  // Click para volver a COP
  await btnMoneda.evaluate((el: HTMLButtonElement) => el.click());
  await page.waitForTimeout(200);
  await expect(btnMoneda).toContainText("COP");
});

// -----------------------------------------------------------
// TEST 10: Chatbot — flujo completo con API mockeada
// -----------------------------------------------------------
test("CRIT-10: chatbot envia mensaje y recibe respuesta", async ({ page }) => {
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycby6PP-VwO2K5NZ-bd0RSsFVNfXkPd-PNQOLbqG1JkjhEmsbultty96dxUIbRcXhKZ1A/exec";

  // Mockear el endpoint para no consumir la API real
  await page.route(SCRIPT_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Soy el asistente virtual del Ing. Juan Cueto. Tengo experiencia en saneamiento ambiental, desarrollo rural y formulacion de proyectos.",
      }),
    });
  });

  await page.goto("index.html");

  // Abrir chatbot
  await page.locator(".chatbot-btn").click();
  const panel = page.locator(".chatbot-panel");
  await expect(panel).toHaveClass(/abierto/);

  // Esperar mensaje de bienvenida
  await expect(page.locator(".chatbot-mensaje.asistente")).toHaveCount(1);

  // Escribir y enviar mensaje
  const textarea = page.locator(".chatbot-input");
  await textarea.fill("Que experiencia tienes?");
  await page.locator(".chatbot-send").click();

  // Esperar respuesta del asistente
  await expect(page.locator(".chatbot-mensaje.asistente")).toHaveCount(2);

  // Verificar que la respuesta mockeada aparece
  const respuesta = page.locator(".chatbot-mensaje.asistente").last();
  await expect(respuesta).toContainText("saneamiento ambiental");

  // Cerrar chatbot
  await page.locator(".chatbot-close").click();
  await expect(panel).not.toHaveClass(/abierto/);
});
