---
title: Example Document
subtitle: This is the subtitle
author: W. Williams
version: 0.9
status: Draft
language: en
date: 14-05-2026
summary: |
  This document is a sample document to test the functionality of omd2typst.

  It contains a cover page, table of contents, tables, images and call-outs. Optionally a figure list and revision and approval sections.
figure-list: true
revision-table: Revision
approval-table: Approval
appendix-from: Notes
---

# Example Document

## Revision

| Version | Date       | Author(s)        | Remark / Changes          |
| :----:  | ---------- | ---------------- | ------------------------- |
|  0.8    | 2026-05-01 | William Williams | Initial draft             |
|  0.9    | 2026-05-16 | William Williams | Review comments applied   |

## Approval

| Role         | Reviewer      | v0.8 | v0.9 | Remark |
| ------------ | ------------- | :--: | :--: | ------ |
| Security     | S.E. Curity   |  💬  |      |        |
| Governance   | Gover Nance   |  😶  |      |        |
| Architecture | Archi Tectuur |  👍  |      |        |

| Symbol | Meaning                       |
| ------ | ----------------------------- |
| 👍     | Agrees with the content       |
| 💬     | Input or comments provided    |
| 😶     | No response received          |

## Introduction

This section gives a brief introduction to the document.

## Text examples

| Description  | Syntax                  | Result                 |
| ------------ | ----------------------- | ---------------------- |
| Regular text | \*\*Bold text\*\*       | **Bold text**          |
| Italic text  | \_Italic text\_         | _Italic text_          |
| Inline code  | this is \`sample\` text | this is `sample` text  |

\> "Quote" →
> "Quote: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." – Lorem Ipsum

The Obsidian comment (\%\%Obsidian comment\%\%) is on the line below; in the omd2typst output it has been removed.

%% Obsidian comment %%

Below is another Obsidian comment line inside a MarkDown block.
```markdown
# Markdown example

Below an Obsidian comment

%% Obsidian comment %%

Another line of text.
```

## Strikethrough, highlighting, super- and subscript

| Markdown                                     | Result                                   |
| -------------------------------------------- | ---------------------------------------- |
| \~~strikethrough text\~~                     | ~~strikethrough~~ text                   |
| Following text is `==highlighted==` text.    | Following text is ==highlighted== text.  |
| Following text is `==🔴highlighted==` text.   | Following text is ==🔴highlighted== text. |
| Following text is `==🟠highlighted==` text.   | Following text is ==🟠highlighted== text. |
| Following text is `==🟡highlighted==` text.   | Following text is ==🟡highlighted== text. |
| Following text is `==🟢highlighted==` text.   | Following text is ==🟢highlighted== text. |
| Following text is `==🔵highlighted==` text.   | Following text is ==🔵highlighted== text. |
| Following text is `==🟣highlighted==` text.   | Following text is ==🟣highlighted== text. |
| Superscript (HTML hack) `E = mc<sup>2</sup>` | Superscript: E = mc<sup>2</sup>          |
| Subscript: `H<sub>2</sub>O`                  | Subscript: H<sub>2</sub>O                |

## Mathematics

Inline math uses a single '$', with '\$\$' its placed centered on the next line.

| Markdown                                          | Result                                         |
| ------------------------------------------------- | ---------------------------------------------- |
| Math \$E = m c^2$ and $a^2 + b^2 = c^2\$ inline.  | Math $E = m c^2$ and $a^2 + b^2 = c^2$ inline. |
| New line: \$$E = m c^2$ and $a^2 + b^2 = c^2\$\$. | $$E = m c^2$ and $a^2 + b^2 = c^2$$            |
| New line: \$\$sum_(k=1)^n k = (n(n+1)) / 2\$\$    | $$sum_(k=1)^n k = (n(n+1)) / 2$$               |
| New line: \$\$log(x)\$$                           | $$log(x)$$                                     |

## Bullet lists

Lists

### Unordered list

A list:
- Item a
- Item b
    - Sub-item a
    - Sub-item b
        - Sub-sub-item a
        - Sub-sub-item b
            - Sub-sub-sub-item a
            - Sub-sub-sub-item b
        - Sub-sub-item c
    - Sub-item c
- Item c

That was the list.

### Ordered list

1. Item 1
2. Item 2
	1. Sub-item 1
	2. Sub-item 2
		1. Sub-sub-item 1
		2. Sub-sub-item 2
			1. Sub-sub-sub-item 1
			2. Sub-sub-sub-item 2
		3. Sub-sub-item 3
	3. Sub-item 3
3. Item 3

## Table

Some examples of tables and their alignment.

The text before the table.

| Component     | Description |
|---|---|
| `service-name` | Short logical name of the service (e.g. `portal`, `api`, `intranet`) |
| `environment`  | DTAP environment (`dev`, `tst`, `acc`, `prd`) |
| `application`  | Centrally registered application code |

Text between the tables.

| Not aligned | Not aligned |
|---|---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

| Right-aligned | Left-aligned |
|---:|:---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

| Centered | Left-aligned |
|:---:|:---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

One line of text after the table.

## Code block

And then a code block.

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

Text after the code block.

## Section with images

Examples of the different ways images can be displayed in markdown. With or without alt text or custom size.

### Without size

An image without a specified size.

```markdown
![alt text](_assets/laptop.png)
```

![alt text](_assets/laptop.png)

### Width 200 – Option 1

The first format for an image with width 200.

```markdown
![alt text|200](_assets/laptop.png)
```

![alt text|200](_assets/laptop.png)

### Width 150 – Option 2

The second format for an image with width 150.
The alt text is not supported in this format. The caption shows only the figure number.

```markdown
![[_assets/laptop.png|150]]
```

![[_assets/laptop.png|150]]

## Call-outs

The collection of supported call-outs.

### Note

> [!note] Note
> This is a "note" call-out.

### Info

> [!info] Info
> This is an "info" call-out.

### Tip

> [!tip] Tip
> This is a "tip" call-out.

### Hint


> [!hint] Hint
> This is a "hint" call-out.

### Important

> [!important] Important
> This is an "important" call-out.

### Warning

> [!warning] Warning
> This is a "warning" call-out.

### Caution

> [!caution] Caution
> This is a "caution" call-out.

### Attention

> [!Attention] Attention
> This is an "attention" call-out.

### Danger

> [!danger] Danger
> This is a "danger" call-out.

### Error

> [!error] Error
> This is an "error" call-out.

### Bug

> [!BUG] Bug
> This is a "bug" call-out.

### Quote

> [!quote] Quote
> This is a "quote" call-out.

### Cite

> [!cite] Citation or Reference
> This is a "cite" call-out.

### Unknown, not defined

> [!unknown] Not defined, fallback value
> This is an "unknown, not defined" call-out.

### Typst

In Typst, `breakable: false` is added to the outer block of a call-out. This prevents call-outs from being split across a page break.

## Selection or checkboxes

Regularly used in Obsidian but after a PDF export they may still be useful to indicate a certain status.

- [ ] Empty / to do
- [x] Done
- [/] In progress
- [-] Cancelled
- [>] Forwarded
- [!] Important
- [?] Question
- [I] Idea
- [i] Info
- [*] Star

## Wiki links

Obsidian wikilinks are rendered according to the `--wikilinks` option of the CLI
(or the *Wikilinks* setting of the plugin): `text` (default), `bold`, `link` or
`keep`.

| Syntax | Description | Result |
| ------ | ----------- | ------ |
| \[\[A Note\]\] | Note | [[A Note]] |
| \[\[A Note\\\|just a label\]\] | Note with alias | [[A Note\|just a label]] |
| \[\[A Note#Some heading\]\] | Note and heading | [[A Note#Some heading]] |
| \[\[\#Table\]\] | Heading in this document | [[#Table]] |
| \[\[\#Footnotes\|jump to footnotes\]\] | Heading in this document with alias | [[#Footnotes\|jump to footnotes]] |
| \[\[\#text examples\]\] | Heading in this document, different case | [[#text examples]] |
| \[\[\#No such heading\]\] | Heading that does not exist | [[#No such heading]] |
| \[\[Another Note#^block-id\]\] | Block reference | [[Another Note#^block-id]] |

Wikilinks also work inside running text, for example in a sentence that mentions
[[Another Note|another note]] and then continues, in **bold [[#Mathematics]]**
and in a list:

- First item with a link to a [[TestNote]].
- Second item pointing to [[#Code block|the code block]] within this document.

`[[Wikilinks in code stay as typed]]`

## Footnotes

Footnotes are placed inline in the text.[^1] A second footnote can follow immediately.[^2]

[^1]: This is the first footnote. It appears at the bottom of the page.
[^2]: This is the second footnote.

## Notes

Here follows an addendum with notes.

## More notes

More notes.
