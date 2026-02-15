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
const togglePlaceModeButton = document.getElementById("togglePlaceMode");
const trail = document.getElementById("trail");
const trailPath = document.getElementById("trailPath");
const mapFrame = document.getElementById("mapFrame");
const baseMap = document.getElementById("baseMap");
const placementPanel = document.getElementById("placementPanel");
const placementSelect = document.getElementById("placementSelect");
const copyPlacementDataButton = document.getElementById("copyPlacementData");
const donePlacementButton = document.getElementById("donePlacement");

const placeModeEnabledByQuery = new URLSearchParams(window.location.search).get("place") === "1";

const defaultTrailPoints = [
  [0.26, 58.1],
  [2.45, 57.24],
  [5.07, 57.37],
  [7.43, 58.47],
  [10.31, 60.8],
  [13.9, 64.6],
  [19.67, 70.97],
  [24.83, 74.65],
  [28.85, 75.14],
  [33.48, 74.53],
  [39.42, 72.2],
  [45.54, 69.99],
  [49.91, 67.91],
  [54.11, 64.6],
  [59.09, 60.68],
  [62.67, 57.98],
  [66.43, 53.93],
  [69.93, 48.42],
  [73.25, 39.96],
  [75.7, 34.81],
  [78.58, 29.78],
  [81.56, 27.94],
  [86.54, 26.59],
  [90.12, 25.24],
  [92.83, 25.12],
  [99.83, 25.12]
];

let trailPoints = [...defaultTrailPoints];
let activeId = null;
let mediaPoints = [];
let isPlaceModeActive = false;

function formatType(type) {
  return type === "video" ? "Video" : "Photo";
}

function rounded(value) {
  return Number(value.toFixed(2));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
    if (point.poster) {
      mediaNode.poster = point.poster;
    }
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

function renderPoints() {
  pointLayer.replaceChildren();
  pointList.replaceChildren();

  mediaPoints.forEach((point) => {
    const button = pointButtonTemplate.content.firstElementChild.cloneNode(true);
    button.dataset.id = point.id;
    button.style.left = `${point.x}%`;
    button.style.top = `${point.y}%`;
    button.querySelector(".point-label").textContent = point.shortLabel;
    button.addEventListener("click", () => {
      if (!isPlaceModeActive) {
        openViewer(point);
      }
    });
    if (isPlaceModeActive && placementSelect.value === point.id) {
      button.classList.add("placement-active");
    }
    pointLayer.appendChild(button);

    const listItem = listItemTemplate.content.firstElementChild.cloneNode(true);
    listItem.querySelector(".stop-title").textContent = point.title;
    listItem.querySelector(".stop-meta").textContent = `${point.date} • ${formatType(point.type)} • x:${point.x} y:${point.y}`;
    listItem.addEventListener("click", () => {
      openViewer(point);
      button.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    });
    pointList.appendChild(listItem);
  });
}

function renderPlacementOptions() {
  placementSelect.replaceChildren();
  mediaPoints.forEach((point) => {
    const option = document.createElement("option");
    option.value = point.id;
    option.textContent = `${point.title} (${point.src.split("/").pop()})`;
    placementSelect.appendChild(option);
  });
}

function setPlaceMode(active) {
  isPlaceModeActive = active;
  placementPanel.hidden = !active;
  mapFrame.classList.toggle("placing", active);
  togglePlaceModeButton.textContent = active ? "Placing..." : "Place Media";
  togglePlaceModeButton.setAttribute("aria-pressed", String(active));
  renderPoints();
}

function selectedPoint() {
  const targetId = placementSelect.value;
  return mediaPoints.find((point) => point.id === targetId) || null;
}

function placeSelectedPoint(event) {
  const point = selectedPoint();
  if (!point) {
    return;
  }

  const rect = baseMap.getBoundingClientRect();
  const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
  const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
  point.x = rounded(x);
  point.y = rounded(y);
  renderPoints();
}

async function copyPlacementData() {
  const payload = mediaPoints.map((point) => ({
    id: point.id,
    src: point.src,
    x: point.x,
    y: point.y
  }));
  try {
    await navigator.clipboard.writeText(JSON.stringify(payload));
    copyPlacementDataButton.textContent = "Copied";
  } catch {
    copyPlacementDataButton.textContent = "Copy Failed";
  }
  setTimeout(() => {
    copyPlacementDataButton.textContent = "Copy Placement JSON";
  }, 1100);
}

async function init() {
  renderTrail();

  if (placeModeEnabledByQuery) {
    togglePlaceModeButton.hidden = false;
  }

  const response = await fetch("data/media.json");
  mediaPoints = await response.json();
  renderPlacementOptions();
  renderPoints();
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

togglePlaceModeButton.addEventListener("click", () => {
  setPlaceMode(!isPlaceModeActive);
});

donePlacementButton.addEventListener("click", () => {
  setPlaceMode(false);
});

placementSelect.addEventListener("change", () => {
  renderPoints();
});

copyPlacementDataButton.addEventListener("click", copyPlacementData);

mapFrame.addEventListener("click", (event) => {
  if (!isPlaceModeActive) {
    return;
  }

  if (placementPanel.contains(event.target)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  placeSelectedPoint(event);
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
