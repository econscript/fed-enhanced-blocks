# Fed Enhanced Blocks

A WordPress plugin that adds some enhanced functionality

1. **Captions for featured images and Media & Text blocks.** Manage captions in the editor, rendered automatically on the front end.
2. **An enhanced Data Table block** with sorting, filtering, advanced styling, and mobile-responsive layouts.

## Requirements

- WordPress 6.2+
- PHP 7.4+
- The block editor (Gutenberg)

## Installation

1. Drop the `fed-enhanced-blocks` folder into `wp-content/plugins/`
2. Activate **Fed Enhanced Blocks** via code: https://docs.wpvip.com/plugins/activate-plugins-through-code/
3. No further configuration is required.

## Features

### 1. Featured image caption

- Open any post or page that supports a featured image.
- In the post-settings sidebar you'll see a new panel **Featured Image Caption** (visible once a featured image is set).
- Type your caption. It saves to post meta (`_feb_featured_image_caption`) and is rendered as a `<figcaption>` wrapping the theme's `the_post_thumbnail()` output.

To extend caption support to additional post types:

```php
add_filter( 'feb_featured_caption_post_types', function ( $types ) {
    $types[] = 'your_custom_post_type';
    return $types;
} );
```

### 2. Media & Text block captions

- Insert a core **Media & Text** block as usual.
- In the block sidebar, expand the **Caption** panel and add your caption.
- On the front end, a `<figcaption>` is injected into the media column.

### 3. Data Table (Enhanced) block

In the block selector while editing content, search for **Data Table (Enhanced)**.

Inspector controls:

- **Behavior**: toggle column sorting (editor-only), toggle row filter (editor-only), choose mobile layout (stacked cards or horizontal scroll).
- **Style**: striped rows, bordered cells, and color pickers for header background, header text, stripe color, and border color.

Editing experience: a spreadsheet-style grid with **+ Add row** / **+ Add column** buttons and per-row/column remove buttons. When sorting is enabled, clicking a column header in the editor sorts the table — numeric columns (including formatted values like `$1,250` or `12.5%`) sort numerically; text columns sort with locale-aware comparison. **The new row order becomes the saved data**, so visitors see whatever order you saved. When filtering is enabled, a search box appears above the table for finding rows; non-matching rows are hidden from the editor view only — **the filter never changes saved data**.

Front-end behavior:

- Plain semantic HTML — no JavaScript. The table renders in the saved order.
- On small screens, the table either stacks each row as a card with `data-label`-driven labels, or scrolls horizontally, depending on the block setting.

## File layout

```
fed-enhanced-blocks/
├── fed-enhanced-blocks.php                     Main plugin bootstrap
├── includes/
│   ├── class-featured-image-caption.php        Featured image caption logic
│   ├── class-media-text-caption.php            Media & Text caption render filter
│   └── class-data-table-block.php              Data table block registration + render
├── assets/
│   ├── css/
│   │   ├── editor.css                          Block editor styles
│   │   └── frontend.css                        Front-end styles (CSS only — no JS)
│   └── js/
│       └── editor.js                           Block editor UI (no build step required)
├── languages/                                  (i18n .pot/.mo files would go here)
└── readme.md                                   This file
```

## Notes & next steps

This is a working baseline. Reasonable production hardening would include:

- A build pipeline (`@wordpress/scripts`) so the editor JS can use JSX and proper bundling/minification.
- Unit / E2E tests, particularly for the data table sort behavior in the editor.
- CSV import/export for the data table (drop-in via `papaparse` on the editor side).
- Conditional formatting (e.g., color cells based on numeric thresholds — useful for financial data).
- A `has_block()` check before enqueuing front-end CSS, to avoid loading on pages that don't use the block.
- Theme-aware default colors that pull from the active theme's palette via `theme.json`.
