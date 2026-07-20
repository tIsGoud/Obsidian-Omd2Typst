// ============================================================
//  template-purple.typ  –  Obsidian-branded document template
//  for use with md2typst.
//
//  Usage:
//    md2typst input.md output.pdf --template template-purple.typ
//
//  Expected frontmatter keys (all optional, fall back to ""):
//    title      Document title
//    subtitle   Sub-title / project description
//    author     Author name(s)
//    version    Version number, e.g. "1.0"
//    status     Document status, e.g. "Concept" / "Definitief"
//    date       Date string, e.g. "2026-05-14"
//    summary    Executive summary (single paragraph)
//    language   Language code, e.g. "nl" (default) or "en"
//
//  Required exports consumed by md2typst:
//    template   Show-rule function  (#show: template.with(fm: fm))
//    callout    Renders Obsidian callout blocks
// ============================================================

// ── Colours ──────────────────────────────────────────────────
#let accent = rgb("#4c229e")   // purple — headings, links, table headers

// ── Embedded Obsidian logo ────────────────────────────────────
#let _logo-svg = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>
<svg
   id=\"custom-logo\"
   width=\"351.10001\"
   height=\"443.20001\"
   viewBox=\"0 0 351.10001 443.20001\"
   fill=\"none\"
   version=\"1.1\"
   xmlns=\"http://www.w3.org/2000/svg\"
   xmlns:svg=\"http://www.w3.org/2000/svg\">
  <defs
     id=\"defs17\">
    <radialGradient
       id=\"b\"
       cx=\"0\"
       cy=\"0\"
       r=\"1\"
       gradientUnits=\"userSpaceOnUse\"
       gradientTransform=\"matrix(-48,-185,123,-32,98.900003,392.7)\">
      <stop
         stop-color=\"#fff\"
         stop-opacity=\".4\"
         id=\"stop1\" />
      <stop
         offset=\"1\"
         stop-opacity=\".1\"
         id=\"stop2\" />
    </radialGradient>
    <radialGradient
       id=\"c\"
       cx=\"0\"
       cy=\"0\"
       r=\"1\"
       gradientUnits=\"userSpaceOnUse\"
       gradientTransform=\"matrix(41,-310,229,30,261.5,314.3)\">
      <stop
         stop-color=\"#fff\"
         stop-opacity=\".6\"
         id=\"stop3\" />
      <stop
         offset=\"1\"
         stop-color=\"#fff\"
         stop-opacity=\".1\"
         id=\"stop4\" />
    </radialGradient>
    <radialGradient
       id=\"d\"
       cx=\"0\"
       cy=\"0\"
       r=\"1\"
       gradientUnits=\"userSpaceOnUse\"
       gradientTransform=\"matrix(57,-261,178,39,110.4,259.3)\">
      <stop
         stop-color=\"#fff\"
         stop-opacity=\".8\"
         id=\"stop5\" />
      <stop
         offset=\"1\"
         stop-color=\"#fff\"
         stop-opacity=\".4\"
         id=\"stop6\" />
    </radialGradient>
    <radialGradient
       id=\"e\"
       cx=\"0\"
       cy=\"0\"
       r=\"1\"
       gradientUnits=\"userSpaceOnUse\"
       gradientTransform=\"matrix(-79,-133,153,-90,241.3,427.2)\">
      <stop
         stop-color=\"#fff\"
         stop-opacity=\".3\"
         id=\"stop7\" />
      <stop
         offset=\"1\"
         stop-opacity=\".3\"
         id=\"stop8\" />
    </radialGradient>
    <radialGradient
       id=\"f\"
       cx=\"0\"
       cy=\"0\"
       r=\"1\"
       gradientUnits=\"userSpaceOnUse\"
       gradientTransform=\"matrix(-29,136,-92,-20,220.6,112.9)\">
      <stop
         stop-color=\"#fff\"
         stop-opacity=\"0\"
         id=\"stop9\" />
      <stop
         offset=\"1\"
         stop-color=\"#fff\"
         stop-opacity=\".2\"
         id=\"stop10\" />
    </radialGradient>
    <radialGradient
       id=\"g\"
       cx=\"0\"
       cy=\"0\"
       r=\"1\"
       gradientUnits=\"userSpaceOnUse\"
       gradientTransform=\"matrix(72,73,-155,153,57.700003,188.2)\">
      <stop
         stop-color=\"#fff\"
         stop-opacity=\".2\"
         id=\"stop11\" />
      <stop
         offset=\"1\"
         stop-color=\"#fff\"
         stop-opacity=\".4\"
         id=\"stop12\" />
    </radialGradient>
    <radialGradient
       id=\"h\"
       cx=\"0\"
       cy=\"0\"
       r=\"1\"
       gradientUnits=\"userSpaceOnUse\"
       gradientTransform=\"matrix(20,118,-251,43,135,236.7)\">
      <stop
         stop-color=\"#fff\"
         stop-opacity=\".1\"
         id=\"stop13\" />
      <stop
         offset=\"1\"
         stop-color=\"#fff\"
         stop-opacity=\".3\"
         id=\"stop14\" />
    </radialGradient>
    <radialGradient
       id=\"i\"
       cx=\"0\"
       cy=\"0\"
       r=\"1\"
       gradientUnits=\"userSpaceOnUse\"
       gradientTransform=\"matrix(-162,-85,268,-510,294.3,334.7)\">
      <stop
         stop-color=\"#fff\"
         stop-opacity=\".2\"
         id=\"stop15\" />
      <stop
         offset=\".5\"
         stop-color=\"#fff\"
         stop-opacity=\".2\"
         id=\"stop16\" />
      <stop
         offset=\"1\"
         stop-color=\"#fff\"
         stop-opacity=\".3\"
         id=\"stop17\" />
    </radialGradient>
    <filter
       id=\"a\"
       x=\"80.099998\"
       y=\"37\"
       width=\"351.10001\"
       height=\"443.20001\"
       filterUnits=\"userSpaceOnUse\"
       color-interpolation-filters=\"sRGB\">
      <feFlood
         flood-opacity=\"0\"
         result=\"BackgroundImageFix\"
         id=\"feFlood17\" />
      <feBlend
         in=\"SourceGraphic\"
         in2=\"BackgroundImageFix\"
         result=\"shape\"
         id=\"feBlend17\"
         mode=\"normal\" />
      <feGaussianBlur
         stdDeviation=\"6.5\"
         result=\"effect1_foregroundBlur_744_9191\"
         id=\"feGaussianBlur17\" />
    </filter>
  </defs>
  <rect
     id=\"logo-bg\"
     fill=\"#262626\"
     width=\"512\"
     height=\"512\"
     rx=\"100\"
     x=\"-80.099998\"
     y=\"-37\"
     style=\"display:none;opacity:1\" />
  <g
     filter=\"url(#a)\"
     id=\"g17\"
     transform=\"translate(-80.099997,-37)\">
    <path
       d=\"m 359.2,437.5 c -2.6,19 -21.3,33.9 -40,28.7 C 292.7,459 262,447.6 234.4,445.5 L 192,442.3 A 28,28 0 0 1 174,434 l -73,-74.8 a 27.7,27.7 0 0 1 -5.4,-30.7 c 0,0 45,-98.6 46.8,-103.7 1.6,-5.1 7.8,-49.9 11.4,-73.9 a 28,28 0 0 1 9,-16.5 L 249,57.2 a 28,28 0 0 1 40.6,3.4 l 72.6,91.6 a 29.5,29.5 0 0 1 6.2,18.3 c 0,17.3 1.5,53 11.2,76 a 301.3,301.3 0 0 0 35.6,58.2 14,14 0 0 1 1,15.6 c -6.3,10.7 -18.9,31.3 -36.6,57.6 a 142.2,142.2 0 0 0 -20.5,59.6 z\"
       fill=\"#000000\"
       fill-opacity=\"0.3\"
       id=\"path17\" />
  </g>
  <path
     id=\"arrow\"
     d=\"m 279.8,397.3 c -2.6,19.1 -21.3,34 -40,28.9 -26.4,-7.3 -57,-18.7 -84.7,-20.8 l -42.3,-3.2 a 27.9,27.9 0 0 1 -17.999997,-8.4 l -73,-75 a 27.9,27.9 0 0 1 -5.4,-31 c 0,0 45.1,-99 46.8,-104.2 1.7,-5.1 7.8,-50 11.4,-74.2 a 28,28 0 0 1 9,-16.6 L 169.8,15.3 a 28,28 0 0 1 40.6,3.5 l 72.5,92 a 29.7,29.7 0 0 1 6.2,18.3 c 0,17.4 1.5,53.2 11.1,76.3 a 303,303 0 0 0 35.6,58.5 14,14 0 0 1 1.1,15.7 c -6.4,10.8 -18.9,31.4 -36.7,57.9 a 143.3,143.3 0 0 0 -20.4,59.8 z\"
     fill=\"#6c31e3\" />
  <path
     d=\"m 102.6,399.4 c 33.9,-68.7 33,-118 18.5,-153 -13.2,-32.4 -37.899997,-52.8 -57.299997,-65.5 -0.4,1.9 -1,3.7 -1.8,5.4 l -45.6,101.5 a 27.9,27.9 0 0 0 5.5,31 l 72.9,75 c 2.3,2.3 5,4.2 7.799997,5.6 z\"
     fill=\"url(#b)\"
     id=\"path18\"
     style=\"fill:url(#b)\" />
  <path
     d=\"m 194.8,260 c 9.1,0.9 18,2.9 26.8,6.1 27.8,10.4 53.1,33.8 74,78.9 1.5,-2.6 3,-5.1 4.6,-7.5 a 1222,1222 0 0 0 36.7,-57.9 14,14 0 0 0 -1,-15.7 303,303 0 0 1 -35.7,-58.5 c -9.6,-23 -11,-58.9 -11.1,-76.3 0,-6.6 -2.1,-13.1 -6.2,-18.3 l -72.5,-92 -1.2,-1.5 c 5.3,17.5 5,31.5 1.7,44.2 -3,11.8 -8.6,22.5 -14.5,33.8 -2,3.8 -4,7.7 -5.9,11.7 a 140,140 0 0 0 -15.8,58 c -1,24.2 3.9,54.5 20,95 z\"
     fill=\"url(#c)\"
     id=\"path19\"
     style=\"fill:url(#c)\" />
  <path
     d=\"m 194.7,260 c -16.1,-40.5 -21,-70.8 -20,-95 1,-24 8,-42 15.8,-58 l 6,-11.7 c 5.8,-11.3 11.3,-22 14.4,-33.8 a 78.5,78.5 0 0 0 -1.7,-44.2 28,28 0 0 0 -39.4,-2 L 83.600003,92.8 a 28,28 0 0 0 -9,16.6 l -10.5,69.6 c 0,0.7 -0.2,1.3 -0.3,2 19.4,12.6 43.999997,33 57.299997,65.3 2.6,6.4 4.8,13.1 6.4,20.4 a 200,200 0 0 1 67.2,-6.8 z\"
     fill=\"url(#d)\"
     id=\"path20\"
     style=\"fill:url(#d)\" />
  <path
     d=\"m 239.9,426.2 c 18.6,5.1 37.3,-9.8 39.9,-29 A 153,153 0 0 1 295.7,345 c -21,-45.1 -46.3,-68.5 -74,-78.9 -29.5,-11 -61.6,-7.3 -94.2,0.6 7.3,33.1 3,76.4 -24.8,132.7 3.1,1.6 6.6,2.5 10.1,2.8 l 43.9,3.3 c 23.8,1.7 59.3,14 83.2,20.7 z\"
     fill=\"url(#e)\"
     id=\"path21\"
     style=\"fill:url(#e)\" />
  <path
     fill-rule=\"evenodd\"
     clip-rule=\"evenodd\"
     d=\"m 174.9,163.5 c -1.1,24 1.9,51.4 18,91.8 l -5,-0.5 c -14.5,-42.1 -17.7,-63.7 -16.6,-88 1,-24.3 8.9,-43 16.7,-59 2,-4 6.6,-11.5 8.6,-15.3 5.8,-11.3 9.7,-17.2 13,-27.5 4.8,-14.4 3.8,-21.2 3.2,-28 3.7,24.5 -10.4,45.8 -21,67.5 a 145,145 0 0 0 -17,59 z\"
     fill=\"url(#f)\"
     id=\"path22\"
     style=\"fill:url(#f)\" />
  <path
     fill-rule=\"evenodd\"
     clip-rule=\"evenodd\"
     d=\"m 125.9,248.1 c 2,4.4 3.7,8 4.9,13.5 l -4.3,1 c -1.7,-6.4 -3,-11 -5.5,-16.5 -14.6,-34.3 -37.999997,-52 -56.999997,-65 23,12.4 46.699997,31.9 61.899997,67 z\"
     fill=\"url(#g)\"
     id=\"path23\"
     style=\"fill:url(#g)\" />
  <path
     fill-rule=\"evenodd\"
     clip-rule=\"evenodd\"
     d=\"m 131,266 c 8,37.5 -1,85.2 -27.5,131.6 22.2,-46 33,-90.1 24,-131 l 3.5,-0.7 z\"
     fill=\"url(#h)\"
     id=\"path24\"
     style=\"fill:url(#h)\" />
  <path
     fill-rule=\"evenodd\"
     clip-rule=\"evenodd\"
     d=\"m 222.6,262.5 c 43.5,16.3 60.3,52 72.8,81.9 -15.5,-31.2 -37,-65.7 -74.4,-78.5 -28.4,-9.8 -52.4,-8.6 -93.5,0.7 l -0.9,-4 c 43.6,-10 66.4,-11.2 96,0 z\"
     fill=\"url(#i)\"
     id=\"path25\"
     style=\"fill:url(#i)\" />
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
// Add entries here to support additional languages.
// Set  language: <code>  in the document frontmatter to activate.
#let _lang_strings = (
  "nl": (
    toc:      "Inhoudsopgave",
    appendix: "Bijlage",
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
    appendix: "Appendix",
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
    appendix: "Anhang",
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
    appendix: "Apéndice",
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
    appendix: "Appendice",
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

// ── Sidebar helper ────────────────────────────────────────────
// Places the purple gradient bar flush left, full page height.
// Call inside any zero-margin page block that should show the bar.
#let _sidebar = place(left + top,
  rect(width: 1.2cm, height: 100%,
    fill: gradient.linear(rgb("#4c229e"), rgb("#af8ff1"), angle: 90deg))
)

// ── Template function ─────────────────────────────────────────
// fm   — frontmatter dictionary emitted by md2typst
// doc  — document body (all content blocks)
#let template(fm: (:), doc) = {

  // Extract metadata with safe defaults
  let title    = fm.at("title",    default: "")
  let subtitle = fm.at("subtitle", default: "")
  let author   = fm.at("author",   default: "")
  let version  = fm.at("version",  default: "")
  let status   = fm.at("status",   default: "")
  let date     = fm.at("date",     default: fm.at("published", default: ""))
  let summary  = fm.at("summary",  default: "")
  let _lang    = fm.at("language", default: "nl")
  let _t       = _lang_strings.at(_lang, default: _lang_strings.at("nl"))

  // Register the localized "Appendix" label so the engine’s appendix numbering
  // switch (emitted at `appendix-from`) renders e.g. "Bijlage A - …".
  state("omd-appendix-label").update(_t.at("appendix", default: "Appendix"))

  // ── Page layout ─────────────────────────────────────────────
  set page(
    paper: "a4",
    margin: (top: 2.5cm, bottom: 2.5cm, left: 2.8cm, right: 2.5cm),
    header: context {
      // Non-content pages use explicit page() with header: none, so this
      // rule only fires on numbered body pages.
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
    pagebreak(weak: true)   // each chapter starts on a new page
    text(size: 17pt, weight: "bold", fill: accent, it)
    v(0.5em)
  }
  show heading.where(level: 2): it => {
    v(1.0em)
    text(size: 13pt, weight: "bold", fill: accent, it)
    v(0.3em)
  }
  show heading.where(level: 3): it => {
    v(0.8em)
    text(size: 11pt, weight: "bold", fill: rgb("#333333"), it)
    v(0.2em)
  }

  set list(indent: 1em, marker: [•])
  set enum(indent: 1em)

  // ── Tables ───────────────────────────────────────────────────
  set table(
    stroke: (_, y) => if y == 0 { (bottom: 1.5pt + accent) }
                      else       { (bottom: 0.5pt + rgb("#dddddd")) },
    fill:   (_, y) => if y == 0 { rgb("#ede8f9") } else { none },
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
    stroke: (left: 1pt + rgb("#c4b0e8")),
    inset: (left: 1em, top: 0.4em, bottom: 0.4em),
    width: 100%,
    it.body,
  )

  // ── Figure spacing ───────────────────────────────────────────
  show figure: set block(below: 1.5em)

  // ── Cover page ───────────────────────────────────────────────
  page(
    margin: (top: 0pt, bottom: 0pt, left: 0pt, right: 0pt),
    header: none,
    footer: none,
  )[
    // Left purple gradient bar
    #_sidebar

    // Obsidian logo — flush to top, centred
    #place(top + center, dy: 1.5cm,
      image(bytes(_logo-svg), format: "svg", height: 40mm, fit: "contain")
    )

    #pad(left: 2.8cm, right: 2.5cm, bottom: 2.5cm)[
      // Push title to one-third down the page (A4 = 297 mm → 99 mm from top)
      #v(99mm)

      // Title
      #text(size: 26pt, weight: "bold", fill: accent, title)
      #v(0.4cm)
      #line(length: 80%, stroke: 2pt + accent)
      #v(0.5cm)

      // Subtitle
      #if subtitle != "" [
        #text(size: 11pt, fill: rgb("#666666"), subtitle)
      ]

      // Equal space above and below the summary
      #v(1fr)

      // Summary box (only shown when frontmatter has a summary key)
      #if summary != "" [
        #rect(
          width: 85%,
          inset: 14pt,
          radius: 4pt,
          stroke: 1pt + rgb("#c4b0e8"),
          fill: rgb("#f0ebff"),
        )[
          #text(weight: "bold", fill: accent)[#_t.summary]
          #v(0.4em)
          #summary
        ]
      ]

      #v(1fr)

      // Metadata grid — pinned to the bottom
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

  // ── Revision / Approval page (optional) ─────────────────────
  // Shown when frontmatter contains revision-table and/or approval-table keys
  // naming an H2 section. The sections are extracted from the document body
  // and rendered here; they are not numbered and do not appear in the ToC.
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
