export const WIKI_TOC_LINKS = [
  { sectionId: "wiki-sec-1", label: "What Is Cyberclone?" },
  { sectionId: "wiki-sec-2", label: "Meme, Imitation, and Clone" },
  { sectionId: "wiki-sec-3", label: "Memes Are Not Only Memes" },
  { sectionId: "wiki-sec-4", label: "Attention, Prestige, and Self-Commodification" },
  { sectionId: "wiki-sec-5", label: "The Embodiment of Meme" },
  { sectionId: "wiki-sec-6", label: "Identity and Participatory Popularity" },
  { sectionId: "wiki-sec-7", label: "Supermeme and Merchandise" },
  { sectionId: "wiki-sec-8", label: "Conclusion" }
];

export function scrollWikiSection(sectionId) {
  const wikiMainScroll = document.querySelector("#hello .wiki-vector-main");
  const target = document.getElementById(sectionId);

  if (!wikiMainScroll || !target) {
    return;
  }

  const containerTop = wikiMainScroll.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  const nextTop = wikiMainScroll.scrollTop + (targetTop - containerTop) - 10;

  wikiMainScroll.scrollTo({
    top: Math.max(0, nextTop),
    behavior: "smooth"
  });
}

export function handleWikiSectionLink(event, sectionId) {
  event.preventDefault();
  scrollWikiSection(sectionId);
}

export default function WikiTocNav({ className, id }) {
  return (
    <nav className={className || "wiki-toc-nav"} id={id}>
      <ol className="wiki-toc-list">
        {WIKI_TOC_LINKS.map(function (item, index) {
          return (
            <li key={item.sectionId}>
              <a
                className="wiki-toc-link"
                href="#"
                onClick={function (event) {
                  handleWikiSectionLink(event, item.sectionId);
                }}
              >
                <span className="wiki-toc-num">{index + 1}</span> {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
