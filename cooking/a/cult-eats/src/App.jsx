import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  addDoc 
} from 'firebase/firestore';
import { 
  MapPin, 
  Clock, 
  Flame, 
  Heart, 
  Bookmark, 
  Check, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  User, 
  LogOut, 
  Sparkles, 
  Compass, 
  ChefHat, 
  Utensils, 
  ArrowRight, 
  X, 
  Search, 
  ShoppingBag,
  Globe,
  Award,
  Zap
} from "lucide-react"
import { startSmoothScroll, setupPageMotion, scrollToTop, animateSwap } from './motion/motion.js';
import FoodIconField from './motion/FoodIconField.jsx';
import Marquee from './motion/Marquee.jsx';

// ==========================================
// FIREBASE INITIALIZATION (STRICT RULE 1-3)
// ==========================================
let app = null;
let auth = null;
let db = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'cult-eats-impossible-app';

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig = JSON.parse(__firebase_config);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (err) {
  console.error('Firebase initialization error:', err);
}

// ==========================================
// INITIAL ICONIC WORLD STREET FOODS DATASET
// ==========================================
const INITIAL_DISHES = [
  {
    id: 'jay-fai-crab-omelette',
    name: 'CRAB OMELETTE',
    parenthetical: '(JAY FAI BANGKOK)',
    region: 'ASIA',
    city: 'BANGKOK',
    country: 'THAILAND',
    spotName: 'Raan Jay Fai, Phra Nakhon',
    coordinates: '13.7525° N, 100.5048° E',
    waitTimeRealLife: '4.5 HRS IN LINE',
    cookTimeHome: '18 MINS',
    prepMinutes: 18,
    difficulty: 'HARDCORE',
    heatLevel: 'MEDIUM',
    tagline: 'SEARED OVER ROARING CHARCOAL IN SKI GOGGLES',
    story: 'Cooked by a 70+ year old street-food queen wearing ski goggles over a blistering charcoal brazier. Stuffed with a half-pound of sweet jumbo lump blue swimmer crab encased in a paper-thin, lacy golden egg cylinder.',
    secretTrick: 'Heat rice bran oil until smoking hot (400°F+). Whisk eggs with a splash of lime juice and rice flour slurry right before pouring from 12 inches high to create the signature crispy honeycomb crust that wraps around the crab without absorbing grease.',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1000&q=85',
    maskShape: 'mask-blob-1',
    featured: true,
    ingredients: [
      { item: 'Jumbo Lump Crab Meat (steamed)', amount: 250, unit: 'g' },
      { item: 'Large Duck or Free-Range Eggs', amount: 4, unit: 'pcs' },
      { item: 'High-Smoke Rice Bran Oil', amount: 350, unit: 'ml' },
      { item: 'Thai Fish Sauce (Nam Pla)', amount: 1, unit: 'tbsp' },
      { item: 'Fresh Lime Juice', amount: 0.5, unit: 'tsp' },
      { item: 'Crispy Garlic & Cilantro', amount: 15, unit: 'g' }
    ],
    steps: [
      {
        title: 'AERATE THE EGG MATRIX',
        instruction: 'Beat the eggs vigorously with fish sauce and fresh lime juice for 90 seconds until frothy micro-bubbles form across the top.',
        timerSeconds: 90
      },
      {
        title: 'BLISTER THE WOK OIL',
        instruction: 'Heat 350ml oil in a deep carbon-steel wok until wisps of white smoke appear. Drop a tiny droplet of egg—it must puff instantly.',
        timerSeconds: 120
      },
      {
        title: 'THE LACY POUR & CRAB CORE',
        instruction: 'Pour half the egg mixture from high above the wok. Immediately pile the warm lump crab in the center and fold the crispy lacy edges inward using two spatulas.',
        timerSeconds: 180
      },
      {
        title: 'SEAL THE GOLDEN CYLINDER',
        instruction: 'Roll the omelette tight like a cigar, pouring the remaining egg along the seam to weld it shut until deep mahogany-gold.',
        timerSeconds: 90
      }
    ]
  },
  {
    id: 'los-tacos-adobada',
    name: 'ADOBADA TACO',
    parenthetical: '(LOS TACOS NO. 1 NYC)',
    region: 'AMERICAS',
    city: 'NEW YORK',
    country: 'USA / TIJUANA',
    spotName: 'Chelsea Market, Manhattan',
    coordinates: '40.7424° N, 74.0061° W',
    waitTimeRealLife: '45 MINS QUEUE',
    cookTimeHome: '25 MINS',
    prepMinutes: 25,
    difficulty: 'MEDIUM',
    heatLevel: 'FIERY',
    tagline: 'SHAVED OFF THE VERTICAL TROMPO INTO FRESH MASA',
    story: 'Born from Tijuana street masters right inside Chelsea Market. Thinly sliced pork shoulder marinated in guajillo, ancho, and achiote paste, charred on the vertical spit and crowned with whipped avocado mousse and raw onion.',
    secretTrick: 'Press the freshly pressed corn tortilla directly against the glistening red fat of the pork before griddling for 15 seconds, then top with creamy whipped guacamole (blended with ice water and lime) rather than chunky mash.',
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1000&q=85',
    maskShape: 'mask-blob-2',
    featured: false,
    ingredients: [
      { item: 'Thinly Sliced Pork Shoulder', amount: 400, unit: 'g' },
      { item: 'Guajillo & Ancho Chile Paste', amount: 60, unit: 'g' },
      { item: 'Achiote (Annatto) & Pineapple Juice', amount: 80, unit: 'ml' },
      { item: 'Fresh Pressed Corn Tortillas', amount: 6, unit: 'pcs' },
      { item: 'Hass Avocados (Whipped)', amount: 2, unit: 'pcs' },
      { item: 'Roasted Charred Pineapple Spears', amount: 100, unit: 'g' }
    ],
    steps: [
      {
        title: 'BLITZ THE RED ADOBO MARINADE',
        instruction: 'Blend rehydrated guajillo chiles, achiote paste, garlic, oregano, vinegar, and pineapple juice into a blood-red velvet paint.',
        timerSeconds: 120
      },
      {
        title: 'CAST-IRON HIGH CHAR',
        instruction: 'Sear the marinated pork wafer-slices in a screaming hot dry cast-iron skillet until the edges blacken and caramelize.',
        timerSeconds: 240
      },
      {
        title: 'EMULSIFY THE TAQUERIA GUACAMOLE',
        instruction: 'Blend ripe avocados, cilantro, jalapeno, lime juice, and 2 tbsp ice-cold water on high speed until silky smooth.',
        timerSeconds: 60
      },
      {
        title: 'THE STREET ASSEMBLY',
        instruction: 'Steam-sear corn tortillas, pile shaved pork high, swipe with avocado crema, diced white onion, cilantro, and flick a slice of charred pineapple on top.',
        timerSeconds: 60
      }
    ]
  },
  {
    id: 'las-du-fallafel-paris',
    name: 'FALLAFEL SPÉCIAL',
    parenthetical: "(L'AS DU FALLAFEL PARIS)",
    region: 'EUROPE',
    city: 'PARIS',
    country: 'FRANCE',
    spotName: '34 Rue des Rosiers, Le Marais',
    coordinates: '48.8575° N, 2.3592° E',
    waitTimeRealLife: '1 HR COBBLESTONE LINE',
    cookTimeHome: '22 MINS',
    prepMinutes: 22,
    difficulty: 'EASY',
    heatLevel: 'SPICY',
    tagline: 'CRUNCHY HERB FRITTERS DROWNING IN TAHINI & HARISSA',
    story: 'The undisputed crown jewel of Rue des Rosiers in Paris. Overstuffed pillowy pita layered in strict architectural order: pickled purple cabbage, silky fried eggplant, emerald-green herb falafel balls, golden tahini, and fiery red Yemenite zhoug.',
    secretTrick: 'Never use canned chickpeas. Soak dried chickpeas for 18 hours with a pinch of baking soda and pulse raw with parsley, cilantro, and garlic so the center stays neon green and fluffy while the crust shatters.',
    image: 'https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?auto=format&fit=crop&w=1000&q=85',
    maskShape: 'mask-blob-3',
    featured: false,
    ingredients: [
      { item: 'Soaked Raw Dried Chickpeas', amount: 300, unit: 'g' },
      { item: 'Fresh Flat-Leaf Parsley & Cilantro', amount: 80, unit: 'g' },
      { item: 'Japanese Eggplant (Cubed & Fried)', amount: 200, unit: 'g' },
      { item: 'Thick Israeli Pocket Pita', amount: 2, unit: 'pcs' },
      { item: 'Roasted Sesame Tahini', amount: 90, unit: 'ml' },
      { item: 'Fiery Red Harissa Paste', amount: 30, unit: 'g' }
    ],
    steps: [
      {
        title: 'PULSE THE EMERALD MIX',
        instruction: 'Pulse soaked raw chickpeas with herbs, garlic, cumin, and coriander until it resembles coarse wet sand (do not puree into paste).',
        timerSeconds: 90
      },
      {
        title: 'DEEP-FRY THE FALAFEL & EGGPLANT',
        instruction: 'Scoop balls into 365°F oil until deep chestnut brown and super craggy. Fry cubed eggplant alongside until jammy inside.',
        timerSeconds: 210
      },
      {
        title: 'ARCHITECTURAL PITA LAYERING',
        instruction: 'Smear the bottom of warm pita with hummus, add pickled red cabbage, 3 falafel balls, fried eggplant, then 3 more falafel balls on top.',
        timerSeconds: 60
      },
      {
        title: 'THE DOUBLE SAUCE DRENCH',
        instruction: 'Zig-zag lemon-garlic tahini generously over the crown and finish with a bold stripe of crimson harissa.',
        timerSeconds: 30
      }
    ]
  },
  {
    id: 'tsukiji-tamagoyaki',
    name: 'TSUKIJI TAMAGO',
    parenthetical: '(MARUTAKE TOKYO)',
    region: 'ASIA',
    city: 'TOKYO',
    country: 'JAPAN',
    spotName: 'Tsukiji Outer Market, Chuo City',
    coordinates: '35.6655° N, 139.7707° E',
    waitTimeRealLife: '40 MINS MARKET STALL',
    cookTimeHome: '12 MINS',
    prepMinutes: 12,
    difficulty: 'MEDIUM',
    heatLevel: 'MILD',
    tagline: 'SEVEN-LAYER Dashi CUSTARD ON A BAMBOO SKEWER',
    story: 'Served steaming hot on a wooden skewer at 6:00 AM in Tokyo’s legendary fish market. A sweet-savory, tremblingly tender rolled egg block infused with smoky bonito dashi and mirin.',
    secretTrick: 'Keep a folded paper towel soaked in neutral oil in a small bowl and swab the rectangular pan between every single thin layer within 3 seconds of rolling so the layers fuse without browning excessively.',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1000&q=85',
    maskShape: 'mask-blob-4',
    featured: false,
    ingredients: [
      { item: 'Japanese Large Eggs (Chilled)', amount: 5, unit: 'pcs' },
      { item: 'Smoky Bonito Dashi Stock', amount: 75, unit: 'ml' },
      { item: 'Fine White Caster Sugar', amount: 2.5, unit: 'tbsp' },
      { item: 'Hon-Mirin (Sweet Rice Wine)', amount: 1.5, unit: 'tbsp' },
      { item: 'Usukuchi Light Soy Sauce', amount: 1, unit: 'tsp' },
      { item: 'Grated Daikon Radish', amount: 40, unit: 'g' }
    ],
    steps: [
      {
        title: 'SLICE THE EGG WHITES (NO FOAM)',
        instruction: 'Use chopsticks in a zig-zag motion to cut the egg whites into the yolks with cold dashi, sugar, and mirin without incorporating air bubbles.',
        timerSeconds: 60
      },
      {
        title: 'FIRST THIN SHEET & CORE ROLL',
        instruction: 'Pour a paper-thin coat into a hot oiled makiyakinabe pan. Pop large bubbles and roll tightly from far edge to near edge while still glossy on top.',
        timerSeconds: 90
      },
      {
        title: 'FIVE-LAYER LAMINATION',
        instruction: 'Push roll to far end, swab pan with oil, pour next layer lifting the roll so custard flows underneath, and roll back toward you. Repeat 4 times.',
        timerSeconds: 180
      },
      {
        title: 'BAMBOO MAT PRESS & SKEWER',
        instruction: 'Shape in a makisu bamboo mat for 2 minutes to lock the cubic geometry, slice thick, and spear onto wooden skewers.',
        timerSeconds: 120
      }
    ]
  },
  {
    id: 'da-michele-margherita',
    name: 'DOPPIA MARGHERITA',
    parenthetical: '(DA MICHELE NAPLES)',
    region: 'EUROPE',
    city: 'NAPLES',
    country: 'ITALY',
    spotName: 'Via Cesare Sersale 1, Napoli',
    coordinates: '40.8498° N, 14.2633° E',
    waitTimeRealLife: '2 HRS TICKET QUEUE',
    cookTimeHome: '15 MINS',
    prepMinutes: 15,
    difficulty: 'HARDCORE',
    heatLevel: 'MILD',
    tagline: 'LEOPARD-SPOTTED WAGON WHEEL FROM A 900°F DOME',
    story: 'Since 1870, L’Antica Pizzeria da Michele serves only two pizzas: Marinara and Margherita. The dough spills over the plate edges—blistered, soupy in the center, swimming in crushed San Marzano tomatoes and double Fior di Latte.',
    secretTrick: 'In a home kitchen without a 900°F brick oven, preheat a heavy upside-down cast-iron skillet on the top rack at 550°F, sear the stretched dough on the stove burner for 90 seconds first, then blast under the broiler for 90 seconds.',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1000&q=85',
    maskShape: 'mask-blob-1',
    featured: false,
    ingredients: [
      { item: 'Tipo 00 High-Hydration Dough Ball', amount: 280, unit: 'g' },
      { item: 'Hand-Crushed San Marzano DOP Tomatoes', amount: 140, unit: 'g' },
      { item: 'Aged Agerola Fior di Latte (Baton Cut)', amount: 130, unit: 'g' },
      { item: 'Pecorino Romano (Finely Grated)', amount: 15, unit: 'g' },
      { item: 'Fresh Neapolitan Sweet Basil Leaves', amount: 6, unit: 'pcs' },
      { item: 'Campania Extra Virgin Olive Oil', amount: 15, unit: 'ml' }
    ],
    steps: [
      {
        title: 'THE NEAPOLITAN SLAP STRETCH',
        instruction: 'Press air from center outward to a 1cm rim (cornicione), then slap-stretch from knuckle to knuckle until 13 inches wide and translucent in the middle.',
        timerSeconds: 90
      },
      {
        title: 'SPIRAL THE RAW SAN MARZANO',
        instruction: 'Ladle uncooked, salted hand-crushed tomatoes in a spiral. Dust with Pecorino, tear basil leaves, and scatter thick batons of Fior di Latte.',
        timerSeconds: 60
      },
      {
        title: 'STOVETOP IRON FLOOR SEAR',
        instruction: 'Slide onto a smoking-hot dry cast-iron pan on high flame until the underside develops dramatic black leopard char spots.',
        timerSeconds: 90
      },
      {
        title: 'TOP-RACK BROILER BLAST',
        instruction: 'Transfer pan 2 inches beneath a roaring broiler until the cornicione balloons and the mozzarella puddles into molten rivers.',
        timerSeconds: 90
      }
    ]
  },
  {
    id: 'el-moro-churros-cdmx',
    name: 'CRISP CHURROS',
    parenthetical: '(EL MORO MEXICO CITY)',
    region: 'AMERICAS',
    city: 'MEXICO CITY',
    country: 'MEXICO',
    spotName: 'Eje Central Lázaro Cárdenas 42, CDMX',
    coordinates: '19.4319° N, 99.1412° W',
    waitTimeRealLife: '50 MINS MIDNIGHT LINE',
    cookTimeHome: '20 MINS',
    prepMinutes: 20,
    difficulty: 'EASY',
    heatLevel: 'MILD',
    tagline: 'PIPED IN GIANT SPIRALS SINCE 1935 WITH SPICED CHOCOLATE',
    story: 'At 2:00 AM in downtown Mexico City, churro masters pipe yard-long coils of choux-style dough into bubbling cauldrons, snipping them into ridged golden batons dusted in Mexican canela sugar.',
    secretTrick: 'Use a sharp metal star tip (#1M or #8B) and boil the water with butter and salt before dumping all the flour in at once—this gelatinizes the starches so the churros never go soggy and shatter like glass.',
    image: 'https://images.unsplash.com/photo-1624371414361-e670edf4898d?auto=format&fit=crop&w=1000&q=85',
    maskShape: 'mask-blob-2',
    featured: false,
    ingredients: [
      { item: 'All-Purpose Unbleached Flour', amount: 250, unit: 'g' },
      { item: 'Boiling Filtered Water', amount: 300, unit: 'ml' },
      { item: 'Unsalted Cultured Butter', amount: 45, unit: 'g' },
      { item: 'Ceylon / Mexican Canela Cinnamon', amount: 2, unit: 'tbsp' },
      { item: 'Granulated Cane Sugar', amount: 120, unit: 'g' },
      { item: 'Stone-Ground Mexican Dark Chocolate', amount: 150, unit: 'g' }
    ],
    steps: [
      {
        title: 'SCALD THE DOUGH MATRIX',
        instruction: 'Bring water, butter, and a pinch of salt to a furious boil. Dump flour in all at once and beat fiercely with a wooden spoon until a smooth ball forms.',
        timerSeconds: 120
      },
      {
        title: 'PIPE THE STAR-RIDGED COIL',
        instruction: 'Pack warm dough into a heavy-duty star-tipped pastry bag. Pipe 8-inch ridged rods directly into 375°F oil, snipping cleanly with kitchen shears.',
        timerSeconds: 180
      },
      {
        title: 'CANELA SUGAR TUMBLE',
        instruction: 'Drain for 15 seconds on wire rack, then immediately toss in a tray of pulverized Mexican cinnamon and cane sugar while still sizzling.',
        timerSeconds: 45
      },
      {
        title: 'FROTH THE HOT CHOCOLATE MOLINILLO',
        instruction: 'Simmer stone-ground chocolate with whole milk and whip until foamy for dunking.',
        timerSeconds: 90
      }
    ]
  },
  {
    id: 'bambi-balik-ekmek-istanbul',
    name: 'BALIK EKMEK',
    parenthetical: '(EMINÖNÜ DOCKS ISTANBUL)',
    region: 'MIDDLE EAST',
    city: 'ISTANBUL',
    country: 'TURKEY',
    spotName: 'Galata Bridge Golden Horn Boats',
    coordinates: '41.0182° N, 28.9708° E',
    waitTimeRealLife: '30 MINS HARBOR SURGE',
    cookTimeHome: '16 MINS',
    prepMinutes: 16,
    difficulty: 'EASY',
    heatLevel: 'MEDIUM',
    tagline: 'GRIDDLED MACKEREL TOSSED FROM ROCKING GOLDEN HORN BOATS',
    story: 'Grilled on ornate rocking boats moored beside the Galata Bridge. Crispy-skinned Atlantic mackerel fillets slapped inside crusty Turkish Francala bread with sumac-rubbed red onions and a shot of fiery crimson pickle brine.',
    secretTrick: 'Massage sliced red onions with a generous tablespoon of tangy purple sumac and coarse sea salt for 5 minutes until they soften and bleed magenta juice, then brush the bread crust with the sizzling mackerel skin drippings.',
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=1000&q=85',
    maskShape: 'mask-blob-3',
    featured: false,
    ingredients: [
      { item: 'Skin-On Atlantic Mackerel Fillets', amount: 350, unit: 'g' },
      { item: 'Crusty Turkish Somun / Baguette', amount: 2, unit: 'pcs' },
      { item: 'Red Onion (Feathered Thin)', amount: 120, unit: 'g' },
      { item: 'Ground Anatolian Sumac Berry', amount: 1.5, unit: 'tbsp' },
      { item: 'Aleppo Pepper Flakes (Pul Biber)', amount: 1, unit: 'tbsp' },
      { item: 'Fresh Lemon & Pomegranate Molasses', amount: 30, unit: 'ml' }
    ],
    steps: [
      {
        title: 'MACERATE THE SUMAC ONIONS',
        instruction: 'Scrunch thinly sliced red onions, chopped parsley, sumac, and sea salt with your bare hands until wilted and fragrant.',
        timerSeconds: 90
      },
      {
        title: 'SCORE & BLISTER THE MACKEREL SKIN',
        instruction: 'Score mackerel skin in diamonds, brush with olive oil, and press skin-side down on a flat iron plancha until shatteringly crisp.',
        timerSeconds: 180
      },
      {
        title: 'STAMP THE BREAD IN FISH DRIPPINGS',
        instruction: 'Split crusty bread open and press the crumb side directly onto the sizzling pan juices for 20 seconds until toasted gold.',
        timerSeconds: 30
      },
      {
        title: 'LOAD & DRENCH WITH LEMON',
        instruction: 'Tuck hot fillets inside the loaf, pile high with sumac onions, shower with Pul Biber chili flakes, and squeeze lemon juice.',
        timerSeconds: 30
      }
    ]
  },
  {
    id: 'bombay-vada-pav-mumbai',
    name: 'BOMBAY VADA PAV',
    parenthetical: '(ASHOK VADA PAV MUMBAI)',
    region: 'ASIA',
    city: 'MUMBAI',
    country: 'INDIA',
    spotName: 'Kirti College Lane, Dadar West',
    coordinates: '19.0176° N, 72.8305° E',
    waitTimeRealLife: '35 MINS MONSOON CROWD',
    cookTimeHome: '24 MINS',
    prepMinutes: 24,
    difficulty: 'MEDIUM',
    heatLevel: 'FIERY',
    tagline: 'SPICED POTATO FRITTER & GARLIC CHUTNEY GUNPOWDER',
    story: 'Since 1971 outside Kirti College in Mumbai, Ashok Vada Pav has fueled millions. A turmeric-spiced mashed potato sphere dipped in aerated gram flour batter, wedged inside buttered ladi pav with fiery dry red garlic-coconut chutney and fried green chiles.',
    secretTrick: 'Whisk a pinch of hot fry oil and a tiny dash of baking soda into the besan (chickpea flour) batter, and scatter crispy fried batter droplets (chura) inside the bun for double crunch.',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=1000&q=85',
    maskShape: 'mask-blob-4',
    featured: false,
    ingredients: [
      { item: 'Boiled & Mashed Starchy Potatoes', amount: 400, unit: 'g' },
      { item: 'Besan (Fine Gram Chickpea Flour)', amount: 150, unit: 'g' },
      { item: 'Soft Ladi Pav Dinner Rolls', amount: 4, unit: 'pcs' },
      { item: 'Roasted Garlic, Dry Coconut & Kashmiri Chili', amount: 80, unit: 'g' },
      { item: 'Black Mustard Seeds & Curry Leaves', amount: 15, unit: 'g' },
      { item: 'Slit Whole Thai Green Chiles', amount: 6, unit: 'pcs' }
    ],
    steps: [
      {
        title: 'TEMPER THE MUSTARD SEED TADKA',
        instruction: 'Pop black mustard seeds, hing, curry leaves, crushed garlic, ginger, and turmeric in hot oil, then fold into mashed potatoes and shape into balls.',
        timerSeconds: 120
      },
      {
        title: 'PULSE THE RED GARLIC GUNPOWDER',
        instruction: 'Coarsely grind toasted garlic cloves, desiccated coconut, sesame seeds, and fiery red Kashmiri chili into a dry crimson rubble.',
        timerSeconds: 60
      },
      {
        title: 'FRY VADAS & CRISPY CHURA',
        instruction: 'Dip potato spheres in silky gram batter and deep-fry until golden. Drizzle extra batter droplets into oil to create crunchy chura pearls.',
        timerSeconds: 210
      },
      {
        title: 'SMASH & SLATHER THE PAV',
        instruction: 'Slather soft pav with green cilantro chutney and heaps of red garlic gunpowder, press hot vada inside until slightly flattened, and top with a blistered salted green chile.',
        timerSeconds: 45
      }
    ]
  },
  {
    id: 'jemaa-el-fnaa-mechoui-marrakech',
    name: 'MECHOUI LAMB',
    parenthetical: '(ALLEY 32 MARRAKECH)',
    region: 'MIDDLE EAST',
    city: 'MARRAKECH',
    country: 'MOROCCO',
    spotName: 'Mechoui Alley, Jemaa el-Fnaa Medina',
    coordinates: '31.6269° N, 7.9891° W',
    waitTimeRealLife: 'NOON PIT OPENING RUSH',
    cookTimeHome: '35 MINS',
    prepMinutes: 35,
    difficulty: 'MEDIUM',
    heatLevel: 'MEDIUM',
    tagline: 'EARTHEN PIT-ROASTED LAMB WITH CUMIN SALT & KHOBZ',
    story: 'Pulled from underground clay ovens in Marrakech’s Mechoui Alley. Meltingly tender lamb crusted in saffron-garlic butter, torn by hand onto brown paper and eaten with warm semolina khobz bread and freshly toasted cumin-salt.',
    secretTrick: 'Rub the lamb aggressively with ras el hanout, preserved lemon paste, and smen (or browned cultured butter), then sear under high heat and finish with a dry dip of freshly toasted and crushed cumin seeds mixed 1:1 with flaky salt.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=85',
    maskShape: 'mask-blob-1',
    featured: false,
    ingredients: [
      { item: 'Boneless Lamb Shoulder Steaks', amount: 450, unit: 'g' },
      { item: 'Whole Cumin Seeds (Toasted & Crushed)', amount: 2, unit: 'tbsp' },
      { item: 'Preserved Lemon Rind (Minced)', amount: 30, unit: 'g' },
      { item: 'Saffron Threads & Browned Butter', amount: 50, unit: 'g' },
      { item: 'Moroccan Semolina Khobz Flatbread', amount: 2, unit: 'pcs' },
      { item: 'Harissa & Green Olives', amount: 60, unit: 'g' }
    ],
    steps: [
      {
        title: 'BLOOM SAFFRON & PRESERVED LEMON BUTTER',
        instruction: 'Steep crushed saffron threads in warm browned butter with grated garlic, coriander, and minced preserved lemon.',
        timerSeconds: 90
      },
      {
        title: 'HIGH-HEAT CHAR & BASTE',
        instruction: 'Sear lamb steaks in cast iron until the fat cap renders into crispy mahogany cracklings, basting continuously with the saffron butter.',
        timerSeconds: 300
      },
      {
        title: 'CRUSH THE CUMIN-SALT DIP',
        instruction: 'Toast whole cumin seeds in a dry pan until smoking fragrant, then crush in a mortar with flaky sea salt.',
        timerSeconds: 60
      },
      {
        title: 'BUTCHER PAPER SERVICE',
        instruction: 'Pull the tender meat into chunks with two forks, pile onto warm Khobz bread, and dip every bite directly into the cumin salt mound.',
        timerSeconds: 45
      }
    ]
  }
];

const CITIES = ['ALL CITIES', 'BANGKOK', 'NEW YORK', 'PARIS', 'TOKYO', 'NAPLES', 'MEXICO CITY', 'ISTANBUL', 'MUMBAI', 'MARRAKECH'];
const REGIONS = ['ASIA', 'AMERICAS', 'EUROPE', 'MIDDLE EAST'];
const VAULT_TAGS = ['ALL SAVED', 'COOK SOON', 'MASTERED', 'BUCKET LIST TRIP'];

// Hero photos: dish index, placement, mask, resting tilt, mouse depth, scroll speed, float timing, label
const HERO_PHOTOS = [
  { dish: 0, place: 'hidden md:block top-10 left-4 lg:left-8 w-44 h-44 lg:w-56 lg:h-56', mask: 'mask-blob-1', rotate: '-6deg', depth: -0.6, speed: -0.3, dur: '6.5s', delay: '-1s', label: 'BANGKOK • CRAB OMELETTE ▸', labelPos: 'bottom-2 left-4' },
  { dish: 1, place: 'hidden md:block top-12 right-4 lg:right-10 w-44 h-44 lg:w-56 lg:h-56', mask: 'mask-blob-2', rotate: '8deg', depth: 0.7, speed: -0.22, dur: '7.2s', delay: '-3s', label: 'NYC • ADOBADA TACO ▸', labelPos: 'bottom-2 right-4' },
  { dish: 4, place: 'hidden lg:block bottom-10 left-12 w-48 h-48', mask: 'mask-blob-3', rotate: '5deg', depth: -0.45, speed: -0.1, dur: '5.8s', delay: '-2s', label: 'NAPLES • DA MICHELE ▸', labelPos: 'top-2 left-4' },
  { dish: 7, place: 'hidden lg:block bottom-8 right-14 w-48 h-48', mask: 'mask-blob-4', rotate: '-7deg', depth: 0.55, speed: -0.14, dur: '6.8s', delay: '-4s', label: 'MUMBAI • VADA PAV ▸', labelPos: 'top-2 right-4' }
];

const MARQUEE_TOP = INITIAL_DISHES.map((d) => d.name);
const MARQUEE_BOTTOM = ['ZERO GATEKEEPING', 'NO 4-HOUR LINES', 'EXACT STREET RATIOS', 'COOK IT TONIGHT'];
const MARQUEE_FOOTER = ['EAT THE WORLD', 'FROM YOUR STOVE', 'STEAL THE RECIPES', 'DROP A LEGEND'];

export default function App() {
  // Navigation & Transition State
  const [activePage, setActivePage] = useState('HOME');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState('CULT EATS');

  // Data State
  const [communityDishes, setCommunityDishes] = useState([]);
  const [selectedDish, setSelectedDish] = useState(INITIAL_DISHES[0]);
  const [activeRegionTab, setActiveRegionTab] = useState('ASIA');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL CITIES');
  const [recipeDiffFilter, setRecipeDiffFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Recipe Lab Interactive State
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [activeTimers, setActiveTimers] = useState({}); // { stepIdx: { remaining, running } }

  // User Auth & Vault State
  const [user, setUser] = useState(null);
  const [chefAlias, setChefAlias] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [savedVault, setSavedVault] = useState({}); // { dishId: { dishId, tag, note, savedAt } }
  const [activeVaultTag, setActiveVaultTag] = useState('ALL SAVED');
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Submit Dish Form State
  const [newDishForm, setNewDishForm] = useState({
    name: '',
    parenthetical: '',
    region: 'ASIA',
    city: '',
    spotName: '',
    waitTimeRealLife: '1 HR LINE',
    cookTimeHome: '20 MINS',
    difficulty: 'MEDIUM',
    tagline: '',
    story: '',
    secretTrick: '',
    ingredientsText: '300g Special Protein\n2 tbsp Secret Chili Oil\n4 pcs Street Flatbread',
    step1Title: 'HIGH HEAT SEAR',
    step1Text: 'Blast in a smoking cast iron pan until charred on the edges.'
  });

  // Motion: root for scoped GSAP selectors, region grid for tab swaps
  const motionRootRef = useRef(null);
  const regionGridRef = useRef(null);
  const prevPageRef = useRef(null);
  const firstRegionRef = useRef(true);

  // Combine initial dishes with live Firestore community dishes
  const allDishes = useMemo(() => {
    return [...INITIAL_DISHES, ...communityDishes];
  }, [communityDishes]);

  // Trigger temporary punk manifesto toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // ==========================================
  // FIREBASE AUTH SETUP (RULE 3)
  // ==========================================
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth error:', err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) {
        setChefAlias(currentUser.displayName);
      }
    });
    return () => unsubscribe();
  }, []);

  // ==========================================
  // FIRESTORE REAL-TIME LISTENERS (RULE 1-3)
  // ==========================================
  useEffect(() => {
    if (!user || !db) return;

    // 1. User's Private Saved Vault
    const vaultRef = collection(db, 'artifacts', appId, 'users', user.uid, 'savedVault');
    const unsubVault = onSnapshot(
      vaultRef,
      (snapshot) => {
        const items = {};
        snapshot.forEach((docSnap) => {
          items[docSnap.id] = docSnap.data();
        });
        setSavedVault(items);
      },
      (error) => console.error('Vault listener error:', error)
    );

    // 2. Public Community Dishes Feed
    const publicDishesRef = collection(db, 'artifacts', appId, 'public', 'data', 'communityDishes');
    const unsubPublic = onSnapshot(
      publicDishesRef,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort in memory (Rule 2)
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setCommunityDishes(list);
      },
      (error) => console.error('Community feed listener error:', error)
    );

    return () => {
      unsubVault();
      unsubPublic();
    };
  }, [user]);

  // ==========================================
  // SMOOTH SCROLL + SCROLL / HERO / PARALLAX MOTION (src/motion/motion.js)
  // ==========================================
  useEffect(() => startSmoothScroll(), []);

  // Rebuilt per page. After a curtain swap, wait for the curtain to lift (750ms total, page swaps at 340ms).
  useLayoutEffect(() => {
    const delay = prevPageRef.current && prevPageRef.current !== activePage ? 0.42 : 0;
    prevPageRef.current = activePage;
    return setupPageMotion(motionRootRef.current, { delay });
  }, [activePage]);

  useLayoutEffect(() => {
    if (firstRegionRef.current) {
      firstRegionRef.current = false;
      return;
    }
    animateSwap(regionGridRef.current);
  }, [activeRegionTab]);

  // ==========================================
  // KITCHEN STEP TIMERS ENGINE
  // ==========================================
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key].running && next[key].remaining > 0) {
            changed = true;
            const newRem = next[key].remaining - 1;
            next[key] = {
              ...next[key],
              remaining: newRem,
              running: newRem > 0
            };
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // FULL-SCREEN BUTCHER CURTAIN NAVIGATION
  // ==========================================
  const navigateWithCurtain = (targetPage, customFlashText = null, dishToSelect = null) => {
    if (isTransitioning) return;
    setTransitionLabel(customFlashText || targetPage);
    setIsTransitioning(true);

    setTimeout(() => {
      if (dishToSelect) {
        setSelectedDish(dishToSelect);
        setCheckedIngredients({});
        setActiveTimers({});
      }
      setActivePage(targetPage);
      scrollToTop();
    }, 340);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 750);
  };

  // ==========================================
  // VAULT ACTIONS (SAVE / REMOVE / TAG / NOTE)
  // ==========================================
  const toggleSaveDish = async (dish, e) => {
    if (e) e.stopPropagation();
    const isAlreadySaved = Boolean(savedVault[dish.id]);

    // Optimistic local state update + Firestore persistence
    if (isAlreadySaved) {
      setSavedVault((prev) => {
        const copy = { ...prev };
        delete copy[dish.id];
        return copy;
      });
      triggerToast(`REMOVED FROM VAULT: ${dish.name}`);
      if (user && db) {
        try {
          await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'savedVault', dish.id));
        } catch (err) {
          console.error('Error removing dish:', err);
        }
      }
    } else {
      const payload = {
        dishId: dish.id,
        tag: 'COOK SOON',
        note: '',
        savedAt: Date.now()
      };
      setSavedVault((prev) => ({ ...prev, [dish.id]: payload }));
      triggerToast(`LOCKED IN VAULT: ${dish.name}`);
      if (user && db) {
        try {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'savedVault', dish.id), payload);
        } catch (err) {
          console.error('Error saving dish:', err);
        }
      }
    }
  };

  const updateVaultItem = async (dishId, updates) => {
    const existing = savedVault[dishId] || { dishId, tag: 'COOK SOON', note: '', savedAt: Date.now() };
    const updated = { ...existing, ...updates };
    setSavedVault((prev) => ({ ...prev, [dishId]: updated }));
    if (user && db) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'savedVault', dishId), updated);
      } catch (err) {
        console.error('Error updating vault item:', err);
      }
    }
  };

  // ==========================================
  // USER ALIAS LOGIN HANDLER
  // ==========================================
  const handleChefLogin = async (e) => {
    e.preventDefault();
    const cleanAlias = aliasInput.trim().toUpperCase() || 'CHEF REBEL';
    setChefAlias(cleanAlias);
    if (user && auth) {
      try {
        await updateProfile(user, { displayName: cleanAlias });
      } catch (err) {
        console.error('Profile update error:', err);
      }
    }
    setShowAuthModal(false);
    triggerToast(`SIGNED IN AS ${cleanAlias}`);
  };

  // ==========================================
  // SUBMIT NEW LEGENDARY DISH TO FIRESTORE
  // ==========================================
  const handleDropDishSubmit = async (e) => {
    e.preventDefault();
    if (!newDishForm.name.trim() || !newDishForm.city.trim()) {
      triggerToast('FILL IN THE DISH NAME & CITY FIRST');
      return;
    }

    const parsedIngredients = newDishForm.ingredientsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({
        item: line,
        amount: 1,
        unit: 'portion'
      }));

    const newDishObj = {
      name: newDishForm.name.trim().toUpperCase(),
      parenthetical: `(${newDishForm.parenthetical.trim().toUpperCase() || newDishForm.city.trim().toUpperCase()})`,
      region: newDishForm.region,
      city: newDishForm.city.trim().toUpperCase(),
      country: newDishForm.region,
      spotName: newDishForm.spotName.trim() || 'Legendary Street Corner',
      coordinates: 'LIVE COMMUNITY DROP',
      waitTimeRealLife: newDishForm.waitTimeRealLife.toUpperCase(),
      cookTimeHome: newDishForm.cookTimeHome.toUpperCase(),
      prepMinutes: 20,
      difficulty: newDishForm.difficulty,
      heatLevel: 'FIERY',
      tagline: newDishForm.tagline.trim().toUpperCase() || 'UNDERGROUND STREET LEGEND UNLOCKED',
      story: newDishForm.story.trim() || 'Submitted by the CULT EATS street food intelligence network.',
      secretTrick: newDishForm.secretTrick.trim() || 'High heat, zero hesitation, authentic local spices.',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=85',
      maskShape: 'mask-blob-2',
      featured: false,
      createdAt: Date.now(),
      submittedBy: chefAlias || 'ANONYMOUS CHEF',
      ingredients: parsedIngredients.length ? parsedIngredients : [{ item: 'Secret Street Spices', amount: 100, unit: 'g' }],
      steps: [
        {
          title: newDishForm.step1Title.toUpperCase() || 'THE SIGNATURE SEAR',
          instruction: newDishForm.step1Text || 'Follow traditional high-heat street preparation.',
          timerSeconds: 120
        }
      ]
    };

    if (user && db) {
      try {
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'communityDishes'), newDishObj);
        const createdWithId = { id: docRef.id, ...newDishObj };
        triggerToast(`DROPPED TO WORLD FEED: ${newDishObj.name}`);
        navigateWithCurtain('RECIPE_LAB', newDishObj.name, createdWithId);
      } catch (err) {
        console.error('Error submitting dish:', err);
        triggerToast('ERROR SAVING TO CLOUD');
      }
    } else {
      const fallbackDish = { id: `custom-${Date.now()}`, ...newDishObj };
      setCommunityDishes((prev) => [fallbackDish, ...prev]);
      triggerToast(`DROPPED: ${newDishObj.name}`);
      navigateWithCurtain('RECIPE_LAB', newDishObj.name, fallbackDish);
    }
  };

  // Filtered dishes for Carousel by region
  const regionCarouselDishes = useMemo(() => {
    const filtered = allDishes.filter((d) => d.region === activeRegionTab);
    return filtered.length > 0 ? filtered : allDishes;
  }, [allDishes, activeRegionTab]);

  // Ensure carousel index stays valid when switching tabs
  useEffect(() => {
    setCarouselIndex(0);
  }, [activeRegionTab]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const savedCount = Object.keys(savedVault).length;

  return (
    <div ref={motionRootRef} className="min-h-screen bg-ember text-bone-white selection:bg-impossible-red selection:text-bone-white overflow-x-clip relative font-body">
      {/* Scroll progress */}
      <div data-progress aria-hidden="true" className="fixed top-0 left-0 right-0 z-[60] h-1 bg-impossible-red origin-left motion-reduce:hidden" style={{ transform: 'scaleX(0)' }} />
      {/* ==========================================
          FULL-SCREEN BUTCHER CURTAIN PAGE TRANSITION
          ========================================== */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col">
          <div className="flex-1 bg-impossible-red border-b border-butcher-black flex items-center justify-center overflow-hidden">
            <div className="bg-butcher-black text-bone-white px-8 py-4 rounded-xl-2 border border-bone-white">
              <span className="font-meat text-5xl md:text-8xl tracking-wider text-impossible-red block leading-none">
                ◂ {transitionLabel} ▸
              </span>
            </div>
          </div>
          <div className="h-24 bg-butcher-black flex items-center justify-between px-8 text-blush-highlight font-ui-meat text-sm tracking-widest">
            <span>ZERO GATEKEEPING MANIFESTO</span>
            <span>WORLD FAMOUS STREET CONTRABAND</span>
            <span>100% AUTHENTIC FORMULA</span>
          </div>
        </div>
      )}

      {/* ==========================================
          PUNK POSTER TOAST NOTIFICATION
          ========================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[90] bg-impossible-red text-bone-white border border-butcher-black rounded-xl-2 px-5 py-3 flex items-center gap-3 animate-slam">
          <span className="w-2.5 h-2.5 rounded-full bg-butcher-black inline-block" />
          <span className="font-ui-meat font-bold text-base tracking-wider">{toastMessage}</span>
        </div>
      )}

      {/* ==========================================
          STICKY TOP NAVIGATION (#000000 BAR)
          ========================================== */}
      <header className="sticky top-0 z-50 w-full bg-butcher-black px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Left Brand Mark in White Pill */}
        <button
          onClick={() => navigateWithCurtain('HOME', 'CULT EATS')}
          className="bg-bone-white text-impossible-red px-3.5 py-1 rounded-xl-2 font-meat text-xl tracking-tight whitespace-nowrap shrink-0 hover:bg-blush-highlight transition-colors flex items-center gap-1.5"
        >
          <span>CULT EATS</span>
        </button>

        {/* Centered Nav Links with Caret Indicators */}
        <nav className="hidden lg:flex items-center gap-7">
          {[
            { id: 'HOME', label: 'MANIFESTO' },
            { id: 'ATLAS', label: 'FAMOUS PLACES ATLAS' },
            { id: 'RECIPE_LAB', label: 'THE RECIPE LAB' },
            { id: 'VAULT', label: `THE VAULT (${savedCount})` },
            { id: 'SUBMIT', label: 'DROP A LEGEND' }
          ].map((navItem) => {
            const isActive = activePage === navItem.id;
            return (
              <button
                key={navItem.id}
                onClick={() => navigateWithCurtain(navItem.id, navItem.label)}
                className={`font-ui-meat text-base font-bold tracking-wider flex items-center gap-1.5 transition-colors ${
                  isActive ? 'text-impossible-red' : 'text-bone-white hover:text-blush-highlight'
                }`}
              >
                <span>{navItem.label}</span>
                <span className="text-xs text-impossible-red">▾</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side CTAs */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigateWithCurtain('VAULT', 'SAVED VAULT')}
            className="btn-ghost-impossible !py-1.5 !px-3 text-xs sm:text-sm"
            title="Saved Recipes Vault"
          >
            <Bookmark className="w-3.5 h-3.5 text-impossible-red fill-impossible-red" />
            <span className="hidden sm:inline">VAULT</span>
            <span className="bg-burgundy-stage text-bone-white px-1.5 py-0.5 rounded-full text-xs">
              {savedCount}
            </span>
          </button>

          <button
            onClick={() => setShowAuthModal(true)}
            className="btn-ghost-impossible !py-1.5 !px-3 text-xs sm:text-sm"
            aria-label={chefAlias ? chefAlias : 'Chef login'}
          >
            <User className="w-3.5 h-3.5 text-blush-highlight" />
            <span className="hidden sm:inline">{chefAlias ? chefAlias : 'CHEF LOGIN'}</span>
          </button>

          <button
            onClick={() => navigateWithCurtain('ATLAS', 'FIND FAMOUS SPOTS')}
            className="btn-primary-impossible !py-1.5 !px-3.5 text-xs sm:text-sm"
          >
            <span>FIND US</span>
            <span>▸</span>
          </button>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden bg-butcher-black px-3 py-2 flex items-center justify-center gap-2 overflow-x-auto">
        {[
          { id: 'HOME', label: 'HOME' },
          { id: 'ATLAS', label: 'ATLAS' },
          { id: 'RECIPE_LAB', label: 'RECIPE LAB' },
          { id: 'VAULT', label: `VAULT (${savedCount})` },
          { id: 'SUBMIT', label: '+ DROP' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => navigateWithCurtain(item.id, item.label)}
            className={`px-3 py-1 rounded-xl-2 font-ui-meat text-xs font-bold whitespace-nowrap ${
              activePage === item.id
                ? 'bg-impossible-red text-bone-white'
                : 'bg-burgundy-stage text-blush-highlight'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* =========================================================
          PAGE 1: HOME (THE MANIFESTO & ICONIC DROPS)
          ========================================================= */}
      {activePage === 'HOME' && (
        <main className="pb-24">
          {/* HERO DISPLAY BLOCK: FLOATING FOOD ICONS + MASK-CUT FOOD PHOTOGRAPHY */}
          <section data-hero className="relative isolate min-h-[86vh] flex flex-col items-center justify-center px-4 py-16 md:py-24 overflow-hidden max-w-[1280px] mx-auto">
            <FoodIconField />

            {/* Floating photos — layers: scroll parallax › mouse depth + intro pop › always-on CSS float */}
            {HERO_PHOTOS.map((p) => {
              const dish = INITIAL_DISHES[p.dish];
              return (
                <div key={dish.id} data-parallax={p.speed} className={`absolute z-10 ${p.place}`}>
                  <div data-depth={p.depth} data-hero-photo className="w-full h-full">
                    <button
                      type="button"
                      onClick={() => navigateWithCurtain('RECIPE_LAB', dish.name, dish)}
                      aria-label={`Open the ${dish.name} recipe`}
                      className="relative block w-full h-full cursor-pointer group animate-float"
                      style={{ rotate: p.rotate, '--float-dur': p.dur, '--float-delay': p.delay, '--float-y': '12px', '--float-r': '3deg' }}
                    >
                      <img
                        src={dish.image}
                        alt=""
                        className={`w-full h-full object-cover ${p.mask} saturate-150 contrast-125 group-hover:scale-105 transition-[scale] duration-300`}
                      />
                      <span className={`absolute ${p.labelPos} bg-butcher-black text-blush-highlight font-ui-meat text-xs px-2.5 py-0.5 rounded-xl-2 border border-impossible-red whitespace-nowrap`}>
                        {p.label}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* CENTERED HERO DISPLAY STACK */}
            <div data-hero-stack className="relative z-20 flex flex-col items-center text-center max-w-5xl mx-auto">
              <div data-eyebrow className="font-ui-meat text-gold text-sm md:text-lg font-bold tracking-[0.06em] mb-4">
                ◂ WORLD FAMOUS STREET CONTRABAND ▸
              </div>

              <h1 data-hero-title className="display-hero select-none">
                <span className="block">CULT FOODS</span>
                <span className="block text-[0.72em] mt-2">(FROM FAMOUS PLACES)</span>
              </h1>

              <p data-hero-copy className="mt-6 max-w-xl text-blush-highlight text-base md:text-lg font-medium leading-snug">
                Skip the 4-hour cobblestone queue. We reverse-engineered the exact recipes, wok temperatures, and secret ratios from the planet’s most guarded street stalls.
              </p>

              {/* Two-Step Signature CTAs */}
              <div data-hero-copy className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => navigateWithCurtain('RECIPE_LAB', 'THE RECIPE LAB')}
                  className="btn-primary-impossible text-base px-6 py-3"
                >
                  <span>STEAL THE RECIPES</span>
                  <span>▸</span>
                </button>
                <button
                  onClick={() => navigateWithCurtain('ATLAS', 'WORLD TOUR ATLAS')}
                  className="btn-ghost-impossible text-base px-6 py-3"
                >
                  <MapPin className="w-4 h-4 text-gold" />
                  <span>EXPLORE FAMOUS PLACES</span>
                </button>
              </div>

              {/* Mobile Masked Food Strip — floats like the desktop photos */}
              <div className="grid grid-cols-4 gap-3 mt-10 md:hidden w-full max-w-md">
                {INITIAL_DISHES.slice(0, 4).map((d, i) => (
                  <button
                    key={d.id}
                    data-hero-photo
                    onClick={() => navigateWithCurtain('RECIPE_LAB', d.name, d)}
                    aria-label={`Open the ${d.name} recipe`}
                    className="aspect-square"
                  >
                    <span
                      className="block w-full h-full animate-float"
                      style={{ '--float-dur': `${5.5 + i * 0.7}s`, '--float-delay': `${-i * 1.3}s`, '--float-y': '8px' }}
                    >
                      <img src={d.image} alt="" className={`w-full h-full object-cover ${d.maskShape} saturate-150`} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="py-10 md:py-14 space-y-3 overflow-x-clip">
            <Marquee items={MARQUEE_TOP} tone="red" tilt={-2} />
            <Marquee items={MARQUEE_BOTTOM} tone="wine" tilt={1.5} reverse speed={34} />
          </div>

          {/* =========================================================
              CATEGORY TAB WITH NUMBER BADGE + PRODUCT CAROUSEL
              ========================================================= */}
          <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-12">
            <div className="text-center mb-8">
              <p data-eyebrow className="font-ui-meat text-gold text-sm md:text-base font-bold tracking-widest mb-2">
                ◂ PICK YOUR CONTINENT OF ORIGIN ▸
              </p>
              <h2 className="display-section">
                <span className="block">STREET LEGENDS</span>
                <span className="block text-[0.68em] mt-1">(BY REGION)</span>
              </h2>
            </div>

            {/* Category Tabs with Circular Number Badges */}
            <div data-reveal className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mb-10">
              {REGIONS.map((region) => {
                const count = allDishes.filter((d) => d.region === region).length;
                const isActive = activeRegionTab === region;
                return (
                  <button
                    key={region}
                    onClick={() => setActiveRegionTab(region)}
                    className={`group flex items-center gap-2.5 pb-2 border-b-4 transition-all ${
                      isActive ? 'border-impossible-red' : 'border-transparent'
                    }`}
                  >
                    <span
                      className={`font-ui-meat text-xl md:text-2xl font-bold tracking-wider ${
                        isActive ? 'text-bone-white' : 'text-blush-highlight group-hover:text-bone-white'
                      }`}
                    >
                      {region}
                    </span>
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border border-butcher-black ${
                        isActive ? 'bg-impossible-red text-bone-white' : 'bg-burgundy-stage text-bone-white'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Overflowing Horizontal Product Carousel */}
            <div className="relative">
              <div ref={regionGridRef} data-stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regionCarouselDishes.map((dish, idx) => {
                  const isSaved = Boolean(savedVault[dish.id]);
                  return (
                    <div
                      key={dish.id}
                      onClick={() => navigateWithCurtain('RECIPE_LAB', dish.name, dish)}
                      className="bg-burgundy-stage border border-butcher-black rounded-xl overflow-hidden flex flex-col justify-between cursor-pointer group transition-transform duration-150 hover:-translate-y-1"
                    >
                      {/* Top 60% Edge-to-Edge Packaging/Dish Photo */}
                      <div className="relative h-64 w-full bg-butcher-black overflow-hidden border-b border-butcher-black">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          data-zoom
                          className="w-full h-full object-cover saturate-125 group-hover:scale-105 transition-[scale] duration-300"
                        />
                        <div className="absolute top-3 left-3 bg-butcher-black text-bone-white px-3 py-1 rounded-xl-2 font-ui-meat text-xs font-bold tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-impossible-red" />
                          <span>{dish.city}</span>
                        </div>
                        <button
                          onClick={(e) => toggleSaveDish(dish, e)}
                          className={`absolute top-3 right-3 px-3 py-1 rounded-xl-2 border border-butcher-black font-ui-meat text-xs font-bold flex items-center gap-1 transition-colors ${
                            isSaved
                              ? 'bg-impossible-red text-bone-white'
                              : 'bg-butcher-black text-blush-highlight hover:bg-impossible-red hover:text-bone-white'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-bone-white' : ''}`} />
                          <span>{isSaved ? 'SAVED' : 'SAVE'}</span>
                        </button>
                        <div className="absolute bottom-3 left-3 bg-impossible-red text-bone-white border border-butcher-black px-2.5 py-0.5 rounded-xl-2 font-ui-meat text-xs font-bold">
                          REAL LINE: {dish.waitTimeRealLife} → HOME: {dish.cookTimeHome}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-xs font-ui-meat text-blush-highlight tracking-widest mb-1">
                            {dish.spotName}
                          </div>
                          <h3 className="font-meat text-3xl text-blush-highlight group-hover:text-bone-white tracking-wide leading-none">
                            {dish.name} <span className="text-impossible-red block text-xl mt-1">{dish.parenthetical}</span>
                          </h3>
                          <p className="mt-3 text-sm text-bone-white line-clamp-2 leading-relaxed">
                            {dish.story}
                          </p>
                        </div>

                        {/* Two CTAs Side by Side (LEARN MORE filled + FIND IT ghost) */}
                        <div className="mt-5 pt-4 border-t border-velvet-wine flex items-center gap-2.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateWithCurtain('RECIPE_LAB', dish.name, dish);
                            }}
                            className="btn-primary-impossible flex-1 justify-center"
                          >
                            <span>COOK RECIPE</span>
                            <span>▸</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCityFilter(dish.city);
                              navigateWithCurtain('ATLAS', dish.city);
                            }}
                            className="btn-ghost-impossible justify-center"
                          >
                            <MapPin className="w-3.5 h-3.5 text-impossible-red" />
                            <span>FIND IT</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Dots Below Carousel */}
              <div className="flex items-center justify-center gap-2 mt-8">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveRegionTab(r)}
                    aria-label={`Select ${r}`}
                    className={`h-3 rounded-full border border-butcher-black transition-all ${
                      activeRegionTab === r ? 'w-10 bg-impossible-red' : 'w-3 bg-burgundy-stage'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* =========================================================
              PROMINENT 38PX-RADIUS FEATURE SPOTLIGHT CARD
              ========================================================= */}
          <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-12">
            <div data-clip className="bg-burgundy-stage border-2 border-butcher-black rounded-3xl p-6 md:p-12 overflow-hidden relative">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-2 bg-butcher-black text-impossible-red px-4 py-1.5 rounded-xl-2 font-ui-meat text-sm font-bold">
                    <span data-eyebrow>◂ LEGEND OF THE WEEK SPOTLIGHT ▸</span>
                  </div>

                  <h2 className="display-section !text-bone-white">
                    <span className="block text-impossible-red">JAY FAI</span>
                    <span className="block">CRAB OMELETTE</span>
                    <span className="block text-[0.55em] text-blush-highlight mt-2">(MICHELIN STREET STALL • BANGKOK)</span>
                  </h2>

                  <p data-reveal className="text-bone-white text-base md:text-lg leading-relaxed max-w-2xl">
                    People fly across the globe and wait 4.5 hours on Maha Chai Road just to taste Supinya Junsuta’s charcoal-fired crab omelette. We broke down the exact rice-flour slurry and 400°F oil pour height so you can pull it off in 18 minutes tonight.
                  </p>

                  <div data-reveal className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => navigateWithCurtain('RECIPE_LAB', INITIAL_DISHES[0].name, INITIAL_DISHES[0])}
                      className="btn-primary-impossible text-base px-6 py-3"
                    >
                      <span>UNLOCK SECRET RECIPE</span>
                      <span>▸</span>
                    </button>
                    <button
                      onClick={(e) => toggleSaveDish(INITIAL_DISHES[0], e)}
                      className="btn-ghost-impossible text-base px-6 py-3"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          savedVault[INITIAL_DISHES[0].id] ? 'fill-impossible-red text-impossible-red' : 'text-bone-white'
                        }`}
                      />
                      <span>
                        {savedVault[INITIAL_DISHES[0].id] ? 'SAVED IN YOUR VAULT' : 'SAVE TO VAULT'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Organic Masked Feature Image */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div data-parallax="-0.12" className="relative w-72 h-72 sm:w-88 sm:h-88">
                    <img
                      src={INITIAL_DISHES[0].image}
                      alt="Jay Fai Crab Omelette"
                      className="w-full h-full object-cover mask-blob-1 saturate-150 animate-float"
                      style={{ '--float-dur': '7s', '--float-y': '10px', '--float-r': '2deg' }}
                    />
                    <div className="absolute -bottom-3 right-2 bg-butcher-black text-bone-white border border-impossible-red rounded-xl-2 px-4 py-2 font-ui-meat text-sm">
                      <span className="text-impossible-red font-bold">SECRET RATIO:</span> 250G LUMP CRAB / 4 DUCK EGGS
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================
              BRACKETED SECTION OPENER + 4-COLUMN COMPACT RECIPE GRID
              ========================================================= */}
          <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-14">
            <div className="text-center mb-12">
              <div data-eyebrow className="font-ui-meat text-gold text-sm md:text-base font-bold tracking-[0.05em] mb-3">
                ◂ FLEX ON EVERYONE AT ▸
              </div>
              <h2 className="display-section">
                <span className="block">THE POTLUCK</span>
                <span className="block text-[0.65em] mt-1">(ZERO GATEKEEPING)</span>
              </h2>
            </div>

            {/* 4-Column Product/Recipe Grid */}
            <div data-stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {allDishes.slice(0, 8).map((dish) => {
                const isSaved = Boolean(savedVault[dish.id]);
                return (
                  <div
                    key={dish.id}
                    onClick={() => navigateWithCurtain('RECIPE_LAB', dish.name, dish)}
                    className="bg-burgundy-stage border border-butcher-black rounded-xl p-4 flex flex-col justify-between cursor-pointer group hover:bg-butcher-black transition-colors"
                  >
                    <div>
                      <div className="relative h-44 w-full rounded-[8px] overflow-hidden border border-butcher-black mb-4">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          data-zoom
                          className="w-full h-full object-cover saturate-125 group-hover:scale-105 transition-[scale] duration-300"
                        />
                        <span className="absolute top-2 left-2 bg-butcher-black text-blush-highlight px-2.5 py-0.5 rounded-xl-2 font-ui-meat text-xs font-bold">
                          {dish.city}
                        </span>
                        <button
                          onClick={(e) => toggleSaveDish(dish, e)}
                          className={`absolute top-2 right-2 w-8 h-8 rounded-full border border-butcher-black flex items-center justify-center ${
                            isSaved ? 'bg-impossible-red text-bone-white' : 'bg-butcher-black text-bone-white'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-bone-white' : ''}`} />
                        </button>
                      </div>

                      <div className="font-ui-meat text-xs text-impossible-red font-bold tracking-wider">
                        {dish.cookTimeHome} • {dish.difficulty}
                      </div>
                      <h3 className="font-meat text-2xl text-bone-white mt-0.5 leading-tight">
                        {dish.name}
                      </h3>
                      <div className="font-ui-meat text-sm text-blush-highlight font-bold">
                        {dish.parenthetical}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-velvet-wine flex items-center justify-between">
                      <span className="font-ui-meat text-xs text-blush-highlight">
                        {dish.ingredients.length} INGREDIENTS
                      </span>
                      <span className="bg-impossible-red text-bone-white px-3 py-1 rounded-xl-2 font-ui-meat text-xs font-bold">
                        COOK IT ▸
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {/* =========================================================
          PAGE 2: FAMOUS PLACES ATLAS (WORLD TOUR)
          ========================================================= */}
      {activePage === 'ATLAS' && (
        <main className="max-w-[1280px] mx-auto px-4 md:px-8 py-14 pb-24">
          {/* Hero Header */}
          <div className="relative isolate text-center mb-12 py-6">
            <FoodIconField variant="compact" />
            <div data-eyebrow className="font-ui-meat text-gold text-sm md:text-base font-bold tracking-[0.05em] mb-3">
              ◂ EXACT COORDINATES & STREET LORE ▸
            </div>
            <h1 className="display-hero">
              <span className="block">WORLD ATLAS</span>
              <span className="block text-[0.65em] mt-2">(ICONIC STALLS)</span>
            </h1>
          </div>

          {/* Filter Pill Toggle Group */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            {CITIES.map((city) => {
              const active = selectedCityFilter === city;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCityFilter(city)}
                  className={`pill-toggle border border-butcher-black ${
                    active
                      ? 'bg-impossible-red text-bone-white'
                      : 'bg-burgundy-stage text-blush-highlight hover:text-bone-white'
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>

          {/* Atlas Cultural Landmark Cards */}
          <div data-stagger className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allDishes
              .filter((d) => selectedCityFilter === 'ALL CITIES' || d.city === selectedCityFilter)
              .map((dish) => {
                const isSaved = Boolean(savedVault[dish.id]);
                return (
                  <div
                    key={dish.id}
                    className="bg-burgundy-stage border border-butcher-black rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 border-b border-butcher-black">
                      <div className="sm:col-span-5 relative min-h-[220px] bg-butcher-black">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover saturate-125"
                        />
                        <div className="absolute top-3 left-3 bg-butcher-black text-impossible-red px-3 py-1 rounded-xl-2 font-ui-meat text-xs font-bold border border-impossible-red">
                          {dish.city} • {dish.region}
                        </div>
                      </div>

                      <div className="sm:col-span-7 p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs font-ui-meat text-blush-highlight">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-impossible-red" />
                              {dish.coordinates}
                            </span>
                            <button
                              onClick={(e) => toggleSaveDish(dish, e)}
                              className={`px-2.5 py-0.5 rounded-xl-2 border border-butcher-black font-bold ${
                                isSaved ? 'bg-impossible-red text-bone-white' : 'bg-butcher-black text-blush-highlight'
                              }`}
                            >
                              {isSaved ? '★ SAVED' : '+ VAULT'}
                            </button>
                          </div>

                          <h3 className="font-meat text-3xl text-bone-white mt-2 leading-none">
                            {dish.name}
                          </h3>
                          <div className="font-ui-meat text-base text-impossible-red font-bold mt-0.5">
                            {dish.spotName}
                          </div>

                          <p className="mt-3 text-sm text-blush-highlight leading-relaxed">
                            {dish.story}
                          </p>
                        </div>

                        {/* Wait Time in Real Life vs Cook Time at Home Bar */}
                        <div className="mt-4 bg-velvet-wine border border-butcher-black rounded-xl p-3">
                          <div className="flex items-center justify-between text-xs font-ui-meat">
                            <span className="text-blush-highlight">STALL QUEUE: {dish.waitTimeRealLife}</span>
                            <span className="text-impossible-red font-bold">HOME LAB: {dish.cookTimeHome}</span>
                          </div>
                          <div className="w-full h-2 bg-butcher-black rounded-full mt-1.5 overflow-hidden flex">
                            <div className="w-4/5 bg-burgundy-stage h-full" />
                            <div className="w-1/5 bg-impossible-red h-full" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-butcher-black flex flex-wrap items-center justify-between gap-3">
                      <span className="font-ui-meat text-xs text-blush-highlight tracking-wider">
                        SIGNATURE SECRET: {dish.tagline}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigateWithCurtain('RECIPE_LAB', dish.name, dish)}
                          className="btn-primary-impossible !py-1.5 !px-4 text-xs"
                        >
                          <span>COOK THE RECIPE</span>
                          <span>▸</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </main>
      )}

      {/* =========================================================
          PAGE 3: THE RECIPE LAB (STEP-BY-STEP COOKING STUDIO)
          ========================================================= */}
      {activePage === 'RECIPE_LAB' && (
        <main className="max-w-[1280px] mx-auto px-4 md:px-8 py-12 pb-24">
          {/* Top Recipe Selector Bar */}
          <div className="mb-10">
            <div className="relative isolate text-center mb-6 py-6">
              <FoodIconField variant="compact" />
              <div data-eyebrow className="font-ui-meat text-gold text-sm font-bold tracking-widest mb-2">
                ◂ REVERSE-ENGINEERED STREET FORMULAS ▸
              </div>
              <h1 className="display-section">
                <span>THE RECIPE LAB</span>
              </h1>
            </div>

            {/* Horizontal Dish Switcher Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3">
              {allDishes.map((dish) => {
                const isSelected = selectedDish?.id === dish.id;
                return (
                  <button
                    key={dish.id}
                    onClick={() => {
                      setSelectedDish(dish);
                      setCheckedIngredients({});
                      setActiveTimers({});
                    }}
                    className={`pill-toggle whitespace-nowrap border border-butcher-black flex items-center gap-2 ${
                      isSelected
                        ? 'bg-impossible-red text-bone-white'
                        : 'bg-burgundy-stage text-blush-highlight hover:text-bone-white'
                    }`}
                  >
                    <span>{dish.name}</span>
                    <span className="text-xs opacity-80">({dish.city})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDish && (
            <div className="space-y-10 animate-slam">
              {/* Active Dish Hero Banner */}
              <div className="bg-burgundy-stage border-2 border-butcher-black rounded-3xl p-6 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-butcher-black text-impossible-red px-3 py-1 rounded-xl-2 font-ui-meat text-xs font-bold">
                        ORIGIN: {selectedDish.spotName} ({selectedDish.city})
                      </span>
                      <span className="bg-velvet-wine text-blush-highlight px-3 py-1 rounded-xl-2 font-ui-meat text-xs font-bold border border-butcher-black">
                        PREP TIME: {selectedDish.cookTimeHome}
                      </span>
                      <span className="bg-velvet-wine text-bone-white px-3 py-1 rounded-xl-2 font-ui-meat text-xs font-bold border border-butcher-black">
                        DIFFICULTY: {selectedDish.difficulty}
                      </span>
                    </div>

                    <h2 data-no-split className="display-section !text-bone-white">
                      <span className="block text-impossible-red">{selectedDish.name}</span>
                      <span className="block text-[0.55em] text-blush-highlight mt-2">
                        {selectedDish.parenthetical}
                      </span>
                    </h2>

                    <p className="text-bone-white text-base leading-relaxed">
                      {selectedDish.story}
                    </p>

                    {/* Secret Vendor Trick Callout Box */}
                    <div className="bg-velvet-wine border border-butcher-black rounded-xl p-4">
                      <div className="font-ui-meat text-sm text-impossible-red font-bold tracking-wider flex items-center gap-1.5 mb-1">
                        <Flame className="w-4 h-4" />
                        <span>AUTHENTIC STREET VENDOR SECRET TECHNIQUE:</span>
                      </div>
                      <p className="text-sm text-blush-highlight leading-relaxed">
                        {selectedDish.secretTrick}
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={(e) => toggleSaveDish(selectedDish, e)}
                        className="btn-primary-impossible"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            savedVault[selectedDish.id] ? 'fill-bone-white' : ''
                          }`}
                        />
                        <span>
                          {savedVault[selectedDish.id]
                            ? 'SAVED IN YOUR VAULT'
                            : 'SAVE THIS RECIPE TO VAULT'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Masked Food Cutout */}
                  <div className="lg:col-span-5 flex justify-center">
                    <div className="w-72 h-72 sm:w-80 sm:h-80 relative">
                      <img
                        src={selectedDish.image}
                        alt={selectedDish.name}
                        className={`w-full h-full object-cover ${selectedDish.maskShape || 'mask-blob-1'} saturate-150`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipe Lab Interactive Studio: Left Ingredients + Scaler, Right Timed Steps */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: PORTION SCALER & CLICKABLE INGREDIENT CHECKLIST */}
                <div className="lg:col-span-5 bg-burgundy-stage border border-butcher-black rounded-xl p-6 h-fit">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-butcher-black">
                    <div>
                      <span data-eyebrow className="font-ui-meat text-xs text-impossible-red font-bold block">
                        ◂ COMPONENT MATRIX ▸
                      </span>
                      <h3 className="font-meat text-3xl text-bone-white">INGREDIENTS</h3>
                    </div>

                    {/* Interactive Portion Scaler Pills */}
                    <div className="flex items-center gap-1.5">
                      {[
                        { mult: 1, label: '1X SOLO' },
                        { mult: 2, label: '2X DUO' },
                        { mult: 4, label: '4X POTLUCK' }
                      ].map((scale) => (
                        <button
                          key={scale.mult}
                          onClick={() => setPortionMultiplier(scale.mult)}
                          className={`px-3 py-1.5 rounded-xl-2 font-ui-meat text-xs font-bold border border-butcher-black ${
                            portionMultiplier === scale.mult
                              ? 'bg-impossible-red text-bone-white'
                              : 'bg-velvet-wine text-blush-highlight'
                          }`}
                        >
                          {scale.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs font-ui-meat text-blush-highlight mt-3 mb-4">
                    CLICK AN INGREDIENT AS YOU PREP TO STRIKE IT IN IMPOSSIBLE RED:
                  </p>

                  <div className="space-y-2.5">
                    {selectedDish.ingredients.map((ing, i) => {
                      const isChecked = Boolean(checkedIngredients[i]);
                      const scaledAmount =
                        typeof ing.amount === 'number'
                          ? Math.round(ing.amount * portionMultiplier * 10) / 10
                          : ing.amount;
                      return (
                        <button
                          key={i}
                          onClick={() =>
                            setCheckedIngredients((prev) => ({
                              ...prev,
                              [i]: !prev[i]
                            }))
                          }
                          className={`w-full text-left p-3 rounded-xl border border-butcher-black flex items-center justify-between transition-colors ${
                            isChecked
                              ? 'bg-velvet-wine text-blush-highlight'
                              : 'bg-butcher-black text-bone-white hover:border-impossible-red'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                                isChecked
                                  ? 'bg-impossible-red border-impossible-red text-bone-white'
                                  : 'border-blush-highlight'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                isChecked ? 'line-through decoration-impossible-red decoration-2 opacity-70' : ''
                              }`}
                            >
                              {ing.item}
                            </span>
                          </div>
                          <span className="font-ui-meat text-base font-bold text-impossible-red">
                            {scaledAmount} {ing.unit}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT COLUMN: STEP-BY-STEP EXECUTION WITH INTEGRATED TIMERS */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-burgundy-stage border border-butcher-black rounded-xl p-6">
                    <span data-eyebrow className="font-ui-meat text-xs text-impossible-red font-bold block">
                      ◂ HIGH-HEAT EXECUTION PROTOCOL ▸
                    </span>
                    <h3 className="font-meat text-3xl text-bone-white mb-6">
                      STEP-BY-STEP COOKING STUDIO
                    </h3>

                    <div className="space-y-5">
                      {selectedDish.steps.map((step, idx) => {
                        const timerState = activeTimers[idx] || {
                          remaining: step.timerSeconds || 60,
                          running: false
                        };
                        const isZero = timerState.remaining === 0;

                        return (
                          <div
                            key={idx}
                            className="bg-velvet-wine border border-butcher-black rounded-xl p-5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5">
                                <span className="bg-impossible-red text-bone-white px-3 py-0.5 rounded-xl-2 font-meat text-lg">
                                  STEP 0{idx + 1}
                                </span>
                                <h4 className="font-meat text-2xl text-blush-highlight tracking-wide">
                                  {step.title}
                                </h4>
                              </div>

                              {/* Integrated Kitchen Step Timer */}
                              {step.timerSeconds && (
                                <div className="flex items-center gap-1.5 bg-butcher-black border border-burgundy-stage px-3 py-1 rounded-xl-2">
                                  <Clock className="w-3.5 h-3.5 text-impossible-red" />
                                  <span
                                    className={`font-ui-meat text-base font-bold ${
                                      isZero ? 'text-impossible-red' : 'text-bone-white'
                                    }`}
                                  >
                                    {isZero ? 'DONE!' : formatTime(timerState.remaining)}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setActiveTimers((prev) => ({
                                        ...prev,
                                        [idx]: {
                                          remaining:
                                            prev[idx]?.remaining !== undefined
                                              ? prev[idx].remaining
                                              : step.timerSeconds,
                                          running: !prev[idx]?.running
                                        }
                                      }))
                                    }
                                    className="ml-1 bg-impossible-red text-bone-white p-1 rounded-full hover:bg-bone-white hover:text-butcher-black"
                                    title={timerState.running ? 'Pause Timer' : 'Start Timer'}
                                  >
                                    {timerState.running ? (
                                      <Pause className="w-3 h-3" />
                                    ) : (
                                      <Play className="w-3 h-3" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() =>
                                      setActiveTimers((prev) => ({
                                        ...prev,
                                        [idx]: {
                                          remaining: step.timerSeconds,
                                          running: false
                                        }
                                      }))
                                    }
                                    className="bg-burgundy-stage text-blush-highlight p-1 rounded-full hover:text-bone-white"
                                    title="Reset Timer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <p className="text-bone-white text-base leading-relaxed mt-2">
                              {step.instruction}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* =========================================================
          PAGE 4: SAVED VAULT & USER PROFILE (FIREBASE PERSISTENCE)
          ========================================================= */}
      {activePage === 'VAULT' && (
        <main className="max-w-[1280px] mx-auto px-4 md:px-8 py-14 pb-24">
          <div className="relative isolate text-center mb-10 py-6">
            <FoodIconField variant="compact" />
            <div data-eyebrow className="font-ui-meat text-gold text-sm md:text-base font-bold tracking-[0.05em] mb-3">
              ◂ CLOUD-SYNCED CONTRABAND STASH ▸
            </div>
            <h1 className="display-hero">
              <span className="block">THE VAULT</span>
              <span className="block text-[0.65em] mt-2">(SAVED RECIPES)</span>
            </h1>
          </div>

          {/* Chef Profile Status Bar + Combined Shopping List Export */}
          <div className="bg-burgundy-stage border border-butcher-black rounded-xl p-5 mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-impossible-red border border-butcher-black flex items-center justify-center font-meat text-2xl text-bone-white">
                {(chefAlias || 'C')[0]}
              </div>
              <div>
                <div className="font-ui-meat text-xs text-blush-highlight">
                  AUTHENTICATED CHEF VAULT • ID: {user ? user.uid : 'LOCAL-SESSION'}
                </div>
                <div className="font-meat text-2xl text-bone-white">
                  {chefAlias ? `CHEF ${chefAlias}` : 'REBEL GUEST CHEF'} ({savedCount} SAVED)
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-ghost-impossible"
              >
                <User className="w-4 h-4 text-impossible-red" />
                <span>{chefAlias ? 'CHANGE CHEF ALIAS' : 'SET CHEF ALIAS / LOGIN'}</span>
              </button>

              {savedCount > 0 && (
                <button
                  onClick={() => setShowShoppingModal(true)}
                  className="btn-primary-impossible"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>EXPORT COMBINED SHOPPING LIST ({savedCount})</span>
                  <span>▸</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills by Custom Vault Tag */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {VAULT_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveVaultTag(tag)}
                className={`pill-toggle border border-butcher-black ${
                  activeVaultTag === tag
                    ? 'bg-impossible-red text-bone-white'
                    : 'bg-burgundy-stage text-blush-highlight'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {savedCount === 0 ? (
            <div className="bg-burgundy-stage border border-butcher-black rounded-3xl p-12 text-center max-w-2xl mx-auto">
              <h3 className="font-meat text-5xl text-impossible-red mb-3">
                YOUR VAULT IS EMPTY
              </h3>
              <p className="text-blush-highlight mb-6">
                Hit the SAVE button on any iconic street food across the Manifesto or World Atlas to lock the recipe and build your personal tasting notes here.
              </p>
              <button
                onClick={() => navigateWithCurtain('HOME', 'EXPLORE RECIPES')}
                className="btn-primary-impossible text-base px-6 py-3"
              >
                <span>EXPLORE ICONIC FOODS</span>
                <span>▸</span>
              </button>
            </div>
          ) : (
            <div data-stagger className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.values(savedVault)
                .filter((item) => activeVaultTag === 'ALL SAVED' || item.tag === activeVaultTag)
                .map((vaultItem) => {
                  const dish = allDishes.find((d) => d.id === vaultItem.dishId);
                  if (!dish) return null;
                  return (
                    <div
                      key={dish.id}
                      className="bg-burgundy-stage border border-butcher-black rounded-xl overflow-hidden flex flex-col justify-between"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="w-20 h-20 object-cover mask-blob-1 border border-butcher-black"
                            />
                            <div>
                              <span className="font-ui-meat text-xs text-impossible-red font-bold">
                                {dish.city} • {dish.spotName}
                              </span>
                              <h3 className="font-meat text-3xl text-bone-white leading-none mt-0.5">
                                {dish.name}
                              </h3>
                              <span className="font-ui-meat text-sm text-blush-highlight">
                                {dish.parenthetical}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => toggleSaveDish(dish, e)}
                            className="bg-butcher-black text-blush-highlight hover:text-impossible-red p-2 rounded-xl border border-butcher-black"
                            title="Remove from Vault"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Tag Selector Pills */}
                        <div className="mt-4 flex flex-wrap items-center gap-1.5">
                          <span className="font-ui-meat text-xs text-blush-highlight mr-1">STATUS TAG:</span>
                          {['COOK SOON', 'MASTERED', 'BUCKET LIST TRIP'].map((t) => (
                            <button
                              key={t}
                              onClick={() => updateVaultItem(dish.id, { tag: t })}
                              className={`px-2.5 py-1 rounded-xl-2 font-ui-meat text-xs font-bold border border-butcher-black ${
                                vaultItem.tag === t
                                  ? 'bg-impossible-red text-bone-white'
                                  : 'bg-velvet-wine text-blush-highlight'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        {/* Personal Chef Tasting Note Input */}
                        <div className="mt-4">
                          <label className="block font-ui-meat text-xs text-blush-highlight mb-1">
                            PERSONAL CHEF LAB NOTES (AUTO-SAVED TO CLOUD):
                          </label>
                          <textarea
                            rows={2}
                            value={vaultItem.note || ''}
                            onChange={(e) => updateVaultItem(dish.id, { note: e.target.value })}
                            placeholder="Add your spice adjustments, wok temp notes, or trip memories..."
                            className="w-full bg-velvet-wine border border-butcher-black rounded-xl p-2.5 text-sm text-bone-white placeholder-blush-highlight/50 focus:outline-none focus:border-impossible-red"
                          />
                        </div>
                      </div>

                      <div className="bg-butcher-black px-5 py-3 flex items-center justify-between">
                        <span className="font-ui-meat text-xs text-blush-highlight">
                          HOME PREP: {dish.cookTimeHome}
                        </span>
                        <button
                          onClick={() => navigateWithCurtain('RECIPE_LAB', dish.name, dish)}
                          className="btn-primary-impossible !py-1.5 !px-4 text-xs"
                        >
                          <span>OPEN IN RECIPE LAB</span>
                          <span>▸</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </main>
      )}

      {/* =========================================================
          PAGE 5: SUBMIT A LEGEND (COMMUNITY DROP)
          ========================================================= */}
      {activePage === 'SUBMIT' && (
        <main className="max-w-[960px] mx-auto px-4 md:px-8 py-14 pb-24">
          <div className="relative isolate text-center mb-10 py-6">
            <FoodIconField variant="compact" />
            <div data-eyebrow className="font-ui-meat text-gold text-sm md:text-base font-bold tracking-[0.05em] mb-3">
              ◂ EXPAND THE GLOBAL STREET ARCHIVE ▸
            </div>
            <h1 className="display-section">
              <span className="block">DROP A LEGEND</span>
              <span className="block text-[0.65em] mt-2">(SHARE THE SECRET)</span>
            </h1>
          </div>

          <form
            onSubmit={handleDropDishSubmit}
            className="bg-burgundy-stage border-2 border-butcher-black rounded-3xl p-6 md:p-10 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-ui-meat text-sm text-blush-highlight font-bold mb-1.5">
                  DISH NAME (SHOUTED HEADLINE) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CURRYWURST MIT POMMES"
                  value={newDishForm.name}
                  onChange={(e) => setNewDishForm({ ...newDishForm, name: e.target.value })}
                  className="w-full bg-velvet-wine border border-butcher-black rounded-xl-2 px-4 py-3 text-bone-white font-ui-meat text-lg focus:outline-none focus:border-impossible-red"
                />
              </div>

              <div>
                <label className="block font-ui-meat text-sm text-blush-highlight font-bold mb-1.5">
                  FAMOUS STALL PARENTHETICAL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KONOPKE'S IMBISS BERLIN"
                  value={newDishForm.parenthetical}
                  onChange={(e) => setNewDishForm({ ...newDishForm, parenthetical: e.target.value })}
                  className="w-full bg-velvet-wine border border-butcher-black rounded-xl-2 px-4 py-3 text-bone-white font-ui-meat text-lg focus:outline-none focus:border-impossible-red"
                />
              </div>

              <div>
                <label className="block font-ui-meat text-sm text-blush-highlight font-bold mb-1.5">
                  CITY *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BERLIN"
                  value={newDishForm.city}
                  onChange={(e) => setNewDishForm({ ...newDishForm, city: e.target.value })}
                  className="w-full bg-velvet-wine border border-butcher-black rounded-xl-2 px-4 py-3 text-bone-white font-ui-meat text-lg focus:outline-none focus:border-impossible-red"
                />
              </div>

              <div>
                <label className="block font-ui-meat text-sm text-blush-highlight font-bold mb-1.5">
                  REGION CATEGORY
                </label>
                <select
                  value={newDishForm.region}
                  onChange={(e) => setNewDishForm({ ...newDishForm, region: e.target.value })}
                  className="w-full bg-velvet-wine border border-butcher-black rounded-xl-2 px-4 py-3 text-bone-white font-ui-meat text-lg focus:outline-none focus:border-impossible-red"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-ui-meat text-sm text-blush-highlight font-bold mb-1.5">
                EXACT NEIGHBORHOOD & STREET SPOT LORE
              </label>
              <input
                type="text"
                placeholder="Under the U-Bahn tracks at Eberswalder Straße since 1930..."
                value={newDishForm.story}
                onChange={(e) => setNewDishForm({ ...newDishForm, story: e.target.value })}
                className="w-full bg-velvet-wine border border-butcher-black rounded-xl-2 px-4 py-3 text-bone-white text-sm focus:outline-none focus:border-impossible-red"
              />
            </div>

            <div>
              <label className="block font-ui-meat text-sm text-impossible-red font-bold mb-1.5">
                THE VENDOR SECRET TECHNIQUE (HOW TO REPLICATE AT HOME)
              </label>
              <textarea
                rows={2}
                placeholder="Bloom the curry powder in rendered pork drippings before adding spiced tomato reduction..."
                value={newDishForm.secretTrick}
                onChange={(e) => setNewDishForm({ ...newDishForm, secretTrick: e.target.value })}
                className="w-full bg-velvet-wine border border-butcher-black rounded-xl-2 px-4 py-3 text-bone-white text-sm focus:outline-none focus:border-impossible-red"
              />
            </div>

            <div>
              <label className="block font-ui-meat text-sm text-blush-highlight font-bold mb-1.5">
                INGREDIENTS (ONE PER LINE)
              </label>
              <textarea
                rows={4}
                value={newDishForm.ingredientsText}
                onChange={(e) => setNewDishForm({ ...newDishForm, ingredientsText: e.target.value })}
                className="w-full bg-velvet-wine border border-butcher-black rounded-xl-2 px-4 py-3 text-bone-white text-sm focus:outline-none focus:border-impossible-red"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigateWithCurtain('HOME', 'MANIFESTO')}
                className="btn-ghost-impossible"
              >
                <span>CANCEL</span>
              </button>
              <button type="submit" className="btn-primary-impossible text-base px-6 py-3">
                <span>PUBLISH TO LIVE WORLD FEED</span>
                <span>▸</span>
              </button>
            </div>
          </form>
        </main>
      )}

      {/* ==========================================
          CHEF AUTHENTICATION / ALIAS MODAL
          ========================================== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[80] bg-butcher-black/85 flex items-center justify-center p-4">
          <div className="bg-burgundy-stage border-2 border-butcher-black rounded-3xl max-w-md w-full p-6 md:p-8 relative animate-slam">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 bg-butcher-black text-bone-white p-2 rounded-full hover:bg-impossible-red"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="font-ui-meat text-xs text-impossible-red font-bold tracking-widest mb-1">
              ◂ CLOUD VAULT PASSPORT ▸
            </div>
            <h3 className="font-meat text-4xl text-bone-white leading-none mb-3">
              CHEF IDENTITY
            </h3>
            <p className="text-sm text-blush-highlight mb-6">
              Your saved street foods and recipe notes are automatically synced to your cloud session. Claim your Chef Alias below:
            </p>

            <form onSubmit={handleChefLogin} className="space-y-4">
              <div>
                <label className="block font-ui-meat text-xs text-blush-highlight font-bold mb-1">
                  CHEF ALIAS / HANDLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WOK MASTER ZERO"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  className="w-full bg-velvet-wine border border-butcher-black rounded-xl-2 px-4 py-3 text-bone-white font-ui-meat text-lg focus:outline-none focus:border-impossible-red"
                />
              </div>

              <div>
                <label className="block font-ui-meat text-xs text-blush-highlight font-bold mb-1">
                  EMAIL (OPTIONAL FOR CROSS-DEVICE BADGE)
                </label>
                <input
                  type="email"
                  placeholder="chef@culteats.org"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-velvet-wine border border-butcher-black rounded-xl-2 px-4 py-3 text-bone-white text-sm focus:outline-none focus:border-impossible-red"
                />
              </div>

              <button type="submit" className="btn-primary-impossible w-full justify-center py-3 text-base">
                <span>LOCK IN CHEF IDENTITY</span>
                <span>▸</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          COMBINED SHOPPING LIST MODAL
          ========================================== */}
      {showShoppingModal && (
        <div className="fixed inset-0 z-[80] bg-butcher-black/85 flex items-center justify-center p-4">
          <div className="bg-burgundy-stage border-2 border-butcher-black rounded-3xl max-w-lg w-full p-6 md:p-8 max-h-[85vh] flex flex-col relative animate-slam">
            <button
              onClick={() => setShowShoppingModal(false)}
              className="absolute top-5 right-5 bg-butcher-black text-bone-white p-2 rounded-full hover:bg-impossible-red"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="font-ui-meat text-xs text-impossible-red font-bold tracking-widest mb-1">
              ◂ MARKET CONTRABAND MANIFEST ▸
            </div>
            <h3 className="font-meat text-4xl text-bone-white leading-none mb-4">
              COMBINED SHOPPING LIST
            </h3>

            <div className="overflow-y-auto flex-1 space-y-4 pr-2">
              {Object.keys(savedVault).map((dishId) => {
                const dish = allDishes.find((d) => d.id === dishId);
                if (!dish) return null;
                return (
                  <div
                    key={dish.id}
                    className="bg-velvet-wine border border-butcher-black rounded-xl p-4"
                  >
                    <div className="font-meat text-xl text-impossible-red mb-2">
                      {dish.name} <span className="text-blush-highlight text-sm">{dish.parenthetical}</span>
                    </div>
                    <ul className="space-y-1 text-sm text-bone-white">
                      {dish.ingredients.map((ing, i) => (
                        <li key={i} className="flex justify-between border-b border-burgundy-stage py-1">
                          <span>{ing.item}</span>
                          <span className="font-ui-meat font-bold text-blush-highlight">
                            {ing.amount} {ing.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-butcher-black flex justify-end">
              <button
                onClick={() => {
                  setShowShoppingModal(false);
                  triggerToast('SHOPPING LIST READY FOR THE MARKET');
                }}
                className="btn-primary-impossible"
              >
                <span>DONE</span>
                <span>▸</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          FOOTER (BUTCHER BLACK & IMPOSSIBLE RED)
          ========================================== */}
      <div aria-hidden="true" className="pt-6 pb-12 overflow-x-clip">
        <Marquee items={MARQUEE_FOOTER} tone="red" tilt={1.5} speed={24} />
      </div>
      <footer className="bg-butcher-black border-t border-burgundy-stage py-16 px-4 md:px-8">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
          <div>
            <div className="inline-block bg-bone-white text-impossible-red px-3.5 py-1 rounded-xl-2 font-meat text-2xl mb-4">
              CULT EATS
            </div>
            <div className="display-section !text-5xl md:!text-7xl">
              <span className="block">EAT THE WORLD</span>
              <span className="block text-blush-highlight text-[0.65em] mt-1">(FROM YOUR STOVE)</span>
            </div>
          </div>

          <div data-reveal className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigateWithCurtain('RECIPE_LAB', 'THE RECIPE LAB')}
              className="btn-primary-impossible"
            >
              <span>OPEN RECIPE LAB</span>
              <span>▸</span>
            </button>
            <button
              onClick={() => navigateWithCurtain('SUBMIT', 'DROP A LEGEND')}
              className="btn-ghost-impossible"
            >
              <span>SUBMIT STREET RECIPE</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}