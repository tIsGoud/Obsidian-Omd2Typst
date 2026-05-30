---
title: Voorbeeldig document
subtitle: Dit is de ondertitel
author: Albert W. Alberts
version: 0.9
status: Concept
language: nl
date: 14-05-2026
summary: Dit document is een voorbeelddocument om de werking van omd2typst te testen. Het bevat een titelblad, inhoudsopgave, tabellen, afbeeldingen en call-outs. Optioneel zijn de tabel met afbeeldingen, revisie- en goedkeuringssecties.
figure-list: true
revision-table: Revisie
approval-table: Goedkeuring
---

# Voorbeeldig document

## Revisie

| Versie | Datum      | Auteur(s)      | Opmerking / Wijzigingen   |
| :----: | ---------- | -------------- | ------------------------- |
|  0.8   | 2026-05-01 | Albert Alberts | Eerste concept            |
|  0.9   | 2026-05-16 | Albert Alberts | Reviewcommentaar verwerkt |

## Goedkeuring

| Rol          | Reviewer      | v0.8 | v0.9 | Opmerking |
| ------------ | ------------- | :--: | :--: | --------- |
| Security     | S.E. Curity   |  💬  |      |           |
| Governance   | Gover Nance   |  😶  |      |           |
| Architectuur | Archi Tectuur |  👍  |      |           |

| Symbool | Betekenis                    |
| ------- | ---------------------------- |
| 👍      | Akkoord met de inhoud        |
| 💬      | Input of commentaar geleverd |
| 😶      | Geen reactie ontvangen       |

## Inleiding

Dit gedeelte geeft een korte inleiding op het document.

## Tekstvoorbeelden

Reguliere tekst.

\*\*Vetgedrukte tekst\*\* →
**Vetgedrukte tekst**

\_Cursieve tekst\_ →
_Cursieve tekst_

\> "Citaat" →
> "Citaat: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." – Lorem Ipsum

\`Inline code\` →
`tekst tussen backticks`

Obsidian commentaar (\%\%Obsidian commentaar\%\% )staat op de regel hieronder, in de uitvoer van Omd2Typst is deze verwijderd.

%% Obsidian commentaar %%

Hieronder staat nog een Obsidian commentaar regel in een MarkDown block.
```markdown
# Markdown voorbeeld

Hieronder een Obsidian commentaar

%% Obsidian commentaar %%

Nog een regel tekst.
```

## Doorhalen, markeren, super- en subscript

`~~doorgehaalde tekst~~` →
~~doorgehaalde~~ tekst

`==gemarkeerde== tekst` →
==gemarkeerde== tekst

Superscript (HTML-hack) E = mc\<sup\>2\</sup\> →
Superscript: E = mc<sup>2</sup>

Subscript: H\<sub\>2\</sub\>O →
Subscript: H<sub>2</sub>O

## Wiskunde

Inline wiskunde: \$E = m c^2$ en $a^2 + b^2 = c^2$. →
Inline wiskunde: $E = m c^2$ en $a^2 + b^2 = c^2$.


Weergaveformule: \$\$sum_(k=1)^n k = (n(n+1)) / 2\$\$ →

Weergaveformule: $$sum_(k=1)^n k = (n(n+1)) / 2$$

## Lijsten met opsommingstekens

Lijsten

### Ongeordende lijst

Een lijst:
- Item a
- Item b
    - Subitem a
    - Subitem b
        - Sub-subitem a
        - Sub-subitem b
            - Sub-sub-subitem a
            - Sub-sub-subitem b
        - Sub-subitem c
    - Subitem c
- Item c

Dat was de lijst.

### Geordende lijst

1. Item 1
2. Item 2
	1. Subitem 1
	2. Subitem 2
		1. Sub-subitem 1
		2. Sub-subitem 2
			1. Sub-sub-subitem 1
			2. Sub-sub-subitem 2
		3. Sub-subitem 3
	3. Subitem 3
3. Item 3

## Tabel

Een aantal voorbeelden van tabellen en hun uitlijning.

De tekst vóór de tabel.

| Onderdeel     | Toelichting |
|---|---|
| `servicenaam` | Korte logische naam van de dienst (bijv. `portal`, `api`, `intranet`) |
| `omgeving`    | DTAP-omgeving (`dev`, `tst`, `acc`, `prd`) |
| `applicatie`  | Centraal vastgelegde applicatiecode |

Tekst tussen de tabellen.

| Niet uitgelijnd | Niet uitgelijnd |
|---|---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

| Rechts uitgelijnd | Links uitgelijnd |
|---:|:---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

| Gecentreerd | Links uitgelijnd |
|:---:|:---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

Één regel tekst na de tabel.

## Codeblok

En dan nog een codeblok.

```rust
/// Returns a path to the template relative to the output .typ file's directory.
/// Typst resolves #import paths relative to the importing file, not the cwd.
fn resolve_template_path(output: &str, template: &str) -> Result<String> {
    use std::path::{Component, Path};

    let template_abs = Path::new(template)
        .canonicalize()
        .with_context(|| format!("Template file not found: {}", template))?;

    let output_dir = Path::new(output).parent().unwrap_or(Path::new("."));
    let output_dir_abs = output_dir
        .canonicalize()
        .unwrap_or_else(|_| std::env::current_dir().unwrap_or_default());

    let from: Vec<_> = output_dir_abs.components().collect();
    let to: Vec<_> = template_abs.components().collect();
    let common = from.iter().zip(to.iter()).take_while(|(a, b)| a == b).count();

    let up = from.len() - common;
    let mut parts: Vec<String> = (0..up).map(|_| "..".into()).collect();
    parts.extend(to[common..].iter().filter_map(|c| match c {
        Component::Normal(s) => Some(s.to_string_lossy().into_owned()),
        _ => None,
    }));

    Ok(if parts.is_empty() { ".".into() } else { parts.join("/") })
}
```

Tekst na het codeblok.

## Sectie met afbeeldingen

Voorbeelden van de verschillende manieren waarop afbeeldingen in markdown getoond kunnen worden. Al dan niet met hun alt-tekst of aangepaste grootte.

### Zonder grootte

Hieronder een afbeelding zonder opgegeven grootte.

```markdown
![alt tekst](_assets/laptop.png)
```

![alt tekst](_assets/laptop.png)

### Breedte 200 – Optie 1

Hieronder het eerste formaat voor een afbeelding met breedte 200.

```markdown
![alt tekst|200](_assets/laptop.png)
```

![alt tekst|200](_assets/laptop.png)

### Breedte 150 – Optie 2

Hieronder het tweede formaat voor een afbeelding met breedte 150.
De alt-tekst wordt hierbij niet ondersteund. Het onderschrift toont alleen het nummer van de afbeelding.

```markdown
![[_assets/laptop.png|150]]
```

![[_assets/laptop.png|150]]

## Call-outs

De syntax van de call-outs is in het Engels, daarom zijn de sub-paragrafen Engelstalig.

### Note

> [!note] Notitie
> Dit is een "note" call-out.

### Info

> [!info] Info
> Dit is een "info" call-out.

### Tip

> [!tip] Tip
> Dit is een "tip" call-out.

### Hint


> [!hint] Hint
> Dit is een "hint" call-out.

### Important

> [!important] Belangrijk
> Dit is een "important" call-out.

### Warning

> [!warning] Waarschuwing
> Dit is een "warning" call-out.

### Caution

> [!caution] Let op
> Dit is een "caution" call-out.

### Attention

> [!Attention] Aandacht
> Dit is een "attention" call-out.

### Danger

> [!danger] Gevaar
> Dit is een "danger" call-out.

### Error

> [!error] Fout
> Dit is een "error" call-out.

### Bug

> [!BUG] Bug
> Dit is een "bug" call-out.

### Quote

> [!quote] Quote
> Dit is een "quote" call-out.

### Cite

> [!cite] Citaat of Bronvermelding
> Dit is een "cite" call-out.

### Onbekend, niet gedefinieerd

> [!unknown] Niet gedefinieerd, terugvalwaarde
> Dit is een "onbekende, niet gedefinieerde" call-out.

### Typst

In Typst wordt  aan het buitenste blok van een call-outs `breakable: false`. Hierdoor worden call-outs niet gesplitst door een pagina-einde.

## Selectie- of aankruisvakjes

Regelmatig gebruikt in Obsidian maar deze zijn na een PDF-export wellicht nog te gebruiken om een bepaalde status aan te geven.

- [ ] Leeg / te doen
- [x] Gereed
- [/] In uitvoering
- [-] Geannuleerd
- [>] Doorgestuurd
- [!] Belangrijk
- [?] Vraag
- [I] Idee
- [i] Info
- [*] Ster

## Voetnoten

Voetnoten worden inline in de tekst geplaatst.[^1] Een tweede voetnoot kan direct volgen.[^2]

[^1]: Dit is de eerste voetnoot. Deze verschijnt onderaan de pagina.
[^2]: Dit is de tweede voetnoot.

## Addendum — Aantekeningen

Hier volgt een addendum met aantekeningen.

## Addendum — Meer aantekeningen

Nog meer aantekeningen.
