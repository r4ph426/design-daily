export function publishedHref(route = "") {
  return `${import.meta.env.BASE_URL}#${route}`;
}

export function editorialHref(route = "") {
  const review = window.location.pathname.endsWith("/grid-prototype.html");
  const query = review && new URLSearchParams(window.location.search).get("reading") === "desk" ? "?reading=desk" : "";
  return review ? `${import.meta.env.BASE_URL}grid-prototype.html${query}#${route}` : publishedHref(route);
}
