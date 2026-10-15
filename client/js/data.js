/**
 * ATELIER NOIR - Catalog & Apparel Domain Dataset
 * Pre-seeded mock database structured exactly to match our future SQLite3 schema.
 */

const APPAREL_CATEGORIES = [
  { id: 'cat_outerwear', name: 'Outerwear & Coats', slug: 'outerwear', count: 4 },
  { id: 'cat_knitwear', name: 'Knitwear & Sweaters', slug: 'knitwear', count: 3 },
  { id: 'cat_tailoring', name: 'Tailoring & Blazers', slug: 'tailoring', count: 3 },
  { id: 'cat_trousers', name: 'Trousers & Denim', slug: 'trousers', count: 3 },
  { id: 'cat_shirts', name: 'Shirts & Tops', slug: 'shirts', count: 3 },
  { id: 'cat_accessories', name: 'Accessories & Leather', slug: 'accessories', count: 2 }
];

const APPAREL_PRODUCTS = [
  {
    id: 'prod_001',
    title: 'Double-Breasted Cashmere-Wool Overcoat',
    slug: 'double-breasted-cashmere-wool-overcoat',
    category: 'outerwear',
    categoryName: 'Outerwear & Coats',
    department: 'Unisex',
    price: 385.00,
    compareAtPrice: 450.00,
    badge: 'NEW DROP',
    badgeType: 'new',
    rating: 4.9,
    reviewCount: 38,
    isFeatured: true,
    isTrending: true,
    description: 'Masterfully tailored from a plush blend of recycled cashmere and fine virgin wool. Features unstructured shoulders, horn buttons, a deep back vent, and full Bemberg lining for frictionless layering.',
    fabricDetails: '70% Virgin Wool, 30% Recycled Cashmere. 480 GSM heavy drape.',
    careGuide: 'Dry clean only. Store on a contoured cedar wood hanger.',
    fitNote: 'Relaxed tailored fit. True to size for layering over thick knitwear.',
    images: {
      primary: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000&auto=format&fit=crop',
      hover: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    colors: [
      { name: 'Camel Tan', hex: '#b38b59', image: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000&auto=format&fit=crop' },
      { name: 'Obsidian Black', hex: '#111215', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop' },
      { name: 'Heather Charcoal', hex: '#3f444c', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop' }
    ],
    sizes: [
      { size: 'XS', stock: 2, sku: 'OC-CAM-XS' },
      { size: 'S', stock: 5, sku: 'OC-CAM-S' },
      { size: 'M', stock: 8, sku: 'OC-CAM-M' },
      { size: 'L', stock: 3, sku: 'OC-CAM-L' },
      { size: 'XL', stock: 0, sku: 'OC-CAM-XL' } // Sold out demonstration
    ]
  },
  {
    id: 'prod_002',
    title: 'Heavyweight Loopback Fleece Hoodie (500 GSM)',
    slug: 'heavyweight-loopback-fleece-hoodie',
    category: 'knitwear',
    categoryName: 'Knitwear & Sweaters',
    department: 'Men',
    price: 145.00,
    compareAtPrice: null,
    badge: 'ORGANIC',
    badgeType: 'eco',
    rating: 4.8,
    reviewCount: 94,
    isFeatured: true,
    isTrending: true,
    description: 'Custom-milled French terry fleece crafted from 100% GOTS-certified organic cotton. Features double-needle coverstitching, a crossover hood without drawstrings, and heavyweight ribbed side gussets.',
    fabricDetails: '100% Organic Ring-spun Combed Cotton (500 GSM). Pre-shrunk.',
    careGuide: 'Machine wash cold inside out. Hang dry to maintain garment density.',
    fitNote: 'Boxy, dropped shoulder streetwear silhouette.',
    images: {
      primary: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop',
      hover: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1000&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    colors: [
      { name: 'Oatmeal Heather', hex: '#ded7c8', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop' },
      { name: 'Washed Sage', hex: '#637367', image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1000&auto=format&fit=crop' },
      { name: 'Vintage Black', hex: '#202124', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop' }
    ],
    sizes: [
      { size: 'S', stock: 12, sku: 'HD-OAT-S' },
      { size: 'M', stock: 20, sku: 'HD-OAT-M' },
      { size: 'L', stock: 15, sku: 'HD-OAT-L' },
      { size: 'XL', stock: 7, sku: 'HD-OAT-XL' },
      { size: 'XXL', stock: 4, sku: 'HD-OAT-XXL' }
    ]
  },
  {
    id: 'prod_003',
    title: 'Pleated Wide-Leg Wool Flannel Trousers',
    slug: 'pleated-wide-leg-wool-flannel-trousers',
    category: 'trousers',
    categoryName: 'Trousers & Denim',
    department: 'Women',
    price: 195.00,
    compareAtPrice: 240.00,
    badge: 'BESTSELLER',
    badgeType: 'new',
    rating: 4.95,
    reviewCount: 62,
    isFeatured: true,
    isTrending: false,
    description: 'Cut with double forward pleats and a generous high-rise drape that pools effortlessly over sneakers or loafers. Tailored with internal waistband curtaining and deep slash pockets.',
    fabricDetails: '95% Fine Merino Wool, 5% Elastane for subtle comfort stretch.',
    careGuide: 'Dry clean only. Steam gently between wears.',
    fitNote: 'High rise, wide full-length leg with 32" inseam.',
    images: {
      primary: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
      hover: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    colors: [
      { name: 'Chalk White', hex: '#f2f0eb', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1000&auto=format&fit=crop' },
      { name: 'Dark Navy', hex: '#161c28', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop' }
    ],
    sizes: [
      { size: 'XS', stock: 4, sku: 'TR-CHK-XS' },
      { size: 'S', stock: 9, sku: 'TR-CHK-S' },
      { size: 'M', stock: 14, sku: 'TR-CHK-M' },
      { size: 'L', stock: 6, sku: 'TR-CHK-L' }
    ]
  },
  {
    id: 'prod_004',
    title: 'Structured Structured Linen-Silk Overshirt',
    slug: 'structured-linen-silk-overshirt',
    category: 'shirts',
    categoryName: 'Shirts & Tops',
    department: 'Men',
    price: 165.00,
    compareAtPrice: null,
    badge: 'LIMITED',
    badgeType: 'new',
    rating: 4.7,
    reviewCount: 22,
    isFeatured: true,
    isTrending: true,
    description: 'An airy transitional layer combining the slubby texture of Belgian linen with the soft luster and structural tensile strength of raw mulberry silk. Mother-of-pearl buttons throughout.',
    fabricDetails: '65% Belgian Flax Linen, 35% Silk. Breathable 220 GSM.',
    careGuide: 'Hand wash cold or gentle machine cycle. Air dry flat.',
    fitNote: 'Straight boxy cut designed for wearing open or buttoned.',
    images: {
      primary: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
      hover: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    colors: [
      { name: 'Raw Ecru', hex: '#e8e4d8', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop' },
      { name: 'Terra Cotta', hex: '#a6563e', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop' }
    ],
    sizes: [
      { size: 'S', stock: 6, sku: 'SH-ECR-S' },
      { size: 'M', stock: 11, sku: 'SH-ECR-M' },
      { size: 'L', stock: 7, sku: 'SH-ECR-L' },
      { size: 'XL', stock: 2, sku: 'SH-ECR-XL' }
    ]
  },
  {
    id: 'prod_005',
    title: 'Italian Sculpted Single-Breasted Blazer',
    slug: 'italian-sculpted-single-breasted-blazer',
    category: 'tailoring',
    categoryName: 'Tailoring & Blazers',
    department: 'Women',
    price: 320.00,
    compareAtPrice: 380.00,
    badge: 'LOW STOCK',
    badgeType: 'low-stock',
    rating: 4.88,
    reviewCount: 45,
    isFeatured: true,
    isTrending: false,
    description: 'Sculptural silhouette with subtle waist nipping, exaggerated peak lapels, and functional kissing sleeve buttons. Crafted in Biella, Italy using high-twist tropical wool.',
    fabricDetails: '100% Super 120s High-Twist Tropical Wool. Cupro lining.',
    careGuide: 'Specialist dry clean only.',
    fitNote: 'Tailored hourglass fit. Size up if in between bust measurements.',
    images: {
      primary: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop',
      hover: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    colors: [
      { name: 'Espresso Brown', hex: '#3c2b24', image: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop' },
      { name: 'Onyx Black', hex: '#111215', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop' }
    ],
    sizes: [
      { size: 'XS', stock: 1, sku: 'BL-ESP-XS' },
      { size: 'S', stock: 3, sku: 'BL-ESP-S' },
      { size: 'M', stock: 2, sku: 'BL-ESP-M' },
      { size: 'L', stock: 0, sku: 'BL-ESP-L' }
    ]
  },
  {
    id: 'prod_006',
    title: 'Grained Calfskin Leather Weekender Bag',
    slug: 'grained-calfskin-leather-weekender-bag',
    category: 'accessories',
    categoryName: 'Accessories & Leather',
    department: 'Unisex',
    price: 495.00,
    compareAtPrice: 580.00,
    badge: 'HANDMADE',
    badgeType: 'new',
    rating: 5.0,
    reviewCount: 19,
    isFeatured: true,
    isTrending: true,
    description: 'Handcrafted by Florentine leather artisans from full-grain vegetable-tanned calfskin. Features solid brass hardware, a reinforced double-layer base, laptop sleeve, and removable padded shoulder strap.',
    fabricDetails: '100% Full Grain Tuscan Calfskin. Water-resistant cotton canvas lining.',
    careGuide: 'Condition with natural beeswax leather balm annually.',
    fitNote: 'Meets international carry-on airline requirements (45L volume).',
    images: {
      primary: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
      hover: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
      gallery: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop'
      ]
    },
    colors: [
      { name: 'Cognac Saddle', hex: '#8a4b26', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1000&auto=format&fit=crop' },
      { name: 'Midnight Black', hex: '#1a1a1a', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop' }
    ],
    sizes: [
      { size: 'ONE SIZE', stock: 5, sku: 'BG-COG-OS' }
    ]
  }
];

// Coupon discount codes
const PROMO_CODES = {
  'ATELIER15': { discountPercent: 15, minOrder: 100, label: '15% Off Your Entire Order' },
  'FIRSTDROP': { discountAmount: 25, minOrder: 150, label: '$25 Off Over $150' },
  'FREESHIP': { freeShipping: true, minOrder: 0, label: 'Complimentary Express Shipping' }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APPAREL_CATEGORIES, APPAREL_PRODUCTS, PROMO_CODES };
}
