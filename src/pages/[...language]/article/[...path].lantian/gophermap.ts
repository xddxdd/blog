import { getPosts, Post } from '@lib/posts'
import type { APIContext } from 'astro'

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
  if (!path) {
    throw new Error('Article path is required')
  }
  const post = await Post.findByLanguageAndPath(language, path)
  return new Response(await post.renderGophermap())
}
