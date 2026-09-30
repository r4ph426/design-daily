export function publishedHref(route = "") {
  return `${import.meta.env.BASE_URL}#${route}`;
}

export function editorialHref(route = "") {
  const review = window.location.pathname.endsWith("/grid-prototype.html");
  return review ? `${import.meta.env.BASE_URL}grid-prototype.html#${route}` : publishedHref(route);
}
