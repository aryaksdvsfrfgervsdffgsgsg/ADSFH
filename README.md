# Tidepool

Tidepool is a plain HTML, CSS and JavaScript image-search app: type a topic, press Search, and a responsive grid of images from Wikimedia Commons appears. I put the controls in a sticky left panel with the results beside it, so the search box and quick-pick chips stay in reach while you scroll a long grid. I chose a deep sea-teal and amber palette with an automatic light/dark switch, so it looks nothing like a default purple theme and stays readable in any lighting.

**Search:** Each card shows the image, its title and author, and links to the full-size file in a new tab. The quick-pick chips run a search when clicked, and a result line reports how many images were found.

**States:** While a search runs, grey skeleton cards and a "Searching…" line show. A search with no matches shows "No results for ...", and a failed request shows "Something went wrong" instead of a blank screen. On phones the chips become a horizontally scrolling row.

**Live:** LIVE_URL_HERE
