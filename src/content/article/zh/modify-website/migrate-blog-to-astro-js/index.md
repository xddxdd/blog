---
title: '使用 Astro.js 重构我的博客'
categories: 网站与服务端
tags: [Astro.js, 博客]
date: 2024-04-20 16:36:14
---

# 前言

差不多四年半
前，[我把博客系统从 Typecho 迁移到了 Hexo](https://lantian.pub/article/modify-website/switching-to-hexo-static-site-generator.lantian/)。Hexo
是一款静态网页生成器（Static Site Generator），本身无需连接 MySQL、PostgreSQL 等
数据库动态生成网页，而是根据给定的 Markdown 文章文件一次性生成所有的 HTML 网页。
相比于 WordPress、Typecho 等动态方案，预先生成静态网页不需要服务器支持 PHP 等动
态语言，对服务器的性能压力更低。

但是 Hexo 本身并不
新，[它的第一个版本发布于 2013 年 7 月](https://github.com/hexojs/hexo/releases/tag/1.0.0)。
当时以 React 为首的单页应用框架刚刚发布（React：2013 年 5 月），Webpack 等现代前
端流程必须的框架也还不存在（Webpack：2014 年 2 月），因此 Hexo 理所当然的没有用
上这些工具，而是停留在拼接 HTML 字符串的时代。Hexo 常用的几个主题模板系统
EJS，Pug 等都是基于字符串拼接的模板系统。

没有了现代前端流程，就意味着：

- 我需要手动处理拼接 HTML 的所有细节。每次修改模板都让我想起写 PHP 的美好时光。
- 我无法方便地使用 Sass，PostCSS 等 CSS 工具，Unified.js（Remark/Rehype）等可扩
  展 Markdown 解析器。虽然有一些 Hexo 插件可以调用这些功能，但它们大都停留在“能
  跑就行”的阶段，只支持原作者用到的几个功能，而且依赖版本还停留在原作者编写插件
  的时代。
  - 例如：[hexo-renderer-webpack](https://github.com/nejj/hexo-renderer-webpack)
    的依赖版本停留在 5 年
    前。[hexo-renderer-sass](https://github.com/knksmith57/hexo-renderer-sass)
    最后一次更新是 10 个月
    前。[hexo-renderer-unified](https://github.com/LikaKavkasidze/hexo-renderer-unified)
    也停留在 5 年前。
  - 不过我确实有办法使用 Webpack：我单独写了一套 Webpack 配置文件，在 CI 的构建
    脚本里加一步调用 Webpack，把生成的 JS、CSS 放进 Hexo 的主题目录，然后在 Hexo
    的模板里手写 HTML 调用。

除此之外，还有另外几个原因促使我寻找新的静态网页生成器框架：

- 即使是最新的 7.x 版本，Hexo 也还无法在主题、插件中使用 ESM Module，也就意味着
  难以使用 Typescript。而众所周知，手写弱类型的 Javascript 很容易写出 Bug。

![Javascript Trinity](/usr/uploads/202404/the-javascript-trinity.jpg)

（图源 [https://javascriptwtf.com/](https://javascriptwtf.com/)）

- Hexo 无法很好支持一些我的个人需求，例如多语言支持。这些都需要我写插件对逻辑进
  行定制或者替换。随着定制进行，我发现整套系统成了忒修斯之船：如果我换掉了 Hexo
  的一堆功能，那我还用 Hexo 干什么？

因此为了满足我的需求，我开始寻找新的静态网站生成方案。

# 方案选择

我对新方案有以下要求：

- 能够集成现代的前端工具链。
- 做好将模板转换成 HTML/CSS/JS 这一步，而且模板格式最好接近 React JSX，而非手动
  拼接字符串。
  - 但是我不想要将整个网页放在浏览器端用 Javascript 渲染的笨重方案，我的个人博客
    不是复杂的单页应用。我希望 Javascript 是博客网页的可选项，而不是必须部分。
- 有一个可定制的网页路由系统。我需要保持迁移前后每篇文章的 URL 不变。
- 最好有一套简单的文章管理系统，可以加载我的 Markdown 文章并且读取它们的
  Frontmatter 中的信息。但因为手写一套文章管理系统也很简单，所以这不是必须项。

于是经过搜索，我考虑了以下几个方案：

## React、Vue、Svelte 等 SPA 单页应用方案

React 是现代单页应用框架的祖师爷，可以说完全改变了前端的开发方式。选择 React 自
然不会在使用现代前端工具链时遇到问题，因为 React 就是现代前端本身，绝大多数前端
工具开发初始就会考虑到对 React 的支持。

但是 React 有一个很大的缺点：它的整个网页都是在浏览器上用 Javascript 渲染的。这
就意味着：

- 用户浏览网页时需要加载一个很大的 Javascript 文件，然后消耗相当多的 CPU 资源渲
  染出 HTML DOM。
- 如果用户难以/不想使用 JS，例如开了 NoScript 插件，或者网络连接很慢，那么他们将
  完全无法查看网页内容，而不是像传统 HTML 一样，即使没有了 CSS/JS 也至少可以看到
  文字内容。

简单的说，我希望禁用 JS 的浏览器也可以正常打开网页（可能丢失一些不重要的功能）。
因此我排除了 React 框架，以及与其类似的 Vue、Svelte 等面向单页应用的网页框架。

## Sukka 的 Hexo + Next.js 方案

[苏卡卡在 2022 年将自己的博客从纯 Hexo 迁移到了 Hexo + Next.js 方案](https://blog.skk.moe/post/use-nextjs-and-hexo-to-rebuild-my-blog/)。
他保留了 Hexo 作为文章管理系统以及使用少量插件，而博客网页本身使用 Next.js 框架
生成。

相比于 React，Next.js 会预先渲染出整个 HTML DOM，因此即使禁用 Javascript 也可以
看到网页的基本内容。网页加载完成后，Next.js 框架的 Javascript 库再给浏览器端的静
态组件加上单页应用的动态功能。

这种方案确实能满足我的“Javascript 必须可选”的要求，但是依然有一些问题：

- Next.js 加载的额外 JS 代码我基本用不到。
  - 单页应用主要用于与用户有大量交互的网站，但我的博客以文章内容为主，并没有那么
    多交互控件。
  - 单页应用的另一个主要优势是无缝加载，而我使用
    [Instant.page](https://instant.page/) 加浏览器缓存也可以做到很快的加载速度。
- 苏卡卡选择 Hexo 是因为他是 Hexo 的核心开发者，Hexo 刚好可以满足他的需求，而我
  不是。我不需要 Hexo 的复杂的文章管理逻辑，因为我不使用草稿，不需要自动帮我生成
  文章模板，几乎不会使用 `hexo generate` 以外的任何命令。而且我本身就会在 Hexo
  的文章、页面列表上做二次过滤，来满足我的多语言需求。

因此我依然没有选择这种方案，而是选择了另一款框架：

# 最终方案：Astro.js

[Astro.js](https://astro.build/) 宣称它是“为内容网站设计的网页框架”。它和
React、Next.js 等针对单页应用设计的网页框架有很大的不同：

- Astro.js 不支持单页应用的复杂组件。但这也意味着它本身不需要在最终网页中引入额
  外的 JS 代码。如果我不主动加入 JS，Astro.js 生成的网页就会是一行 JS 代码都没有
  的纯静态网页。
- 但是这也不意味着网站上一点复杂功能都不能有。Astro.js 的主打功能 Island（岛
  屿），可以在页面中生成一些互相隔离的区域，并在其中使用 React、Vue 等框架。由于
  岛屿间互相隔离，你甚至可以混用不同网页框架。

除此以外，Astro.js 也满足了我的其它要求：

- Astro.js 的模板是拼接类似 JSX 的组件，而不是拼接 HTML 字符串。如果你有 React
  开发经验，你会觉得模板语法很熟悉。
- Astro.js 自带一套路由系统，可以完全自定义每个页面的地址，也可以用同一模板为每
  篇文章批量生成页面。
- Astro.js 自带一套很简单的文章管理系统（称为 Collection），支持 Markdown 和
  MDX。而且它除了加载 Markdown Frontmatter 和渲染 Markdown 之外不做任何事，给用
  户最大的自由度。
- Astro.js 基于现代前端工具链（Rollup.js，Vite.js，Unified.js 等）开发，对各种插
  件有良好的支持。

但是 Astro.js 不是一个开箱即用的博客系统，它只是一套框架，还需要做不少的开发。我
在开发博客系统时，也遇到了 Astro.js 的一些限制：

- Astro.js 缺失一个比较重要的功能：无法将 Astro 组件单独渲染成 HTML，只能渲染整
  个网页。这导致获取文章摘要比较困难，但在整个网页渲染过程中是可以获取组件 HTML
  的，因此有技巧可以实现。
- Astro.js 依然有少量用户无法操控的细节，例如它会自动将网页用到的 JS 和 CSS 插入
  `<head>` 中，我无法在渲染中控制位置，只能在 HTML 生成完毕后做后处理。

# 博客系统架构

选定了方案，就可以开始开发博客系统了。我的整个过程的所有 commit 可以在
[GitHub 上的 astro-dev 分支](https://github.com/xddxdd/blog/tree/astro-dev)看
到。

## 生成基础模板

Astro.js 本身提供了一个非常简单的博客模板，可以用 `npm create astro@latest` 生
成：

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

## 文章显示

Astro.js 自带一套很简单的文章管理系统（称为 Collection），可以自动加载 Markdown
文件，读取它们 Frontmatter 中的信息。在使用博客模板生成完项目后，可以找到
`src/content/config.ts` 这个文件：

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

// 注：在 Typescript 中 { blog } 等价于 { blog: blog }
export const collections = { blog }
```

这个文件定义了一个名为 `blog` 的 Collection，并且设置了
`title`，`description`，`pubDate`，`updatedDate`，`heroImage` 五项要从 Markdown
Frontmatter 中读取的信息。这些参数和 Hexo 使用的不太一样，所以我们把它改成类似
Hexo 的格式：

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

（我实际使用的更复杂的 `config.ts` 可以在
[https://github.com/xddxdd/blog/blob/astro-dev/src/content/config.ts](https://github.com/xddxdd/blog/blob/astro-dev/src/content/config.ts)
看到）

下一步是把文章放进 `src/content/[Collection 名字]` 这个文件夹。因为我把文章的
Collection 改名成了 `article`，所以我把所有文章都复制到了 `src/content/article`
这个文件夹下。

有了这组 Collection，接下来就要读取 Collection 的文章列表并生成网页了。Astro 的
博客模板在 `src/pages/blog/[...slug].astro` 提供了一个简单的例子：

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

这个模板在 `getStaticPaths()` 函数中使用 `getCollection('blog')` 读取 `blog`
Collection 下的所有文章，并为每篇文章生成一个 `{params: ..., props: ...}` 的对
象。`params` 中的参数会用于生成 URL，例如 `slug` 参数就会替换掉文件路径中的
`[...slug]` 这一部分。而 `props` 的参数会被传递给 Astro 模板，可以用
`const post = Astro.props` 读取整个 `props` 对象。由于 这里 `getStaticPaths()`
返回的 `props` 参数是文章本身，所以 `Astro.props` 的返回值就是这篇文章。

因为我改了 Collection 的格式，所以模板也要相应修改，主要是把 `blog` 改成
`article`：

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

（我实际使用的更复杂的模板可以在
[https://github.com/xddxdd/blog/blob/astro-dev/src/pages/%5B...language%5D/article/%5B...path%5D.lantian/index.astro](https://github.com/xddxdd/blog/blob/astro-dev/src/pages/[...language]/article/[...path].lantian/index.astro)
看到）

## 多语言

我下一个要实现的功能是多语言。我预先将中文文章放在了 `src/content/article/zh`，
英文文章放在 `src/content/article/en`。

这样我就可以根据文章的文件路径判断语言了：

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

（我实际使用的完整代码可以在
[https://github.com/xddxdd/blog/blob/astro-dev/src/lib/posts.ts](https://github.com/xddxdd/blog/blob/astro-dev/src/lib/posts.ts)
看到）

这段代码从文章的 `post.slug` 参数获取文件在 `src/content/article` 下的路径，然后
切出路径第一段的语言代码。

有了语言代码，我们就可以在模板中根据语言生成网页路径了。我的模板在
`src/pages/[...language]/article/[...path].lantian/index.astro` 路径下：

```astro
---
import PageLayout from '../../../../components/PageLayout.astro'
import PagePost from '../../../../components/PagePost.astro'
import { Post, getPosts } from '../../../../lib/posts'

export async function getStaticPaths() {
  const posts = await getPosts()
  return posts.map((post, index) => ({
    params: {
      // 遵循 src/content/article 下的原始路径，path 是我在前面的 Post 类中定义的
      path: post.path,
      // 路径以 [...language] 形式定义并且设置为 undefined 代表省略路径中这一项
      // 我的英文文章在 /en/article 下，而中文文章在 /article 下，没有前缀
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

（我实际使用的更复杂的模板可以在
[https://github.com/xddxdd/blog/blob/astro-dev/src/pages/%5B...language%5D/article/%5B...path%5D.lantian/index.astro](https://github.com/xddxdd/blog/blob/astro-dev/src/pages/[...language]/article/[...path].lantian/index.astro)
看到）

由于 Hexo 的 URL 也是根据 Markdown 文件的路径生成的，因此所有文章的 URL 都不会
变。

## 文章摘要

有了文章内容，接下来就要在文章列表中显示文章摘要。Astro 的默认博客模板没有提供这
个功能，只会显示文章标题和图片。但是，我在实现摘要功能时遇到了一点困难。

我的第一反应是，Astro 会提供一个将组件渲染成 HTML 的接口，类似于：

```typescript
const component = PostContent(post)
const html = component.renderToHTML()
const excerpt = createExcerpt(html)
```

但是查找一圈后，发现 Astro.js 还没有实现这个功
能：[https://github.com/withastro/roadmap/issues/533](https://github.com/withastro/roadmap/issues/533)

不过 Astro.js 只是无法单独渲染某个组件，在渲染整个页面的过程中，还是可以用 Slot
功能获取组件的 HTML 的。

Astro.js 的 Slot 功能类似于 React 的 `props.children`，用于传递子组件。例如，我
有一个组件 `PostExcerpt.astro`：

```astro
---
import { createExcerpt } from '../../lib/utils'

const html = await Astro.slots.render('default')
const excerpt = createExcerpt(html)
---

<p>{excerpt}</p>

```

（我使用的完整组件可以在
[https://github.com/xddxdd/blog/blob/master/src/components/fragments/PostExcerpt.astro](https://github.com/xddxdd/blog/blob/master/src/components/fragments/PostExcerpt.astro)
看到）

如果我们向这个组件传递一个子组件：

```astro
---
---
<PostExcerpt>
 <p>A really really long post content...</p>
</PostExcerpt>
```

`PostExcerpt.astro` 组件就可以通过 `await Astro.slots.render('default')` 获取
`<p>A really really long post content...</p>` 这个子组件的 HTML 渲染结果了。

接下来，它就可以进一步调用 `createExcerpt` 函数，从文章的完整 HTML 中提取摘要。

（更详细的 Slot 功能介绍请参阅官方文
档：[https://docs.astro.build/zh-cn/basics/astro-components/#slots](https://docs.astro.build/zh-cn/basics/astro-components/#slots)）

## 分页

下一步是实现主页文章列表的分页。Astro 的默认博客模板会将所有文章显示在同一页上，
如果博客中文章较多，网页会非常长，难以导航。因此我先实现了一个分页函数，将文章列
表拆分成 10 篇文章的小段：

```typescript
// 每页文章数
const POSTS_PER_PAGE = 10

// 我的模板使用的分页参数
export type PaginationProps = {
  numPages: number    // 总页数
  currentPage: number // 当前页码
  basePath: string    // 基础路径，最终路径是 ${basePath}/page/${currentPage}
}

export type PaginatedProps = {
  pagination: PaginationProps // 当前分页的参数
  posts: Post[]               // 当前分页的文章列表
}

export function getStaticPathsForPaginate(
  posts: Post[],
  basePath: string,
  additionalParams?: Record<string, string>,
  additionalProps?: Record<string, any>
) {
  // 总页数
  const numPages = Math.ceil(posts.length / POSTS_PER_PAGE)
  return [...Array(numPages).keys()].map(i => ({
    params: {
      // 多语言支持省略
      language: undefined,
      // 在路径中添加 page/2，page/3 这样的页码
      // 如果是第一页，就不用加 page/1 了
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

（我实际使用的完整代码可以在
[https://github.com/xddxdd/blog/blob/astro-dev/src/lib/posts.ts](https://github.com/xddxdd/blog/blob/astro-dev/src/lib/posts.ts)
看到）

然后从页面模板中调用这个分页函数。我的主页文章列表模板位于
`src/pages/[...language]/[...page_prefix]/index.astro`：

```astro
---
import { getPosts, getStaticPathsForPaginate } from '../../../lib/posts'
import type { PaginatedProps } from '../../../lib/posts'

export async function getStaticPaths() {
  const posts = await getPosts()
  return getStaticPathsForPaginate(posts, '')
  // 第一页时，函数返回 params 中的 page_prefix 为 undefined，此时路径中没有页码
  // 第二页开始，page_prefix会插入路径中，形成 /page/2 的路径
}

type Props = PaginatedProps
const { posts } = Astro.props

// 其余逻辑省略
```

这样我们就生成了 `/` 这个第一页的路径，以及 `/page/2`，`/page/3` 等其余页码的路
径。

## 匹配 Hexo 的 URL

下一步是实现 Hexo 自动生成的其它页面，例如分类页面
`/category/[分类名]`，`/category/[分类名]/page/[页码]`，以及标签页面
`/tag/[标签名]`，`/tag/[标签名]/page/[页码]`。

这些页面除了要根据分类过滤文章之外，其余实现和主页文章列表并无区别。以分类页面为
例，我们创建
`src/pages/[...language]/category/[category]/[...page_prefix]/index.astro` 这个
模板文件：

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
      // 当前分类的所有文章
      postsForCategory,
      // 分类的基础路径，用于提供给分页选择组件
      `/category/${categoryInUrl}`,
      // additionalParams 参数，将分类加到 URL 中
      { category: category },
      // additionalProps 参数，将分类名加到 Astro.props.中
      { category: category }
    )
  })
}

const { posts, category } = Astro.props

// 其余逻辑省略
```

这样，我们可以将所有该分类的文章显示在 `/category/[分类名]` 或者
`/category/[分类名]/page/[页码]` 这个路径上了。

## Island（岛屿）功能

Astro.js 的主打功能 Island（岛屿），可以以 `.astro` 文件为单位，在页面中生成一些
互相隔离的区域。这些隔离功能包括：

- CSS 隔离。假设我在 `src/components/a.astro` 中添加以下的 HTML/CSS 代码：

```html
<p class="my-class">Hello World</p>

<style>
  .my-class {
    font-size: 100px;
  }
</style>
```

Astro.js 会对上述 HTML 和 CSS 进行处理，并打上一个 `data-astro-cid` 开头的标签：

```html
<p class="my-class" data-astro-cid-123456>Hello World</p>

<style>
  .my-class[data-astro-cid-123456] {
    font-size: 100px;
  }
</style>
```

这样这个 CSS 就只对上面这个 `p` 标签生效了。

这个 `data-astro-cid` 标签对于所有来自 `src/components/a.astro` 的 HTML/CSS 都是
相同的，因此上面的 CSS 会应用到所有的来自 `a.astro` 的 HTML。但是假设我有另一个
组件 `src/components/b.astro`，它会有一个不同的标签，例如
`data-astro-cid-654321`，这样 `a.astro` 的 CSS 就不会对 `b.astro` 生效了。

这在写 CSS 时是一个非常好用的功能，调整网页一个部分的 CSS 时不用担心影响到其余部
分的效果了。

- Javascript 组件隔离

如果我的 Astro 模板中有 Javascript 代码：

```astro
---

---
<div id="test">Hello world</div>

<script>
document.getElementById("test").innerHTML = "Hi there";
</script>
```

Astro.js 会自动为这个组件生成一个岛屿，并在网页加载完成后，再执行这个岛屿的
Javascript 代码。这个岛屿与网页的其余部分完全独立，因此不会拖慢其余部分的加载速
度。

除了提高加载速度，这个特性还简化了 `window.onload` 的使用。在传统前端上，如果我
们想在网页加载时再执行代码，可以这样做：

```javascript
window.onload = () => {
  console.log('Hello World')
}
```

但如果我们有多个函数需要执行呢？如果简单地覆盖 `window.onload` 会导致前一个函数
不被执行：

```javascript
window.onload = () => {
  console.log('这个函数不会被执行')
}
window.onload = () => {
  console.log('Hello World')
}
```

因此我们需要一些更复杂的处理：

```javascript
function addLoadEvent(o) {
  // 记录先前的 window.onload
  var n = window.onload
  'function' != typeof window.onload
    ? (window.onload = o)
    : (window.onload = function () {
        // 如果之前设置了 window.onload，就同时执行先前设置的函数
        n && n(), o()
      })
}

addLoadEvent(() => {
  console.log('这个函数现在会被执行')
})
addLoadEvent(() => {
  console.log('Hello World')
})
```

可行，但有点麻烦。不过有了 Astro.js，上述这些流程都会被自动化：

```astro
---

---
<div id="test">Hello world</div>

<script>
// 这段代码会在整个网页加载完成后再执行，无需其余设置
document.getElementById("test").innerHTML = "Hi there";
</script>
```

下面是我使用岛屿加载 Javascript 的两个例子：

- `WalineComment.astro`，用于加载 Waline 评论系统的评论
  框：[https://github.com/xddxdd/blog/blob/astro-dev/src/components/fragments/WalineComment.astro](https://github.com/xddxdd/blog/blob/astro-dev/src/components/fragments/WalineComment.astro)
- `WalineRecentComments.astro`，用于显示 Waline 评论系统的近期评
  论：[https://github.com/xddxdd/blog/blob/astro-dev/src/components/fragments/WalineRecentComments.astro](https://github.com/xddxdd/blog/blob/astro-dev/src/components/fragments/WalineRecentComments.astro)

## 后处理插件（例：CSS 内联）

Astro.js 主页上有一个插件（Integrations）列表，提供了很多可以提供额外功能的插
件：[https://astro.build/integrations/](https://astro.build/integrations/)

这里我以一个插件 [Inline](https://github.com/Playform/Inline) 为例，它使用
Google 的 [critters](https://github.com/GoogleChromeLabs/critters) 项目，自动将
当前页面用到的 CSS 内联到网页中，以提高网页加载速度。

首先从 NPM 安装 Inline 插件：

```bash
npm install --save @playform/inline
```

然后修改 `astro.config.ts`，将插件添加到 `defineConfig` 的 `integrations` 配置项
中：

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

之后，你用 `astro build` 命令生成的网页都会自动被优化。

类似的，Astro 还提供了很多常用的插件：

- MDX 支
  持：[https://docs.astro.build/en/guides/integrations-guide/mdx/](https://docs.astro.build/en/guides/integrations-guide/mdx/)
- 生成
  Sitemap：[https://docs.astro.build/en/guides/integrations-guide/sitemap/](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- React 支
  持：[https://docs.astro.build/en/guides/integrations-guide/react/](https://docs.astro.build/en/guides/integrations-guide/react/)

你可以用类似的方法，非常简单地加载这些插件。

# 总结

我已经在 2024 年 3 月 18 日将整个博客系统迁移到 Astro.js。整个迁移过程中，所有网
页 URL 均保持不变，我的网页主题模板也原样迁移成功。对于访客来说，整个博客的内
容、样式和功能应该没有任何变化。但是对于我来说，更好的开发体验有利于我方便地实现
更复杂的功能，测试最新的前端工具，以及进行进一步的性能优化。

整个过程的所有 commit 可以在
[GitHub 上的 astro-dev 分支](https://github.com/xddxdd/blog/tree/astro-dev)看
到。
