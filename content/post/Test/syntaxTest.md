---
title: "Markdown Syntax Guide"
date: 1970-01-01T18:58:11+08:00
summary: "测试"
# tags: ['/img/test/下载.png']
# heroimage: '/img/test/下载.png'
images: ['/img/test/google.png', '/img/test/google.png']
categories: ["Test"]
---
# H1

## H2

### H3

#### H4

##### H5

###### H6

This article offers a sample of basic Markdown syntax that can be used in Hugo content files, also it shows whether basic HTML elements are decorated with CSS in a Hugo theme.

## Headings

The following HTML `<h1>`—`<h6>` elements represent six levels of section headings. `<h1>` is the highest section level while `<h6>` is the lowest.

## Paragraph

Xerum, quo qui aut unt expliquam qui dolut labo. Aque venitatiusda cum, voluptionse latur sitiae dolessi aut parist aut dollo enim qui voluptate ma dolestendit peritin re plis aut quas inctum laceat est volestemque commosa as cus endigna tectur, offic to cor sequas etum rerum idem sintibus eiur? Quianimin porecus evelectur, cum que nis nust voloribus ratem aut omnimi, sitatur? Quiatem. Nam, omnis sum am facea corem alique molestrunt et eos evelece arcillit ut aut eos eos nus, sin conecerem erum fuga. Ri oditatquam, ad quibus unda veliamenimin cusam et facea ipsamus es exerum sitate dolores editium rerore eost, temped molorro ratiae volorro te reribus dolorer sperchicium faceata tiustia prat.

Itatur? Quiatae cullecum rem ent aut odis in re eossequodi nonsequ idebis ne sapicia is sinveli squiatum, core et que aut hariosam ex eat.

## Blockquotes

The blockquote element represents content that is quoted from another source, optionally with a citation which must be within a `footer` or `cite` element, and optionally with in-line changes such as annotations and abbreviations.

#### Blockquote without attribution

> Tiam, ad mint andaepu dandae nostion secatur sequo quae. **Note** that you can use *Markdown syntax* within a blockquote.

#### Blockquote with attribution

> Don’t communicate by sharing memory, share memory by communicating.
> — Rob Pike[1](https://hugo-paper.vercel.app/post/markdown-syntax/#fn:1)

## Tables

Tables aren’t part of the core Markdown spec, but Hugo supports supports them out-of-the-box.

| Name  | Age  |
| ----- | ---- |
| Bob   | 27   |
| Alice | 23   |

#### Inline Markdown within tables

| Italics   | Bold     | Code   |
| --------- | -------- | ------ |
| *italics* | **bold** | `code` |

## Code Blocks

#### Code block with backticks

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Example HTML5 Document</title>
  </head>
  <body>
    <p>Test</p>
  </body>
</html>
```

#### Code block indented with four spaces

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Example HTML5 Document</title>
</head>
<body>
  <p>Test</p>
</body>
</html>
```

#### Code block with Hugo’s internal highlight shortcode

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Example HTML5 Document</title>
</head>
<body>
  <p>Test</p>
</body>
</html>
```

## List Types

#### Ordered List

1. First item
2. Second item
3. Third item

#### Unordered List

- List item
- Another item
- And another item

#### Nested list

- Fruit
  - Apple
  - Orange
  - Banana
- Dairy
  - Milk
  - Cheese

## 单词解释
term
: definition
## 图片
![图标](/img/author/head.jpg)

## Other Elements — abbr, sub, sup, kbd, mark

GIF is a bitmap image format.

H2O

Xn + Yn = Zn

Press CTRL+ALT+Delete to end the session.

Most salamanders are nocturnal, and hunt for insects, worms, and other small creatures.

The above quote is excerpted from Rob Pike’s talk during Gopherfest, November 18, 2015.
