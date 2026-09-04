tailwind.config = {
  theme: {
    extend: {
      colors: {
        compost: {
          50: '#fbf7ee',
          100: '#f4ebd5',
          200: '#e8d4aa',
          500: '#a36d2c',
          700: '#6a4216',
          900: '#382109'
        },
        bio: {
          50: '#f2f9f3',
          100: '#e1f2e4',
          500: '#2f855a',
          600: '#276749',
          700: '#1c4d36'
        }
      }
    }
  }
};

// --- ESTADO INICIAL EN MEMORIA ---
let compostRecords = [];

let compostChart = null;

// Métricas de la Prueba del Puño
const fistTestDictionary = {
  seca: {
    estimatedPercent: 35,
    label: "Muy Seca (< 40%)",
    description: "Se desmorona de inmediato al abrir el puño. Sin humedad perceptible. Frena en seco la biología.",
    badge: "Déficit Hídrico Severo"
  },
  ligera: {
    estimatedPercent: 45,
    label: "Ligeramente Seca (~45%)",
    description: "Forma un terrón pero se cuartea con leve roce. No produce gotas.",
    badge: "Baja Humedad"
  },
  optima: {
    estimatedPercent: 55,
    label: "Óptima (50 - 60%)",
    description: "El material forma una bola compacta; al apretar con fuerza salen de 1 a 3 gotas entre los nudillos.",
    badge: "Humedad Ideal"
  },
  moderada: {
    estimatedPercent: 65,
    label: "Ligero Exceso (~65%)",
    description: "Salen entre 4 y 10 gotas sin apretar excesivamente fuerte.",
    badge: "Exceso Hídrico Leve"
  },
  saturada: {
    estimatedPercent: 78,
    label: "Saturada (> 70%)",
    description: "Escurre agua en chorro continuo. Peligro inminente de putrefacción, malos olores y colapso de oxígeno.",
    badge: "Anaerobiosis por Encharcamiento"
  }
};

// --- ELEMENTOS DOM ---
const monitoringForm = document.getElementById("monitoringForm");
const operatorNameInput = document.getElementById("operatorName");
const timeUnitTypeSelect = document.getElementById("timeUnitType");
const timeUnitValueInput = document.getElementById("timeUnitValue");
const unitLabelSpan = document.getElementById("unitLabel");
const recordDateInput = document.getElementById("recordDate");
const temperatureInput = document.getElementById("temperature");
const oxygenLevelInput = document.getElementById("oxygenLevel");
const fistTestSelect = document.getElementById("fistTestSelect");
const fistDescriptionText = document.getElementById("fistDescriptionText");
const humiditySensorValue = document.getElementById("humiditySensorValue");
const recordNotesInput = document.getElementById("recordNotes");

const tabHumedadFist = document.getElementById("tabHumedadFist");
const tabHumedadSensor = document.getElementById("tabHumedadSensor");
const fistTestContainer = document.getElementById("fistTestContainer");
const sensorTestContainer = document.getElementById("sensorTestContainer");

const btnExportPdf = document.getElementById("btnExportPdf");
const btnExportCsv = document.getElementById("btnExportCsv");
const csvFileInput = document.getElementById("csvFileInput");
const btnClearData = document.getElementById("btnClearData");

const monitoringTableBody = document.getElementById("monitoringTableBody");
const recordsCountBadge = document.getElementById("recordsCountBadge");

const startOverlay = document.getElementById("startOverlay");
const btnStartMonitoring = document.getElementById("btnStartMonitoring");

// Indicadores y Alertas
const currentPhaseTitle = document.getElementById("currentPhaseTitle");
const phaseBadge = document.getElementById("phaseBadge");
const kpiTemp = document.getElementById("kpiTemp");
const kpiTempStatus = document.getElementById("kpiTempStatus");
const kpiHumidity = document.getElementById("kpiHumidity");
const kpiHumidityStatus = document.getElementById("kpiHumidityStatus");
const kpiOxygen = document.getElementById("kpiOxygen");
const kpiOxygenStatus = document.getElementById("kpiOxygenStatus");
const advancedAlertsContainer = document.getElementById("advancedAlertsContainer");
const agroRecommendation = document.getElementById("agroRecommendation");

let currentHumidityMode = "fist";
let timeValueEdited = false;

// --- INICIALIZACIÓN ---
window.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  recordDateInput.value = today;

  calculateNextTimeValue();
  initChart();
  refreshAll();
  setupEventListeners();

  // Flujo de inicio: ocultar overlay y arrancar con la bitácora vacía
  btnStartMonitoring.addEventListener("click", () => {
    startOverlay.classList.add("hidden");
    document.body.style.overflow = "";
    operatorNameInput.focus();
    showToast("Monitoreo iniciado. Registra tu primer dato de campo.", "success");
  });
});

function setupEventListeners() {
  // Toggle Humedad
  tabHumedadFist.addEventListener("click", () => {
    currentHumidityMode = "fist";
    tabHumedadFist.className = "px-2.5 py-1 text-xs font-semibold rounded-l-lg bg-amber-600 text-white border border-amber-600 transition";
    tabHumedadSensor.className = "px-2.5 py-1 text-xs font-medium rounded-r-lg bg-white text-stone-600 hover:bg-stone-100 border border-stone-300 border-l-0 transition";
    fistTestContainer.classList.remove("hidden");
    sensorTestContainer.classList.add("hidden");
  });

  tabHumedadSensor.addEventListener("click", () => {
    currentHumidityMode = "sensor";
    tabHumedadSensor.className = "px-2.5 py-1 text-xs font-semibold rounded-r-lg bg-amber-600 text-white border border-amber-600 transition";
    tabHumedadFist.className = "px-2.5 py-1 text-xs font-medium rounded-l-lg bg-white text-stone-600 hover:bg-stone-100 border border-stone-300 border-r-0 transition";
    sensorTestContainer.classList.remove("hidden");
    fistTestContainer.classList.add("hidden");
  });

  fistTestSelect.addEventListener("change", (e) => {
    const item = fistTestDictionary[e.target.value];
    if (item) fistDescriptionText.textContent = item.description;
  });

  timeUnitTypeSelect.addEventListener("change", () => {
    unitLabelSpan.textContent = timeUnitTypeSelect.value;
    if (compostRecords.length > 0) {
      applyAutoTimeValue();
    } else {
      calculateNextTimeValue();
    }
  });

  recordDateInput.addEventListener("change", applyAutoTimeValue);
  timeUnitValueInput.addEventListener("input", () => { timeValueEdited = true; });

  monitoringForm.addEventListener("submit", handleFormSubmit);

  btnExportCsv.addEventListener("click", exportToCSV);
  csvFileInput.addEventListener("change", handleCsvImport);
  btnClearData.addEventListener("click", clearAllData);
  btnExportPdf.addEventListener("click", generatePDFReport);
}

function calculateNextTimeValue() {
  const type = timeUnitTypeSelect.value;
  const matching = compostRecords.filter(r => r.timeUnitType === type);
  if (matching.length > 0) {
    const maxVal = Math.max(...matching.map(m => Number(m.timeUnitValue) || 0));
    timeUnitValueInput.value = maxVal + (type === "Día" ? 2 : 1);
  } else {
    timeUnitValueInput.value = 1;
  }
}

// Sugiere el número de día/semana según la fecha, tomando como ancla el registro más antiguo
function suggestTimeValueFromDate(dateStr, type, records) {
  const relevant = records.filter(r => r.timeUnitType === type);
  const pool = relevant.length > 0 ? relevant : records;
  if (pool.length === 0 || !dateStr) return 1;
  const anchor = Math.min(...pool.map(r => new Date(r.date).getTime()));
  const diffDays = Math.floor((new Date(dateStr).getTime() - anchor) / 86400000);
  const value = type === "Semana" ? Math.floor(diffDays / 7) + 1 : diffDays + 1;
  return Math.max(1, value);
}

// Autocompleta el campo "Número (Día/Semana #)" a partir de la fecha seleccionada
function applyAutoTimeValue() {
  if (timeValueEdited) return;
  if (compostRecords.length === 0) {
    calculateNextTimeValue();
    return;
  }
  if (!recordDateInput.value) return;
  timeUnitValueInput.value = suggestTimeValueFromDate(recordDateInput.value, timeUnitTypeSelect.value, compostRecords);
}

// --- EVALUACIÓN DE FASES DEL COMPOSTAJE ---
function evaluateCompostPhase(temperature, previousRecords) {
  const maxPastTemp = previousRecords.length > 0 
    ? Math.max(...previousRecords.map(r => r.temperature)) 
    : temperature;

  if (temperature >= 45.0) {
    return "Fase Termófila (Higienización)";
  }

  if (maxPastTemp >= 48.0 && temperature < 45.0 && temperature >= 28.0) {
    return "Fase de Enfriamiento";
  }

  if (maxPastTemp >= 48.0 && temperature < 28.0) {
    return "Fase de Maduración / Estabilización";
  }

  if (temperature >= 20.0) {
    return "Fase Mesófila Inicial";
  }

  return "Fase Latente / Inicio";
}

// --- MOTOR DE ANÁLISIS Y AUDITORÍA AGRONÓMICA ---
function runAgronomicAudit(records) {
  const alerts = [];
  if (!records || records.length === 0) return { alerts, stats: {} };

  const sorted = [...records].sort((a,b) => {
    if (a.timeUnitType === b.timeUnitType) return a.timeUnitValue - b.timeUnitValue;
    return new Date(a.date) - new Date(b.date);
  });

  const last = sorted[sorted.length - 1];
  const maxTempEver = Math.max(...sorted.map(r => r.temperature));

  // 1. Detección de Estancamiento en Fase Mesófila Inicial
  const daysPassed = last.timeUnitType === "Día" ? last.timeUnitValue : (last.timeUnitValue * 7);
  const hasReachedThermophilic = sorted.some(r => r.temperature >= 45.0);

  if (daysPassed >= 5 && !hasReachedThermophilic) {
    alerts.push({
      type: "danger",
      title: "¡ALERTA CRÍTICA: Estancamiento Térmico en Fase Mesófila!",
      description: `Han transcurrido <strong>${daysPassed} días</strong> de monitoreo y la pila no ha logrado ascender a la fase termofílica (&ge; 45°C).<br>
      <strong>Causas comunes identificadas por consultoría agronómica:</strong>
      <ul class="list-disc list-inside mt-1 space-y-0.5">
        <li><strong>Relación C:N muy alta (&gt; 40:1):</strong> Exceso de material leñoso o seco (carbono) y carencia de nitrógeno fresco (estiércol, gallinaza o restos verdes).</li>
        <li><strong>Déficit hídrico severo (&lt; 40%):</strong> Sin agua suficiente, los microorganismos mesófilos no pueden multiplicarse.</li>
        <li><strong>Masa crítica insuficiente (&lt; 1 m³):</strong> La pila es muy pequeña y pierde el calor por convección hacia el ambiente con mayor velocidad de la que genera.</li>
      </ul>
      <strong>Acción correctiva inmediata:</strong> Incorpore fuentes nitrogenadas frescas (purín, estiércol o torta vegetal), ajuste la humedad con la prueba del puño a 55% y ensanche la pila.`
    });
  }

  // 2. Alerta de Hipertermia / Sobrecalentamiento Severo (>68°C)
  if (last.temperature > 68.0) {
    alerts.push({
      type: "danger",
      title: "🔥 Hipertermia Biológica Peligrosa (> 68°C)",
      description: `La temperatura actual es de <strong>${last.temperature.toFixed(1)}°C</strong>. Por encima de los 68°C se produce la calcinación y muerte de microorganismos benéficos, provocando volatilización masiva de nitrógeno en forma de amoníaco (olor punzante) e incluso riesgo de carbonización.<br>
      <strong>Acción recomendada por el Ing. Juan L. Cueto Tilano:</strong> Volteo mecánico urgente hoy mismo y aspersión fina de agua para amortiguar el exceso térmico a 58°C - 62°C.`
    });
  }

  // 3. Auditoría de Sanitización e Higienización (Norma EPA 503 / Saneamiento Térmico)
  const thermophilicSanitizedDays = sorted.filter(r => r.temperature >= 55.0).length;
  if (thermophilicSanitizedDays >= 3) {
    alerts.push({
      type: "success",
      title: "✅ Protocolo de Saneamiento Higiénico Conforme (EPA 503)",
      description: `La pila registra <strong>${thermophilicSanitizedDays} mediciones por encima de 55°C</strong>. Se garantiza la destrucción de semillas de malezas invasoras, fitopatógenos (*Fusarium*, *Phytophthora*) y bacterias coliformes (*Salmonella*, *E. coli*).`
    });
  } else if (hasReachedThermophilic && thermophilicSanitizedDays < 3 && last.phase.includes("Termófila")) {
    alerts.push({
      type: "warning",
      title: "⏳ Sanitización Térmica en Curso",
      description: `La pila está en fase higiénica activa (${last.temperature.toFixed(1)}°C). Mantenga la temperatura entre 55°C y 65°C durante al menos 3 a 5 días para asegurar compost libre de patógenos.`
    });
  }

  // 4. Descenso Prematuro / Apagado Inesperado
  if (maxTempEver >= 50.0 && last.temperature < 40.0 && sorted.length <= 4 && daysPassed < 15) {
    alerts.push({
      type: "warning",
      title: "⚠️ Advertencia: Caída Térmica Prematura",
      description: `La pila descendió rápidamente a <strong>${last.temperature.toFixed(1)}°C</strong> antes de completar la degradación de azúcares y celulosas. Es muy probable que se haya secado tras el último volteo o que se haya compactado impidiendo el flujo de oxígeno.`
    });
  }

  // 5. Alerta de Oxígeno Crítico
  if (last.oxygen < 5.0) {
    alerts.push({
      type: "danger",
      title: "🫁 Riesgo Inminente de Anaerobiosis (Oxígeno < 5%)",
      description: `Nivel de oxígeno medido al <strong>${last.oxygen.toFixed(1)}%</strong>. En condiciones de anoxia proliferan bacterias anaerobias putrefactivas que generan metano, sulfuro de hidrógeno y malos olores. <strong>Volteo obligatorio de aireación en las próximas 12 horas.</strong>`
    });
  }

  return {
    alerts,
    stats: {
      daysPassed,
      maxTempEver,
      hasReachedThermophilic,
      thermophilicSanitizedDays
    }
  };
}

// --- GENERACIÓN DE DIAGNÓSTICO DETALLADO ---
function generateDiagnosis(record, history) {
  if (!record) {
    return {
      title: "Sin Registros Aún",
      badgeColor: "bg-stone-200 text-stone-700",
      tempStatus: "Sin datos",
      humidityStatus: "Sin datos",
      oxygenStatus: "Sin datos",
      recommendation: "Comience agregando el registro del día o cargue un archivo CSV previo para visualizar el estado."
    };
  }

  const temp = record.temperature;
  const hum = record.humidityValue;
  const oxy = record.oxygen;
  const phase = record.phase;

  let tempStatus = "Normal";
  let humStatus = "Óptima";
  let oxyStatus = "Bueno";
  let recs = [];

  // Evaluación Térmica
  if (temp > 68) {
    tempStatus = "¡Crítica Alta!";
    recs.push("🚨 <strong>Sobrecalentamiento térmico:</strong> Voltee la pila de inmediato e incorpore humedad fresca.");
  } else if (temp >= 55 && temp <= 65) {
    tempStatus = "Óptimo Higiénico";
    recs.push("✨ <strong>Saneamiento óptimo:</strong> Inactivación eficaz de patógenos y semillas de malezas.");
  } else if (temp < 40 && phase.includes("Mesófila")) {
    tempStatus = "En Calentamiento";
    recs.push("⏳ <strong>Fase inicial:</strong> Los microorganismos mesófilos comienzan a multiplicarse. Si no sube en 4 días, añada nitrógeno.");
  } else if (phase.includes("Maduración")) {
    tempStatus = "Estable (Ambiente)";
    recs.push("🌱 <strong>Maduración avanzada:</strong> Humificación y síntesis de ácidos fúlvicos y húmicos. Dejar reposar sin volteos frecuentes.");
  }

  // Evaluación de Humedad
  if (hum < 45) {
    humStatus = "Déficit Hídrico";
    recs.push("💧 <strong>Falta de agua:</strong> La actividad biológica está frenada. Aplique riego homogéneo en capas durante el volteo.");
  } else if (hum > 65) {
    humStatus = "Exceso Peligroso";
    recs.push("⚠️ <strong>Exceso de humedad:</strong> Se corre riesgo de lixiviación y taponamiento de microporos. Mezcle material estructurante seco (paja, viruta gruesa).");
  } else {
    humStatus = "Óptima (50-60%)";
  }

  // Evaluación de Oxígeno
  if (oxy < 6.0) {
    oxyStatus = "Anaerobiosis (<6%)";
    recs.push("🫁 <strong>Asfixia de la pila:</strong> El oxígeno por debajo del 6% promueve putrefacción ácida. Ejecute volteo mecánico prioritario.");
  } else if (oxy >= 6.0 && oxy < 10.0) {
    oxyStatus = "Aceptable";
    recs.push("🔄 Oxígeno en nivel moderado. Monitoree de cerca las próximas 24 horas.");
  } else {
    oxyStatus = "Óptimo (>10%)";
  }

  let badgeColor = "bg-amber-100 text-amber-800";
  if (phase.includes("Termófila")) badgeColor = "bg-red-100 text-red-800 border border-red-200";
  else if (phase.includes("Enfriamiento")) badgeColor = "bg-blue-100 text-blue-800 border border-blue-200";
  else if (phase.includes("Maduración")) badgeColor = "bg-emerald-100 text-emerald-800 border border-emerald-200";

  return {
    title: phase,
    badgeColor: badgeColor,
    tempStatus: tempStatus,
    humidityStatus: humStatus,
    oxygenStatus: oxyStatus,
    recommendation: recs.join("<br>") || "Parámetros fisicoquímicos en rango ideal. Continúe con el programa de monitoreo preventivo."
  };
}

// --- FORMULARIO Y REGISTRO ---
function handleFormSubmit(e) {
  e.preventDefault();

  const operator = operatorNameInput.value.trim();
  const timeUnitType = timeUnitTypeSelect.value;
  let timeUnitValue = parseInt(timeUnitValueInput.value, 10);
  const date = recordDateInput.value;
  const temperature = parseFloat(temperatureInput.value);
  const oxygen = parseFloat(oxygenLevelInput.value);
  const notes = recordNotesInput.value.trim();

  // Si el número de día/semana quedó vacío, asumir día 1 (o derivarlo de la fecha si ya hay registros)
  if (isNaN(timeUnitValue)) {
    timeUnitValue = recordDateInput.value && compostRecords.length > 0
      ? suggestTimeValueFromDate(recordDateInput.value, timeUnitType, compostRecords)
      : 1;
  }

  if (!operator || isNaN(timeUnitValue) || isNaN(temperature) || isNaN(oxygen)) {
    showToast("Por favor complete los campos obligatorios.", "error");
    return;
  }

  let humidityValue = 55;
  let fistTestType = null;

  if (currentHumidityMode === "fist") {
    fistTestType = fistTestSelect.value;
    humidityValue = fistTestDictionary[fistTestType].estimatedPercent;
  } else {
    const sensorVal = parseFloat(humiditySensorValue.value);
    if (isNaN(sensorVal) || sensorVal < 0 || sensorVal > 100) {
      showToast("Ingrese un porcentaje de humedad válido (0 a 100%).", "error");
      return;
    }
    humidityValue = sensorVal;
  }

  const phase = evaluateCompostPhase(temperature, compostRecords);

  const newRecord = {
    id: Date.now().toString(),
    timeUnitType,
    timeUnitValue,
    date,
    operator,
    temperature,
    humidityMethod: currentHumidityMode,
    humidityValue,
    fistTestType,
    oxygen,
    notes,
    phase
  };

  compostRecords.push(newRecord);
  sortRecordsChronologically();

  // Limpiar campos manteniendo el operador para agilidad
  temperatureInput.value = "";
  oxygenLevelInput.value = "";
  humiditySensorValue.value = "";
  recordNotesInput.value = "";

  applyAutoTimeValue();
  refreshAll();

  showToast(`¡Monitoreo de ${timeUnitType} ${timeUnitValue} registrado con éxito por ${operator}!`, "success");
}

function sortRecordsChronologically() {
  compostRecords.sort((a, b) => {
    if (a.timeUnitType === b.timeUnitType) return a.timeUnitValue - b.timeUnitValue;
    return new Date(a.date) - new Date(b.date);
  });
}

// --- ACTUALIZACIÓN DE TODAS LAS VISTAS ---
function refreshAll() {
  recordsCountBadge.textContent = `${compostRecords.length} registros`;
  renderTable();
  renderDiagnosticAndAlerts();
  updateChartData();
}

function renderDiagnosticAndAlerts() {
  if (compostRecords.length === 0) {
    currentPhaseTitle.innerHTML = `<span class="text-stone-400 font-normal italic">Pila sin mediciones registradas</span>`;
    phaseBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600";
    phaseBadge.textContent = "Sin Datos";
    kpiTemp.textContent = "-- °C";
    kpiTempStatus.textContent = "--";
    kpiHumidity.textContent = "-- %";
    kpiHumidityStatus.textContent = "--";
    kpiOxygen.textContent = "-- %";
    kpiOxygenStatus.textContent = "--";
    agroRecommendation.innerHTML = "Ingrese los datos del monitoreo para ver el diagnóstico asistido.";
    advancedAlertsContainer.innerHTML = "";
    return;
  }

  const last = compostRecords[compostRecords.length - 1];
  const diag = generateDiagnosis(last, compostRecords.slice(0, -1));
  const audit = runAgronomicAudit(compostRecords);

  currentPhaseTitle.textContent = diag.title;
  phaseBadge.className = `px-3 py-1 rounded-full text-xs font-bold ${diag.badgeColor}`;
  phaseBadge.textContent = `${last.timeUnitType} ${last.timeUnitValue} (${last.date})`;

  kpiTemp.textContent = `${last.temperature.toFixed(1)} °C`;
  kpiTempStatus.textContent = diag.tempStatus;

  const humTag = last.humidityMethod === "fist" ? "(Puño)" : "(Sensor)";
  kpiHumidity.innerHTML = `${last.humidityValue}% <span class="text-[10px] font-normal text-stone-400 block">${humTag}</span>`;
  kpiHumidityStatus.textContent = diag.humidityStatus;

  kpiOxygen.textContent = `${last.oxygen.toFixed(1)} %`;
  kpiOxygenStatus.textContent = diag.oxygenStatus;

  agroRecommendation.innerHTML = diag.recommendation;

  // Renderizar Alertas Avanzadas
  advancedAlertsContainer.innerHTML = "";
  if (audit.alerts.length > 0) {
    audit.alerts.forEach(alert => {
      const div = document.createElement("div");
      let styleClass = "bg-amber-50 border-amber-300 text-amber-900";
      let iconClass = "fa-triangle-exclamation text-amber-600";

      if (alert.type === "danger") {
        styleClass = "bg-red-50 border-red-300 text-red-900";
        iconClass = "fa-radiation text-red-600";
      } else if (alert.type === "success") {
        styleClass = "bg-emerald-50 border-emerald-300 text-emerald-900";
        iconClass = "fa-circle-check text-emerald-600";
      }

      div.className = `p-3 rounded-xl border ${styleClass} text-xs leading-relaxed`;
      div.innerHTML = `
        <div class="font-bold flex items-center gap-1.5 mb-1 text-xs">
          <i class="fa-solid ${iconClass}"></i> ${alert.title}
        </div>
        <div>${alert.description}</div>
      `;
      advancedAlertsContainer.appendChild(div);
    });
  }
}

function renderTable() {
  monitoringTableBody.innerHTML = "";

  if (compostRecords.length === 0) {
    monitoringTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-8 text-stone-400 text-xs italic">
          No hay puntos de monitoreo. Agregue uno nuevo o cargue un archivo CSV.
        </td>
      </tr>
    `;
    return;
  }

  const reversed = [...compostRecords].reverse();

  reversed.forEach(item => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-amber-50/40 transition-colors";

    let humLabel = `${item.humidityValue}%`;
    if (item.humidityMethod === "fist" && item.fistTestType) {
      humLabel += ` <span class="text-[10px] text-amber-700 font-semibold" title="Prueba del puño">✊</span>`;
    }

    tr.innerHTML = `
      <td class="py-2.5 px-3 font-bold text-stone-800 whitespace-nowrap">${item.timeUnitType} ${item.timeUnitValue}</td>
      <td class="py-2.5 px-3 text-stone-500 whitespace-nowrap">${item.date}</td>
      <td class="py-2.5 px-3 font-medium text-stone-700 whitespace-nowrap truncate max-w-[130px]" title="${escapeHtml(item.operator)}">
        <i class="fa-regular fa-user text-[10px] text-stone-400 mr-1"></i>${escapeHtml(item.operator)}
      </td>
      <td class="py-2.5 px-3 font-bold text-amber-900">${item.temperature.toFixed(1)}°C</td>
      <td class="py-2.5 px-3 text-blue-900 font-medium">${humLabel}</td>
      <td class="py-2.5 px-3 text-sky-900 font-medium">${item.oxygen.toFixed(1)}%</td>
      <td class="py-2.5 px-3">
        <span class="inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${getPhaseTagColor(item.phase)}">
          ${item.phase.replace("Fase ", "")}
        </span>
      </td>
      <td class="py-2.5 px-2 text-center no-print">
        <button onclick="deleteRecord('${item.id}')" class="text-stone-400 hover:text-red-600 transition p-1 cursor-pointer" title="Eliminar registro">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </td>
    `;
    monitoringTableBody.appendChild(tr);
  });
}

function getPhaseTagColor(phase) {
  if (phase.includes("Termófila")) return "bg-red-100 text-red-700 border border-red-200";
  if (phase.includes("Enfriamiento")) return "bg-blue-100 text-blue-700 border border-blue-200";
  if (phase.includes("Maduración")) return "bg-emerald-100 text-emerald-800 border border-emerald-200";
  return "bg-amber-100 text-amber-800 border border-amber-200";
}

window.deleteRecord = function(id) {
  compostRecords = compostRecords.filter(r => r.id !== id);
  refreshAll();
  showToast("Registro eliminado.", "info");
};

function clearAllData() {
  if (compostRecords.length === 0) return;
  compostRecords = [];
  refreshAll();
  calculateNextTimeValue();
  showToast("Se han reiniciado los registros de la pila.", "info");
}

// --- CONFIGURACIÓN DE CHART.JS ---
function initChart() {
  const ctx = document.getElementById("compostChart").getContext("2d");

  compostChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperatura (°C)",
          data: [],
          borderColor: "#d97706",
          backgroundColor: "rgba(217, 119, 6, 0.12)",
          borderWidth: 3,
          pointBackgroundColor: "#b45309",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35,
          fill: true,
          yAxisID: "y"
        },
        {
          label: "Humedad (%)",
          data: [],
          borderColor: "#0284c7",
          backgroundColor: "transparent",
          borderWidth: 2,
          borderDash: [5, 4],
          pointBackgroundColor: "#0369a1",
          pointRadius: 4,
          tension: 0.25,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500
      },
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1c1917",
          titleFont: { size: 12, weight: "bold" },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            afterBody: function(context) {
              const idx = context[0].dataIndex;
              const it = compostRecords[idx];
              if (!it) return "";
              let str = `\nFase: ${it.phase}\nOxígeno: ${it.oxygen}%\nTécnico: ${it.operator}`;
              if (it.notes) str += `\nObs: ${it.notes.substring(0, 40)}...`;
              return str;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: "#e7e5e4" },
          ticks: { font: { size: 11 }, color: "#57534e" }
        },
        y: {
          type: "linear",
          position: "left",
          min: 0,
          max: 85,
          title: {
            display: true,
            text: "Temperatura (°C)",
            color: "#b45309",
            font: { weight: "bold", size: 11 }
          },
          grid: { color: "#f5f5f4" }
        },
        y1: {
          type: "linear",
          position: "right",
          min: 0,
          max: 100,
          title: {
            display: true,
            text: "Humedad (%)",
            color: "#0369a1",
            font: { weight: "bold", size: 11 }
          },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

function updateChartData() {
  if (!compostChart) return;
  const labels = compostRecords.map(r => `${r.timeUnitType} ${r.timeUnitValue}`);
  const tempData = compostRecords.map(r => r.temperature);
  const humData = compostRecords.map(r => r.humidityValue);

  compostChart.data.labels = labels;
  compostChart.data.datasets[0].data = tempData;
  compostChart.data.datasets[1].data = humData;
  compostChart.update();
}

// --- GENERACIÓN DE INFORME TÉCNICO EN PDF ---
function generatePDFReport() {
  if (compostRecords.length === 0) {
    showToast("No hay registros en la pila para exportar a PDF.", "warning");
    return;
  }

  showToast("Compilando y estructurando reporte PDF...", "info");

  // 1. Llenar los datos del reporte en el contenedor invisible
  const last = compostRecords[compostRecords.length - 1];
  const audit = runAgronomicAudit(compostRecords);
  const diag = generateDiagnosis(last, compostRecords.slice(0, -1));

  document.getElementById("pdfGenerationDate").textContent = new Date().toLocaleDateString("es-ES", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
  document.getElementById("pdfOperatorName").textContent = last.operator || "Técnico de Campo";
  document.getElementById("pdfSignatureOperator").textContent = last.operator || "Técnico Evaluador";
  document.getElementById("pdfCurrentPhase").textContent = last.phase;
  document.getElementById("pdfTotalDays").textContent = `${last.timeUnitType} ${last.timeUnitValue} (${compostRecords.length} evaluaciones registradas)`;
  document.getElementById("pdfDiagnosisText").innerHTML = diag.recommendation;

  // Llenar Alertas en PDF
  const pdfAlertsSection = document.getElementById("pdfAlertsSection");
  pdfAlertsSection.innerHTML = "";
  if (audit.alerts.length > 0) {
    audit.alerts.forEach(al => {
      const b = document.createElement("div");
      b.className = "p-2.5 rounded-lg border text-[11px] " + (al.type === "danger" ? "bg-red-50 border-red-200 text-red-900" : (al.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"));
      b.innerHTML = `<strong>${al.title}</strong>: ${al.description}`;
      pdfAlertsSection.appendChild(b);
    });
  }

  // Convertir el canvas del Chart a imagen base64
  const chartImg = document.getElementById("pdfChartImage");
  chartImg.src = compostChart.toBase64Image("image/png", 1);

  // Llenar tabla en PDF
  const pdfTableBody = document.getElementById("pdfTableBody");
  pdfTableBody.innerHTML = "";
  compostRecords.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-1.5 border border-stone-300 font-bold">${r.timeUnitType} ${r.timeUnitValue}</td>
      <td class="p-1.5 border border-stone-300">${r.date}</td>
      <td class="p-1.5 border border-stone-300">${escapeHtml(r.operator)}</td>
      <td class="p-1.5 border border-stone-300 font-bold">${r.temperature.toFixed(1)}°C</td>
      <td class="p-1.5 border border-stone-300">${r.humidityValue}% ${r.humidityMethod === 'fist' ? '(Puño)' : '(Sensor)'}</td>
      <td class="p-1.5 border border-stone-300">${r.oxygen.toFixed(1)}%</td>
      <td class="p-1.5 border border-stone-300">${r.phase}</td>
      <td class="p-1.5 border border-stone-300">${escapeHtml(r.notes || '-')}</td>
    `;
    pdfTableBody.appendChild(tr);
  });

  // Configuración de html2pdf
  const element = document.getElementById("pdfReportContent");
  const wrapper = document.getElementById("pdfReportWrapper");
  wrapper.classList.remove("hidden");

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `Informe_Compost_${last.operator.replace(/\s+/g, '_')}_${last.date}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    wrapper.classList.add("hidden");
    showToast("¡Informe PDF descargado con éxito!", "success");
  }).catch(err => {
    console.error(err);
    wrapper.classList.add("hidden");
    showToast("Error al generar el archivo PDF.", "error");
  });
}

// --- EXPORTACIÓN CSV ---
function exportToCSV() {
  if (compostRecords.length === 0) {
    showToast("No hay registros para exportar.", "warning");
    return;
  }

  const headers = [
    "ID",
    "Tipo_Intervalo",
    "Valor_Tiempo",
    "Fecha",
    "Tecnico_Operador",
    "Temperatura_C",
    "Metodo_Humedad",
    "Humedad_Pct",
    "Tipo_Prueba_Puno",
    "Oxigeno_Pct",
    "Fase_Biologica",
    "Observaciones_Campo",
    "Consultor_Responsable"
  ];

  const csvRows = [headers.join(",")];

  compostRecords.forEach(r => {
    const safeNotes = `"${(r.notes || '').replace(/"/g, '""')}"`;
    const safeOp = `"${(r.operator || '').replace(/"/g, '""')}"`;
    const row = [
      r.id,
      r.timeUnitType,
      r.timeUnitValue,
      r.date,
      safeOp,
      r.temperature,
      r.humidityMethod,
      r.humidityValue,
      r.fistTestType || "",
      r.oxygen,
      `"${r.phase}"`,
      safeNotes,
      `"Ing. Juan L. Cueto Tilano"`
    ];
    csvRows.push(row.join(","));
  });

  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];

  link.setAttribute("href", url);
  link.setAttribute("download", `Compost_Auditoria_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("Archivo CSV exportado exitosamente.", "success");
}

function handleCsvImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    parseAndLoadCsv(event.target.result);
    csvFileInput.value = "";
  };
  reader.readAsText(file, "UTF-8");
}

function parseAndLoadCsv(csvText) {
  try {
    const lines = csvText.split(/\r\n|\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      showToast("El archivo CSV no contiene registros suficientes.", "error");
      return;
    }

    const separator = lines[0].includes(";") ? ";" : ",";
    const newRecords = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvRow(lines[i], separator);
      if (row.length < 6) continue;

      const timeUnitType = row[1] || "Día";
      const timeUnitValue = parseInt(row[2], 10) || i;
      const date = row[3] || new Date().toISOString().split("T")[0];
      const operator = row[4] || "Técnico de Campo";
      const temperature = parseFloat(row[5]) || 25.0;
      const humidityMethod = row[6] || "fist";
      const humidityValue = parseFloat(row[7]) || 55.0;
      const fistTestType = row[8] || (humidityMethod === "fist" ? "optima" : null);
      const oxygen = parseFloat(row[9]) || 12.0;
      const phase = row[10] || evaluateCompostPhase(temperature, newRecords);
      const notes = row[11] || "";

      newRecords.push({
        id: Date.now() + "_" + i,
        timeUnitType,
        timeUnitValue,
        date,
        operator,
        temperature,
        humidityMethod,
        humidityValue,
        fistTestType,
        oxygen,
        phase,
        notes
      });
    }

    if (newRecords.length === 0) {
      showToast("No se encontraron filas con estructura válida.", "warning");
      return;
    }

compostRecords = newRecords;
        sortRecordsChronologically();
        refreshAll();
        applyAutoTimeValue();

    if (compostRecords.length > 0) {
      operatorNameInput.value = compostRecords[compostRecords.length - 1].operator;
    }

    showToast(`Se cargaron ${newRecords.length} registros y se recalculó la auditoría biológica.`, "success");
  } catch (err) {
    console.error(err);
    showToast("Error al importar el archivo CSV.", "error");
  }
}

function parseCsvRow(text, delimiter) {
  const pattern = new RegExp(
    (
      "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
      "([^\"\\" + delimiter + "\\r\\n]*))"
    ), "gi"
  );

  const row = [];
  let matches = null;

  while (matches = pattern.exec(text)) {
    const matchedDelimiter = matches[1];
    if (matchedDelimiter.length && matchedDelimiter !== delimiter) {}
    let val;
    if (matches[2]) {
      val = matches[2].replace(new RegExp("\"\"", "g"), "\"");
    } else {
      val = matches[3];
    }
    row.push(val);
  }
  return row;
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");

  let bg = "bg-stone-800 text-white border-stone-700";
  let icon = "fa-info-circle text-blue-400";

  if (type === "success") {
    bg = "bg-emerald-900 text-emerald-100 border-emerald-700";
    icon = "fa-circle-check text-emerald-400";
  } else if (type === "error") {
    bg = "bg-red-900 text-red-100 border-red-700";
    icon = "fa-triangle-exclamation text-red-400";
  } else if (type === "warning") {
    bg = "bg-amber-900 text-amber-100 border-amber-700";
    icon = "fa-exclamation-circle text-amber-400";
  }

  toast.className = `${bg} pointer-events-auto border px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-medium transition-all duration-300 transform translate-x-10 opacity-0 max-w-md`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-lg shrink-0"></i>
    <div class="flex-1">${message}</div>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("translate-x-10", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("translate-x-10", "opacity-0");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}