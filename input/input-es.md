---
title: Documento de ejemplo
subtitle: Este es el subtítulo
author: G. Gonzales
version: 0.9
status: Borrador
language: es
date: 14-05-2026
summary: Este documento es un documento de ejemplo para probar la funcionalidad de omd2typst. Contiene una portada, tabla de contenidos, tablas, imágenes y bloques de alerta. Opcionalmente una lista de figuras y secciones de revisión y aprobación.
figure-list: true
revision-table: Revisión
approval-table: Aprobación
---

# Documento de ejemplo

## Revisión

| Versión | Fecha      | Autor(es)      | Comentario / Cambios      |
| :----:  | ---------- | -------------- | ------------------------- |
|  0.8    | 2026-05-01 | Gonzo Gonzales | Primer borrador           |
|  0.9    | 2026-05-16 | Gonzo Gonzales | Comentarios de revisión aplicados |

## Aprobación

| Rol          | Revisor       | v0.8 | v0.9 | Comentario |
| ------------ | ------------- | :--: | :--: | ---------- |
| Security     | S.E. Curity   |  💬  |      |            |
| Governance   | Gover Nance   |  😶  |      |            |
| Arquitectura | Archi Tectuur |  👍  |      |            |

| Símbolo | Significado                          |
| ------- | ------------------------------------ |
| 👍      | De acuerdo con el contenido          |
| 💬      | Aportación o comentarios realizados  |
| 😶      | Sin respuesta recibida               |

## Introducción

Esta sección da una breve introducción al documento.

## Ejemplos de texto

Texto normal.

\*\*Texto en negrita\*\* →
**Texto en negrita**

\_Texto en cursiva\_ →
_Texto en cursiva_

\> "Cita" →
> "Cita: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." – Lorem Ipsum

\`Código en línea\` →
`texto entre comillas invertidas`

El comentario de Obsidian (\%\%Comentario de Obsidian\%\%) está en la línea de abajo; en la salida de Omd2Typst ha sido eliminado.

%% Obsidian commentaar %%

A continuación hay otra línea de comentario de Obsidian dentro de un bloque MarkDown.
```markdown
# Ejemplo de Markdown

A continuación un comentario de Obsidian

%% Comentario de Obsidian %%

Otra línea de texto.
```

## Tachado, resaltado, super- y subíndice

`~~texto tachado~~` →
~~tachado~~ texto

`==texto resaltado==` →
==resaltado== texto

Superíndice (truco HTML) E = mc\<sup\>2\</sup\> →
Superíndice: E = mc<sup>2</sup>

Subíndice: H\<sub\>2\</sub\>O →
Subíndice: H<sub>2</sub>O

## Matemáticas

Matemáticas en línea: \$E = m c^2$ y $a^2 + b^2 = c^2$. →
Matemáticas en línea: $E = m c^2$ y $a^2 + b^2 = c^2$.


Fórmula mostrada: \$\$sum_(k=1)^n k = (n(n+1)) / 2\$\$ →

Fórmula mostrada: $$sum_(k=1)^n k = (n(n+1)) / 2$$

## Listas con viñetas

Listas

### Lista desordenada

Una lista:
- Elemento a
- Elemento b
    - Subelemento a
    - Subelemento b
        - Sub-subelemento a
        - Sub-subelemento b
            - Sub-sub-subelemento a
            - Sub-sub-subelemento b
        - Sub-subelemento c
    - Subelemento c
- Elemento c

Esa fue la lista.

### Lista ordenada

1. Elemento 1
2. Elemento 2
	1. Subelemento 1
	2. Subelemento 2
		1. Sub-subelemento 1
		2. Sub-subelemento 2
			1. Sub-sub-subelemento 1
			2. Sub-sub-subelemento 2
		3. Sub-subelemento 3
	3. Subelemento 3
3. Elemento 3

## Tabla

Algunos ejemplos de tablas y su alineación.

El texto antes de la tabla.

| Componente       | Descripción |
|---|---|
| `nombre-servicio` | Nombre lógico corto del servicio (p. ej. `portal`, `api`, `intranet`) |
| `entorno`         | Entorno DTAP (`dev`, `tst`, `acc`, `prd`) |
| `aplicación`      | Código de aplicación registrado de forma centralizada |

Texto entre las tablas.

| Sin alinear | Sin alinear |
|---|---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

| Alineado a la derecha | Alineado a la izquierda |
|---:|:---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

| Centrado | Alineado a la izquierda |
|:---:|:---|
| lorem | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| ipsum | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |
| dolor | Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |

Una línea de texto después de la tabla.

## Bloque de código

Y luego un bloque de código.

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

Texto después del bloque de código.

## Sección con imágenes

Ejemplos de las diferentes formas en que se pueden mostrar imágenes en markdown. Con o sin texto alternativo o tamaño personalizado.

### Sin tamaño

Una imagen sin tamaño especificado.

```markdown
![texto alternativo](_assets/laptop.png)
```

![texto alternativo](_assets/laptop.png)

### Ancho 200 – Opción 1

El primer formato para una imagen con ancho 200.

```markdown
![texto alternativo|200](_assets/laptop.png)
```

![texto alternativo|200](_assets/laptop.png)

### Ancho 150 – Opción 2

El segundo formato para una imagen con ancho 150.
El texto alternativo no es compatible con este formato. El pie de figura muestra solo el número de figura.

```markdown
![[_assets/laptop.png|150]]
```

![[_assets/laptop.png|150]]

## Call-outs

La sintaxis de los call-outs está en inglés, por lo tanto los sub-párrafos están en inglés.

### Note

> [!note] Nota
> Este es un call-out de tipo "note".

### Info

> [!info] Información
> Este es un call-out de tipo "info".

### Tip

> [!tip] Consejo
> Este es un call-out de tipo "tip".

### Hint


> [!hint] Pista
> Este es un call-out de tipo "hint".

### Important

> [!important] Importante
> Este es un call-out de tipo "important".

### Warning

> [!warning] Advertencia
> Este es un call-out de tipo "warning".

### Caution

> [!caution] Precaución
> Este es un call-out de tipo "caution".

### Attention

> [!Attention] Atención
> Este es un call-out de tipo "attention".

### Danger

> [!danger] Peligro
> Este es un call-out de tipo "danger".

### Error

> [!error] Error
> Este es un call-out de tipo "error".

### Bug

> [!BUG] Bug
> Este es un call-out de tipo "bug".

### Quote

> [!quote] Cita
> Este es un call-out de tipo "quote".

### Cite

> [!cite] Cita o Referencia
> Este es un call-out de tipo "cite".

### Desconocido, no definido

> [!unknown] No definido, valor de reserva
> Este es un call-out de tipo "desconocido, no definido".

### Typst

En Typst se añade `breakable: false` al bloque externo de los call-outs. Esto evita que los call-outs se dividan por un salto de página.

## Casillas de verificación

Usadas regularmente en Obsidian, pero después de exportar a PDF pueden seguir siendo útiles para indicar un estado determinado.

- [ ] Vacío / por hacer
- [x] Hecho
- [/] En progreso
- [-] Cancelado
- [>] Reenviado
- [!] Importante
- [?] Pregunta
- [I] Idea
- [i] Info
- [*] Estrella

## Notas al pie

Las notas al pie se colocan en línea en el texto.[^1] Una segunda nota al pie puede seguir inmediatamente.[^2]

[^1]: Esta es la primera nota al pie. Aparece en la parte inferior de la página.
[^2]: Esta es la segunda nota al pie.

## Addendum — Notas

Aquí sigue un addendum con notas.

## Addendum — Más notas

Más notas.
