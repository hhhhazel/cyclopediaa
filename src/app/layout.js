"use client";
import "./globals.css";
import WikiLogoCarousel from "../components/WikiLogoCarousel";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { releaseIntoField } from "../../lib/field/releaseIntoField";
import { useEffect, useRef, useState } from "react";
import CybercloneTest from "../components/Test";
import SiteCursor from "../components/SiteCursor";
import {
  performSiteSearch,
  updateSiteSearchPlaceholder,
} from "../../lib/search/performSiteSearch";

const HEADER_OFFSET_PATHS = ["/field", "/gallery", "/meme"];

function needsHeaderOffset(pathname) {
  if (!pathname) {
    return false;
  }

  return HEADER_OFFSET_PATHS.some(function (path) {
    return pathname === path || pathname.startsWith(path + "/");
  });
}

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showTest, setShowTest] = useState(false);
  const searchInputRef = useRef(null);
  const mainClassName = needsHeaderOffset(pathname)
    ? "site-main-below-header"
    : undefined;

  useEffect(function () {
    updateSiteSearchPlaceholder(pathname, searchInputRef.current);
  }, [pathname]);

  function handleWikiSearchSubmit(event) {
    event.preventDefault();

    const input = searchInputRef.current;
    const query = input?.value || "";

    performSiteSearch(query, {
      pathname,
      router,
      searchInput: input,
    });
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
         {/* 全站搜索顶栏：搜索框 + Donate 等（不含 Recall clones） */}
    <header className="site-global-header wiki-vector-header z-[9999]" id="siteGlobalHeader">
      <div className="wiki-vector-header-inner">
        <Link href="/" className="wiki-logo-slot site-ui-glow">
          <WikiLogoCarousel />
        </Link>

        <form
          className="wiki-search-form"
          id="wikiSearchForm"
          action="#"
          method="get"
          onSubmit={handleWikiSearchSubmit}
        >
          <input
            ref={searchInputRef}
            className="wiki-search-input"
            id="wikiSearchInput"
            type="search"
            name="search"
            placeholder="Search Cyclopedia"
            aria-label="Search Cyclopedia"
          />
          <button className="wiki-search-button" type="submit">Search</button>
        </form>

        <nav className="wiki-header-links" aria-label="Personal tools">
          <a href="#" className="site-ui-glow" onClick={() => setShowTest(true)}>Test</a>
          <Link href="/field" className="site-ui-glow">Field</Link>
          <Link href="/meme" className="site-ui-glow">MemesEditor</Link>
          <Link href="/gallery" className="site-ui-glow">Gallery</Link>
        </nav>
      </div>
    </header>

    {showTest && (
        <CybercloneTest
          onReleaseIntoField={async(result) => {
            await releaseIntoField(result);  // Level > 0 写入 Supabase
            setShowTest(false);
            router.push("/field");   
          }}
        />
      )}
        <div className={mainClassName}>{children}</div>
        <SiteCursor />
      </body>
    </html>
  );
}
