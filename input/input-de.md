---
title: Beispieldokument
subtitle: Dies ist der Untertitel
author: G. Guntherson
version: 0.9
status: Entwurf
language: de
date: 14-05-2026
summary: Dieses Dokument ist ein Beispieldokument zum Testen der Funktionalität von omd2typst. Es enthält eine Titelseite, ein Inhaltsverzeichnis, Tabellen, Bilder und Call-outs. Optional eine Abbildungsliste sowie Revisions- und Genehmigungsabschnitte.
figure-list: true
revision-table: Revision
approval-table: Genehmigung
---

# Beispieldokument

## Revision

| Version | Datum      | Autor(en)          | Anmerkung / Änderungen    |
| :----:  | ---------- | ------------------ | ------------------------- |
|  0.8    | 2026-05-01 | Gunther Guntherson | Erster Entwurf            |
|  0.9    | 2026-05-16 | Gunther Guntherson | Reviewkommentare eingearbeitet |

## Genehmigung

| Rolle        | Prüfer        | v0.8 | v0.9 | Anmerkung |
| ------------ | ------------- | :--: | :--: | --------- |
| Security     | S.E. Curity   |  💬  |      |           |
| Governance   | Gover Nance   |  😶  |      |           |
| Architektur  | Archi Tectuur |  👍  |      |           |

| Symbol | Bedeutung                       |
| ------ | ------------------------------- |
| 👍     | Inhalt akzeptiert               |
| 💬     | Input oder Kommentare gegeben   |
| 😶     | Keine Antwort erhalten          |

## Einleitung

Dieser Abschnitt gibt eine kurze Einleitung in das Dokument.

## Textbeispiele

Regulärer Text.

\*\*Fetter Text\*\* →
**Fetter Text**

\_Kursiver Text\_ →
_Kursiver Text_

\> "Zitat" →
> "Zitat: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." – Lorem Ipsum

\`Inline-Code\` →
`Text in Backticks`

Der Obsidian-Kommentar (\%\%Obsidian-Kommentar\%\%) steht in der Zeile unten; in der Ausgabe von Omd2Typst wurde er entfernt.

%% Obsidian commentaar %%

Unten steht noch eine Obsidian-Kommentarzeile in einem MarkDown-Block.
```markdown
# Markdown-Beispiel

Unten ein Obsidian-Kommentar

%% Obsidian-Kommentar %%

Noch eine Textzeile.
```

## Durchgestrichen, markiert, hoch- und tiefgestellt

`~~durchgestrichener Text~~` →
~~durchgestrichener~~ Text

`==markierter== Text` →
==markierter== Text

Hochgestellt (HTML-Hack) E = mc\<sup\>2\</sup\> →
Hochgestellt: E = mc<sup>2</sup>

Tiefgestellt: H\<sub\>2\</sub\>O →
Tiefgestellt: H<sub>2</sub>O

## Mathematik

Inline-Mathematik: \$E = m c^2$ und $a^2 + b^2 = c^2$. →
Inline-Mathematik: $E = m c^2$ und $a^2 + b^2 = c^2$.


Anzeigeformel: \$\$sum_(k=1)^n k = (n(n+1)) / 2\$\$ →

Anzeigeformel: $$sum_(k=1)^n k = (n(n+1)) / 2$$

## Aufzählungslisten

Listen

### Ungeordnete Liste

Eine Liste:
- Element a
- Element b
    - Unterelement a
    - Unterelement b
        - Unter-Unterelement a
        - Unter-Unterelement b
            - Unter-Unter-Unterelement a
            - Unter-Unter-Unterelement b
        - Unter-Unterelement c
    - Unterelement c
- Element c

Das war die Liste.

### Geordnete Liste

1. Element 1
2. Element 2
	1. Unterelement 1
	2. Unterelement 2
		1. Unter-Unterelement 1
		2. Unter-Unterelement 2
			1. Unter-Unter-Unterelement 1
			2. Unter-Unter-Unterelement 2
		3. Unter-Unterelement 3
	3. Unterelement 3
3. Element 3

## Tabelle

Einige Beispiele für Tabellen und ihre Ausrichtung.

Der Text vor der Tabelle.

| Komponente    | Beschreibung |
|---|---|
| `dienstname`  | Kurzer logischer Name des Dienstes (z. B. `portal`, `api`, `intranet`) |
| `umgebung`    | DTAP-Umgebung (`dev`, `tst`, `acc`, `prd`) |
| `applikation` | Zentral festgelegter Anwendungscode |

Text zwischen den Tabellen.

| Nicht ausgerichtet | Nicht ausgerichtet |
|---|---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

| Rechtsbündig | Linksbündig |
|---:|:---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

| Zentriert | Linksbündig |
|:---:|:---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

Eine Textzeile nach der Tabelle.

## Codeblock

Und dann noch ein Codeblock.

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

Text nach dem Codeblock.

## Abschnitt mit Bildern

Beispiele für die verschiedenen Möglichkeiten, wie Bilder in Markdown angezeigt werden können. Mit oder ohne Alternativtext oder benutzerdefinierter Größe.

### Ohne Größe

Ein Bild ohne angegebene Größe.

```markdown
![Alternativtext](_assets/laptop.png)
```

![Alternativtext](_assets/laptop.png)

### Breite 200 – Option 1

Das erste Format für ein Bild mit Breite 200.

```markdown
![Alternativtext|200](_assets/laptop.png)
```

![Alternativtext|200](_assets/laptop.png)

### Breite 150 – Option 2

Das zweite Format für ein Bild mit Breite 150.
Der Alternativtext wird in diesem Format nicht unterstützt. Die Bildunterschrift zeigt nur die Abbildungsnummer.

```markdown
![[_assets/laptop.png|150]]
```

![[_assets/laptop.png|150]]

## Call-outs

Die Syntax der Call-outs ist auf Englisch, daher sind die Unterabschnitte auf Englisch.

### Note

> [!note] Hinweis
> Dies ist ein „note" Call-out.

### Info

> [!info] Info
> Dies ist ein „info" Call-out.

### Tip

> [!tip] Tipp
> Dies ist ein „tip" Call-out.

### Hint


> [!hint] Hinweis
> Dies ist ein „hint" Call-out.

### Important

> [!important] Wichtig
> Dies ist ein „important" Call-out.

### Warning

> [!warning] Warnung
> Dies ist ein „warning" Call-out.

### Caution

> [!caution] Vorsicht
> Dies ist ein „caution" Call-out.

### Attention

> [!Attention] Achtung
> Dies ist ein „attention" Call-out.

### Danger

> [!danger] Gefahr
> Dies ist ein „danger" Call-out.

### Error

> [!error] Fehler
> Dies ist ein „error" Call-out.

### Bug

> [!BUG] Bug
> Dies ist ein „bug" Call-out.

### Quote

> [!quote] Zitat
> Dies ist ein „quote" Call-out.

### Cite

> [!cite] Zitat oder Quellenangabe
> Dies ist ein „cite" Call-out.

### Unbekannt, nicht definiert

> [!unknown] Nicht definiert, Fallback-Wert
> Dies ist ein „unbekannter, nicht definierter" Call-out.

### Typst

In Typst wird dem äußeren Block eines Call-outs `breakable: false` hinzugefügt. Dadurch werden Call-outs nicht durch einen Seitenumbruch getrennt.

## Kontrollkästchen

Regelmäßig in Obsidian verwendet, aber nach einem PDF-Export möglicherweise noch nützlich, um einen bestimmten Status anzuzeigen.

- [ ] Leer / zu erledigen
- [x] Fertig
- [/] In Bearbeitung
- [-] Abgebrochen
- [>] Weitergeleitet
- [!] Wichtig
- [?] Frage
- [I] Idee
- [i] Info
- [*] Stern

## Fußnoten

Fußnoten werden inline im Text platziert.[^1] Eine zweite Fußnote kann direkt folgen.[^2]

[^1]: Dies ist die erste Fußnote. Sie erscheint am unteren Seitenrand.
[^2]: Dies ist die zweite Fußnote.

## Addendum — Anmerkungen

Hier folgt ein Addendum mit Anmerkungen.

## Addendum — Weitere Anmerkungen

Weitere Anmerkungen.
