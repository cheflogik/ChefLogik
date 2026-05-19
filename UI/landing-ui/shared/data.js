// Shared restaurant data for Aubergine prototypes
window.AUBERGINE = {
  name: "Aubergine",
  tagline: "Twelve courses on the waterfront",
  chef: "Léo Marchand",
  cuisine: "Contemporary Mediterranean",
  neighborhood: "Red Hook · Brooklyn",
  address: "184 Van Brunt St, Brooklyn NY 11231",
  phone: "+1 (718) 555 0144",
  rating: 4.8,
  reviewCount: 1284,
  hours: [
    { day: "Mon", text: "Closed" },
    { day: "Tue", text: "6:00 – 11:00 pm" },
    { day: "Wed", text: "6:00 – 11:00 pm" },
    { day: "Thu", text: "6:00 – 11:30 pm" },
    { day: "Fri", text: "5:30 – 12:00 am" },
    { day: "Sat", text: "5:30 – 12:00 am" },
    { day: "Sun", text: "5:00 – 10:00 pm" },
  ],
  todayIndex: 3, // Thu (assume today)
  service: ["Dine-in", "Bar Counter", "Private Dining"],
  payments: ["Visa", "Mastercard", "Amex", "Apple Pay", "Crypto"],
  branches: [
    { name: "Red Hook · Flagship", distance: "0.4 mi", note: "Tasting menu only" },
    { name: "Tribeca · Bar Aubergine", distance: "3.1 mi", note: "À la carte · Walk-ins" },
  ],
  offers: [
    { tag: "Loyalty", title: "Sommelier's Table", body: "Members redeem 6,000 pts for a private wine pairing dinner.", chip: "6,000 pts" },
    { tag: "Tuesday", title: "Chef's Counter Tasting", body: "Eight seats. Six courses. One conversation with the chef.", chip: "$145 · Tue only" },
    { tag: "Seasonal", title: "Quince & Smoke", body: "Autumn menu launches Oct 14 — reservations open now.", chip: "Oct 14 — Dec 22" },
  ],
  tastingMenus: [
    { name: "Seven Course Prelude", price: 185, pairing: "+95" },
    { name: "Twelve Course Carte Blanche", price: 295, pairing: "+165" },
    { name: "Vegetal — Twelve Course", price: 265, pairing: "+150" },
  ],
  customer: {
    name: "Eleanor Vance",
    initials: "EV",
    points: 4820,
    tier: "Garnet",
    nextTier: { name: "Onyx", at: 6000 },
    lastOrders: [
      { name: "Charred Hokkaido scallop", when: "Last Friday", price: 38 },
      { name: "Aged duck, fig glace", when: "Aug 23", price: 62 },
      { name: "Pavé of wagyu, bone marrow", when: "Jul 11", price: 95 },
    ],
    favorites: ["Heirloom tomato consommé", "Burnt honey madeleine"],
  },
  categories: [
    {
      id: "aperitifs",
      name: "Aperitifs",
      subtitle: "To begin — bar & garden",
      items: [
        { id: "ap1", name: "Smoked Negroni", desc: "Bourbon, Campari, vermouth di Torino, applewood smoke.", price: 22, tags: ["GF"], pop: true },
        { id: "ap2", name: "Sea Spritz", desc: "Manzanilla sherry, grapefruit cordial, oyster leaf.", price: 18, tags: ["VEG", "GF"] },
        { id: "ap3", name: "Garden Martini", desc: "House gin, cucumber distillate, lovage oil.", price: 20, tags: ["VEG", "GF"], eightySix: { reason: "Out of lovage", eta: "Tomorrow" } },
      ],
    },
    {
      id: "snacks",
      name: "Snacks",
      subtitle: "Three amuses, served together",
      items: [
        { id: "sn1", name: "Sourdough & cultured butter", desc: "Levain milled in-house, brown-butter cultured cream.", price: 14, tags: ["VEG"], pop: true },
        { id: "sn2", name: "Oyster, mignonette of green strawberry", desc: "Wellfleet, frozen mignonette, sorrel.", price: 9, tags: ["GF"], unit: "each" },
        { id: "sn3", name: "Beef tartare cone", desc: "Aged sirloin, smoked yolk, crispy nori shell.", price: 16 },
      ],
    },
    {
      id: "starters",
      name: "Starters",
      subtitle: "Cold & warm openings",
      items: [
        { id: "st1", name: "Charred Hokkaido scallop", desc: "Brown butter, kombu beurre blanc, sea grapes.", price: 38, tags: ["GF"], pop: true },
        { id: "st2", name: "Heirloom tomato consommé", desc: "Twelve-hour clarification, basil oil, burrata cloud.", price: 24, tags: ["VEG", "GF"], pop: true },
        { id: "st3", name: "Foie gras torchon", desc: "Pickled quince, brioche, smoked salt.", price: 36, allergens: ["dairy", "gluten"] },
        { id: "st4", name: "Hamachi crudo", desc: "Ponzu, finger lime, charred jalapeño.", price: 32, tags: ["GF"] },
      ],
    },
    {
      id: "mains",
      name: "Mains",
      subtitle: "From the wood-fired hearth",
      items: [
        { id: "mn1", name: "Aged duck breast", desc: "Twenty-eight day dry-age, fig glace, parsnip purée.", price: 62, tags: ["GF"], pop: true },
        { id: "mn2", name: "Pavé of wagyu, bone marrow", desc: "Coal-cooked A5, smoked marrow, black garlic.", price: 95, tags: ["GF"], pop: true },
        { id: "mn3", name: "Whole roasted turbot", desc: "For two — sauce vin jaune, brown crab.", price: 145, unit: "for two", tags: ["GF"] },
        { id: "mn4", name: "Smoked celeriac", desc: "Aged comté, brown butter dashi, hazelnut.", price: 44, tags: ["VEG"], eightySix: { reason: "Sold out for tonight", eta: "Tomorrow 6pm" } },
      ],
    },
    {
      id: "cheese",
      name: "Cheese",
      subtitle: "Hand-selected by our affineur",
      items: [
        { id: "ch1", name: "Cheese flight, three", desc: "Choose three from the cart — served with quince & honeycomb.", price: 28, tags: ["VEG"] },
        { id: "ch2", name: "Cheese flight, five", desc: "A guided journey — soft, washed, blue.", price: 42, tags: ["VEG"], pop: true },
      ],
    },
    {
      id: "desserts",
      name: "Desserts",
      subtitle: "Pastry chef Maya Okafor",
      items: [
        { id: "ds1", name: "Burnt honey madeleine", desc: "Warm from the oven, brown-butter ice cream.", price: 18, tags: ["VEG"], pop: true },
        { id: "ds2", name: "Smoked chocolate, miso caramel", desc: "70% Madagascar, rye crumble, malted milk.", price: 22, tags: ["VEG"] },
        { id: "ds3", name: "Fig leaf parfait", desc: "Buckwheat tuile, black sesame, fig leaf oil.", price: 20, tags: ["VEGAN", "GF"] },
      ],
    },
  ],
};
