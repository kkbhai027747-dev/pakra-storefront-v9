window.P10IpDirectoryNavigatorConfig = {
  'my-little-pony': {
    publisher: {
      label: 'Publisher',
      values: ['KAYOU'],
    },
    productType: {
      label: 'Product Type',
      values: ['CCG', 'TCG', 'Merch & Collectibles'],
    },
    market: {
      label: 'Market',
      values: ['CN'],
      hiddenForProductType: 'Merch & Collectibles',
    },
    routes: [
      {
        publisher: 'KAYOU',
        productType: 'CCG',
        market: 'CN',
        url: '/pages/my-little-pony',
      },
      {
        publisher: 'KAYOU',
        productType: 'TCG',
        market: 'CN',
        url: '/pages/my-little-pony-kayou-tcg-cn',
      },
      {
        publisher: 'KAYOU',
        productType: 'Merch & Collectibles',
        url: '/pages/my-little-pony-merch',
      },
    ],
  },
  naruto: {
    publisher: {
      label: 'Publisher',
      values: ['KAYOU'],
    },
    productType: {
      label: 'Product Type',
      values: ['CCG'],
    },
    market: {
      label: 'Market',
      values: ['CN'],
    },
    routes: [
      {
        publisher: 'KAYOU',
        productType: 'CCG',
        market: 'CN',
        url: '/pages/naruto',
      },
    ],
  },
  'harry-potter': {
    productType: {
      label: 'Product Type',
      values: ['CCG'],
    },
    market: {
      label: 'Market',
      values: ['CN'],
    },
    routes: [
      {
        productType: 'CCG',
        market: 'CN',
        url: '/pages/harry-potter',
      },
    ],
  },
  'the-powerpuff-girls': {
    productType: {
      label: 'Product Type',
      values: ['CCG'],
    },
    market: {
      label: 'Market',
      values: ['CN'],
    },
    routes: [
      {
        productType: 'CCG',
        market: 'CN',
        url: '/pages/the-powerpuff-girls',
      },
    ],
  },
  inuyasha: {
    productType: {
      label: 'Product Type',
      values: ['CCG', 'Merch & Collectibles'],
    },
    market: {
      label: 'Market',
      values: ['CN'],
      hiddenForProductType: 'Merch & Collectibles',
    },
    routes: [
      {
        productType: 'CCG',
        market: 'CN',
        url: '/pages/inuyasha',
      },
      {
        productType: 'Merch & Collectibles',
        url: '/pages/inuyasha-merch',
      },
    ],
  },
  arknights: {
    productType: {
      label: 'Product Type',
      values: ['CCG'],
    },
    market: {
      label: 'Market',
      values: ['CN'],
    },
    routes: [
      {
        productType: 'CCG',
        market: 'CN',
        url: '/pages/arknights',
      },
    ],
  },
  pokemon: {
    description: 'Trading cards, merchandise, and collectibles.',
    productType: {
      label: 'Product Type',
      values: ['TCG', 'Merch & Collectibles'],
    },
    market: {
      label: 'Market',
      values: ['JP', 'CN', 'EN'],
      hiddenForProductType: 'Merch & Collectibles',
    },
    routes: [
      {
        productType: 'TCG',
        market: 'JP',
        url: '/pages/pokemon-tcg',
      },
      {
        productType: 'TCG',
        market: 'CN',
        url: '/collections/pokemon-tcg-cn',
      },
      {
        productType: 'TCG',
        market: 'EN',
        url: '/collections/pokemon-tcg-en',
      },
      {
        productType: 'Merch & Collectibles',
        url: '/pages/pokemon-merch',
      },
    ],
  },
  'final-fantasy': {
    aliases: ['Magic: The Gathering', 'MTG'],
    description: 'Magic: The Gathering — FINAL FANTASY trading card releases.',
    productType: {
      label: 'Product Type',
      values: ['TCG'],
    },
    market: {
      label: 'Market',
      values: ['EN'],
    },
    routes: [
      {
        productType: 'TCG',
        market: 'EN',
        url: '/collections/ip-final-fantasy',
      },
    ],
  },
  disney: {
    aliases: ['Lorcana', 'Disney Lorcana', 'Disney Lorcana TCG'],
    description: 'Disney collectible cards, Lorcana TCG, and collector goods.',
    productType: {
      label: 'Product Type',
      values: ['CCG', 'TCG', 'Merch & Collectibles'],
    },
    market: {
      label: 'Market',
      values: ['CN'],
      showSingleOption: true,
    },
    routes: [
      {
        productType: 'CCG',
        market: 'CN',
        url: '/pages/disney-ccg',
      },
      {
        productType: 'TCG',
        url: '/pages/disney-tcg',
      },
      {
        productType: 'Merch & Collectibles',
        url: '/pages/disney-merch',
      },
    ],
  },
  marvel: {
    description: 'Collectible card games, trading cards, and collector goods.',
    productType: {
      label: 'Product Type',
      values: ['CCG', 'TCG', 'Merch & Collectibles'],
    },
    routes: [
      {
        productType: 'CCG',
        url: '/pages/marvel-ccg',
      },
      {
        productType: 'TCG',
        url: '/pages/marvel-tcg',
      },
      {
        productType: 'Merch & Collectibles',
        url: '/pages/marvel-merch',
      },
    ],
  },
  dc: {
    description: 'Collectible card games, trading cards, and collector goods.',
    productType: {
      label: 'Product Type',
      values: ['CCG', 'TCG', 'Merch & Collectibles'],
    },
    routes: [
      {
        productType: 'CCG',
        url: '/pages/dc-ccg',
      },
      {
        productType: 'TCG',
        url: '/pages/dc-tcg',
      },
      {
        productType: 'Merch & Collectibles',
        url: '/pages/dc-merch',
      },
    ],
  },
  'hatsune-miku': {
    aliases: ['Miku'],
    description: 'CCG collectible card releases and individual cards.',
    productType: { label: 'Product Type', values: ['CCG', 'Single Cards'] },
    routes: [
      { productType: 'CCG', url: '/collections/ip-hatsune-miku/sealed-product' },
      { productType: 'Single Cards', url: '/collections/ip-hatsune-miku/single-card' },
    ],
  },
  'detective-conan': {
    aliases: ['Conan'],
    description: 'Detective Conan CCG collectible card releases.',
    productType: { label: 'Product Type', values: ['CCG'] },
    routes: [
      { productType: 'CCG', url: '/collections/ip-detective-conan/sealed-product' },
    ],
  },
  'miracle-nikki': {
    description: 'Miracle Nikki CCG collectible card releases.',
    productType: { label: 'Product Type', values: ['CCG'] },
    routes: [
      { productType: 'CCG', url: '/collections/ip-miracle-nikki/sealed-product' },
    ],
  },
  'ye-luoli': {
    description: 'Individual Ye Luoli collectible cards.',
    productType: { label: 'Product Type', values: ['Single Cards'] },
    routes: [
      { productType: 'Single Cards', url: '/collections/ip-ye-luoli/single-card' },
    ],
  },
  'shining-nikki': {
    description: 'Shining Nikki CCG collectible card releases.',
    productType: { label: 'Product Type', values: ['CCG'] },
    routes: [
      { productType: 'CCG', url: '/collections/ip-shining-nikki/sealed-product' },
    ],
  },
  'persona-5-royal': {
    aliases: ['Persona 5', 'P5R'],
    description: 'Persona 5 Royal CCG collectible card releases.',
    productType: { label: 'Product Type', values: ['CCG'] },
    routes: [
      { productType: 'CCG', url: '/collections/ip-persona-5-royal/sealed-product' },
    ],
  },
  'miraculous-ladybug': {
    aliases: ['Miraculous'],
    description: 'Miraculous Ladybug trading card display boxes.',
    productType: { label: 'Product Type', values: ['TCG'] },
    routes: [
      { productType: 'TCG', url: '/collections/ip-miraculous-ladybug/sealed-product' },
    ],
  },
  'natsumes-book-of-friends': {
    aliases: ['Natsume', 'Natsume Yuujinchou'],
    description: "Natsume's Book of Friends CCG collectible card releases.",
    productType: { label: 'Product Type', values: ['CCG'] },
    routes: [
      { productType: 'CCG', url: '/collections/ip-natsume/sealed-product' },
    ],
  },
  'dunhuang-museum': {
    aliases: ['Dunhuang'],
    description: 'Dunhuang Museum CCG art and heritage card releases.',
    productType: { label: 'Product Type', values: ['CCG'] },
    routes: [
      { productType: 'CCG', url: '/collections/ip-dunhuang-museum/sealed-product' },
    ],
  },
  'the-fallen-merman': {
    aliases: ['Fallen Merman'],
    description: 'The Fallen Merman Deep Sea Dream CCG collectible cards.',
    productType: { label: 'Product Type', values: ['CCG'] },
    routes: [
      { productType: 'CCG', url: '/products/kayou-the-fallen-merman-deep-sea-dream-series-2-collectible-card-display-box' },
    ],
  },
  'tom-and-jerry': {
    aliases: ['Tom & Jerry'],
    description: 'Individual Tom and Jerry collectible cards.',
    productType: { label: 'Product Type', values: ['Single Cards'] },
    routes: [
      { productType: 'Single Cards', url: '/collections/ip-tom-and-jerry/single-card' },
    ],
  },
  'one-piece': {
    aliases: ['ONE PIECE Card Game'],
    description: 'Official ONE PIECE Card Game releases.',
    publisher: {
      label: 'Publisher',
      values: ['Bandai'],
    },
    productType: {
      label: 'Product Type',
      values: ['TCG'],
    },
    pending: {
      label: 'Launch status',
      message: 'Storefront route is awaiting product activation.',
    },
    routes: [],
  },
  "friends": {
    "description": "Friends collectible cards and boxed releases.",
    "productType": {
      "label": "Product Type",
      "values": [
        "CCG"
      ]
    },
    "routes": [
      {
        "productType": "CCG",
        "url": "/collections/ip-friends"
      }
    ]
  },
  "sanrio": {
    "description": "Sanrio collectible cards and boxed releases.",
    "productType": {
      "label": "Product Type",
      "values": [
        "CCG"
      ]
    },
    "routes": [
      {
        "productType": "CCG",
        "url": "/collections/ip-sanrio"
      }
    ]
  },
  "warner-bros": {
    "description": "Warner Bros. collectible cards and boxed releases.",
    "productType": {
      "label": "Product Type",
      "values": [
        "CCG"
      ]
    },
    "routes": [
      {
        "productType": "CCG",
        "url": "/collections/ip-warner-bros"
      }
    ]
  },
  "game-of-thrones": {
    "description": "Game of Thrones collectible cards and boxed releases.",
    "productType": {
      "label": "Product Type",
      "values": [
        "CCG"
      ]
    },
    "routes": [
      {
        "productType": "CCG",
        "url": "/collections/ip-game-of-thrones"
      }
    ]
  },
  "fantastic-beasts": {
    "description": "Fantastic Beasts collectible cards and boxed releases.",
    "productType": {
      "label": "Product Type",
      "values": [
        "CCG"
      ]
    },
    "routes": [
      {
        "productType": "CCG",
        "url": "/collections/ip-fantastic-beasts"
      }
    ]
  },
  "maltese": {
    "description": "Maltese collectible cards and boxed releases.",
    "productType": {
      "label": "Product Type",
      "values": [
        "CCG"
      ]
    },
    "routes": [
      {
        "productType": "CCG",
        "url": "/collections/ip-maltese"
      }
    ],
    "aliases": [
      "Line Puppy"
    ]
  },
  "please-eat-red-bean": {
    "description": "Please Eat Red Bean collectible cards and boxed releases.",
    "productType": {
      "label": "Product Type",
      "values": [
        "CCG"
      ]
    },
    "routes": [
      {
        "productType": "CCG",
        "url": "/collections/ip-please-eat-red-bean"
      }
    ]
  },
  "honkai-star-rail": {
    "description": "Honkai: Star Rail collectible cards and boxed releases.",
    "productType": {
      "label": "Product Type",
      "values": [
        "CCG"
      ]
    },
    "routes": [
      {
        "productType": "CCG",
        "url": "/collections/ip-honkai-star-rail"
      }
    ]
  },
  "china-winter-sports-national-team": {
    "description": "China Winter Sports National Team collectible cards and boxed releases.",
    "productType": {
      "label": "Product Type",
      "values": [
        "CCG"
      ]
    },
    "routes": [
      {
        "productType": "CCG",
        "url": "/collections/ip-china-winter-sports-national-team"
      }
    ]
  },
  "xiao-ma-ben-ben": {
    "description": "Xiao Ma Ben Ben collectible cards and boxed releases.",
    "productType": {
      "label": "Product Type",
      "values": [
        "CCG"
      ]
    },
    "routes": [
      {
        "productType": "CCG",
        "url": "/collections/ip-xiao-ma-ben-ben"
      }
    ]
  },
};
