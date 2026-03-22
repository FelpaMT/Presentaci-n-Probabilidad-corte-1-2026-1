const deck = new Reveal({
  hash: true,
  slideNumber: true,
  transition: "slide",
  backgroundTransition: "fade",
  width: 1366,
  height: 768,
  margin: 0.04,
  minScale: 0.55,
  maxScale: 1.2
});

deck.initialize();

function factorial(n) {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function poissonProbability(k, lambda) {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

function expDensity(t, lambda) {
  return lambda * Math.exp(-lambda * t);
}

const lambdaSlider = document.getElementById("lambdaSlider");
const lambdaValue = document.getElementById("lambdaValue");
const poissonMean = document.getElementById("poissonMean");
const expMean = document.getElementById("expMean");
const lambdaText = document.getElementById("lambdaText");

const poissonCtx = document.getElementById("poissonChart");
const expCtx = document.getElementById("expChart");

const poissonLabels = Array.from({ length: 11 }, (_, i) => i);
const expLabels = Array.from({ length: 41 }, (_, i) => (i * 0.1).toFixed(1));

let currentLambda = parseFloat(lambdaSlider.value);

const poissonChart = new Chart(poissonCtx, {
  type: "bar",
  data: {
    labels: poissonLabels,
    datasets: [{
      label: "P(X = k)",
      data: poissonLabels.map(k => poissonProbability(k, currentLambda)),
      backgroundColor: "rgba(53, 92, 222, 0.65)",
      borderColor: "rgba(53, 92, 222, 1)",
      borderWidth: 1.5,
      borderRadius: 6
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

const expChart = new Chart(expCtx, {
  type: "line",
  data: {
    labels: expLabels,
    datasets: [{
      label: "f(t)",
      data: expLabels.map(t => expDensity(parseFloat(t), currentLambda)),
      borderColor: "rgba(123, 97, 255, 1)",
      backgroundColor: "rgba(123, 97, 255, 0.18)",
      fill: true,
      tension: 0.3,
      pointRadius: 0
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

function updateLambdaText(lambda) {
  if (lambda < 2) {
    return `Cuando λ = ${lambda}, la tasa de ocurrencia es baja: se esperan pocos eventos y el tiempo promedio de espera es relativamente alto.`;
  } else if (lambda < 5) {
    return `Cuando λ = ${lambda}, el proceso tiene una intensidad moderada: aumenta el número esperado de eventos y disminuye el tiempo promedio de espera.`;
  } else {
    return `Cuando λ = ${lambda}, la tasa de ocurrencia es alta: se esperan muchos eventos por unidad de tiempo y la espera media se hace mucho más corta.`;
  }
}

function updateCharts(lambda) {
  lambdaValue.textContent = lambda;
  poissonMean.textContent = lambda.toFixed(2);
  expMean.textContent = (1 / lambda).toFixed(2);
  lambdaText.textContent = updateLambdaText(lambda);

  poissonChart.data.datasets[0].data = poissonLabels.map(k => poissonProbability(k, lambda));
  poissonChart.update();

  expChart.data.datasets[0].data = expLabels.map(t => expDensity(parseFloat(t), lambda));
  expChart.update();
}

lambdaSlider.addEventListener("input", (e) => {
  const lambda = parseFloat(e.target.value);
  updateCharts(lambda);
});

/* =========================
   SIMULACION PROCESO POISSON
========================= */

function exponentialSample(lambda) {
  return -Math.log(1 - Math.random()) / lambda;
}

const simLambdaSlider = document.getElementById("simLambdaSlider");
const simLambdaValue = document.getElementById("simLambdaValue");
const generateEventsBtn = document.getElementById("generateEventsBtn");
const simTimeline = document.getElementById("simTimeline");
const eventCount = document.getElementById("eventCount");
const interarrivalTimes = document.getElementById("interarrivalTimes");

const SIM_INTERVAL_MAX = 10;
const SIM_MAX_RENDERED_EVENTS = 14;

function clearSimulation() {
  const oldEvents = simTimeline.querySelectorAll(".sim-event");
  oldEvents.forEach(el => el.remove());
}

function generatePoissonProcess(lambda, maxTime = 10) {
  let t = 0;
  const arrivals = [];
  const gaps = [];

  while (true) {
    const gap = exponentialSample(lambda);
    if (t + gap > maxTime) break;
    t += gap;
    arrivals.push(t);
    gaps.push(gap);
  }

  return { arrivals, gaps };
}

function formatGaps(gaps) {
  if (gaps.length === 0) {
    return "No ocurrieron eventos en el intervalo observado.";
  }

  const shown = gaps.slice(0, 10).map(v => v.toFixed(2)).join(" , ");
  if (gaps.length > 10) {
    return `${shown} ...`;
  }
  return shown;
}

function sampleArrivalsForRendering(arrivals, maxShown) {
  if (arrivals.length <= maxShown) return arrivals;

  const sampled = [];
  const step = (arrivals.length - 1) / (maxShown - 1);

  for (let i = 0; i < maxShown; i++) {
    const idx = Math.round(i * step);
    sampled.push(arrivals[idx]);
  }

  return sampled;
}

function renderSimulation(arrivals, gaps) {
  clearSimulation();

  const tooltip = document.getElementById("simTooltip");
  const legend = document.getElementById("simLegend");

  eventCount.textContent = arrivals.length;
  interarrivalTimes.textContent = formatGaps(gaps);

  if (legend) {
    legend.textContent = `Se visualizaron ${Math.min(arrivals.length, SIM_MAX_RENDERED_EVENTS)} de ${arrivals.length} eventos para mantener claridad.`;
  }

  if (arrivals.length === 0) {
    if (legend) legend.textContent = "No ocurrieron eventos en el intervalo observado.";
    return;
  }

  const arrivalsToShow = sampleArrivalsForRendering(arrivals, SIM_MAX_RENDERED_EVENTS);

  arrivalsToShow.forEach((time, index) => {
    const position = 4 + (time / SIM_INTERVAL_MAX) * 92;

    const point = document.createElement("div");
    point.className = "sim-event";
    point.style.left = `${position}%`;
    point.style.animationDelay = `${index * 0.06}s`;

    point.addEventListener("mouseenter", () => {
      tooltip.style.left = `${position}%`;
      tooltip.textContent = `t = ${time.toFixed(2)}`;
      tooltip.style.opacity = "1";
    });

    point.addEventListener("mouseleave", () => {
      tooltip.style.opacity = "0";
    });

    simTimeline.appendChild(point);
  });
}

function runSimulation() {
  const lambda = parseFloat(simLambdaSlider.value);
  simLambdaValue.textContent = lambda;
  const { arrivals, gaps } = generatePoissonProcess(lambda, SIM_INTERVAL_MAX);
  renderSimulation(arrivals, gaps);
}

if (simLambdaSlider && generateEventsBtn) {
  simLambdaSlider.addEventListener("input", (e) => {
    simLambdaValue.textContent = e.target.value;
  });

  generateEventsBtn.addEventListener("click", runSimulation);
}

const miniCtx = document.getElementById("miniPoissonChart");

if (miniCtx) {
  const lambdaMini = 3;
  const labelsMini = Array.from({ length: 8 }, (_, i) => i);

  const dataMini = labelsMini.map(k =>
    (Math.exp(-lambdaMini) * Math.pow(lambdaMini, k)) / factorial(k)
  );

  new Chart(miniCtx, {
    type: "bar",
    data: {
      labels: labelsMini,
      datasets: [{
        data: dataMini,
        backgroundColor: "rgba(53, 92, 222, 0.6)",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { font: { size: 10 } }
        },
        y: {
          display: false
        }
      }
    }
  });
}
const realCards = document.querySelectorAll(".real-card");
const realText = document.getElementById("realText");

realCards.forEach(card => {
  card.addEventListener("mouseenter", () => {
    const info = card.getAttribute("data-info");
    realText.textContent = info;
  });

  card.addEventListener("mouseleave", () => {
    realText.textContent = "Pasa el cursor sobre una aplicación para ver su interpretación.";
  });
});

const quizButtons = document.querySelectorAll(".quiz-btn");
const feedback = document.getElementById("quiz-feedback");

quizButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const isCorrect = btn.getAttribute("data-correct") === "true";

    if (isCorrect) {
      feedback.textContent = "Correcto. La exponencial modela el tiempo entre eventos.";
      feedback.style.color = "green";
    } else {
      feedback.textContent = "Incorrecto. Intenta nuevamente.";
      feedback.style.color = "red";
    }
  });
});

const solutionButtons = document.querySelectorAll(".solution-btn");

document.querySelectorAll(".solution-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    const solutionBox = document.getElementById(targetId);

    if (!solutionBox) return;

    const isOpen = solutionBox.classList.contains("open");
    solutionBox.classList.toggle("open");

    button.textContent = isOpen ? "Ver solución" : "Ocultar solución";
  });
});