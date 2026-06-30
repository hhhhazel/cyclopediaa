const PROFILE_ROWS = [
  {
    label: "Born",
    value: (
      <>
        Kimberly Noel Kardashian
        <br />
        October 21, 1980 (age 45)
        <br />
        Los Angeles, California, U.S.
      </>
    )
  },
  {
    label: "Other names",
    value: "Kim Kardashian West · Kim K"
  },
  {
    label: "Occupations",
    value: "Media personality · socialite · businesswoman · model · actress · producer · fashion designer"
  },
  {
    label: "Years active",
    value: "2003-present"
  },
  {
    label: "Television",
    value: (
      <>
        <em>Keeping Up with the Kardashians</em>
        <br />
        <em>Kourtney and Kim Take Miami</em>
        <br />
        <em>Kourtney and Kim Take New York</em>
        <br />
        <em>The Kardashians</em>
      </>
    )
  },
  
  {
    label: "Children",
    value: "4, including North West"
  },
  {
    label: "Parents",
    value: (
      <>
        Robert Kardashian (father)
        <br />
        Kris Jenner (mother)
        <br />
        Caitlyn Jenner (stepmother)
      </>
    )
  },
  {
    label: "Relatives",
    value: "Kardashian Memes Family"
  }
];

export default function WikiProfileInfobox() {
  return (
    <aside className="wiki-profile-infobox" aria-label="Kim Kardashian profile summary">
      <h2 className="wiki-profile-title">Kim Kardashian</h2>

      <figure className="wiki-profile-figure">
        <div className="wiki-profile-image-frame ">
          <img
            src="/Kim_Kardashian_West_2014.jpg"
            alt="Kim Kardashian"
            width="220"
            height="291"
            draggable={false}
          />
        </div>
        <figcaption>Kardashian in 2014</figcaption>
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
