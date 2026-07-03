const PROFILE_ROWS = [
  {
    label: "Born",
    value: (
      <>
        Kim Kardashian Money GIF
        <br />
        June 20, 2016
        <br />
        GQ.com, United States
      </>
    ),
  },
  {
    label: "Other names",
    value:
      "Pay Me · Cash monaaaaaaaay · Kim K Money · Make It Rain Kim · Money Kim",
  },
  {
    label: "Occupations",
    value:
      "reaction GIF · celebrity meme · money meme · digital sticker · caption template",
  },
  {
    label: "Years active",
    value: "2016–present",
  },
  {
    label: "Original source",
    value: (
      <>
        Behind the Buttmoji: Kim Kardashian West on Her Favorite Kimojis
        <br />
        GQ
      </>
    ),
  },
  {
    label: "Media",
    value: "Giphy · Tenor · social media reposts · group chats",
  },
  {
    label: "Known for",
    value: (
      <>
        throwing dollar bills into the air from a stack of cash
        <br />
        being used to signal payment, spending, luxury, self-branding, and the
        fantasy of becoming rich
      </>
    ),
  },
  {
    label: "Related work",
    value: (
      <>
        Kimoji
        <br />
        GQ July 2016 cover story
      </>
    ),
  },
  {
    label: "Children",
    value:
      'cropped GIFs · captioned screenshots · "pay me" reactions · "make it rain" edits · money-themed image macros',
  },
  {
    label: "Parents",
    value: (
      <>
        GQ
        <br />
        Kimoji
        <br />
        Kim Kardashian brand
      </>
    ),
  },
  {
    label: "Relatives",
    value: (
      <>
        Kardashian Crying Face
        <br />
        You&rsquo;re Doing Amazing, Sweetie
        <br />
        Kylie Jenner Lip Challenge
        <br />
        Kardashian Memes Family
      </>
    ),
  },
];

export default function WikiProfileInfobox() {
  return (
    <aside
      className="wiki-profile-infobox"
      aria-label="Kim Kardashian Money GIF profile summary"
    >
      <h2 className="wiki-profile-title">Kim Kardashian</h2>

      <figure className="wiki-profile-figure">
        <div className="wiki-profile-image-frame ">
          <img
            src="/motion/1.png"
            alt="Kim Kardashian Money GIF"
            width="220"
            height="291"
            draggable={false}
          />
        </div>
        <figcaption>Kim Kardashian Money GIF in 2016</figcaption>
      </figure>

      <dl className="wiki-profile-facts">
        {PROFILE_ROWS.map(function (row) {
          return (
            <div className="wiki-profile-row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          );
        })}
      </dl>

      <div className="wiki-profile-signature">
        <strong>Signature</strong>
        <span aria-label="Kim signature">kim</span>
      </div>
    </aside>
  );
}
