/**
 * Next.js serves public/ at /. Use "/images/foo.gif", never "/public/images/foo.gif".
 */
export function normalizeMemeGifSrc(value) {
    if (!value) return "";
  
    let path = String(value).trim();
  
    if (/^https?:\/\//i.test(path)) {
      return path.split("?")[0];
    }
  
    path = path.split("?")[0];
  
    if (path.startsWith("/public/")) {
      path = path.slice("/public".length);
    } else if (path.startsWith("public/")) {
      path = "/" + path.slice("public".length);
    }
  
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
  
    return path;
  }
  