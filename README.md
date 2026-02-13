# Sun and Spice

A Shopify theme for Sun and Spice, an Ayurvedic skincare brand.

## Development

### Prerequisites

- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli)
- [Node.js](https://nodejs.org/) (for blog scripts)

### Getting Started

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `shopify theme dev` to start the development server

### Deployment

Push changes to the live theme using:

```bash
shopify theme push
```

## Blog Generator

Create and update blog posts from the command line using the Shopify Admin API.

### First-Time Setup

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```
   SHOPIFY_STORE=sun-and-spice.myshopify.com
   SHOPIFY_CLIENT_ID=your_client_id
   SHOPIFY_CLIENT_SECRET=your_client_secret
   SHOPIFY_ACCESS_TOKEN=
   ```
   You can find the Client ID and Secret in the [Shopify developer dashboard](https://dev.shopify.com) under the `blog-generator` app > Settings.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the one-time OAuth flow to get an access token:
   ```bash
   npm run auth
   ```
   This opens your browser to authorize the app. Once approved, the access token is saved to `.env` automatically.

### Creating a Blog Post

1. Edit the `post` object in `scripts/create-blog.js`:
   ```js
   const post = {
     title: "Your Post Title",
     author: "Sun & Spice",
     tags: "ayurveda, skincare",
     body_html: `<p>Your content here...</p>`,
     published: false, // set to true to publish immediately
   };
   ```

2. Run the script:
   ```bash
   npm run blog:create
   ```

3. The script will:
   - Look for an existing article with the same title in the **Learn** blog
   - **Update** it if found, or **create** a new one if not
   - To force-update a specific article, set `UPDATE_ARTICLE_ID` to its ID

### Styling Blog Posts

Use these CSS classes inside `body_html` for styled posts that match the theme:

| Class | Purpose |
|---|---|
| `ss-article` | Wrapper for styled article content |
| `ss-lead` | Larger intro paragraph |
| `ss-pullquote` | Centered quote with top/bottom borders |
| `ss-video-wrapper` | Responsive 16:9 video embed |

Headings inside `ss-article` automatically render as uppercase with a subtle bottom border.

### Article Template Features

Every blog article automatically includes (configurable in the theme editor under the Content block):

- **Call to Action** — customizable text, button label, and link
- **Social Share Icons** — X, Facebook, Pinterest, Email (each toggleable on/off)
