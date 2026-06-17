// Seed data for the Subletair marketplace.
// Listings are grouped by destination so the home page can render one row per
// city (Airbnb-style). Images reuse a small pool of known-good Unsplash photos.

export const categories = [
  { key: "all", label: "All" },
  { key: "loft", label: "Lofts" },
  { key: "cabin", label: "Cabins" },
  { key: "beach", label: "Beachfront" },
  { key: "city", label: "City flats" },
  { key: "design", label: "Design" },
  { key: "tiny", label: "Tiny homes" },
  { key: "country", label: "Countryside" },
  { key: "lake", label: "Lakefront" },
];

const IMG = [
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800&q=80",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80",
];

// Each destination supplies its own listings; ids are assigned sequentially below.
const DESTINATIONS = [
  {
    location: "Lisbon",
    cat: "city",
    homes: [
      { title: "Bright flat off the harbour", sub: "Alfama · Jun 20–25", price: 142, rating: 4.85, guests: 4, badge: "Guest favorite" },
      { title: "Tiled studio in Alfama", sub: "Old town · Jul 2–6", price: 96, rating: 4.8, guests: 2, badge: "New" },
      { title: "Sunny rooftop apartment", sub: "Bairro Alto · Aug 1–5", price: 168, rating: 4.91, guests: 3 },
      { title: "Pastel townhouse with patio", sub: "Graça · Sep 9–14", price: 134, rating: 4.78, guests: 5 },
      { title: "Riverside loft with balcony", sub: "Cais do Sodré · Jun 28–Jul 2", price: 189, rating: 4.94, guests: 4, badge: "Guest favorite" },
    ],
  },
  {
    location: "Tahoe",
    cat: "cabin",
    homes: [
      { title: "Pine cabin near the trailhead", sub: "Jul 1–5", price: 184, rating: 4.97, guests: 6, badge: "Guest favorite" },
      { title: "Sunlit lakefront A-frame", sub: "Jul 15–19", price: 201, rating: 4.91, guests: 8, badge: "Guest favorite", cat: "lake" },
      { title: "Cozy log cabin with hot tub", sub: "Aug 3–8", price: 176, rating: 4.88, guests: 5 },
      { title: "Modern chalet, ski-in access", sub: "Dec 10–15", price: 240, rating: 4.95, guests: 6, badge: "New" },
      { title: "Quiet cottage among the pines", sub: "Sep 5–9", price: 152, rating: 4.82, guests: 4 },
    ],
  },
  {
    location: "Kyoto",
    cat: "loft",
    homes: [
      { title: "Designer loft above the market", sub: "Aug 10–14", price: 167, rating: 4.89, guests: 3, badge: "New" },
      { title: "Machiya townhouse with garden", sub: "Jul 18–22", price: 198, rating: 4.96, guests: 4, badge: "Guest favorite", cat: "design" },
      { title: "Minimalist studio near Gion", sub: "Sep 1–5", price: 128, rating: 4.84, guests: 2 },
      { title: "Tea-house inspired retreat", sub: "Oct 6–10", price: 212, rating: 4.93, guests: 4, cat: "design" },
      { title: "Riverside apartment, Pontocho", sub: "Aug 22–26", price: 156, rating: 4.87, guests: 3 },
    ],
  },
  {
    location: "Catskills",
    cat: "cabin",
    homes: [
      { title: "A-frame tiny home in the woods", sub: "Jun 28–30", price: 119, rating: 4.95, guests: 2, cat: "tiny" },
      { title: "Glass cabin in the pines", sub: "Jul 22–26", price: 192, rating: 4.94, guests: 4, badge: "Guest favorite" },
      { title: "Restored barn with a view", sub: "Aug 12–16", price: 174, rating: 4.86, guests: 6, cat: "country" },
      { title: "Creekside cottage retreat", sub: "Sep 2–6", price: 138, rating: 4.8, guests: 4 },
      { title: "Off-grid cabin, full sky", sub: "Oct 1–5", price: 145, rating: 4.9, guests: 3, badge: "New", cat: "tiny" },
    ],
  },
  {
    location: "Mexico City",
    cat: "design",
    homes: [
      { title: "Minimalist concrete house", sub: "Roma Norte · Jul 9–13", price: 173, rating: 4.88, guests: 4, badge: "New" },
      { title: "Condesa loft with terrace", sub: "Condesa · Aug 5–9", price: 149, rating: 4.91, guests: 3, cat: "loft" },
      { title: "Art-filled colonial flat", sub: "Juárez · Sep 11–15", price: 162, rating: 4.85, guests: 4 },
      { title: "Bright studio near the park", sub: "Polanco · Jun 24–28", price: 121, rating: 4.79, guests: 2, cat: "city" },
      { title: "Rooftop casita with plants", sub: "Coyoacán · Oct 3–7", price: 185, rating: 4.93, guests: 5, badge: "Guest favorite" },
    ],
  },
  {
    location: "Tofino",
    cat: "beach",
    homes: [
      { title: "Beach bungalow, steps to sand", sub: "Aug 3–8", price: 215, rating: 4.9, guests: 5, badge: "Guest favorite" },
      { title: "Surfside cabin in the cedars", sub: "Jul 12–16", price: 168, rating: 4.86, guests: 4, cat: "cabin" },
      { title: "Oceanfront cottage with deck", sub: "Sep 1–5", price: 232, rating: 4.95, guests: 6, badge: "Guest favorite" },
      { title: "Cozy A-frame near Cox Bay", sub: "Jun 26–30", price: 154, rating: 4.83, guests: 3 },
      { title: "Storm-watching retreat", sub: "Nov 8–12", price: 198, rating: 4.92, guests: 4, badge: "New" },
    ],
  },
];

// Larger set of destinations Israelis commonly book — Israel plus popular getaways.
// Listings are generated from per-category title pools so each row fills out.
const TITLE_POOLS = {
  city: [
    "Bright apartment in the center", "Sunlit flat with a balcony", "Modern studio downtown",
    "Boho loft near the market", "Quiet flat off the boulevard", "Renovated apartment with terrace",
    "Cozy studio near the old town", "Designer flat with city views", "Charming walk-up apartment",
    "Penthouse with a rooftop", "Garden-level one-bedroom", "Stylish pied-à-terre",
  ],
  beach: [
    "Seafront apartment with balcony", "Bright beach studio", "Steps-to-sand bungalow",
    "Blue-and-white beach house", "Sunset-view sea apartment", "Coastal villa with a pool",
    "Marina-side flat", "Whitewashed seaside studio", "Surfside cabin", "Palm-shaded beach cottage",
    "Cliffside apartment, sea view", "Breezy beachfront loft",
  ],
  design: [
    "Minimalist desert retreat", "Architect-designed villa", "Cave-style suite with a view",
    "Concrete-and-glass house", "Cycladic cave house", "Infinity-view design villa",
    "Stone suite with plunge pool", "Sculptural desert home", "Sunset caldera suite",
    "Modernist hillside house", "Earth-toned design loft", "Light-filled architectural flat",
  ],
  lake: [
    "Lakefront cottage with deck", "Galilee-view apartment", "Quiet lakeside studio",
    "Waterfront cabin", "Lake-view villa with garden", "Boathouse-style retreat",
    "Shoreline bungalow", "Calm lakeside flat",
  ],
};
const SUBS = [
  "Jun 12–16", "Jun 24–28", "Jul 3–8", "Jul 15–20", "Aug 1–6", "Aug 18–23",
  "Sep 5–10", "Sep 22–27", "Oct 8–13", "Nov 2–7",
];
const BASE_PRICE = { city: 120, beach: 165, design: 205, lake: 140 };

// { location, cat, n } — Israel, Greece, and other Israeli-favorite spots.
const GENERATED = [
  { location: "Tel Aviv", cat: "city", n: 10 },
  { location: "Jerusalem", cat: "city", n: 8 },
  { location: "Haifa", cat: "city", n: 8 },
  { location: "Eilat", cat: "beach", n: 10 },
  { location: "Tiberias", cat: "lake", n: 8 },
  { location: "Dead Sea", cat: "design", n: 6 },
  { location: "Mitzpe Ramon", cat: "design", n: 6 },
  { location: "Athens", cat: "city", n: 8 },
  { location: "Santorini", cat: "design", n: 10 },
  { location: "Crete", cat: "beach", n: 8 },
  { location: "Rhodes", cat: "beach", n: 7 },
  { location: "Mykonos", cat: "beach", n: 6 },
  { location: "Thessaloniki", cat: "city", n: 5 },
  { location: "Larnaca", cat: "beach", n: 5 },
  { location: "Batumi", cat: "city", n: 5 },
];

function genHomes(dest) {
  const pool = TITLE_POOLS[dest.cat];
  return Array.from({ length: dest.n }, (_, i) => ({
    title: pool[i % pool.length],
    sub: SUBS[(i + dest.location.length) % SUBS.length],
    price: BASE_PRICE[dest.cat] + ((i * 37) % 95),
    rating: Math.round((4.72 + ((i * 13) % 26) / 100) * 100) / 100,
    guests: 2 + ((i * 3) % 6),
    badge: i % 4 === 0 ? "Guest favorite" : i % 7 === 0 ? "New" : null,
  }));
}

const ALL_DESTINATIONS = [
  ...DESTINATIONS,
  ...GENERATED.map((d) => ({ location: d.location, cat: d.cat, homes: genHomes(d) })),
];

let nextId = 1;
export const listings = ALL_DESTINATIONS.flatMap((d) =>
  d.homes.map((h, i) => ({
    id: nextId++,
    title: h.title,
    subtitle: h.sub,
    price: h.price,
    rating: h.rating,
    badge: h.badge ?? null,
    image: IMG[(d.location.length + i) % IMG.length],
    cat: h.cat ?? d.cat,
    location: d.location,
    guests: h.guests,
  }))
);

export const demoHost = {
  name: "Subletair Demo Host",
  email: "demo@subletair.test",
  // bcrypt hash of "password123"
  password: "password123",
};

// Availability windows (ISO dates). Wide-open unless named here, so a couple of
// stays are bookable only in a narrow window and date filters visibly bite.
const idOf = (t) => listings.find((l) => l.title === t)?.id;
export const demoAvailability = {
  default: { start: "2026-01-01", end: "2026-12-31" },
  [idOf("Pine cabin near the trailhead")]: { start: "2026-07-01", end: "2026-07-31" },
  [idOf("Beach bungalow, steps to sand")]: { start: "2026-08-01", end: "2026-08-31" },
};
