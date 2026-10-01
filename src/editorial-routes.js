export function publishedHref(route = "") {
  return `${import.meta.env.BASE_URL}#${route}`;
}

export function editorialHref(route = "") {
  const review = window.location.pathname.endsWith("/grid-prototype.html");
  const reading = new URLSearchParams(window.location.search).get("reading");
  const query = review && ["desk", "combined"].includes(reading) ? `?reading=${reading}` : "";
  return review ? `${import.meta.env.BASE_URL}grid-prototype.html${query}#${route}` : publishedHref(route);
}
