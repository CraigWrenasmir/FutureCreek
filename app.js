const pointLayer = document.getElementById("pointLayer");
const pointList = document.getElementById("pointList");
const viewer = document.getElementById("viewer");
const viewerMedia = document.getElementById("viewerMedia");
const viewerTitle = document.getElementById("viewerTitle");
const viewerCaption = document.getElementById("viewerCaption");
const viewerDate = document.getElementById("viewerDate");
const pointButtonTemplate = document.getElementById("pointButtonTemplate");
const listItemTemplate = document.getElementById("listItemTemplate");
const closeViewerButton = document.getElementById("closeViewer");
const toggleTrailButton = document.getElementById("toggleTrail");
const calibrateTrailButton = document.getElementById("calibrateTrail");
const trail = document.getElementById("trail");
const trailPath = document.getElementById("trailPath");
const trailGuide = document.getElementById("trailGuide");
const mapFrame = document.getElementById("mapFrame");
const baseMap = document.getElementById("baseMap");
const calibrationPanel = document.getElementById("calibrationPanel");
const undoTrailPointButton = document.getElementById("undoTrailPoint");
const clearTrailPointsButton = document.getElementById("clearTrailPoints");
const copyTrailDataButton = document.getElementById("copyTrailData");
const doneCalibratingButton = document.getElementById("doneCalibrating");

const defaultTrailPoints = [
  [4.5, 75.0],
  [10.8, 79.2],
  [18.5, 82.3],
  [27.4, 83.1],
  [36.0, 80.4],
  [45.0, 75.2],
  [54.3, 69.8],
  [62.5, 63.6],
  [69.4, 55.1],
  [74.8, 46.6],
  [79.2, 38.7],
  [83.2, 30.7],
  [87.6, 24.0],
  [92.4, 20.2],
  [98.3, 19.2]
];

let trailPoints = loadTrailPoints();
let isCalibratingTrail = false;
let activeId = null;

function loadTrailPoints() {
  try {
    const stored = localStorage.getItem("futurecreek_trail_points");
    if (!stored) {
      return [...defaultTrailPoints];
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length < 2) {
      return [...defaultTrailPoints];
    }
    return parsed;
  } catch {
    return [...defaultTrailPoints];
  }
}

function saveTrailPoints() {
  localStorage.setItem("futurecreek_trail_points", JSON.stringify(trailPoints));
}

function formatType(type) {
  return type === "video" ? "Video" : "Photo";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rounded(value) {
  return Number(value.toFixed(2));
}

function pointsToPath(points) {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    return `M${points[0][0]},${points[0][1]}`;
  }

  let path = `M${points[0][0]},${points[0][1]}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    path += ` C${rounded(cp1x)},${rounded(cp1y)} ${rounded(cp2x)},${rounded(cp2y)} ${p2[0]},${p2[1]}`;
  }

  return path;
}

function renderTrail() {
  trailPath.setAttribute("d", pointsToPath(trailPoints));
  trailGuide.replaceChildren();

  if (!isCalibratingTrail) {
    return;
  }

  trailPoints.forEach(([x, y]) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", x);
    dot.setAttribute("cy", y);
    dot.setAttribute("r", "0.55");
    dot.setAttribute("class", "trail-guide-dot");
    trailGuide.appendChild(dot);
  });
}

function clearActive() {
  document.querySelectorAll(".point.active").forEach((node) => {
    node.classList.remove("active");
  });
}

function setActive(id) {
  activeId = id;
  clearActive();
  const activePoint = document.querySelector(`.point[data-id='${id}']`);
  if (activePoint) {
    activePoint.classList.add("active");
  }
}

function openViewer(point) {
  setActive(point.id);
  viewerMedia.replaceChildren();

  let mediaNode;
  if (point.type === "video") {
    mediaNode = document.createElement("video");
    mediaNode.src = point.src;
    mediaNode.controls = true;
    mediaNode.preload = "metadata";
  } else {
    mediaNode = document.createElement("img");
    mediaNode.src = point.src;
    mediaNode.alt = point.title;
    mediaNode.loading = "lazy";
  }

  viewerMedia.appendChild(mediaNode);
  viewerTitle.textContent = point.title;
  viewerCaption.textContent = point.caption;
  viewerDate.textContent = `${point.date} • ${formatType(point.type)}`;

  if (typeof viewer.showModal === "function") {
    viewer.showModal();
  } else {
    viewer.setAttribute("open", "open");
  }
}

function renderPoint(point) {
  const button = pointButtonTemplate.content.firstElementChild.cloneNode(true);
  button.dataset.id = point.id;
  button.style.left = `${point.x}%`;
  button.style.top = `${point.y}%`;
  button.querySelector(".point-label").textContent = point.shortLabel;
  button.addEventListener("click", () => openViewer(point));
  pointLayer.appendChild(button);

  const listItem = listItemTemplate.content.firstElementChild.cloneNode(true);
  listItem.querySelector(".stop-title").textContent = point.title;
  listItem.querySelector(".stop-meta").textContent = `${point.date} • ${formatType(point.type)}`;
  listItem.addEventListener("click", () => {
    openViewer(point);
    button.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  });
  pointList.appendChild(listItem);
}

function toggleCalibration(enabled) {
  isCalibratingTrail = enabled;
  calibrateTrailButton.setAttribute("aria-pressed", String(enabled));
  calibrateTrailButton.textContent = enabled ? "Calibrating..." : "Calibrate Trail";
  calibrationPanel.hidden = !enabled;
  renderTrail();
}

function addTrailPointFromEvent(event) {
  const rect = baseMap.getBoundingClientRect();
  const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
  const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
  trailPoints.push([rounded(x), rounded(y)]);
  saveTrailPoints();
  renderTrail();
}

async function copyTrailData() {
  const json = JSON.stringify(trailPoints);
  try {
    await navigator.clipboard.writeText(json);
    copyTrailDataButton.textContent = "Copied";
    setTimeout(() => {
      copyTrailDataButton.textContent = "Copy Path Data";
    }, 1100);
  } catch {
    copyTrailDataButton.textContent = "Copy Failed";
    setTimeout(() => {
      copyTrailDataButton.textContent = "Copy Path Data";
    }, 1100);
  }
}

async function init() {
  renderTrail();
  const response = await fetch("data/media.json");
  const points = await response.json();
  points.forEach(renderPoint);
}

closeViewerButton.addEventListener("click", () => {
  if (typeof viewer.close === "function") {
    viewer.close();
  } else {
    viewer.removeAttribute("open");
  }
});

toggleTrailButton.addEventListener("click", () => {
  const isHidden = trail.hasAttribute("hidden");
  if (isHidden) {
    trail.removeAttribute("hidden");
  } else {
    trail.setAttribute("hidden", "hidden");
  }
  const nowHidden = !isHidden;
  toggleTrailButton.setAttribute("aria-pressed", String(!nowHidden));
  toggleTrailButton.textContent = nowHidden ? "Show Trail" : "Hide Trail";
});

calibrateTrailButton.addEventListener("click", () => {
  toggleCalibration(!isCalibratingTrail);
});

doneCalibratingButton.addEventListener("click", () => {
  toggleCalibration(false);
});

undoTrailPointButton.addEventListener("click", () => {
  if (!trailPoints.length) {
    return;
  }
  trailPoints.pop();
  saveTrailPoints();
  renderTrail();
});

clearTrailPointsButton.addEventListener("click", () => {
  trailPoints = [];
  saveTrailPoints();
  renderTrail();
});

copyTrailDataButton.addEventListener("click", copyTrailData);

mapFrame.addEventListener("click", (event) => {
  if (!isCalibratingTrail) {
    return;
  }

  // Only map-surface clicks should add points.
  const clickedOnMapSurface =
    event.target === baseMap ||
    event.target === trail ||
    event.target === trailPath ||
    trailGuide.contains(event.target);

  if (!clickedOnMapSurface) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  addTrailPointFromEvent(event);
});

viewer.addEventListener("click", (event) => {
  const rect = viewer.getBoundingClientRect();
  const clickedOutside =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;
  if (clickedOutside && typeof viewer.close === "function") {
    viewer.close();
  }
});

init().catch(() => {
  pointList.innerHTML = "<p>Could not load map points.</p>";
});
