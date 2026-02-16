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
  title: "The Evening Glow Ritual: How to Build a Brightening Routine That Works",
  author: "Sun & Spice",
  tags: "turmeric, skincare, routine, brightening, glow, evening skincare, hyperpigmentation",
  template_suffix: "glow-reveal-game",
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

<p class="ss-lead">Morning skincare gets all the attention. But if you're serious about fading dark spots, evening out your tone, and waking up with genuinely brighter skin, what you do at night matters more. Your skin repairs itself while you sleep &mdash; and with the right evening ritual, you can turn those overnight hours into your most powerful brightening treatment.</p>

<h2>Why Nighttime Is When the Magic Happens</h2>

<p>Between 10 PM and 2 AM, your skin enters peak repair mode. Blood flow to the skin increases, cell turnover accelerates, and your body produces more collagen and growth hormones than at any other time of day. This is when your skin is most receptive to active ingredients.</p>

<p>During the day, your skin is in defense mode &mdash; fighting UV radiation, pollution, and environmental stress. At night, it switches to offense. It's actively rebuilding, shedding damaged cells, and generating fresh ones. If you're applying brightening ingredients during this window, they're working with your body's natural rhythm instead of against environmental interference.</p>

<p>This is also why exfoliating at night makes more sense than in the morning. When you remove dead, pigmented surface cells before bed, you give your skin a clean slate to work with during its most regenerative hours. The new cells that surface overnight are fresher, more evenly toned, and better able to absorb your other products.</p>

<h2>Step 1: Double Cleanse to Reset</h2>

<p>Your evening routine starts with a clean canvas. Throughout the day, your skin accumulates layers of sunscreen, makeup, excess sebum, pollution particles, and sweat. A single cleanser often can't cut through all of it &mdash; especially if you're wearing SPF (which you should be).</p>

<p>Start with an oil-based cleanser or micellar water to dissolve makeup and sunscreen. Follow with a gentle water-based cleanser to remove any remaining residue. Your skin should feel clean but never tight or stripped &mdash; if it does, your cleanser is too harsh and may actually be triggering more pigmentation by damaging your skin barrier.</p>

<div class="ss-pullquote">A brightening routine is only as effective as the cleanse that comes before it. Active ingredients can't penetrate through a layer of yesterday's sunscreen.</div>

<h2>Step 2: Exfoliate and Tone with Turmeric Glow Pads</h2>

<p>This is the centerpiece of the ritual. After cleansing, pull a Turmeric Glow Pad from the jar and sweep it across your entire face, starting from the center and working outward. Pay extra attention to areas where you notice uneven tone &mdash; cheeks, forehead, around the nose, and along the jawline.</p>

<p>Each pad does three things simultaneously. The textured surface provides gentle physical exfoliation, buffing away the dead cells sitting on the surface. The toning solution contains curcumin and kojic acid, which inhibit the enzyme (tyrosinase) responsible for overproducing melanin. And the hydrating base ensures your skin stays balanced and doesn't overcompensate by producing more oil or inflammation.</p>

<p>One pad, one swipe, three mechanisms. This is the step that does the heavy lifting for pigmentation &mdash; and it takes about 30 seconds.</p>

<h2>Step 3: Targeted Treatment for Stubborn Spots</h2>

<p>After toning, your skin is primed for active ingredients. If you have particularly stubborn dark marks &mdash; the kind that have been hanging around for months &mdash; this is when to apply a targeted serum. Look for ingredients that complement turmeric's brightening action:</p>

<ul>
  <li><strong>Niacinamide (Vitamin B3)</strong>Reduces the transfer of melanin from melanocytes to surrounding skin cells. It works on a different part of the pigmentation pathway than curcumin, so they complement each other rather than overlapping. Also strengthens the skin barrier and regulates oil production.</li>
  <li><strong>Vitamin C (L-Ascorbic Acid)</strong>Another tyrosinase inhibitor that also provides antioxidant protection. Use it in the evening if your formulation is stable, or save it for mornings under SPF. Pairs well with turmeric since both are antioxidants but work through slightly different mechanisms.</li>
  <li><strong>Alpha Arbutin</strong>A gentle, stable brightener derived from bearberry plant. It slowly releases hydroquinone in small, non-irritating doses to suppress melanin production over time. Ideal for sensitive skin that can't tolerate stronger actives.</li>
  <li><strong>Tranexamic Acid</strong>Originally developed to reduce bleeding, this ingredient has become a skincare favorite for its ability to interrupt melanin production triggered by UV and hormonal changes. Especially effective for melasma, which is notoriously difficult to treat.</li>
</ul>

<p>A note on layering: apply your thinnest, most watery serums first, then move to thicker ones. Give each product about 30 seconds to absorb before the next. You don't need all four of these &mdash; pick one or two that address your specific concerns.</p>

<h2>Step 4: Lock It In with Moisture</h2>

<p>Hydration isn't just about comfort &mdash; it directly affects how bright your skin looks. Dehydrated skin scatters light unevenly, making pigmentation look worse and giving your complexion a dull, flat appearance. Well-moisturized skin reflects light uniformly, creating the "lit from within" effect that we associate with healthy, glowing skin.</p>

<p>Choose a moisturizer that seals in your actives without clogging pores. Ingredients like hyaluronic acid, squalane, and ceramides are your friends here. Apply while your serums are still slightly damp to lock in hydration.</p>

<p>If your skin runs dry, consider adding a facial oil as the final step. Rosehip, jojoba, and marula oil are all non-comedogenic options that create an occlusive barrier to prevent overnight water loss. In Ayurvedic practice, facial oils have been used for centuries &mdash; the act of gently pressing oil into the skin (called <em>abhyanga</em>) is considered both a physical and spiritual act of self-care.</p>

<div class="ss-pullquote">Glowing skin isn't one product &mdash; it's a ritual. Each step builds on the last, and consistency is what turns a routine into results.</div>

<h2>Step 5: The Overnight Advantage</h2>

<p>Once your routine is complete, your skin spends the next 7&ndash;8 hours doing what it does best: repairing and renewing. The curcumin from your toner pad is actively inhibiting melanin production. Your serums are penetrating deeper without competing with sunscreen or environmental stress. And the fresh, exfoliated surface is turning over faster, pushing pigmented cells out and pulling brighter ones up.</p>

<p>This is why you'll often notice the biggest difference in your skin first thing in the morning &mdash; especially after 2&ndash;3 weeks of consistent use. That "morning glow" isn't a myth. It's the visible result of your skin's overnight repair cycle working in tandem with your evening routine.</p>

<h2>What to Expect: A Realistic Timeline</h2>

<p>Brightening takes patience. Here's a realistic timeline of what consistent evening use looks like:</p>

<ul>
  <li><strong>Week 1&ndash;2</strong>Your skin feels smoother and looks more even in texture. The exfoliation is clearing surface buildup, and your products are absorbing better. You may notice a subtle "freshness" to your complexion, even if dark spots haven't visibly changed yet.</li>
  <li><strong>Week 3&ndash;4</strong>Newer, lighter spots start to fade noticeably. Your overall tone looks more uniform. This is your skin's first full turnover cycle with consistent active ingredients, and it's the point where most people start getting compliments.</li>
  <li><strong>Week 6&ndash;8</strong>Deeper, older spots begin to lighten. The cumulative effect of nightly curcumin + exfoliation becomes clearly visible. If you've been patient and consistent, this is your payoff period.</li>
  <li><strong>Month 3+</strong>Significant improvement in overall radiance and tone. Stubborn melasma and deep PIH marks continue to fade gradually. At this stage, you're in maintenance mode &mdash; keeping your skin bright rather than actively correcting it.</li>
</ul>

<h2>The Non-Negotiable Morning Follow-Up</h2>

<p>No evening brightening routine works without daytime sun protection. UV exposure is the single biggest trigger for melanin production, and it can undo weeks of progress in a single afternoon. Every morning, apply a broad-spectrum SPF 30 or higher as the final step in your morning routine &mdash; even on cloudy days, even if you're staying indoors near windows.</p>

<p>Think of it this way: your evening routine is offense (actively fading spots), and your morning SPF is defense (preventing new ones). You need both to win.</p>

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
