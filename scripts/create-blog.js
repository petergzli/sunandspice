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
  title: "The Science of Glow: How Turmeric Toner Pads Fight Hyperpigmentation",
  author: "Sun & Spice",
  tags: "turmeric, skincare, hyperpigmentation, toner pads, ingredients, interactive",
  template_suffix: "toner-pad-game",
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

<p class="ss-lead">Dark spots, uneven patches, stubborn post-acne marks &mdash; if you've ever looked in the mirror and wished your skin tone was more uniform, you're not alone. Hyperpigmentation is one of the most common skin concerns worldwide, and it doesn't discriminate by age, gender, or skin type. The good news? Nature has been offering a solution for thousands of years. It's golden, it's powerful, and it's the star of every Sun &amp; Spice product: turmeric.</p>

<h2>What Is Hyperpigmentation?</h2>

<p>Hyperpigmentation is the medical term for patches of skin that become darker than the surrounding area. It happens when your skin produces excess melanin &mdash; the pigment responsible for your natural skin color. While it's almost always harmless, it can be a major source of frustration and self-consciousness.</p>

<p>There are three main types you're likely to encounter:</p>

<ul>
  <li><strong>Sunspots (Solar Lentigines)</strong>Caused by years of UV exposure, these flat brown spots appear on areas that get the most sun &mdash; face, hands, shoulders, and chest. They're sometimes called age spots or liver spots, though they have nothing to do with your liver.</li>
  <li><strong>Post-Inflammatory Hyperpigmentation (PIH)</strong>This is the dark mark left behind after a pimple, cut, burn, or any skin injury heals. The inflammation triggers your melanocytes (pigment-producing cells) to go into overdrive, leaving a shadow that can linger for months.</li>
  <li><strong>Melasma</strong>Often called "the mask of pregnancy," melasma creates larger, symmetrical patches of discoloration &mdash; usually on the cheeks, forehead, and upper lip. It's driven by hormonal changes and made worse by sun exposure.</li>
</ul>

<div class="ss-pullquote">Hyperpigmentation isn't a flaw &mdash; it's your skin telling a story. But if you want to rewrite the ending, turmeric is the pen.</div>

<h2>Why Does Hyperpigmentation Happen?</h2>

<p>At the cellular level, hyperpigmentation starts with an enzyme called <em>tyrosinase</em>. When triggered by UV rays, hormones, or inflammation, tyrosinase kicks off a chain reaction that converts the amino acid tyrosine into melanin. The more active your tyrosinase, the more melanin is produced &mdash; and the darker those spots become.</p>

<p>This is why sunscreen alone isn't enough. While SPF blocks UV-triggered melanin production going forward, it doesn't address the melanin that's already been deposited in the skin. To truly fade existing spots, you need ingredients that work on the tyrosinase pathway itself.</p>

<h2>Enter Turmeric: Nature's Brightening Powerhouse</h2>

<p>Turmeric (<em>Curcuma longa</em>) has been used in Ayurvedic beauty rituals for over 4,000 years. Indian brides still apply turmeric paste before their wedding day for luminous, even-toned skin. But this isn't just tradition &mdash; modern science backs it up.</p>

<p>The magic lies in <em>curcumin</em>, the primary bioactive compound in turmeric. Research has shown that curcumin:</p>

<ul>
  <li><strong>Inhibits Tyrosinase Activity</strong>Curcumin directly blocks the tyrosinase enzyme, slowing the production of new melanin at its source. Multiple studies have demonstrated that curcumin is comparable to hydroquinone (a prescription-grade brightener) but without the harsh side effects.</li>
  <li><strong>Reduces Inflammation</strong>Since inflammation is a major trigger for PIH, curcumin's powerful anti-inflammatory properties help prevent new dark marks from forming after breakouts or irritation.</li>
  <li><strong>Fights Free Radicals</strong>As a potent antioxidant, curcumin neutralizes the free radicals generated by UV exposure &mdash; the same free radicals that signal your skin to produce excess melanin as a defense mechanism.</li>
  <li><strong>Promotes Cell Turnover</strong>By supporting healthy skin renewal, curcumin helps your body naturally shed the pigmented surface cells and replace them with fresh, evenly-toned skin beneath.</li>
</ul>

<h2>Why Toner Pads Are the Ideal Delivery System</h2>

<p>Here's the thing about curcumin: it's notoriously difficult to absorb through the skin in its raw form. Simply rubbing turmeric powder on your face (as social media sometimes suggests) mostly just stains your skin yellow without delivering meaningful amounts of active curcumin to where it's needed.</p>

<p>This is where formulation science matters. Our Turmeric Glow Pads are pre-soaked in a concentrated formula that solves the bioavailability problem. Each pad delivers:</p>

<ul>
  <li><strong>Optimized Curcumin Concentration</strong>Our formula uses a stabilized curcumin complex at the precise concentration shown in clinical studies to inhibit tyrosinase without irritating the skin.</li>
  <li><strong>Gentle Chemical Exfoliation</strong>The toning solution includes mild AHAs that dissolve the "glue" holding dead, pigmented skin cells to the surface &mdash; revealing brighter skin underneath while improving curcumin penetration.</li>
  <li><strong>Physical Exfoliation</strong>The textured pad surface provides gentle mechanical exfoliation as you swipe, buffing away dull surface cells in one satisfying step.</li>
  <li><strong>Hydrating Base</strong>Hyaluronic acid and aloe in the formula ensure your skin stays plump and moisturized &mdash; because dehydrated skin actually looks more uneven and makes hyperpigmentation more visible.</li>
</ul>

<div class="ss-pullquote">One pad. Two types of exfoliation. A concentrated dose of curcumin. That's the three-step fade in a single swipe.</div>

<h2>How to Use Turmeric Toner Pads for Best Results</h2>

<p>Consistency is everything when treating hyperpigmentation. Melanin didn't build up overnight, and it won't fade overnight either. Here's how to get the most out of your pads:</p>

<ul>
  <li><strong>Cleanse First</strong>Always start with a clean face. Removing makeup, sunscreen, and daily grime ensures the active ingredients can actually reach your skin &mdash; not sit on top of a barrier of product buildup.</li>
  <li><strong>Swipe, Don't Scrub</strong>Pull a pad from the jar and gently swipe across your entire face, paying extra attention to areas of discoloration. Let the pad and formula do the work &mdash; aggressive rubbing can actually trigger more inflammation and pigmentation.</li>
  <li><strong>Let It Absorb</strong>Don't rinse. The toning solution continues working as it absorbs into your skin. Wait 30 seconds before applying your next product (serum, moisturizer, etc.).</li>
  <li><strong>SPF Is Non-Negotiable</strong>In the morning, always follow with broad-spectrum SPF 30 or higher. UV exposure is the number-one trigger for melanin production. Using brightening products without sunscreen is like mopping the floor with the faucet still running.</li>
</ul>

<p>Most people start noticing a difference in tone and texture within 2&ndash;4 weeks of daily use. Significant fading of darker spots typically takes 6&ndash;8 weeks. The key is not to give up early &mdash; those melanocytes are stubborn, but curcumin is stubborn-er.</p>

<h2>Try It Yourself &mdash; Virtually</h2>

<p>Before you reach for a pad in real life, scroll up and try our Scratch &amp; Tone game! Use a virtual turmeric toner pad to scrub away dark spots before the clock runs out. It's a fun way to see what our pads are designed to do &mdash; minus the satisfying glow afterward. For that, you'll need the real thing.</p>

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
