export const setFavicon = (url: string) => {
  const link = document.querySelector("link[rel~='icon']");
  if (link) {
    link.setAttribute("href", url);
  }
  localStorage.setItem("favicon", url);
};
