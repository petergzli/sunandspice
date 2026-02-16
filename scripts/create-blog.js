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
  title: "What's Actually In Our Turmeric Toner Pads? Every Ingredient, Explained",
  author: "Sun & Spice",
  tags: "turmeric, ingredients, natural skincare, kojic acid, chamomile, vitamin c, clean beauty, organic",
  template_suffix: "tone-mixer-game",
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

<p class="ss-lead">We believe you should know exactly what you're putting on your skin &mdash; and why it's there. Every ingredient in our Turmeric Glow Pads was chosen for a reason: it works, it's natural, and it belongs in a formula designed to brighten, exfoliate, and protect without a single harsh chemical in sight.</p>

<h2>The Star: Turmeric &amp; Turmeric Extract</h2>

<p>Turmeric has been the cornerstone of Ayurvedic beauty for over 4,000 years &mdash; and modern science has caught up to explain why. The active compound, curcumin, is one of nature's most potent anti-inflammatory and antioxidant agents. It directly inhibits tyrosinase, the enzyme responsible for melanin overproduction, which makes it remarkably effective at fading dark spots and evening out skin tone.</p>

<p>We use both whole turmeric and concentrated turmeric extract in our formula. The whole plant brings a spectrum of curcuminoids and essential oils that support skin health broadly, while the extract delivers a higher concentration of pure curcumin for targeted brightening action. Together, they provide both immediate radiance and long-term pigmentation correction.</p>

<h2>The Brightening Allies</h2>

<ul>
  <li><strong>Kojic Acid</strong>Derived from fungi during the fermentation of rice (a process used in Japanese sake brewing for centuries), kojic acid is one of the most effective natural brighteners available. Like curcumin, it inhibits tyrosinase &mdash; but through a different mechanism, which means the two work synergistically. Where curcumin blocks the enzyme's activity, kojic acid chelates the copper ions the enzyme needs to function. Double the suppression, zero harsh bleaching.</li>
  <li><strong>Vitamin C</strong>The gold standard antioxidant. Vitamin C intercepts free radicals before they can trigger inflammation-driven pigmentation, and it brightens existing dark spots by interrupting melanin synthesis at yet another point in the pathway. It also stimulates collagen production, improving skin texture and firmness alongside tone.</li>
  <li><strong>Lemon Peel &amp; Orange Peel</strong>Citrus peels are naturally rich in alpha-hydroxy acids (AHAs) and vitamin C. They provide gentle chemical exfoliation, helping to dissolve the bonds between dead skin cells so they shed more easily. The result is smoother, more luminous skin after every use &mdash; without the irritation of synthetic acid peels.</li>
  <li><strong>Grapefruit Extract</strong>A natural source of antioxidants and fruit acids that complement the citrus peels. Grapefruit extract helps protect the skin from environmental oxidative stress while supporting the gentle exfoliation process. It also contributes to the formula's fresh, clean scent &mdash; no synthetic fragrance needed.</li>
</ul>

<div class="ss-pullquote">Every brightening ingredient in our formula attacks hyperpigmentation from a different angle. That's not an accident &mdash; it's the whole strategy.</div>

<h2>The Soothers &amp; Hydrators</h2>

<ul>
  <li><strong>Chamomile</strong>Bisabolol and chamazulene &mdash; the active compounds in chamomile &mdash; are among the gentlest anti-inflammatories found in nature. Chamomile calms redness, reduces irritation, and helps the skin recover from exfoliation. It's the ingredient that makes our pads safe for sensitive skin types that normally can't tolerate active brightening products.</li>
  <li><strong>Panthenol (Vitamin B5)</strong>Panthenol is a humectant that draws moisture into the skin and holds it there. Once absorbed, it converts to pantothenic acid, which supports the skin's natural barrier repair process. This means your skin stays hydrated and resilient even while being actively exfoliated &mdash; no dryness, no flaking, no compromise.</li>
  <li><strong>Vegetable Glycerin</strong>A plant-derived humectant that creates a moisture reservoir on the skin's surface. Glycerin prevents transepidermal water loss (TEWL) and keeps the skin supple and plump throughout the day. It also helps the other active ingredients distribute evenly across the pad and onto your skin.</li>
  <li><strong>Aqua</strong>Purified water forms the base of the toning solution. It acts as the solvent that carries all other ingredients and ensures they're delivered in the right concentration. Simple, essential, and the foundation everything else builds on.</li>
</ul>

<h2>The Gentle Cleanser</h2>

<ul>
  <li><strong>Coco Glucoside</strong>Derived from coconut oil and fruit sugars, coco glucoside is one of the mildest surfactants (cleansing agents) that exists. It removes dirt, oil, and impurities without stripping the skin's protective acid mantle. Unlike sulfates, which can leave skin feeling tight and dry, coco glucoside cleanses while actually supporting hydration. It's biodegradable, non-toxic, and approved for even the most sensitive skin formulations.</li>
</ul>

<h2>The Microbiome Supporter</h2>

<ul>
  <li><strong>Lactobacillus (Probiotic Ferment)</strong>Your skin has its own microbiome &mdash; a living ecosystem of beneficial bacteria that protects against pathogens, regulates inflammation, and maintains pH balance. Lactobacillus ferment supports this ecosystem by providing postbiotic compounds that strengthen the skin's natural defenses. Healthy microbiome means less inflammation, fewer breakouts, and better response to active ingredients.</li>
</ul>

<div class="ss-pullquote">Clean skincare isn't about what we add &mdash; it's about what we refuse to include.</div>

<h2>What We Leave Out (and Why)</h2>

<p>Our formula is defined as much by what's absent as by what's present. Here's what you'll never find in a Sun &amp; Spice product:</p>

<ul>
  <li><strong>Alcohol (Denatured)</strong>Cheap filler that gives products a quick-drying feel but strips the skin barrier, causes chronic dehydration, and triggers rebound oil production. Over time, alcohol-based products actually accelerate skin aging and worsen the pigmentation issues they claim to treat.</li>
  <li><strong>Parabens</strong>Synthetic preservatives linked to hormone disruption. They mimic estrogen in the body and have been found in breast tissue samples. We use natural preservation methods instead &mdash; there are better ways to keep a formula stable without introducing endocrine disruptors.</li>
  <li><strong>Synthetic Fragrance</strong>The word "fragrance" on a label can hide hundreds of undisclosed chemicals, many of which are known sensitizers and allergens. Synthetic fragrance is the single most common cause of contact dermatitis in skincare. Our products smell like their ingredients &mdash; turmeric, citrus, chamomile &mdash; because that's all that's in them.</li>
  <li><strong>Sulfates (SLS/SLES)</strong>Aggressive surfactants that create the foaming lather people associate with "clean" but actually damage the skin barrier, strip natural oils, and cause irritation. Coco glucoside does the same job without the collateral damage.</li>
  <li><strong>Mineral Oil</strong>A petroleum byproduct that sits on top of the skin and creates an artificial occlusive barrier. While it prevents water loss, it also prevents the skin from breathing and can trap bacteria and impurities underneath. Plant-derived alternatives like vegetable glycerin achieve the same hydration without sealing in problems.</li>
</ul>

<h2>The Ayurvedic Philosophy</h2>

<p>In Ayurveda, skincare is not about adding foreign substances to the body. It's about supporting the body's innate intelligence with ingredients the skin already recognizes. Every plant extract, every fruit acid, every probiotic compound in our formula has a biological analog that your skin already produces or interacts with naturally.</p>

<p>That's why our pads work without irritation, without adjustment periods, and without the "purging" that synthetic active products often cause. Your skin doesn't need to learn how to process turmeric or chamomile or vitamin C. It already knows. We're just giving it more of what it needs.</p>

<p>This is what clean beauty actually means: not a marketing label, but a genuine commitment to formulating with ingredients that your skin recognizes as allies, not invaders.</p>

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
