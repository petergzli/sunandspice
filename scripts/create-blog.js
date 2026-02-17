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
  title: "Why Your Dark Spots Keep Coming Back — And What Actually Works",
  author: "Sun & Spice",
  tags: "hyperpigmentation, dark spots, discoloration, turmeric, melanin, curcumin, skincare science, natural treatment, brightening",
  template_suffix: "glow-cannon-game",
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

<p class="ss-lead">You use the serum. You wear the SPF. You've tried the peels. And yet the dark spots keep reappearing &mdash; sometimes in the exact same place. If this sounds familiar, you're not imagining things. Hyperpigmentation is one of the most persistent skin concerns precisely because most treatments only address the surface. The real problem is deeper.</p>

<h2>What's Actually Happening Under Your Skin</h2>

<p>Every dark spot, every patch of uneven tone, starts with one enzyme: tyrosinase. This enzyme lives inside cells called melanocytes and controls how much melanin your skin produces. When everything is working normally, melanin production is balanced &mdash; it's what gives your skin its natural color and protects it from UV damage.</p>

<p>But when something triggers those melanocytes to overproduce &mdash; sun exposure, inflammation, hormonal changes, or injury &mdash; they go into overdrive. Excess melanin gets deposited in the upper layers of your skin, and what you see on the surface is a dark spot, a patch of discoloration, or an overall uneven tone.</p>

<p>Here's the part most products ignore: once a melanocyte has been triggered, it remembers. It stays in a heightened state, ready to overproduce melanin at the slightest provocation. That's why your dark spots keep coming back. You're treating the melanin that's already there without calming the melanocyte that's making it.</p>

<h2>The Five Types of Discoloration</h2>

<ul>
  <li><strong>Post-Inflammatory Hyperpigmentation (PIH)</strong>The dark marks left behind after acne, eczema, cuts, or any skin inflammation. Your melanocytes respond to the injury by flooding the area with protective melanin. PIH is especially common in darker skin tones and can persist for months or years without treatment. The key is reducing inflammation first, then fading the deposit.</li>
  <li><strong>Sun Spots (Solar Lentigines)</strong>Flat brown spots that develop on sun-exposed areas &mdash; face, hands, chest, forearms. Years of cumulative UV exposure cause melanocytes in those areas to permanently upregulate melanin production. Unlike a tan, sun spots don't fade on their own because the melanocyte itself has been altered. Prevention and tyrosinase inhibition are the most effective approaches.</li>
  <li><strong>Melasma</strong>Larger, symmetrical patches of brown or gray-brown discoloration, most commonly on the cheeks, forehead, and upper lip. Melasma is driven primarily by hormonal changes &mdash; pregnancy, birth control, hormone therapy &mdash; combined with UV exposure. It's one of the most stubborn forms of hyperpigmentation because the hormonal trigger is ongoing. Gentle, consistent treatment works better than aggressive approaches, which can actually worsen it.</li>
  <li><strong>Acne Scars &amp; Marks</strong>Different from PIH, true acne scarring involves changes to the skin's texture and structure. But the dark discoloration that accompanies acne scarring is a pigmentation issue. Treating the pigmentation component requires both exfoliation (to remove stained surface cells) and melanin suppression (to prevent the scar site from continuing to darken).</li>
  <li><strong>General Dullness &amp; Uneven Tone</strong>Not a single spot but an overall lack of radiance. This happens when dead skin cells accumulate on the surface, scattering light unevenly instead of reflecting it. Combined with low-level inflammation and oxidative stress from pollution and UV, the result is skin that looks tired, flat, and older than it is. Regular exfoliation and antioxidant protection restore luminosity.</li>
</ul>

<div class="ss-pullquote">The reason most brightening products fail is simple: they bleach the melanin without calming the melanocyte. The spot fades, the cell keeps producing, the spot returns.</div>

<h2>Why Most Brightening Products Don't Last</h2>

<p>The majority of over-the-counter brightening products work by one of two mechanisms: chemical exfoliation (removing stained surface cells) or direct bleaching (using hydroquinone or similar agents to destroy melanin). Both produce visible results. Neither addresses the root cause.</p>

<p>Chemical exfoliation removes the dark cells you can see, but the melanocytes underneath are still overproducing. As new cells rise to the surface, they carry the same excess melanin. The spot fades, then returns in weeks.</p>

<p>Hydroquinone directly inhibits tyrosinase, which sounds like the right approach &mdash; except it's cytotoxic. At effective concentrations, it damages melanocytes rather than calming them. Short-term results can be dramatic, but long-term use is associated with paradoxical darkening (ochronosis), increased sensitivity, and rebound hyperpigmentation when you stop.</p>

<p>The effective approach is a combination strategy: calm the inflammation that triggers overproduction, inhibit tyrosinase through multiple gentle mechanisms simultaneously, exfoliate to remove existing deposits, and protect against future triggers.</p>

<h2>How Turmeric Attacks Discoloration</h2>

<p>Curcumin, the primary active compound in turmeric, is one of the few natural ingredients that works on multiple levels of the hyperpigmentation pathway simultaneously:</p>

<ul>
  <li><strong>Tyrosinase Inhibition</strong>Curcumin directly suppresses tyrosinase activity, reducing melanin production at its enzymatic source. Unlike hydroquinone, it does this without damaging the melanocyte itself. The cell stays healthy but produces less melanin &mdash; a sustainable correction rather than a destructive one. In vitro studies have confirmed curcumin's tyrosinase-inhibiting properties, and clinical studies have shown measurable improvement in hyperpigmentation within four weeks of consistent use.</li>
  <li><strong>Anti-Inflammatory Action</strong>Curcumin is one of the most potent natural anti-inflammatories studied. It suppresses NF-kB, the master inflammatory pathway that triggers melanocyte overproduction after injury or irritation. By calming the inflammatory signal, curcumin addresses the root trigger of post-inflammatory hyperpigmentation &mdash; not just the melanin it produces.</li>
  <li><strong>Antioxidant Protection</strong>Oxidative stress from UV exposure and pollution directly activates melanocytes. Curcumin neutralizes free radicals before they can trigger this cascade, acting as a preventive shield against future discoloration while treating existing spots.</li>
  <li><strong>Wound Healing Support</strong>For PIH and acne marks, curcumin accelerates the skin's natural repair process. Faster healing means shorter inflammatory periods, which means less melanin overproduction in response to skin damage.</li>
</ul>

<div class="ss-pullquote">Curcumin doesn't just fade what's there. It teaches your melanocytes to stop overreacting.</div>

<h2>The Multi-Ingredient Approach</h2>

<p>Turmeric alone is powerful. But the most effective approach to stubborn discoloration combines multiple tyrosinase inhibitors that work through different mechanisms. Our Turmeric Glow Pads stack several of these:</p>

<p>Kojic acid chelates the copper ions that tyrosinase needs to function &mdash; a completely different mechanism than curcumin's direct enzymatic inhibition. Vitamin C intercepts free radicals and interrupts melanin synthesis at yet another pathway point. Citrus fruit acids (from lemon and orange peel) provide gentle AHA exfoliation, accelerating the removal of pigmented surface cells so fresh, evenly-toned skin is revealed faster.</p>

<p>Meanwhile, chamomile and panthenol keep the skin calm and hydrated throughout the process. This matters because irritation from overly aggressive treatments is itself a trigger for more pigmentation &mdash; the exact opposite of what you want.</p>

<h2>What You Can Do Right Now</h2>

<p>If you're dealing with persistent dark spots or uneven tone, the most important steps are consistent and simple:</p>

<ul>
  <li><strong>Wear SPF Daily</strong>UV exposure is the single biggest trigger for melanocyte overproduction. No brightening product in the world will work if you're re-triggering your melanocytes with unprotected sun exposure every day. SPF 30 minimum, reapplied every two hours in direct sun. Non-negotiable.</li>
  <li><strong>Gentle, Consistent Exfoliation</strong>Remove pigmented surface cells regularly but gently. Harsh scrubs and strong acid peels can cause micro-injuries that trigger more PIH. Natural AHAs from fruit acids are effective without the irritation risk.</li>
  <li><strong>Multi-Pathway Tyrosinase Inhibition</strong>Use products that combine multiple natural brighteners rather than relying on a single aggressive ingredient. Curcumin plus kojic acid plus vitamin C covers three distinct mechanisms simultaneously.</li>
  <li><strong>Reduce Inflammation</strong>Anti-inflammatory ingredients like turmeric and chamomile address the root trigger, not just the symptom. Less inflammation means less melanocyte activation means fewer new spots forming.</li>
  <li><strong>Be Patient</strong>Skin cells turn over every 28&ndash;40 days. Meaningful improvement in hyperpigmentation takes 4&ndash;8 weeks of consistent use. The spots didn't appear overnight, and they won't disappear overnight. But with the right approach, they do disappear &mdash; and they stay gone.</li>
</ul>

<p>The difference between a product that temporarily lightens and one that genuinely corrects is whether it addresses the melanocyte or just the melanin. Calm the cell, inhibit the enzyme, protect against triggers, exfoliate the deposits. Do all four consistently, and the results aren't just visible &mdash; they're lasting.</p>

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
