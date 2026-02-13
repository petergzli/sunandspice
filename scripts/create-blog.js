/**
 * Create a blog post on Shopify via the Admin API.
 *
 * Usage:
 *   npm run blog:create
 *
 * You can customize the post by editing the `post` object below,
 * or modify this script to accept arguments / read from a file.
 */

import "dotenv/config";

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = "2026-01";

if (!STORE || !TOKEN) {
  console.error("Missing SHOPIFY_STORE or SHOPIFY_ACCESS_TOKEN in .env");
  console.error("Run `npm run auth` first to get an access token.");
  process.exit(1);
}

const BASE_URL = `https://${STORE}/admin/api/${API_VERSION}`;

async function shopifyRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`API error (${res.status}):`, JSON.stringify(data, null, 2));
    process.exit(1);
  }
  return data;
}

// --- List existing blogs ---
async function listBlogs() {
  const { blogs } = await shopifyRequest("/blogs.json");
  return blogs;
}

// --- Create a blog (container) if needed ---
async function findOrCreateBlog(title = "News") {
  const blogs = await listBlogs();
  const existing = blogs.find((b) => b.title.toLowerCase() === title.toLowerCase());
  if (existing) {
    console.log(`Using existing blog: "${existing.title}" (ID: ${existing.id})`);
    return existing;
  }

  const { blog } = await shopifyRequest("/blogs.json", {
    method: "POST",
    body: JSON.stringify({ blog: { title } }),
  });
  console.log(`Created blog: "${blog.title}" (ID: ${blog.id})`);
  return blog;
}

// --- Create a blog article (post) ---
async function createArticle(blogId, article) {
  const { article: created } = await shopifyRequest(`/blogs/${blogId}/articles.json`, {
    method: "POST",
    body: JSON.stringify({ article }),
  });
  console.log(`\n✅ Article created!`);
  console.log(`   Title: ${created.title}`);
  console.log(`   URL:   https://${STORE}/blogs/${created.handle || "news"}/${created.handle}`);
  console.log(`   ID:    ${created.id}`);
  return created;
}

// --- Update an existing article ---
async function updateArticle(blogId, articleId, article) {
  const { article: updated } = await shopifyRequest(`/blogs/${blogId}/articles/${articleId}.json`, {
    method: "PUT",
    body: JSON.stringify({ article }),
  });
  console.log(`\n✅ Article updated!`);
  console.log(`   Title: ${updated.title}`);
  console.log(`   ID:    ${updated.id}`);
  return updated;
}

// --- Find article by title ---
async function findArticle(blogId, title) {
  const { articles } = await shopifyRequest(`/blogs/${blogId}/articles.json`);
  return articles.find((a) => a.title === title);
}

// ============================================================
// Edit your blog post here
// ============================================================
const post = {
  title: "From Soil to Skin: How Turmeric Is Grown & Harvested",
  author: "Sun & Spice",
  tags: "turmeric, ayurveda, ingredients, sustainability, interactive",
  template_suffix: "turmeric-game",
  body_html: `
<style>
  .ss-article { font-size: 1.0625rem; line-height: 1.8; color: var(--color-foreground); }
  .ss-article p { margin-bottom: 1.5em; }
  .ss-lead { font-size: 1.25rem; line-height: 1.7; letter-spacing: -0.01em; margin-bottom: 2em; }
  .ss-article h2 { font-family: var(--font-heading--family); font-size: 1.5rem; text-transform: uppercase; letter-spacing: 0.05em; margin: 3em 0 1em; padding-bottom: 0.5em; border-bottom: 1px solid rgba(0,0,0,0.08); font-weight: 400; }
  .ss-article h2:first-of-type { margin-top: 2em; }
  .ss-article ul { list-style: none; padding: 0; margin: 1.5em 0 2em; display: flex; flex-direction: column; gap: 1em; }
  .ss-article ul li { padding: 1.25em 1.5em; background: rgba(0,0,0,0.02); border-left: 2px solid var(--color-foreground); line-height: 1.6; }
  .ss-article ul li strong { display: block; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.25em; }
  .ss-article .ss-pullquote { font-family: var(--font-heading--family); font-size: 1.375rem; text-align: center; padding: 2.5em 1.5em; margin: 2.5em 0; border-top: 1px solid rgba(0,0,0,0.08); border-bottom: 1px solid rgba(0,0,0,0.08); letter-spacing: -0.01em; line-height: 1.5; font-weight: 400; }
</style>

<div class="ss-article">

<p class="ss-lead">Every Sun &amp; Spice product starts with a single, remarkable root. Before turmeric becomes the golden ingredient in your skincare routine, it spends months growing in rich tropical soil, absorbing the sun and nutrients that give it extraordinary healing power. Here's the journey from earth to your skin.</p>

<h2>Where Turmeric Grows</h2>

<p>Turmeric (<em>Curcuma longa</em>) thrives in warm, humid climates with plenty of rainfall. The world's largest producers are India, Bangladesh, and parts of Southeast Asia. It needs temperatures between 20-30&deg;C and well-drained, fertile soil rich in organic matter.</p>

<p>The plant belongs to the ginger family &mdash; and like ginger, the prized part grows underground as a rhizome (a thick, knobby root system). Above ground, turmeric produces stunning broad green leaves and, occasionally, beautiful white or pink flower spikes.</p>

<h2>Planting &amp; Growing</h2>

<p>Turmeric is propagated by planting small pieces of rhizome &mdash; called "seed rhizomes" or "fingers" &mdash; about 5-7 cm deep in prepared beds. Planting typically happens at the start of the monsoon season (May-June in India).</p>

<ul>
  <li><strong>Month 1-2</strong>The rhizome sends up its first shoots. Farmers keep the soil moist and weed carefully around the young plants.</li>
  <li><strong>Month 3-5</strong>The plant grows vigorously, developing large leaves up to a meter long. The underground rhizome network begins to expand.</li>
  <li><strong>Month 6-8</strong>This is the critical period of rhizome development. The roots swell with curcumin &mdash; the compound that gives turmeric its intense golden color and potent anti-inflammatory properties.</li>
  <li><strong>Month 9-10</strong>The leaves begin to yellow and dry out, signaling that the rhizomes below are mature and ready for harvest.</li>
</ul>

<div class="ss-pullquote">It takes 8 to 10 months of patient cultivation for a single turmeric plant to develop the curcumin-rich rhizomes we use in our products.</div>

<h2>Harvesting</h2>

<p>Harvest is a hands-on process. Farmers carefully lift the entire plant and its root cluster from the soil, usually with a simple spade or by hand. Timing is everything &mdash; harvest too early and the curcumin content is low; too late and the rhizomes become fibrous and woody.</p>

<p>A healthy plant yields about 200-300 grams of fresh rhizomes. The roots are separated from the mother plant, washed clean of soil, and sorted by size and quality.</p>

<h2>Processing: From Root to Powder</h2>

<p>Fresh turmeric rhizomes must be processed quickly to preserve their potency. The traditional method involves:</p>

<ul>
  <li><strong>Boiling</strong>Rhizomes are boiled in water for 30-45 minutes until soft. This activates enzymes that enhance curcumin availability and creates the uniform golden color throughout.</li>
  <li><strong>Drying</strong>The boiled rhizomes are spread in the sun for 10-15 days, turning them regularly. Sun-drying is preferred because it preserves more of the active compounds than mechanical drying.</li>
  <li><strong>Polishing &amp; Grinding</strong>Dried rhizomes are polished to remove rough outer skin, then ground into the fine golden powder used in cooking, supplements, and skincare formulations.</li>
</ul>

<h2>Why This Matters for Your Skin</h2>

<p>The curcumin content of turmeric &mdash; the compound responsible for its anti-inflammatory, antioxidant, and brightening properties &mdash; is directly tied to how well the plant was grown and harvested. Stressed plants, premature harvests, or poor processing all reduce the potency of the final ingredient.</p>

<p>At Sun &amp; Spice, we source our turmeric from farms that follow traditional Ayurvedic cultivation practices: organic soil, natural rainfall, hand harvesting at peak maturity. This means every pad you press against your skin delivers the highest concentration of active curcumin possible.</p>

<p>Now that you know the journey &mdash; scroll up and test your turmeric instincts in the harvest game!</p>

</div>
  `,
  published: false, // set to true when ready to go live
};

// ============================================================

// Set to an article ID to update instead of create, or leave null to create new
const UPDATE_ARTICLE_ID = null;

async function main() {
  console.log("Connecting to Shopify...\n");

  const blog = await findOrCreateBlog("Learn");

  if (UPDATE_ARTICLE_ID) {
    await updateArticle(blog.id, UPDATE_ARTICLE_ID, post);
  } else {
    // Try to find existing article by title and update it
    const existing = await findArticle(blog.id, post.title);
    if (existing) {
      console.log(`Found existing article "${post.title}" (ID: ${existing.id}), updating...`);
      await updateArticle(blog.id, existing.id, post);
    } else {
      await createArticle(blog.id, post);
    }
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
