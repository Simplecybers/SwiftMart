# E-Commerce Application Design Guidelines

## Design Approach: Reference-Based
Drawing inspiration from **Shopify's clean product presentations**, **Etsy's visual warmth**, and **modern delivery apps** (like DoorDash/Uber) for tracking interfaces. This creates a premium shopping experience that balances visual appeal with functional clarity.

## Typography System
- **Primary Font**: Inter (via Google Fonts) - headings, UI elements, clean sans-serif
- **Secondary Font**: DM Sans - body text, descriptions, excellent readability
- **Scale**: text-sm (12-14px) for metadata, text-base (16px) for body, text-lg/xl for subheadings, text-2xl-4xl for page titles, text-5xl-6xl for hero headlines

## Spacing & Layout System
**Tailwind Units**: Use 2, 4, 6, 8, 12, 16, 20, 24 as core spacing primitives (p-4, gap-8, mb-12, etc.)

**Grid System**: 
- Product grids: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 with gap-6
- Container max-widths: max-w-7xl for main content areas
- Cart/Checkout: max-w-4xl centered layouts

## Component Library

### Navigation
**Header**: Sticky top navigation with search bar (prominent center position), cart icon with item count badge, user account dropdown, category mega-menu on hover
**Mobile**: Bottom tab bar for key actions (Home, Search, Cart, Account)

### Homepage Components

**Hero Section**: Full-width banner featuring seasonal collection or promotion
- Height: min-h-[500px] lg:min-h-[600px]
- Image: Lifestyle product photography showing products in use
- Overlay: CTA button with backdrop-blur-md bg-white/90 treatment
- Text: Large headline (text-5xl-6xl) with contrasting supporting text

**Featured Collections**: 3-column grid showcasing category tiles with hover scale effect
**Trending Products**: 4-column responsive grid with product cards
**Trust Indicators**: Single row with icons for Free Shipping, Easy Returns, Secure Checkout (4 total indicators)

### Product Listing Pages
**Filter Sidebar**: Left-aligned (w-64), collapsible on mobile with category tree, price range slider, rating filters, brand checkboxes
**Product Grid**: Occupies remaining space with infinite scroll or pagination
**Sort Controls**: Dropdown in top-right (Price: Low to High, New Arrivals, Best Selling, Rating)

### Product Cards
- Product image with subtle border, aspect ratio square
- Quick view icon overlay on hover
- Product name (text-base, 2-line clamp)
- Price display: Original price (line-through if on sale) + sale price
- Star rating with review count
- Add to Cart button appears on hover (desktop), always visible (mobile)

### Product Detail Page
**Layout**: Two-column split (60/40)
- **Left**: Image gallery with thumbnails, main image zoom on hover, multiple product angles
- **Right**: Breadcrumb → Product title (text-3xl) → Rating/reviews → Price → Variant selectors (size, color as visual swatches) → Quantity selector → Add to Cart (prominent) + Add to Wishlist → Accordion sections for Description, Specifications, Shipping & Returns

**Below Fold**: Related products carousel, customer reviews with photos, Q&A section

### Shopping Cart
**Drawer/Slide-out**: Slides from right side (w-96), shows mini cart with:
- Item thumbnails with remove icon
- Quantity adjusters (- / number / +)
- Running subtotal
- Prominent checkout button
- "Continue Shopping" link

**Full Cart Page**: 
- Table layout for desktop showing product details, quantity, price, subtotal per item
- Order summary card (sticky on scroll): Subtotal, Shipping estimate, Tax, Total, Promo code input, Checkout button

### Checkout Flow
**Multi-step Progress Bar**: Shipping → Payment → Review (with step indicators showing current position)
**Forms**: Single-column with clear section headers
- Shipping address with autocomplete
- Delivery method radio buttons with estimated dates
- Payment method tabs (Credit Card, PayPal, etc.)
- Order review with edit capabilities

### Order Tracking Interface
**Order Status Page**:
- **Top Section**: Order number (large), status badge (Processing/Shipped/Delivered), estimated delivery date
- **Progress Timeline**: Horizontal stepper showing Order Placed → Processing → Shipped → Out for Delivery → Delivered with timestamps
- **Map Integration**: Interactive map showing current package location (full-width, height: h-96), delivery route visualization, real-time driver location (if available)
- **Shipment Details Card**: Tracking number, carrier info with logo, current location text, package contents list
- **Delivery Updates Feed**: Timeline of location updates with timestamps (reverse chronological)

### Interactive Map Component
- Centered on delivery destination
- Marker for destination address
- Animated marker for current package location
- Route polyline if in transit
- Zoom controls and recenter button
- Estimated time remaining overlay

## Images Strategy

**Hero Image**: Yes - Lifestyle photography featuring product usage or seasonal campaign (1920x600px minimum)
**Product Images**: Square format (800x800px), white or minimal backgrounds, multiple angles required
**Category Tiles**: Curated lifestyle imagery representing each category (600x400px)
**Trust/Feature Icons**: Use Heroicons for shipping, returns, security badges
**Map Integration**: Use Mapbox or Google Maps SDK with custom styling

## Form Elements
All inputs: border with focus:ring-2 treatment, consistent height (h-12), rounded corners (rounded-lg), placeholder text for guidance
Buttons: Primary (solid), Secondary (outlined), sizes: default (h-12) and large (h-14 for CTAs)
Checkboxes/Radio: Custom styled with accent treatment

## Responsive Breakpoints
- Mobile-first approach
- sm (640px): Stack to 2 columns
- md (768px): Introduce sidebars
- lg (1024px): Full 4-column grids, expanded navigation
- xl (1280px+): Maximum container widths applied

## Micro-interactions (Minimal)
- Product card hover: subtle scale (scale-105) and shadow increase
- Add to cart: Brief success state with checkmark
- Image gallery: Smooth fade transitions
- Map: Pan and zoom animations only