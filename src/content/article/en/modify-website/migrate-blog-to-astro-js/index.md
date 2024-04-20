---
title: 'Migrating My Blog to Astro.js'
categories: 'Website and Servers'
tags: [Astro.js, Blog]
date: 2024-04-20 16:36:14
---

# Preface

Almost four and a half years ago, I
[migrated the blog's site system from Typecho to Hexo (Chinese only link)](https://lantian.pub/article/modify-website/switching-to-hexo-static-site-generator.lantian/).
Hexo is a static site generator that by itself doesn't connect to databases like
MySQL and PostgreSQL and dynamically generate pages. Instead, it generated all
HTML pages in one go based on the given Markdown files. Compared to dynamic
solutions like WordPress and Typecho, pre-generating static pages eliminates the
need of dynamic language support on the web server (like PHP), and has lower
performance requirements on the server.

Hexo itself, however, is not a new solution.
[It's first version was released back in July 2013](https://github.com/hexojs/hexo/releases/tag/1.0.0).
By then, single page application frameworks, leaded by React, were just released
(React: May 2013). Webpack and other frameworks needed in modern web frontend
workflow also did not exist (Webpack: February 2014). As expected, Hexo didn't
make use of these tools, and is instead concatenating HTML strings in the
old-fashioned way. The template systems used by Hexo, such as EJS and Pug, are
all based on string concatenation.

Not using a modern web frontend workflow means that:

- I have to manually handle all the details of concatenating HTML string. Every
  time I make changes to the templates, I got reminded of the good old days of
  working with PHP.
- I cannot easily make use of CSS tools like Sass and PostCSS, or extensible
  Markdown parsers like Unified.js (Remark/Rehype). Although there are some Hexo
  plugins that brings them into play, that usually ends at "as long as it runs"
  stage, and only supports whatever features the plugin author decides that they
  need. The dependency versions are also likely to stay in the era when the
  author first wrote the plugin.
  - For example: the dependency version of
    [hexo-renderer-webpack](https://github.com/nejj/hexo-renderer-webpack)
    stayed in 5 years ago.
    [hexo-renderer-sass](https://github.com/knksmith57/hexo-renderer-sass) was
    last updated 10 months ago.
    [hexo-renderer-unified](https://github.com/LikaKavkasidze/hexo-renderer-unified)
    is also frozen 5 years ago.
  - I do have a way to use Webpack though: I created a separate Webpack config
    file, added the necessary calls into the CI build script, which puts the
    generated JS and CSS files into the correct place in Hexo's theme directroy.
    Finally, I add the necessary calls by hand into Hexo's HTML template.

Other than that, I'm also motivated to find a new static site generator
framework for a few more reasons:

- Hexo doesn't support ESM modules in themes and plugins, even at the latest
  version of 7.x. This means that it's difficult to use Typescript. Yet it is
  widely known that hand writing weakly typed Javascript code is bound to
  attracting bugs.

![Javascript Trinity](/usr/uploads/202404/the-javascript-trinity.jpg)

(Source: [https://javascriptwtf.com/](https://javascriptwtf.com/))

- Hexo doesn't support some of my personal needs well, like multi-language
  support. These required me to customize and/or replace them with my plugins.
  As the plugins added up, I noticed that the entire system becomes a Ship of
  Theseus: why do I need Hexo after all if I'm customizing all my logics?

Therefore, to satisfy my needs, I started looking for a new static site
generator.

# Choosing Solution

I have the following requires for the new solution:

- Integrates with modern web frontend toolchain.
- Do the step of converting template to HTML/CSS/JS well, ideally with a
  template format similar to React JSX, rather than concatenating strings
  manually.
  - However, I don't want to render the entire webpage on user's browser with
    Javascript. My personal blog is not a complex single page application. I
    hope Javascript is optional for my blog's web pages, rather than mandatory.
- Have a customizable page routing system. I need to keep the post URLs
  unchanges before/after the migration.
- (Ideally) have a simple system for managing posts, to load my Markdown posts
  and read their information from their frontmatters. However, since writing a
  post management system by hand is simple enough, this is not a necessity.

After searching around, I took the following solutions into consideration:

## Single Page Applications like React, Vue, Svelte

React is the mother to all modern single page application frameworks. It
drastically changed how the web frontend development work is done. Natually, you
won't encounter issues while using modern web frontend toolchains with React,
because React is the modern web frontend itself. Most if not all frontend tools
consider React support from the beginning of their development.

But React has one major drawback: the whole web page is rendered on browser with
Javascript. This means:

- Users need to load a large Javascript file while browsing the pages, which
  consumes a lot of CPU cycles to render the HTML DOM.
- If the user cannot or doesn't want Javascript, for example using NoScript
  browser plugin or having a slow network connection, they will be completely
  unable to view the page content, unlike traditional HTMLs which allows them to
  at least see the text even without CSS/JS.

In short, I hope even browsers that have Javascript disabled can normally view
the page (while losing some less important features). Therefore, I excluded
React, as well as similar single page application frameworks like Vue and
Svelte, from my consideration.

## Sukka's Hexo + Next.js Solution

[Sukka migrated his blog from Hexo to Hexo + Next.js in 2022 (Chinese only link)](https://blog.skk.moe/post/use-nextjs-and-hexo-to-rebuild-my-blog/).
He retained Hexo to manage posts, yet used Next.js framework to render the web
pages for the blog.

Compared to React, Next.js will prerender the entire HTML DOM, so that even if
Javascript is disabled, users can see the basic content of the web page. After
the page is loaded, some Javascript code from the Next.js framework will add
dynamic features to the static components in the browser.

This solution does indeed meet my requirements for "optional Javascript", but
still have some downsides:

- I have almost zero use for the additional Javascript code added by Next.js.
  - Single page applications are mainly used for website that interacts a lot
    with users. My blog, however, is content-based and do not have as much
    interactive controls.
  - Another advantage of single page applications is seamless loading, but I can
    achieve a similar fast speed with [Instant.page](https://instant.page/) and
    browser caching.
- Sukka chose Hexo because he is a core developer for Hexo, and Hexo happens to
  satisfy his needs. I am not. I don't need the complicated system for managing
  blog posts. I don't use drafts, don't use autogenerated post templates, and
  almost never runs any command other than `hexo generate`. In addition, I
  already do another round of filtering on Hexo's post and page list to satisfy
  my multi-language support needs.

Therefore, I didn't choose this solution as well. Instead, I went with another
framework:

# Final Solution: Astro.js

[Astro.js](https://astro.build/) advertises it as "the web framework for
content-driven websites". Compared to frameworks targeted at single page
applications like React and Next.js, it has some major differences:

- Astro.js doesn't support complex components for single page applications.
  However, this also means that it doesn't need to load additional Javascript
  codes into the web page. If I do not actively add any Javascript, the web page
  generated by Astro.js will be completely static with zero Javascript code.
- But this doesn't mean there needs to be zero complex interactions on the
  website. The major selling feature of Astro.js called Island allows us to add
  isolated regions inside the webpage, and run frameworks such as React or Vue
  in them. Since the Islands are isolated from each other, you can even mix and
  match multiple frameworks.

Other than that, Astro.js also satisfies my other needs:

- The template system of Astro.js works by combining components similar to JSX,
  instead of combining HTML strings. If you have experience with React, you will
  find the template syntax familiar.
- Astro.js comes with a routing system that allows complete customization of
  each page. It also allows us to generate multiple pages for the collection of
  posts from the same template.
- Astro.js also comes with a simple post management system (called Collection),
  that supports Markdown and MDX. It doesn't do any additional processing other
  than loading Markdown Frontmatters and rendering Markdown files, which
  provides users with maximum flexibility.
- Astro.js is built on modern web frontend toolchains (Rollup.js, Vite.js,
  Unified.js, etc.), and has great support for all varieties of plugins.

However, Astro.js is not a blogging system out of the box. It's only a framework
that requires a fair bit of additional development. I also met some limitations
of Astro.js while developing my blog system:

- Astro.js misses one relatively important feature: it cannot render a single
  Astro component into HTML. It can only render an entire page at a time. This
  makes it hard to generate excerpts for my posts. However, it is still possible
  to obtain component HTMLs while rendering the entire page, so this is still
  possible to implement.
- Astro.js still has a small amount of details that the user cannot control. For
  example, it automatically inserts Javascript and CSS used by the page into
  `<head>`, with no control to specify the exact position. I had to do
  additional postprocessing after HTML generation is complete.

# Blog Architecture

After the solution is chosen, I got around to developing my blog system. All
commits from my development process can be found in
[the astro-dev branch of my GitHub](https://github.com/xddxdd/blog/tree/astro-dev).

## Generating a Basic Template

Astro.js provides a very simple blog template, which can be generated with
`npm create astro@latest`:

```bash
Need to install the following packages:
create-astro@4.8.0
Ok to proceed? (y)

 astro   Launch sequence initiated.

   dir   Where should we create your new project?
         ./blog

  tmpl   How would you like to start your new project?
         Use blog template

    ts   Do you plan to write TypeScript?
         Yes

   use   How strict should TypeScript be?
         Strict

  deps   Install dependencies?
         Yes

   git   Initialize a new git repository?
         Yes

      ✔  Project initialized!
         ■ Template copied
         ■ TypeScript customized
         ■ Dependencies installed
         ■ Git initialized

  next   Liftoff confirmed. Explore your project!

         Enter your project directory using cd ./blog
         Run npm run dev to start the dev server. CTRL+C to stop.
         Add frameworks like react or tailwind using astro add.

         Stuck? Join us at https://astro.build/chat

╭─────╮  Houston:
│ ◠ ◡ ◠  Good luck out there, astronaut! 🚀
╰─────╯
```

## Displaying Posts

Astro.js comes with a simple post management system (called Collection), that
automatically loads Markdown files and read their Frontmatter information. After
generating a project with the blog template, you can find the
`src/content/config.ts` file:

```typescript
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  type: 'content',
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
  }),
})

// Note: in Typescript, { blog } is equivalent to { blog: blog }
export const collections = { blog }
```

This file defines a Collection named `blog`, and sets five informations to be
read from Markdown Frontmatter: `title`, `description`, `pubDate`,
`updatedDate`, `heroImage`. These namings are different from what Hexo uses, so
we change it to a format similar to Hexo:

```typescript
import { defineCollection, z } from 'astro:content'

const article = defineCollection({
  type: 'content',
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    categories: z.string(),
    tags: z.array(z.string()).optional(),
    date: z.coerce.date(),
    image: z.string().optional(),
  }),
})

export const collections = {
  article: article,
}
```

(The more complex `config.ts` I actually use can be found at
[https://github.com/xddxdd/blog/blob/astro-dev/src/content/config.ts](https://github.com/xddxdd/blog/blob/astro-dev/src/content/config.ts))

Next step is to put the posts into the `src/content/[Collection Name]` folder.
Since I renamed the Collection for my posts to `article`, I'm going to copy all
my posts into the `src/content/article` folder.

With this Collection handy, we can obtain the list of posts and generate web
pages. Astro's blog template provides a simple example at
`src/pages/blog/[...slug].astro`:

```astro
---
import { type CollectionEntry, getCollection } from 'astro:content';
import BlogPost from '../../layouts/BlogPost.astro';

export async function getStaticPaths() {
	const posts = await getCollection('blog');
	return posts.map((post) => ({
		params: { slug: post.slug },
		props: post,
	}));
}
type Props = CollectionEntry<'blog'>;

const post = Astro.props;
const { Content } = await post.render();
---

<BlogPost {...post.data}>
	<Content />
</BlogPost>
```

This template reads all posts under the `blog` Collection by calling
`getCollection('blog')` from the `getStaticPaths()`, and generated an object
`{params: ..., props: ...}` for each post. Parameters in `params` are used for
generating URLs, e.g. the `slug` parameter will replace the `[...slug]` part in
the file path. Parameters in `props`, on the other hand, are passed to the Astro
template, and the entire `props` object can be read with
`const post = Astro.props`. Since the `props` parameter returned by
`getStaticPaths()` here is the post itself, the return value of `Astro.props` is
exactly the post object.

Since I changed the format of the Collection, I need to update the template as
well. Namely, I need to replace `blog` with `article`:

```astro
---
import { type CollectionEntry, getCollection } from 'astro:content';
import BlogPost from '../../../layouts/BlogPost.astro';

export async function getStaticPaths() {
  const posts = await getCollection('article');
  return posts.map((post) => ({
    params: { slug: post.slug, language: undefined },
    props: post,
  }));
}
type Props = CollectionEntry<'article'>;

const post = Astro.props;
const { Content } = await post.render();
---

<BlogPost {...post.data}>
  <Content />
</BlogPost>

```

(The more complex template I actually use can be found at
[https://github.com/xddxdd/blog/blob/astro-dev/src/pages/%5B...language%5D/article/%5B...path%5D.lantian/index.astro](https://github.com/xddxdd/blog/blob/astro-dev/src/pages/[...language]/article/[...path].lantian/index.astro))

## Multi Language Support

The next feature I'm working on is multi language support. I already placed
Chinese posts in `src/content/article/zh` and English ones in
`src/content/article/en`.

With that organization, I can determine the language of the post from its file
path:

```typescript
export class Post {
  public readonly title: string
  public readonly language: string
  public readonly path: string
  public readonly body: string

  constructor(post: CollectionEntry<'article'>) {
    this.collectionEntry = post

    const [language, ...paths] = post.slug.split('/')
    const path = paths.join('/')

    this.title = post.data.title
    this.language = language
    this.path = path
    this.body = post.body
  }

  public static fromCollectionEntry(post: CollectionEntry<'article'>): Post {
    return new Post(post)
  }
}

export async function getPosts(): Promise<Post[]> {
  return (await getCollection('article'))
    .map(Post.fromCollectionEntry)
    .sort((a, b) => b.date.valueOf() - a.date.valueOf())
}
```

(The full code I actually use can be found at
[https://github.com/xddxdd/blog/blob/astro-dev/src/lib/posts.ts](https://github.com/xddxdd/blog/blob/astro-dev/src/lib/posts.ts))

This piece of code obtains the file's path under `src/content/article` from
`post.slug`, and splits the language code from the first part of the path.

With the language code, we can generate page URLs in our templates based on the
language. I placed my template under the
`src/pages/[...language]/article/[...path].lantian/index.astro` path:

```astro
---
import PageLayout from '../../../../components/PageLayout.astro'
import PagePost from '../../../../components/PagePost.astro'
import { Post, getPosts } from '../../../../lib/posts'

export async function getStaticPaths() {
  const posts = await getPosts()
  return posts.map((post, index) => ({
    params: {
      // Follows original path under src/content/article, path was defined in Post class earlier
      path: post.path,
      // Path parts are omitted if defined as [...language] and set to undefined
      // My English posts are in /en/article and Chinese posts in /article without prefix
      language: post.language == "zh"
        ? undefined
        : post.language,
    },
    props: {
      post: post,
    },
  }))
}
type Props = {
  post: Post
}
const { post } = Astro.props
---

<PageLayout title={post.title} language={post.language} post={post}>
  <PagePost
    language={post.language}
    post={post}
  />
</PageLayout>
```

(The more complex template I actually use can be found at
[https://github.com/xddxdd/blog/blob/astro-dev/src/pages/%5B...language%5D/article/%5B...path%5D.lantian/index.astro](https://github.com/xddxdd/blog/blob/astro-dev/src/pages/[...language]/article/[...path].lantian/index.astro))

Since Hexo also generates URLs based on Markdown file paths, all posts will have
the same URL as before.

## Post Excerpt

Now we have the post content, the next step is to display the excerpt in post
lists. Astro's default blog template doesn't offer this feature, as it only
shows the title and picture of each post. However, I ran into some difficulties
while adding the excerpt feature.

My initial thought is that Astro will provide an API for rendering a component
to HTML, something similar to:

```typescript
const component = PostContent(post)
const html = component.renderToHTML()
const excerpt = createExcerpt(html)
```

But a round of searches revealed that Astro.js doesn't have this feature
implemented yet:
[https://github.com/withastro/roadmap/issues/533](https://github.com/withastro/roadmap/issues/533)

But the only limitation is that Astro.js cannot render a component
independently. It is still possible to obtain the component's HTML while
rendering the entire page using the Slot feature.

The Slot feature of Astro.js is similar to `props.children` in React. It is used
for passing child components. For example, I have a component
`PostExcerpt.astro`:

```astro
---
import { createExcerpt } from '../../lib/utils'

const html = await Astro.slots.render('default')
const excerpt = createExcerpt(html)
---

<p>{excerpt}</p>

```

(The full component I actually use can be found at
[https://github.com/xddxdd/blog/blob/master/src/components/fragments/PostExcerpt.astro](https://github.com/xddxdd/blog/blob/master/src/components/fragments/PostExcerpt.astro))

If we pass a child component to it:

```astro
---
---
<PostExcerpt>
 <p>A really really long post content...</p>
</PostExcerpt>
```

By calling `await Astro.slots.render('default')`, the `PostExcerpt.astro`
component can obtain the HTML render result of the child component
`<p>A really really long post content...</p>`.

Now, it can further make calls to the `createExcerpt` function to extract the
excerpt from the post's full HTML.

(For more detailed information for the Slot feature, please check the official
manual:
[https://docs.astro.build/en/basics/astro-components/#slots](https://docs.astro.build/en/basics/astro-components/#slots))

## Pagination

Next step is to implement pagination for the post list on home page. Astro's
default blog template will display all posts on the same page. If you have a lot
of posts on your blog, the page will be very long and be hard to navigate. I
first implemented a pagination function that splits post list into small
sections of 10 posts:

```typescript
const POSTS_PER_PAGE = 10

// Pagination properties used by my template
export type PaginationProps = {
  numPages: number    // Total number of pages
  currentPage: number // Current page number
  basePath: string    // Base path, final path will be ${basePath}/page/${currentPage}
}

export type PaginatedProps = {
  pagination: PaginationProps // Pagination properties for the current page
  posts: Post[]               // Posts in the current page
}

export function getStaticPathsForPaginate(
  posts: Post[],
  basePath: string,
  additionalParams?: Record<string, string>,
  additionalProps?: Record<string, any>
) {
  // Total number of pages
  const numPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  return [...Array(numPages).keys()].map(i => ({
    params: {
      // Multi language support is omitted here
      language: undefined,
      // Add page numbers like page/2, page/3 in URL
      // No need to add page/1 for the first page
      page_prefix: i == 0 ? undefined : `page/${i + 1}`,
      ...additionalParams,
    },
    props: <PaginatedProps>{
      pagination: <PaginationProps>{
        numPages: numPages,
        currentPage: i + 1,
        basePath: basePath,
      },
      posts: postsForLanguage.slice(
        i * POSTS_PER_PAGE,
        (i + 1) * POSTS_PER_PAGE
      ),=
      ...additionalProps,
    },
  }))
}
```

(The full code I actually use can be found at
[https://github.com/xddxdd/blog/blob/astro-dev/src/lib/posts.ts](https://github.com/xddxdd/blog/blob/astro-dev/src/lib/posts.ts))

Then call this pagination function from page templates. My home page's template
is located at `src/pages/[...language]/[...page_prefix]/index.astro`:

```astro
---
import { getPosts, getStaticPathsForPaginate } from '../../../lib/posts'
import type { PaginatedProps } from '../../../lib/posts'

export async function getStaticPaths() {
  const posts = await getPosts()
  return getStaticPathsForPaginate(posts, '')
  // On the first page, the page_prefix in the returned params is undefined, so no page number in URL
  // Starting from second page, page_prefix is added to URL, creating routes like /page/2
}

type Props = PaginatedProps
const { posts } = Astro.props

// Other logics are omitted
```

Now we have generated the path `/` for the first page, and additional pages like
`/page/2`, `/page/3`, etc.

## Matching Hexo URLs

The next step is to implement other pages that Hexo automatically generates,
including the categorization page `/category/[Category Name]`,
`/category/[Category Name]/page/[Page Number]`, and tag page
`/tag/[Tag Name]`，`/tag/[Tag Name]/page/[Page Number]`.

Other than filtering posts based on their categorization, it is no different
from the home page post list. Take the categorization page for example. Let's
create the template file
`src/pages/[...language]/category/[category]/[...page_prefix]/index.astro`:

```astro
---
export async function getStaticPaths() {
  const categories = [
    ...new Set(Object.entries(CATEGORY_MAP).map(([_, v]) => v)),
  ]
  const posts = await getPosts()

  return categories.flatMap(category => {
    const postsForCategory = posts.filter(
      post => post.category == category
    )
    return getStaticPathsForPaginate(
      // All posts under the category
      postsForCategory,
      // Base path for the category, to be provided to pagination component
      `/category/${categoryInUrl}`,
      // additionalParams parameter, to add category into URL
      { category: category },
      // additionalProps parameter, to add category to Astro..props
      { category: category }
    )
  })
}

const { posts, category } = Astro.props

// Other logics are omitted
```

In this way, we can display all posts of this category under the pages
`/category/[Category Name]` or `/category/[Category Name]/page/[Page Number]`.

## The Island Feature

The major feature of Astro.js, Island, can generate isolated areas in the page
for each `.astro` file. These isolations include:

- CSS isolation. Let's assume we have the following HTML/CSS code in
  `src/components/a.astro`:

```html
<p class="my-class">Hello World</p>

<style>
  .my-class {
    font-size: 100px;
  }
</style>
```

Astro.js will process the HTML and CSS, and add a tag starting with
`data-astro-cid`:

```html
<p class="my-class" data-astro-cid-123456>Hello World</p>

<style>
  .my-class[data-astro-cid-123456] {
    font-size: 100px;
  }
</style>
```

Now the CSS only applies to the `p` tag above.

The `data-astro-cid` tag is the same for all HTML/CSS originating from
`src/components/a.astro`, so all CSS here will apply to all HTML from `a.astro`.
But assume I have another component `src/components/b.astro`. It will get a
different tag, for example `data-astro-cid-654321`. Now the CSS from `a.astro`
will not apply to `b.astro`.

This is a handy feature while writing CSS, since you no longer worry about
changing appearance of rest of the site while adjusting CSS for a specific part
of the page.

- Javascript Component Isolation

Suppose I have Javascript code in my Astro template:

```astro
---

---
<div id="test">Hello world</div>

<script>
document.getElementById("test").innerHTML = "Hi there";
</script>
```

Astro.js will automatically generate an Island for this component, and only run
the Javascript of this Island after page load is complete. This island is
isolated from other parts of the web page, and will not slow down loading time
for other parts.

In addition to improving page load speed, this also simplifies using
`window.onload`. The old way of running a function after page is loaded is:

```javascript
window.onload = () => {
  console.log('Hello World')
}
```

But what if we have multiple functions to run? If we simply overwrite
`window.onload`, the previous function will never be executed:

```javascript
window.onload = () => {
  console.log('This function will never be executed')
}
window.onload = () => {
  console.log('Hello World')
}
```

So we need some more complex logic:

```javascript
function addLoadEvent(o) {
  // Store the previous window.onload
  var n = window.onload
  'function' != typeof window.onload
    ? (window.onload = o)
    : (window.onload = function () {
        // If window.onload was previously set, run that function as well
        n && n(), o()
      })
}

addLoadEvent(() => {
  console.log('This function is now executed')
})
addLoadEvent(() => {
  console.log('Hello World')
})
```

It works, but is a bit of hassle. With Astro.js, however, all the above are
automated:

```astro
---

---
<div id="test">Hello world</div>

<script>
// This code will be run after the entire page is loaded, with no additional config required
document.getElementById("test").innerHTML = "Hi there";
</script>
```

Here are two examples of running Javascript in Islands:

- `WalineComment.astro`, for loading the comment box of Waline comment system:
  [https://github.com/xddxdd/blog/blob/astro-dev/src/components/fragments/WalineComment.astro](https://github.com/xddxdd/blog/blob/astro-dev/src/components/fragments/WalineComment.astro)
- `WalineRecentComments.astro`, for showing recent comments from the Waline
  comment system:
  [https://github.com/xddxdd/blog/blob/astro-dev/src/components/fragments/WalineRecentComments.astro](https://github.com/xddxdd/blog/blob/astro-dev/src/components/fragments/WalineRecentComments.astro)

## Postprocess Plugins (e.g. CSS Inline)

A list of plugins (integrations) is available on the home page of Astro.js,
which provides various plugins that offer additional features:
[https://astro.build/integrations/](https://astro.build/integrations/)

I will take an example of [Inline](https://github.com/Playform/Inline) plugin.
It uses Google's [critters](https://github.com/GoogleChromeLabs/critters)
project to automatically inline CSS used in the current page, to improve the
loading speed of the web page.

First, install the Inline plugin from NPM:

```bash
npm install --save @playform/inline
```

Then modify `astro.config.ts`, and add the plugin to `integrations` under
`defineConfig`:

```typescript
import inline from '@playform/inline'

export default defineConfig({
  integrations: [
    // ...
    critters({}),
    // ...
  ],
  // ...
})
```

After that, all pages generated with `astro build` will be automatically
optimized.

Similarly, Astro provides quite a few frequently used plugins:

- MDX
  support:[https://docs.astro.build/en/guides/integrations-guide/mdx/](https://docs.astro.build/en/guides/integrations-guide/mdx/)
- Generating Sitemap:
  [https://docs.astro.build/en/guides/integrations-guide/sitemap/](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- React support:
  [https://docs.astro.build/en/guides/integrations-guide/react/](https://docs.astro.build/en/guides/integrations-guide/react/)

You can load these plugins in similar ways.

# Conclusions

I have already migrated the entire blog system to Astro.js on March 18, 2024.
All page URLs remain the same during the migration, and my blog theme template
is also migrated with the exact same look and feel. From a visitor's
perspective, there should be no change to the blog's content, style and
functionality. But for me, a better developing experience will help me implement
more complex logic on the website, test latest frontend tools, and make
additional performance improvements.

All commits from my development process can be found in
[the astro-dev branch of my GitHub](https://github.com/xddxdd/blog/tree/astro-dev).
