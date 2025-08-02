import type { APIContext } from 'astro'
import { Post, getPosts } from '../../../../lib/posts'

export async function getStaticPaths() {
  const posts = await getPosts()

  return Promise.all(
    posts.map(async post => ({
      params: {
        path: post.path,
        language: post.language.isDefault()
          ? undefined
          : post.language.toString(),
      },
    }))
  )
}

export async function GET(context: APIContext) {
  const { language, path } = context.params
  const post = await Post.findByLanguageAndPath(language, path || '')
  return new Response(await post.renderGophermap())
}
