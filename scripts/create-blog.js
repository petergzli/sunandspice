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
  title: "The Ancient Science of Ayurveda — And Why Turmeric Is Its Golden Star",
  author: "Sun & Spice",
  tags: "ayurveda, turmeric, skincare, wellness, ingredients",
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
  .ss-article em { font-style: italic; }
  .ss-article .ss-pullquote { font-family: var(--font-heading--family); font-size: 1.375rem; text-align: center; padding: 2.5em 1.5em; margin: 2.5em 0; border-top: 1px solid rgba(0,0,0,0.08); border-bottom: 1px solid rgba(0,0,0,0.08); letter-spacing: -0.01em; line-height: 1.5; font-weight: 400; }
  .ss-video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 2.5em 0; border-radius: 4px; }
  .ss-video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
</style>

<div class="ss-article">

<p class="ss-lead">Long before modern skincare labs and clinical trials, there was Ayurveda — a 5,000-year-old system of natural healing rooted in the belief that true beauty starts from within. Originating in India, Ayurveda (meaning "the science of life") isn't just medicine. It's a philosophy. A way of living in harmony with your body, your environment, and the natural world.</p>

<p>At Sun &amp; Spice, Ayurveda isn't a trend we're borrowing. It's the foundation everything we create is built on.</p>

<h2>What Is Ayurvedic Medicine?</h2>

<p>Ayurveda is one of the world's oldest holistic healing systems. It's built on the idea that health and wellness depend on a delicate balance between mind, body, and spirit. Rather than treating symptoms, Ayurveda addresses the root cause — using natural ingredients, dietary wisdom, and daily rituals to restore balance.</p>

<p>Central to Ayurveda is the concept of the three doshas — <strong>Vata</strong>, <strong>Pitta</strong>, and <strong>Kapha</strong> — energies that govern everything from your digestion to your skin type. When your doshas are balanced, your skin glows. When they're not, inflammation, dullness, and breakouts follow.</p>

<div class="ss-pullquote">This is where the right ingredients make all the difference.</div>

<h2>Turmeric: The Golden Goddess of Ayurveda</h2>

<p>If Ayurveda had a single MVP ingredient, it would be turmeric. Known as <em>Haridra</em> in Sanskrit — literally "the golden one" — turmeric has been used for thousands of years in Ayurvedic practice for everything from wound healing to skin brightening to reducing inflammation.</p>

<ul>
  <li><strong>Curcumin</strong>Turmeric's active compound is a potent anti-inflammatory and antioxidant. It fights the free radicals that cause premature aging and dull skin.</li>
  <li><strong>Natural Brightening</strong>Inhibits excess melanin production, helping to even out skin tone and fade hyperpigmentation over time.</li>
  <li><strong>Antibacterial</strong>Fights acne-causing bacteria without stripping your skin's natural moisture barrier.</li>
  <li><strong>Universal Balance</strong>One of the rare Ayurvedic ingredients that balances all three doshas — works for every skin type.</li>
</ul>

<p>In traditional Ayurvedic practice, brides would apply turmeric paste before their wedding for radiant, glowing skin. That ritual wasn't just ceremonial — it was science passed down through generations.</p>

<h2>See It in Action</h2>

<p>Want a deeper dive into what makes turmeric so remarkable? Watch this:</p>

<div class="ss-video-wrapper">
  <iframe src="https://www.youtube.com/embed/V9ll-bsBRd8" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>
</div>

<h2>Why We Built Sun &amp; Spice Around It</h2>

<p>We created Sun &amp; Spice because we believe the next generation of skincare doesn't come from a lab — it comes from the earth. Turmeric is our hero ingredient because it works. Not in a vague, "wellness buzzword" way. In a visible, feel-it-on-your-skin way.</p>

<p>Our <strong>Ayurvedic Turmeric Glow Pads</strong> combine turmeric with kojic acid for a one-two punch: ancient Ayurvedic wisdom meets modern efficacy. The result? Brighter skin, reduced hyperpigmentation, and a natural glow — no harsh chemicals required.</p>

</div>
  `,
  published: false, // set to true when ready to go live
};

// ============================================================

// Set to an article ID to update instead of create, or leave null to create new
const UPDATE_ARTICLE_ID = 595036143849;

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
