// Tidepool – Part 3: loading, empty and error states on top of the Part 2 search.

const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const clearBtn = document.getElementById("clear-btn");
const results = document.getElementById("results");
const resultCount = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyText = document.getElementById("empty-text");
const chips = document.querySelectorAll(".chip");

const API = "https://commons.wikimedia.org/w/api.php";
const SKELETON_COUNT = 8;

// Each search gets a number so a slow, older search can't overwrite a newer one.
let latestSearch = 0;

// "File:Red_fox_(Vulpes_vulpes).jpg" -> "Red fox (Vulpes vulpes)"
function cleanTitle(raw) {
  return raw.replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ").trim();
}

// The API returns the author as an HTML snippet; keep only its text.
function plainText(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent.trim();
}

function buildUrl(query) {
  const params =
    "action=query&format=json&origin=*" +
    "&generator=search&gsrnamespace=6&gsrlimit=24" +
    "&gsrsearch=" + encodeURIComponent(query + " filetype:bitmap") +
    "&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=480";
  return API + "?" + params;
}

function createCard(page) {
  const info = page.imageinfo[0];
  const title = cleanTitle(page.title);
  const meta = info.extmetadata || {};
  const author = meta.Artist ? plainText(meta.Artist.value) : "";

  // The whole card links to the full-size image in a new tab.
  const card = document.createElement("a");
  card.className = "card";
  card.href = info.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const img = document.createElement("img");
  img.src = info.thumburl || info.url;
  img.alt = title;
  img.loading = "lazy";

  const caption = document.createElement("div");
  caption.className = "card-body";

  const name = document.createElement("p");
  name.className = "card-title";
  name.textContent = title;

  const by = document.createElement("p");
  by.className = "card-author";
  by.textContent = author ? "By " + author : "Author unknown";

  caption.appendChild(name);
  caption.appendChild(by);
  card.appendChild(img);
  card.appendChild(caption);
  return card;
}

// Grey placeholder cards shown while the request is in flight.
function createSkeleton() {
  const card = document.createElement("div");
  card.className = "skeleton";
  card.setAttribute("aria-hidden", "true");

  const pic = document.createElement("div");
  pic.className = "sk-pic";
  const line1 = document.createElement("div");
  line1.className = "sk-line";
  const line2 = document.createElement("div");
  line2.className = "sk-line sk-short";

  card.appendChild(pic);
  card.appendChild(line1);
  card.appendChild(line2);
  return card;
}

function showMessage(title, text, isError) {
  emptyTitle.textContent = title;
  emptyText.textContent = text;
  emptyState.classList.toggle("is-error", Boolean(isError));
  emptyState.hidden = false;
}

function setLoading(query) {
  results.innerHTML = "";
  emptyState.hidden = true;
  resultCount.textContent = 'Searching for "' + query + '"…';
  results.setAttribute("aria-busy", "true");
  searchBtn.disabled = true;
  searchBtn.textContent = "Searching…";
  for (let i = 0; i < SKELETON_COUNT; i++) {
    results.appendChild(createSkeleton());
  }
}

function stopLoading() {
  results.removeAttribute("aria-busy");
  searchBtn.disabled = false;
  searchBtn.textContent = "Search";
}

async function searchImages(query) {
  const thisSearch = ++latestSearch;
  setLoading(query); // loading indicator appears before fetch starts

  try {
    const response = await fetch(buildUrl(query));
    if (!response.ok) {
      throw new Error("Request failed with status " + response.status);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.info || "The API returned an error");
    }
    if (thisSearch !== latestSearch) return; // a newer search took over

    results.innerHTML = ""; // removes the skeletons

    // No matches means the API leaves out "query" entirely.
    const pages = data.query ? Object.values(data.query.pages) : [];
    const usable = pages
      .filter((page) => page.imageinfo && page.imageinfo.length > 0)
      .sort((a, b) => a.index - b.index);

    if (usable.length === 0) {
      resultCount.textContent = "Showing 0 results";
      showMessage(
        'No results for "' + query + '"',
        "Try another search or pick one of the quick picks.",
        false
      );
      return;
    }

    usable.forEach((page) => results.appendChild(createCard(page)));
    const n = usable.length;
    resultCount.textContent =
      "Showing " + n + (n === 1 ? " result" : " results") + ' for "' + query + '"';
  } catch (error) {
    if (thisSearch !== latestSearch) return;
    results.innerHTML = "";
    resultCount.textContent = "Showing 0 results";
    showMessage(
      "Something went wrong",
      "We couldn't load images. Check your connection and try again.",
      true
    );
  } finally {
    if (thisSearch === latestSearch) stopLoading();
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return; // blank search: do nothing
  await searchImages(query);
});

// Quick-pick chips fill the box and run a search.
chips.forEach((chip) => {
  chip.addEventListener("click", async () => {
    input.value = chip.dataset.topic;
    await searchImages(chip.dataset.topic);
  });
});

// Clear empties the box and puts the cursor back in it.
clearBtn.addEventListener("click", () => {
  input.value = "";
  input.focus();
});
