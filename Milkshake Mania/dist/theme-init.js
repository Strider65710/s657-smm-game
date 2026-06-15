/* Applies the saved theme before first paint to avoid a flash.
   Loaded as a blocking script in <head> on every page. */
if (localStorage.getItem("smm-theme") === "light") {
  document.documentElement.classList.add("theme-light");
}
