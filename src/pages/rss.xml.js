import rss from '@astrojs/rss';
import { getPosts } from '../lib/posts';
import { SITE_TITLE } from '../consts';

export async function GET(context) {
	const posts = await getPosts();
	return rss({
		title: SITE_TITLE,
		description: SITE_TITLE,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.slug}/`,
			pubDate: post.date,
		})),
	});
}
