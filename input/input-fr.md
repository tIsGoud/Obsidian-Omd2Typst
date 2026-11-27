---
title: Document d'exemple
subtitle: Ceci est le sous-titre
author: B. Bernard
version: 0.9
status: Brouillon
language: fr
date: 14-05-2026
summary: Ce document est un document d'exemple pour tester les fonctionnalités d'omd2typst. Il contient une page de titre, une table des matières, des tableaux, des images et des blocs d'alerte. En option; une liste de figures et des sections de révision et d'approbation.
figure-list: true
revision-table: Révision
approval-table: Approbation
---

# Document d'exemple

## Révision

| Version | Date       | Auteur(s)       | Remarque / Modifications  |
| :----:  | ---------- | --------------- | ------------------------- |
|  0.8    | 2026-05-01 | Bernard Bernard | Premier brouillon         |
|  0.9    | 2026-05-16 | Bernard Bernard | Commentaires de révision intégrés |

## Approbation

| Rôle         | Réviseur      | v0.8 | v0.9 | Remarque |
| ------------ | ------------- | :--: | :--: | -------- |
| Security     | S.E. Curity   |  💬  |      |          |
| Governance   | Gover Nance   |  😶  |      |          |
| Architecture | Archi Tectuur |  👍  |      |          |

| Symbole | Signification                       |
| ------- | ----------------------------------- |
| 👍      | D'accord avec le contenu            |
| 💬      | Contributions ou commentaires fournis |
| 😶      | Aucune réponse reçue                |

## Introduction

Cette section donne une brève introduction au document.

## Exemples de texte

| Description | Syntaxe | Résultat |
| --- | --- | --- |
| Texte en gras | \*\*Texte en gras\*\* | **Texte en gras** |
| Texte en italique | \_Texte en italique\_ | _Texte en italique_ |
| Code en ligne | ceci est un texte \`exemple\` | ceci est un texte `exemple` |

\> "Citation" →
> "Citation : Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." – Lorem Ipsum

Le commentaire Obsidian (\%\%Commentaire Obsidian\%\%) se trouve sur la ligne ci-dessous ; dans la sortie d'Omd2Typst il a été supprimé.

%% Obsidian commentaar %%

Ci-dessous se trouve encore une ligne de commentaire Obsidian dans un bloc MarkDown.
```markdown
# Exemple Markdown

Ci-dessous un commentaire Obsidian

%% Commentaire Obsidian %%

Encore une ligne de texte.
```

## Barré, surligné, exposant et indice

| Markdown | Résultat |
| --- | --- |
| \~~texte barré\~~ | ~~barré~~ texte |
| Le texte suivant est du texte `==surligné==`. | Le texte suivant est du texte ==surligné==. |
| Le texte suivant est du texte `==🔴surligné==`. | Le texte suivant est du texte ==🔴surligné==. |
| Le texte suivant est du texte `==🟠surligné==`. | Le texte suivant est du texte ==🟠surligné==. |
| Le texte suivant est du texte `==🟡surligné==`. | Le texte suivant est du texte ==🟡surligné==. |
| Le texte suivant est du texte `==🟢surligné==`. | Le texte suivant est du texte ==🟢surligné==. |
| Le texte suivant est du texte `==🔵surligné==`. | Le texte suivant est du texte ==🔵surligné==. |
| Le texte suivant est du texte `==🟣surligné==`. | Le texte suivant est du texte ==🟣surligné==. |
| Exposant (astuce HTML) `E = mc<sup>2</sup>` | Exposant : E = mc<sup>2</sup> |
| Indice : `H<sub>2</sub>O` | Indice : H<sub>2</sub>O |

## Mathématiques

Les mathématiques en ligne utilisent un seul '$' ; avec '\$\$' la formule est placée centrée sur la ligne suivante.

Les formules s'écrivent en LaTeX, comme Obsidian les affiche. Pour la syntaxe Typst, utilisez `--math typst` (CLI) ou le réglage *Math syntax* (plugin).

| Markdown | Résultat |
| --- | --- |
| Mathématiques `$E = m c^2$ and $a^2 + b^2 = c^2$` inline. | Mathématiques $E = m c^2$ and $a^2 + b^2 = c^2$ inline. |
| Nouvelle ligne: `$$E = m c^2$$` | $$E = m c^2$$ |
| Nouvelle ligne: `$$\sum_{k=1}^n k = \frac{n(n+1)}{2}$$` | $$\sum_{k=1}^n k = \frac{n(n+1)}{2}$$ |
| Nouvelle ligne: `$$\log(x)$$` | $$\log(x)$$ |
| `$\sqrt{x}$, $\alpha$, $\beta$` | $\sqrt{x}$, $\alpha$, $\beta$ |

Matrice et cas :

$$
f(x) = \begin{cases} 1 & x > 0 \\ 0 & \text{otherwise} \end{cases}
$$

$$
A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}
$$

## Listes à puces

Listes

### Liste non ordonnée

Une liste :
- Élément a
- Élément b
    - Sous-élément a
    - Sous-élément b
        - Sous-sous-élément a
        - Sous-sous-élément b
            - Sous-sous-sous-élément a
            - Sous-sous-sous-élément b
        - Sous-sous-élément c
    - Sous-élément c
- Élément c

C'était la liste.

### Liste ordonnée

1. Élément 1
2. Élément 2
	1. Sous-élément 1
	2. Sous-élément 2
		1. Sous-sous-élément 1
		2. Sous-sous-élément 2
			1. Sous-sous-sous-élément 1
			2. Sous-sous-sous-élément 2
		3. Sous-sous-élément 3
	3. Sous-élément 3
3. Élément 3

## Tableau

Quelques exemples de tableaux et de leur alignement.

Le texte avant le tableau.

| Composant      | Description |
|---|---|
| `nom-service`  | Nom logique court du service (p. ex. `portal`, `api`, `intranet`) |
| `environnement` | Environnement DTAP (`dev`, `tst`, `acc`, `prd`) |
| `application`  | Code d'application enregistré de manière centralisée |

Texte entre les tableaux.

| Non aligné | Non aligné |
|---|---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

| Aligné à droite | Aligné à gauche |
|---:|:---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

| Centré | Aligné à gauche |
|:---:|:---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

Une ligne de texte après le tableau.

## Bloc de code

Et ensuite un bloc de code.

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

Texte après le bloc de code.

## Section avec images

Exemples des différentes façons d'afficher des images en markdown. Avec ou sans texte alternatif ou taille personnalisée.

Les tailles sont données en pixels Obsidian. Dans le PDF, elles deviennent la même proportion de la largeur du texte : avec la largeur de référence par défaut de 700, `|350` correspond à la moitié de la largeur et `|700` à la largeur complète (voir `--image-reference-width` et le réglage du plugin *Image width reference*).

### Sans taille

Une image sans taille spécifiée.

```markdown
![texte alternatif](_assets/laptop.png)
```

![texte alternatif](_assets/laptop.png)

### Largeur 200 – Option 1

Le premier format pour une image de largeur 200.

```markdown
![texte alternatif|200](_assets/laptop.png)
```

![texte alternatif|200](_assets/laptop.png)

### Largeur 150 – Option 2

Le deuxième format pour une image de largeur 150.
Le format d'Obsidian avec doubles crochets. Sans texte alternatif, la légende affiche uniquement le numéro de figure.

```markdown
![[_assets/laptop.png|150]]
```

![[_assets/laptop.png|150]]

### Largeur 200 et texte alternatif – Option 3

Le format avec doubles crochets, avec largeur et texte alternatif. L'ordre de la largeur et du texte alternatif n'a pas d'importance.

```markdown
![[_assets/laptop.png|200|alt text]]
```

![[_assets/laptop.png|200|alt text]]

### Texte alternatif seul – Option 4

Le format avec doubles crochets, avec texte alternatif et sans largeur.

```markdown
![[_assets/laptop.png|alt text]]
```

![[_assets/laptop.png|alt text]]

Avec le réglage *Use file name as caption* (CLI : `--filename-captions`), une image sans texte alternatif reçoit son nom de fichier comme légende. Le texte alternatif est toujours prioritaire.

## PDF intégrés

Un PDF peut être intégré comme une image : `![[fichier.pdf]]`. L'export inclut ses pages, de sorte qu'une annexe conserve la numérotation des pages et les titres de chapitre du document. Dans le plugin Obsidian, le réglage *PDF embeds* choisit l'affichage des pages : dans les marges de la page, avec l'en-tête et le pied de page (par défaut), ou en pages entières. Cela demande Typst 0.14 ou plus récent. L'outil en ligne de commande n'inclut pas encore les PDF et affiche un espace réservé.

| Syntaxe | Pages incluses |
| --- | --- |
| `![[example.pdf]]` | toutes les pages |
| `![[example.pdf#page=5]]` | de la page 5 à la dernière page |
| `![[example.pdf#page=5-7]]` | pages 5 à 7 |
| `![[example.pdf#page=5,6,7]]` | exactement les pages 5, 6 et 7 |

Les pages 5, 6 et 7 de `example.pdf` :

![[_assets/example.pdf#page=5,6,7]]

## Call-outs

La syntaxe des blocs d'alerte est en anglais, c'est pourquoi les sous-paragraphes sont en anglais.

### Note

> [!note] Note
> C'est un bloc d'alerte de type « note ».

### Info

> [!info] Info
> C'est un bloc d'alerte de type « info ».

### Tip

> [!tip] Astuce
> C'est un bloc d'alerte de type « tip ».

### Hint


> [!hint] Indice
> C'est un bloc d'alerte de type « hint ».

### Important

> [!important] Important
> C'est un bloc d'alerte de type « important ».

### Warning

> [!warning] Avertissement
> C'est un bloc d'alerte de type « warning ».

### Caution

> [!caution] Attention
> C'est un bloc d'alerte de type « caution ».

### Attention

> [!Attention] Attention
> C'est un bloc d'alerte de type « attention ».

### Danger

> [!danger] Danger
> C'est un bloc d'alerte de type « danger ».

### Error

> [!error] Erreur
> C'est un bloc d'alerte de type « error ».

### Bug

> [!BUG] Bogue
> C'est un bloc d'alerte de type « bug ».

### Quote

> [!quote] Citation
> C'est un bloc d'alerte de type « quote ».

### Cite

> [!cite] Citation ou Référence
> C'est un bloc d'alerte de type « cite ».

### Inconnu, non défini

> [!unknown] Non défini, valeur de repli
> C'est un bloc d'alerte de type « inconnu, non défini ».

### Typst

Dans Typst, `breakable: false` est ajouté au bloc extérieur des blocs d'alerte. Cela empêche les blocs d'alerte d'être divisés par un saut de page.

## Cases à cocher

Régulièrement utilisées dans Obsidian, ces cases peuvent encore être utiles après exportation en PDF pour indiquer un certain statut.

- [ ] Vide / à faire
- [x] Terminé
- [/] En cours
- [-] Annulé
- [>] Transféré
- [!] Important
- [?] Question
- [I] Idée
- [i] Info
- [*] Étoile

## Wikilinks

Les wikilinks d'Obsidian sont rendus selon l'option `--wikilinks` de la CLI (ou le réglage *Wikilinks* du plugin) : `text` (par défaut), `bold`, `link` ou `keep`.

| Syntaxe | Description | Résultat |
| ------ | ----------- | ------ |
| \[\[Une note\]\] | Note | [[Une note]] |
| \[\[Une note\\\|simplement une étiquette\]\] | Note avec alias | [[Une note\|simplement une étiquette]] |
| \[\[Une note#Un titre\]\] | Note et titre | [[Une note#Un titre]] |
| \[\[\#Tableau\]\] | Titre de ce document | [[#Tableau]] |
| \[\[\#Notes de bas de page\|aller aux notes de bas de page\]\] | Titre de ce document avec alias | [[#Notes de bas de page\|aller aux notes de bas de page]] |
| \[\[\#exemples de texte\]\] | Titre de ce document, autre casse | [[#exemples de texte]] |
| \[\[\#N'existe pas\]\] | Titre inexistant | [[#N'existe pas]] |
| \[\[Autre note#^id-bloc\]\] | Référence de bloc | [[Autre note#^id-bloc]] |

Les wikilinks fonctionnent aussi dans le texte courant, par exemple dans une phrase qui renvoie à [[Autre note|une autre note]] et se poursuit, en **gras [[#Mathématiques]]** et dans une liste :

- Premier point avec [[Autre note]]
- Deuxième point qui renvoie à [[#Bloc de code|le bloc de code]]

`[[Les wikilinks dans le code restent tels que saisis]]`

## Notes de bas de page

Les notes de bas de page sont placées en ligne dans le texte.[^1] Une deuxième note de bas de page peut suivre immédiatement.[^2]

[^1]: C'est la première note de bas de page. Elle apparaît en bas de la page.
[^2]: C'est la deuxième note de bas de page.

## Addendum — Remarques

Voici un addendum avec des remarques.

## Addendum — Remarques supplémentaires

D'autres remarques.
