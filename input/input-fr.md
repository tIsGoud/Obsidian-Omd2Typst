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

Texte normal.

\*\*Texte en gras\*\* →
**Texte en gras**

\_Texte en italique\_ →
_Texte en italique_

\> "Citation" →
> "Citation : Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." – Lorem Ipsum

\`Code en ligne\` →
`texte entre guillemets obliques`

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

`~~texte barré~~` →
~~barré~~ texte

`==texte surligné==` →
==surligné== texte

Exposant (astuce HTML) E = mc\<sup\>2\</sup\> →
Exposant : E = mc<sup>2</sup>

Indice : H\<sub\>2\</sub\>O →
Indice : H<sub>2</sub>O

## Mathématiques

Mathématiques en ligne : \$E = m c^2$ et $a^2 + b^2 = c^2$. →
Mathématiques en ligne : $E = m c^2$ et $a^2 + b^2 = c^2$.


Formule affichée : \$\$sum_(k=1)^n k = (n(n+1)) / 2\$\$ →

Formule affichée : $$sum_(k=1)^n k = (n(n+1)) / 2$$

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
Le texte alternatif n'est pas pris en charge dans ce format. La légende affiche uniquement le numéro de figure.

```markdown
![[_assets/laptop.png|150]]
```

![[_assets/laptop.png|150]]

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

## Notes de bas de page

Les notes de bas de page sont placées en ligne dans le texte.[^1] Une deuxième note de bas de page peut suivre immédiatement.[^2]

[^1]: C'est la première note de bas de page. Elle apparaît en bas de la page.
[^2]: C'est la deuxième note de bas de page.

## Addendum — Remarques

Voici un addendum avec des remarques.

## Addendum — Remarques supplémentaires

D'autres remarques.
