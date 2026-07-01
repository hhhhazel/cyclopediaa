"use client";
import "./globals.css";
import WikiLogoCarousel from "../components/WikiLogoCarousel";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CybercloneTest from "../components/Test";

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
  const [showTest, setShowTest] = useState(false);
  const mainClassName = needsHeaderOffset(pathname)
    ? "site-main-below-header"
    : undefined;

  return (
    <html lang="en">
      <body>
         {/* 全站搜索顶栏：搜索框 + Donate 等（不含 Recall clones） */}
    <header className="site-global-header wiki-vector-header z-[9999]" id="siteGlobalHeader">
      <div className="wiki-vector-header-inner">
        <Link href="/" className="wiki-logo-slot">
          <WikiLogoCarousel />
        </Link>

        <form className="wiki-search-form" id="wikiSearchForm" action="#" method="get">
          <input
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
          <a href="#" onClick={() => setShowTest(true)}>Test</a>
          <Link href="/field">Field</Link>
          <Link href="/meme">MemesEditor</Link>
          <Link href="/gallery">Gallery</Link>
        </nav>
      </div>
    </header>

    {showTest && (
        <CybercloneTest
          onReleaseIntoField={async(result) => {
            await releaseIntoField(result);  // Level > 0 写入 Supabase
            router.push("/field");   
          }}
        />
      )}
        <div className={mainClassName}>{children}</div>
      </body>
    </html>
  );
}
