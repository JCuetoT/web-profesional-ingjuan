import { test, expect } from "@playwright/test";

// ============================================================
// FASE 3 — Tests complementarios
// Validan calidad tecnica sin bloquear el sitio si fallan
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
// TEST 9: Jerarquia de headings sin saltos (h1 → h2 → h3)
// -----------------------------------------------------------
for (const pagePath of PAGES) {
  test(`CAL-09: jerarquia de headings correcta en ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath);

    const levels: number[] = await page.locator("h1, h2, h3").evaluateAll((els) =>
      els
        .filter((el) => !el.closest(".chatbot-panel"))
        .map((el) => parseInt(el.tagName.replace("H", "")))
    );

    if (levels.length === 0) return;

    // Debe empezar con h1
    expect(levels[0]).toBe(1);

    // Cada heading debe ser igual al anterior o un nivel mas profundo (nunca saltar)
    for (let i = 1; i < levels.length; i++) {
      const diff = levels[i] - levels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });
}

// -----------------------------------------------------------
// TEST 10: Footer muestra año actual
// -----------------------------------------------------------
test("CAL-10: footer muestra el año actual", async ({ page }) => {
  await page.goto("index.html");
  const yearText = await page.locator("#anio-footer").textContent();
  const currentYear = new Date().getFullYear().toString();
  expect(yearText).toBe(currentYear);
});

// -----------------------------------------------------------
// TEST 11: Barra de progreso responde al scroll
// -----------------------------------------------------------
test("CAL-11: barra de progreso avanza al hacer scroll", async ({ page }) => {
  await page.goto("index.html");

  // Sin scroll — width = 0 o muy pequeño
  let width = await page.locator("#barra-progreso-pagina").evaluate(
    (el) => window.getComputedStyle(el).width
  );
  expect(parseFloat(width)).toBe(0);

  // Scroll al 50%
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
  await page.waitForTimeout(200);

  width = await page.locator("#barra-progreso-pagina").evaluate(
    (el) => window.getComputedStyle(el).width
  );
  const pct = parseFloat(width);
  expect(pct).toBeGreaterThan(0);
});

// -----------------------------------------------------------
// TEST 12: Layout responsive en 3 viewports
// -----------------------------------------------------------
const VIEWPORT_SIZES = [
  { name: "movil", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

for (const vp of VIEWPORT_SIZES) {
  test(`CAL-12: layout no tiene overflow horizontal en ${vp.name} (${vp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("index.html");

    // Verificar que el nav esta presente
    await expect(page.locator(".nav-header")).toBeVisible();

    // Verificar que no hay scroll horizontal
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });
    expect(hasHorizontalScroll).toBe(false);
  });
}

// -----------------------------------------------------------
// TEST 13: JSON-LD valido en todas las paginas
// -----------------------------------------------------------
for (const pagePath of PAGES) {
  test(`CAL-13: JSON-LD es valido en ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath);

    const jsonLdText = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();

    expect(jsonLdText).toBeTruthy();

    // Parseable como JSON
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonLdText!);
    } catch {
      throw new Error(`JSON-LD invalido en ${pagePath}: ${jsonLdText?.slice(0, 80)}`);
    }

    // Campos obligatorios de schema.org
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBeTruthy();
    expect(parsed["name"]).toBeTruthy();
  });
}
