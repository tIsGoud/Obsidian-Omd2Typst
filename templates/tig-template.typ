// ============================================================
//  template-tig.typ  –  tiG-branded document template
//  for use with omd2typst.
//
//  Colour note: the orange (#f47920) is derived from the tiG logo.
//  Adjust if your brand colour differs.
//
//  Expected frontmatter keys (all optional, fall back to ""):
//    title, subtitle, author, version, status, date, summary, language
// ============================================================

// ── Colours ──────────────────────────────────────────────────
#let accent            = rgb("#f27600")   // tiG orange
#let table_header_fill = rgb("#fde8d0")   // light orange
#let summary_fill      = rgb("#fff3e8")   // very light orange
#let summary_stroke    = rgb("#f9c08a")   // warm orange border
#let quote_stroke      = rgb("#f9c08a")

// ── Embedded tiG logo ─────────────────────────────────────────
#let _logo-svg = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>
<svg
   version=\"1.1\"
   width=\"672.4834\"
   height=\"489.51749\"
   style=\"clip-rule:evenodd;fill-rule:evenodd;image-rendering:optimizeQuality;shape-rendering:geometricPrecision;text-rendering:geometricPrecision\"
   id=\"svg23\"
   sodipodi:docname=\"tig-logo.svg\"
   inkscape:version=\"1.4.2 (ebf0e940, 2025-05-08)\"
   xmlns:inkscape=\"http://www.inkscape.org/namespaces/inkscape\"
   xmlns:sodipodi=\"http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd\"
   xmlns=\"http://www.w3.org/2000/svg\"
   xmlns:svg=\"http://www.w3.org/2000/svg\">
  <defs
     id=\"defs23\">
    <filter
       style=\"color-interpolation-filters:sRGB\"
       inkscape:label=\"Drop Shadow\"
       id=\"filter35\"
       x=\"-0.035067249\"
       y=\"-0.049654706\"
       width=\"1.0797684\"
       height=\"1.1129508\">
      <feFlood
         result=\"flood\"
         in=\"SourceGraphic\"
         flood-opacity=\"0.498039\"
         flood-color=\"rgb(0,0,0)\"
         id=\"feFlood34\" />
      <feGaussianBlur
         result=\"blur\"
         in=\"SourceGraphic\"
         stdDeviation=\"9.100000\"
         id=\"feGaussianBlur34\" />
      <feOffset
         result=\"offset\"
         in=\"blur\"
         dx=\"6.000000\"
         dy=\"6.000000\"
         id=\"feOffset34\" />
      <feComposite
         result=\"comp1\"
         operator=\"in\"
         in=\"flood\"
         in2=\"offset\"
         id=\"feComposite34\" />
      <feComposite
         result=\"comp2\"
         operator=\"over\"
         in=\"SourceGraphic\"
         in2=\"comp1\"
         id=\"feComposite35\" />
    </filter>
  </defs>
  <sodipodi:namedview
     id=\"namedview23\"
     pagecolor=\"#ffffff\"
     bordercolor=\"#000000\"
     borderopacity=\"0.25\"
     inkscape:showpageshadow=\"2\"
     inkscape:pageopacity=\"0.0\"
     inkscape:pagecheckerboard=\"0\"
     inkscape:deskcolor=\"#d1d1d1\"
     inkscape:zoom=\"0.84507293\"
     inkscape:cx=\"239.03262\"
     inkscape:cy=\"208.26605\"
     inkscape:current-layer=\"svg23\" />
  <g
     id=\"g2\"
     transform=\"translate(10.182885,-86.440554)\"
     style=\"filter:url(#filter35)\">
    <path
       style=\"display:inline;opacity:1\"
       fill=\"#f9f8f8\"
       d=\"m 396.5,108.5 c 91.333,-3.425 161.166,33.242 209.5,110 28.688,53.177 35.688,109.177 21,168 -18.868,64.527 -58.368,111.694 -118.5,141.5 -48.074,20.808 -97.74,25.475 -149,14 C 293.484,523.642 245.317,483.809 215,422.5 c -0.333,10.667 -0.667,21.333 -1,32 -1.052,6.284 -4.219,11.118 -9.5,14.5 -12.492,5.095 -25.492,7.261 -39,6.5 -46.195,0.141 -71.0286,-22.859 -74.5,-69 -0.5,-21.331 -0.6666,-42.664 -0.5,-64 -7.7056,0.835 -15.0389,-0.331 -22,-3.5 -2.9335,-2.264 -5.1001,-5.098 -6.5,-8.5 -1.1257,-9.096 -1.6257,-18.262 -1.5,-27.5 0.1667,-8.167 0.3333,-16.333 0.5,-24.5 0.5,-1 1,-2 1.5,-3 -4.6205,-3.447 -9.1205,-7.114 -13.5,-11 -11.3333,-13.333 -22.6667,-26.667 -34,-40 -8.24247,-20.858 -1.2425,-32.192 21,-34 4.8996,0.455 9.7329,1.289 14.5,2.5 15.5367,8.931 30.87,18.097 46,27.5 3.574,-5.065 8.24,-8.899 14,-11.5 17.733,-0.959 35.399,-0.625 53,1 5.992,2.659 9.825,7.159 11.5,13.5 1.385,13.621 1.885,27.288 1.5,41 6.342,-0.166 12.675,0 19,0.5 2.115,0.557 4.115,1.391 6,2.5 18.1,-56.272 52.434,-99.772 103,-130.5 28.861,-15.709 59.527,-25.209 92,-28.5 z m -212,243 c 2,0 4,0 6,0 1.47,12.822 3.804,25.489 7,38 -4.296,0.959 -8.629,1.625 -13,2 0,-13.333 0,-26.667 0,-40 z\"
       id=\"path2\" />
  </g>
  <g
     id=\"g3\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#f27600\"
       d=\"m 399.5,126.5 c 81.553,-2.48 144.386,30.187 188.5,98 37.626,68.432 37.96,137.098 1,206 C 540.366,505.753 471.199,538.253 381.5,528 300.979,511.489 247.479,464.322 221,386.5 200.027,304.871 219.86,235.038 280.5,177 c 34.291,-29.478 73.958,-46.312 119,-50.5 z\"
       id=\"path3\" />
  </g>
  <g
     id=\"g6\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#201f1e\"
       d=\"m 294.5,200.5 c 27.15,-1.349 38.316,11.317 33.5,38 -4.115,8.653 -10.949,13.82 -20.5,15.5 -26.271,1.019 -36.771,-11.481 -31.5,-37.5 4.191,-7.696 10.357,-13.029 18.5,-16 z\"
       id=\"path6\" />
  </g>
  <g
     id=\"g7\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#1f1f1e\"
       d=\"m 443.5,202.5 c 34.335,-0.167 68.668,0 103,0.5 0.916,0.374 1.75,0.874 2.5,1.5 0.667,13.333 0.667,26.667 0,40 -0.5,0.5 -1,1 -1.5,1.5 -31.333,0.333 -62.667,0.667 -94,1 -8.229,3.217 -15.062,8.384 -20.5,15.5 -1.275,2.217 -2.275,4.551 -3,7 -0.667,39 -0.667,78 0,117 0.803,2.744 1.803,5.411 3,8 5.438,7.116 12.271,12.283 20.5,15.5 18,0.667 36,0.667 54,0 10.993,-2.315 19.16,-8.482 24.5,-18.5 1.562,-9.939 1.895,-19.939 1,-30 -2.928,-3.881 -6.761,-6.381 -11.5,-7.5 -13,-0.333 -26,-0.667 -39,-1 -0.808,-0.308 -1.475,-0.808 -2,-1.5 -1.147,-12.954 -1.314,-25.954 -0.5,-39 0.5,-0.5 1,-1 1.5,-1.5 33,-0.667 66,-0.667 99,0 0.916,0.374 1.75,0.874 2.5,1.5 0.667,25.333 0.667,50.667 0,76 -1.708,11.743 -6.374,22.077 -14,31 -9.271,10.277 -19.438,19.443 -30.5,27.5 -6.882,3.738 -14.216,6.072 -22,7 -23.667,0.667 -47.333,0.667 -71,0 -13.43,-2.549 -25.097,-8.549 -35,-18 -6.135,-7.136 -12.635,-13.969 -19.5,-20.5 -5.828,-8.484 -9.495,-17.818 -11,-28 -0.667,-39.333 -0.667,-78.667 0,-118 1.123,-10.375 4.79,-19.708 11,-28 10.283,-12.62 22.116,-23.454 35.5,-32.5 5.554,-2.79 11.221,-4.957 17,-6.5 z\"
       id=\"path7\" />
  </g>
  <g
     id=\"g8\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#f9faf9\"
       d=\"m 116.5,203.5 c 14.333,0 28.667,0 43,0 -14.333,2.667 -28.667,2.667 -43,0 z\"
       id=\"path8\" />
  </g>
  <g
     id=\"g9\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#212121\"
       d=\"m 25.5,209.5 c 5.1503,-1.151 10.4836,-1.317 16,-0.5 15.1657,8.748 30.1657,17.748 45,27 6.9353,4.64 8.7687,10.807 5.5,18.5 -7.0955,6.993 -14.9288,7.827 -23.5,2.5 -14.5687,-15.73 -28.902,-31.563 -43,-47.5 z\"
       id=\"path9\" />
  </g>
  <g
     id=\"g10\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#1f1f1f\"
       d=\"m 157.5,281.5 c 11.488,0.995 23.155,1.328 35,1 0,14 0,28 0,42 -11.667,0 -23.333,0 -35,0 -0.473,26.064 0.027,52.064 1.5,78 6.669,11.402 16.502,15.236 29.5,11.5 1.936,-0.813 3.936,-1.313 6,-1.5 1.33,6.298 1.997,12.965 2,20 -0.017,7.077 -0.351,14.077 -1,21 -14.727,3.827 -29.727,4.994 -45,3.5 -27.397,-6.572 -41.063,-24.072 -41,-52.5 0,-26.667 0,-53.333 0,-80 -10.3333,0 -20.6667,0 -31,0 0,-14.333 0,-28.667 0,-43 7.0079,0.166 14.0079,0 21,-0.5 8.074,-3.08 12.907,-8.913 14.5,-17.5 0.5,-12.329 0.667,-24.662 0.5,-37 14.333,0 28.667,0 43,0 0,18.333 0,36.667 0,55 z\"
       id=\"path10\" />
  </g>
  <g
     id=\"g11\"
     style=\"display:none\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#8d8d8d\"
       d=\"m 184.5,237.5 c 0,7.333 0,14.667 0,22 -0.617,-0.111 -1.117,-0.444 -1.5,-1 -0.667,-6.667 -0.667,-13.333 0,-20 0.383,-0.556 0.883,-0.889 1.5,-1 z\"
       id=\"path11\" />
  </g>
  <g
     id=\"g12\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#6a4011\"
       d=\"m 326.5,278.5 c -16,0 -32,0 -48,0 0,58.667 0,117.333 0,176 -0.999,-58.831 -1.332,-117.831 -1,-177 16.509,-0.33 32.842,0.004 49,1 z\"
       id=\"path12\" />
  </g>
  <g
     id=\"g13\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#1e1f1e\"
       d=\"m 326.5,278.5 c 0,58.667 0,117.333 0,176 -16,0 -32,0 -48,0 0,-58.667 0,-117.333 0,-176 16,0 32,0 48,0 z\"
       id=\"path13\" />
  </g>
  <g
     id=\"g14\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#393939\"
       d=\"m 157.5,281.5 c 12,0 24,0 36,0 0.329,14.51 -0.004,28.843 -1,43 0,-14 0,-28 0,-42 -11.845,0.328 -23.512,-0.005 -35,-1 z\"
       id=\"path14\" />
  </g>
  <g
     id=\"g15\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#f9faf9\"
       d=\"m 55.5,284.5 c 2.6667,14 2.6667,28 0,42 0,-14 0,-28 0,-42 z\"
       id=\"path15\" />
  </g>
  <g
     id=\"g16\"
     style=\"display:none\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#8d8d8d\"
       d=\"m 642.5,318.5 c 0,8 0,16 0,24 -0.617,-0.111 -1.117,-0.444 -1.5,-1 -0.667,-7.333 -0.667,-14.667 0,-22 0.383,-0.556 0.883,-0.889 1.5,-1 z\"
       id=\"path16\" />
  </g>
  <g
     id=\"g17\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#797979\"
       d=\"m 78.5,324.5 c 10.3333,0 20.6667,0 31,0 0,26.667 0,53.333 0,80 -0.998,-26.161 -1.331,-52.495 -1,-79 -10.1806,0.327 -20.1806,-0.006 -30,-1 z\"
       id=\"path17\" />
  </g>
  <g
     id=\"g20\"
     style=\"display:none\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#8d8d8d\"
       d=\"m 184.5,351.5 c 0,13.333 0,26.667 0,40 -0.722,-0.418 -1.222,-1.084 -1.5,-2 -0.667,-12.333 -0.667,-24.667 0,-37 0.383,-0.556 0.883,-0.889 1.5,-1 z\"
       id=\"path20\" />
  </g>
  <g
     id=\"g21\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"opacity:1\"
       fill=\"#767676\"
       d=\"m 194.5,412.5 c 0.709,-0.904 1.709,-1.237 3,-1 0.649,14.373 -0.018,28.373 -2,42 0.649,-6.923 0.983,-13.923 1,-21 -0.003,-7.035 -0.67,-13.702 -2,-20 z\"
       id=\"path21\" />
  </g>
  <g
     id=\"g23\"
     transform=\"translate(10.182884,-85.666253)\">
    <path
       style=\"display:none;opacity:1\"
       fill=\"#848484\"
       d=\"m 428.5,556.5 c -8,0 -16,0 -24,0 0.111,-0.617 0.444,-1.117 1,-1.5 7.333,-0.667 14.667,-0.667 22,0 0.556,0.383 0.889,0.883 1,1.5 z\"
       id=\"path23\" />
  </g>
</svg>
"


// ── Callout colours & function ───────────────────────────────
#let _co-colors = (
  "note":      (fill: rgb("#dbeafe"), accent: rgb("#1d4ed8")),
  "info":      (fill: rgb("#dbeafe"), accent: rgb("#1d4ed8")),
  "tip":       (fill: rgb("#dcfce7"), accent: rgb("#15803d")),
  "hint":      (fill: rgb("#dcfce7"), accent: rgb("#15803d")),
  "important": (fill: rgb("#dcfce7"), accent: rgb("#15803d")),
  "warning":   (fill: rgb("#fff5ea"), accent: rgb("#e17000")),
  "caution":   (fill: rgb("#fff5ea"), accent: rgb("#e17000")),
  "attention": (fill: rgb("#fff5ea"), accent: rgb("#e17000")),
  "danger":    (fill: rgb("#fee2e2"), accent: rgb("#b91c1c")),
  "error":     (fill: rgb("#fee2e2"), accent: rgb("#b91c1c")),
  "bug":       (fill: rgb("#fee2e2"), accent: rgb("#b91c1c")),
  "quote":     (fill: rgb("#f1f5f9"), accent: rgb("#475569")),
  "cite":      (fill: rgb("#f1f5f9"), accent: rgb("#475569")),
)

#let _co-icon-paths = (
  "note":      "<circle cx='12' cy='12' r='10'/><line x1='12' y1='16' x2='12' y2='12'/><line x1='12' y1='8' x2='12.01' y2='8'/>",
  "info":      "<circle cx='12' cy='12' r='10'/><line x1='12' y1='16' x2='12' y2='12'/><line x1='12' y1='8' x2='12.01' y2='8'/>",
  "tip":       "<path d='M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5'/><path d='M9 18h6'/><path d='M10 22h4'/>",
  "hint":      "<path d='M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5'/><path d='M9 18h6'/><path d='M10 22h4'/>",
  "important": "<circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/>",
  "warning":   "<path d='m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/>",
  "caution":   "<path d='m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/>",
  "attention": "<path d='m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/>",
  "danger":    "<path d='M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'/>",
  "error":     "<circle cx='12' cy='12' r='10'/><path d='m15 9-6 6'/><path d='m9 9 6 6'/>",
  "bug":       "<path d='m8 2 1.88 1.88'/><path d='M14.12 3.88 16 2'/><path d='M9 7.13v-1a3.003 3.003 0 1 1 6 0v1'/><path d='M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z'/><path d='M12 20v-9'/><path d='M6.53 9C4.6 8.8 3 7.1 3 5'/><path d='M6 13H2'/><path d='M3 21c0-2.1 1.7-3.9 4-4'/><path d='M20.97 5c0 2.1-1.6 3.8-3.5 4'/><path d='M22 13h-4'/><path d='M17 17c2.3.1 4 1.9 4 4'/>",
  "quote":     "<path d='M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z'/><path d='M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z'/>",
  "cite":      "<path d='M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z'/><path d='M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z'/>",
)

#let callout(kind, title, body) = {
  let c = _co-colors.at(kind, default: (fill: rgb("#f3f4f6"), accent: rgb("#374151")))
  let paths = _co-icon-paths.at(kind, default: none)
  let hdr = context {
    if paths != none {
      let cap_h = measure(text(fill: c.accent, weight: "bold")[H]).height
      let svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='" + c.accent.to-hex() + "' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'>" + paths + "</svg>"
      box(height: 1.5 * cap_h, baseline: 1.5 * cap_h / 12, image(bytes(svg), format: "svg")) + h(4pt) + title
    } else { title }
  }
  block(radius: 4pt, width: 100%, clip: true, breakable: false)[
    #block(fill: c.fill.darken(3%), inset: (x: 12pt, y: 7pt), width: 100%)[
      #text(fill: c.accent, weight: "bold")[#hdr]
    ]
    #block(above: 0pt, fill: c.fill, inset: (x: 12pt, y: 10pt), width: 100%)[
      #body
    ]
  ]
}


// ── Language strings ─────────────────────────────────────────
#let _lang_strings = (
  "nl": (
    toc:      "Inhoudsopgave",
    figures:  "Lijst van figuren",
    summary:  "Samenvatting",
    version:  "Versie",
    status:   "Status",
    date:     "Datum",
    author:   "Auteur",
    page:     "Pagina",
    of:       "van",
    fig_nr:   "Figuur",
    fig_desc: "Omschrijving",
  ),
  "en": (
    toc:      "Table of Contents",
    figures:  "List of Figures",
    summary:  "Summary",
    version:  "Version",
    status:   "Status",
    date:     "Date",
    author:   "Author",
    page:     "Page",
    of:       "of",
    fig_nr:   "Figure",
    fig_desc: "Description",
  ),
  "de": (
    toc:      "Inhaltsverzeichnis",
    figures:  "Abbildungsverzeichnis",
    summary:  "Zusammenfassung",
    version:  "Version",
    status:   "Status",
    date:     "Datum",
    author:   "Autor",
    page:     "Seite",
    of:       "von",
    fig_nr:   "Abbildung",
    fig_desc: "Beschreibung",
  ),
  "es": (
    toc:      "Tabla de contenidos",
    figures:  "Lista de figuras",
    summary:  "Resumen",
    version:  "Versión",
    status:   "Estado",
    date:     "Fecha",
    author:   "Autor",
    page:     "Página",
    of:       "de",
    fig_nr:   "Figura",
    fig_desc: "Descripción",
  ),
  "fr": (
    toc:      "Table des matières",
    figures:  "Liste des figures",
    summary:  "Résumé",
    version:  "Version",
    status:   "Statut",
    date:     "Date",
    author:   "Auteur",
    page:     "Page",
    of:       "de",
    fig_nr:   "Figure",
    fig_desc: "Description",
  ),
)

// ── Sidebar ───────────────────────────────────────────────────
// Orange gradient bar flush left, full page height.
#let _sidebar = place(left + top,
  rect(width: 1.2cm, height: 100%,
    fill: gradient.linear(rgb("#bf5c00"), rgb("#f9a060"), angle: 90deg))
)


// ── Template function ─────────────────────────────────────────
#let template(fm: (:), doc) = {

  let title    = fm.at("title",    default: "")
  let subtitle = fm.at("subtitle", default: "")
  let author   = fm.at("author",   default: "")
  let version  = fm.at("version",  default: "")
  let status   = fm.at("status",   default: "")
  let date     = fm.at("date",     default: fm.at("published", default: ""))
  let summary  = fm.at("summary",  default: "")
  let _lang    = fm.at("language", default: "nl")
  let _t       = _lang_strings.at(_lang, default: _lang_strings.at("nl"))

  // ── Page layout ─────────────────────────────────────────────
  set page(
    paper: "a4",
    margin: (top: 2.5cm, bottom: 2.5cm, left: 2.8cm, right: 2.5cm),
    header: context {
      if counter(page).get().first() > 2 {
        set text(size: 8pt, fill: rgb("#888888"))
        grid(
          columns: (1fr, 1fr),
          align(left)[#title],
          align(right)[#_t.version #version],
        )
        line(length: 100%, stroke: 0.4pt + rgb("#cccccc"))
      }
    },
    footer: context {
      if counter(page).get().first() > 2 {
        set text(size: 8pt, fill: rgb("#888888"))
        line(length: 100%, stroke: 0.4pt + rgb("#cccccc"))
        let current = counter(page).get().first()
        let total   = counter(page).final().first()
        grid(
          columns: (1fr, 1fr),
          align(left)[#status],
          align(right)[#_t.page #current #_t.of #total],
        )
      }
    },
  )

  // ── Typography ───────────────────────────────────────────────
  set text(font: ("Helvetica Neue", "Arial", "Liberation Sans"), size: 10.5pt, lang: _lang)
  set par(justify: true, leading: 0.65em)
  set heading(numbering: "1.1.")

  show heading.where(level: 1): it => {
    v(1.4em)
    text(size: 17pt, weight: "bold", fill: accent, it.body)
    v(0.5em)
  }
  show heading.where(level: 2): it => {
    v(1.0em)
    text(size: 13pt, weight: "bold", fill: accent, it.body)
    v(0.3em)
  }
  show heading.where(level: 3): it => {
    v(0.8em)
    text(size: 11pt, weight: "bold", fill: rgb("#333333"), it.body)
    v(0.2em)
  }

  set list(indent: 1em, marker: [•])
  set enum(indent: 1em)

  // ── Tables ───────────────────────────────────────────────────
  set table(
    stroke: (_, y) => if y == 0 { (bottom: 1.5pt + accent) }
                      else       { (bottom: 0.5pt + rgb("#dddddd")) },
    fill:   (_, y) => if y == 0 { table_header_fill } else { none },
    inset: (x: 8pt, y: 6pt),
  )
  show table.cell.where(y: 0): set text(weight: "bold", fill: accent)
  show link: set text(fill: accent)

  // ── Code blocks ──────────────────────────────────────────────
  show raw.where(block: true): it => block(
    fill: luma(245), inset: (x: 10pt, y: 8pt), radius: 4pt, width: 100%, it,
  )
  show raw.where(block: false): it => box(
    fill: luma(245), inset: (x: 3pt, y: 1pt), radius: 2pt, it,
  )

  // ── Block quotes ─────────────────────────────────────────────
  show quote.where(block: true): it => block(
    stroke: (left: 1pt + quote_stroke),
    inset: (left: 1em, top: 0.4em, bottom: 0.4em),
    width: 100%,
    it.body,
  )

  // ── Cover page ───────────────────────────────────────────────
  page(
    margin: (top: 0pt, bottom: 0pt, left: 0pt, right: 0pt),
    header: none,
    footer: none,
  )[
    #_sidebar

    #place(top + center, dy: 1.5cm,
      image(bytes(_logo-svg), format: "svg", height: 40mm, fit: "contain")
    )

    #pad(left: 2.8cm, right: 2.5cm, bottom: 2.5cm)[
      #v(99mm)

      #text(size: 26pt, weight: "bold", fill: accent, title)
      #v(0.4cm)
      #line(length: 80%, stroke: 2pt + accent)
      #v(0.5cm)

      #if subtitle != "" [
        #text(size: 11pt, fill: rgb("#666666"), subtitle)
      ]

      #v(1fr)

      #if summary != "" [
        #rect(
          width: 85%,
          inset: 14pt,
          radius: 4pt,
          stroke: 1pt + summary_stroke,
          fill: summary_fill,
        )[
          #text(weight: "bold", fill: accent)[#_t.summary]
          #v(0.4em)
          #summary
        ]
      ]

      #v(1fr)

      #grid(
        columns: (4cm, 1fr),
        row-gutter: 0.5em,
        text(weight: "bold", fill: rgb("#555555"), _t.version), version,
        text(weight: "bold", fill: rgb("#555555"), _t.status),  status,
        text(weight: "bold", fill: rgb("#555555"), _t.date),    date,
        text(weight: "bold", fill: rgb("#555555"), _t.author),  author,
      )
    ]
  ]

  // ── Revision / Approval page ─────────────────────────────────
  let _rev  = fm.at("revision-blocks",  default: none)
  let _appr = fm.at("approval-blocks", default: none)
  if _rev != none or _appr != none {
    page(
      margin: (top: 0pt, bottom: 0pt, left: 0pt, right: 0pt),
      header: none,
      footer: none,
    )[
      #_sidebar
      #pad(left: 2.5cm, right: 2.5cm, top: 2.5cm, bottom: 2.5cm)[
        #if _rev != none [
          #text(size: 13pt, weight: "bold", fill: accent)[#fm.at("revision-table", default: "")]
          #v(0.8em)
          #_rev
          #if _appr != none { v(2em) }
        ]
        #if _appr != none [
          #text(size: 13pt, weight: "bold", fill: accent)[#fm.at("approval-table", default: "")]
          #v(0.8em)
          #_appr
        ]
      ]
    ]
  }

  // ── Table of contents ────────────────────────────────────────
  page(
    margin: (top: 0pt, bottom: 0pt, left: 0pt, right: 0pt),
    header: none,
    footer: none,
  )[
    #_sidebar
    #pad(left: 2.5cm, right: 2.5cm, top: 2.5cm, bottom: 2.5cm)[
      #text(size: 17pt, weight: "bold", fill: accent)[#_t.toc]
      #v(1.2em)
      #outline(title: none, indent: auto, depth: 3)
    ]
  ]

  // ── List of figures (optional — set figure-list: true in frontmatter) ────
  if fm.at("figure-list", default: "") == "true" {
    page(
      margin: (top: 0pt, bottom: 0pt, left: 0pt, right: 0pt),
      header: none,
      footer: none,
    )[
      #_sidebar
      #pad(left: 2.5cm, right: 2.5cm, top: 2.5cm, bottom: 2.5cm)[
      #text(size: 17pt, weight: "bold", fill: accent)[#_t.figures]
      #v(0.6em)
      #context {
        let figs = query(figure.where(kind: image))
        if figs.len() > 0 {
          table(
            columns: (auto, 1fr, auto),
            stroke: (_, y) => if y == 0 { none }
                              else       { (bottom: 0.5pt + rgb("#dddddd")) },
            fill:   (_, y) => if y == 0 { rgb("#e8f0fa") } else { none },
            inset: (x: 8pt, y: 6pt),
            table.header(
              text(weight: "bold", fill: accent)[#_t.fig_nr],
              text(weight: "bold", fill: accent)[#_t.fig_desc],
              text(weight: "bold", fill: accent)[#_t.page],
            ),
            ..figs.map(fig => {
              let num = counter(figure).at(fig.location()).first()
              let cap = if fig.caption != none { fig.caption.body } else { [] }
              let pg  = counter(page).at(fig.location()).first()
              ([#_t.fig_nr #num], cap, [#pg])
            }).flatten()
          )
        }
      }
      ]
    ]
  }

  // ── Document body ────────────────────────────────────────────
  doc
}
