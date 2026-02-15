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
const trail = document.getElementById("trail");

let activeId = null;

function formatType(type) {
  return type === "video" ? "Video" : "Photo";
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

async function init() {
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
