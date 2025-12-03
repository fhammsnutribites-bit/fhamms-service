const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const products = [
  {
    name: 'Classic Besan Laddu',
    description: 'Traditional besan laddu made with pure ghee, gram flour, and premium dry fruits. Rich in protein and essential nutrients. A perfect blend of taste and health.',
    basePrice: 299,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 50,
    category: 'Traditional Laddus',
    weightOptions: [
      { weight: 250, price: 299, stock: 50 },
      { weight: 500, price: 549, stock: 40 },
      { weight: 1000, price: 1049, stock: 30 }
    ]
  },
  {
    name: 'Premium Dry Fruit Laddu',
    description: 'Luxury dry fruit laddu loaded with premium almonds, cashews, pistachios, dates, figs, and raisins. High in protein, fiber, and antioxidants. A healthy indulgence.',
    basePrice: 499,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 30,
    category: 'Dry Fruit Laddus',
    weightOptions: [
      { weight: 250, price: 499, stock: 30 },
      { weight: 500, price: 949, stock: 25 },
      { weight: 1000, price: 1799, stock: 20 }
    ]
  },
  {
    name: 'Almond & Cashew Nutri Laddu',
    description: 'Protein-packed laddu with premium almonds and cashews, sweetened with jaggery. Rich in healthy fats, Vitamin E, and minerals. Perfect for energy boost.',
    basePrice: 549,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 35,
    category: 'Dry Fruit Laddus',
    weightOptions: [
      { weight: 250, price: 549, stock: 35 },
      { weight: 500, price: 1049, stock: 30 },
      { weight: 1000, price: 1999, stock: 25 }
    ]
  },
  {
    name: 'Dates & Nuts Power Laddu',
    description: 'Energy-boosting laddu with dates, almonds, walnuts, and cashews. Natural sweetness from dates, no added sugar. Ideal for athletes and active individuals.',
    basePrice: 449,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 40,
    category: 'Dry Fruit Laddus',
    weightOptions: [
      { weight: 250, price: 449, stock: 40 },
      { weight: 500, price: 849, stock: 35 },
      { weight: 1000, price: 1599, stock: 30 }
    ]
  },
  {
    name: 'Pistachio & Fig Delight',
    description: 'Exotic combination of pistachios, figs, and dates. Rich in fiber, potassium, and antioxidants. A gourmet treat for health-conscious food lovers.',
    basePrice: 599,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 28,
    category: 'Dry Fruit Laddus',
    weightOptions: [
      { weight: 250, price: 599, stock: 28 },
      { weight: 500, price: 1149, stock: 25 },
      { weight: 1000, price: 2199, stock: 20 }
    ]
  },
  {
    name: 'Mixed Dry Fruit Special',
    description: 'Premium blend of almonds, cashews, pistachios, walnuts, raisins, and dates. Balanced nutrition with natural sweetness. Perfect for daily snacking.',
    basePrice: 479,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 45,
    category: 'Dry Fruit Laddus',
    weightOptions: [
      { weight: 250, price: 479, stock: 45 },
      { weight: 500, price: 899, stock: 40 },
      { weight: 1000, price: 1699, stock: 35 }
    ]
  },
  {
    name: 'Rava Laddu',
    description: 'Delicious rava laddu with roasted semolina, ghee, sugar, and cardamom. Light, fluffy, and melt-in-your-mouth texture. Perfect for festivals and celebrations.',
    basePrice: 249,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 40,
    category: 'Traditional Laddus',
    weightOptions: [
      { weight: 250, price: 249, stock: 40 },
      { weight: 500, price: 449, stock: 35 },
      { weight: 1000, price: 849, stock: 30 }
    ]
  },
  {
    name: 'Coconut Laddu',
    description: 'Fresh coconut laddu with grated coconut, jaggery, and aromatic spices. Naturally sweet and packed with healthy fats. A tropical delight for your taste buds.',
    basePrice: 279,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 35,
    category: 'Traditional Laddus',
    weightOptions: [
      { weight: 250, price: 279, stock: 35 },
      { weight: 500, price: 519, stock: 30 },
      { weight: 1000, price: 999, stock: 25 }
    ]
  },
  {
    name: 'Til Laddu (Sesame)',
    description: 'Nutritious til laddu made with roasted sesame seeds, jaggery, and ghee. Rich in calcium and iron. Perfect for winter months and energy boost.',
    basePrice: 329,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 45,
    category: 'Healthy Laddus',
    weightOptions: [
      { weight: 250, price: 329, stock: 45 },
      { weight: 500, price: 619, stock: 40 },
      { weight: 1000, price: 1199, stock: 35 }
    ]
  },
  {
    name: 'Moong Dal Laddu',
    description: 'Protein-rich moong dal laddu with roasted yellow lentils, ghee, and sugar. Easy to digest and perfect for all age groups. Great source of plant protein.',
    basePrice: 269,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 55,
    category: 'Healthy Laddus',
    weightOptions: [
      { weight: 250, price: 269, stock: 55 },
      { weight: 500, price: 499, stock: 50 },
      { weight: 1000, price: 949, stock: 45 }
    ]
  },
  {
    name: 'Chocolate & Dry Fruit Laddu',
    description: 'Modern twist on traditional laddu with rich dark chocolate, premium dry fruits, and dates. Indulgent yet healthy. Perfect for chocolate lovers who want nutrition too.',
    basePrice: 349,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 38,
    category: 'Fusion Laddus',
    weightOptions: [
      { weight: 250, price: 349, stock: 38 },
      { weight: 500, price: 649, stock: 33 },
      { weight: 1000, price: 1249, stock: 28 }
    ]
  },
  {
    name: 'Oats & Honey Laddu',
    description: 'Healthy oats laddu sweetened with natural honey and loaded with nuts. Low in sugar, high in fiber. Ideal for health-conscious individuals and fitness enthusiasts.',
    basePrice: 299,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 42,
    category: 'Healthy Laddus',
    weightOptions: [
      { weight: 250, price: 299, stock: 42 },
      { weight: 500, price: 549, stock: 38 },
      { weight: 1000, price: 1049, stock: 33 }
    ]
  },
  {
    name: 'Badam Laddu (Almond)',
    description: 'Premium badam laddu made with finest quality almonds, ghee, and sugar. Rich in Vitamin E and healthy fats. A luxurious treat for special occasions.',
    basePrice: 549,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 25,
    category: 'Dry Fruit Laddus',
    weightOptions: [
      { weight: 250, price: 549, stock: 25 },
      { weight: 500, price: 1049, stock: 22 },
      { weight: 1000, price: 1999, stock: 20 }
    ]
  },
  {
    name: 'Gond Laddu',
    description: 'Traditional gond laddu with edible gum, whole wheat flour, ghee, and nuts. Known for its warming properties and energy-boosting benefits. Perfect for winters.',
    basePrice: 379,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 33,
    category: 'Traditional Laddus',
    weightOptions: [
      { weight: 250, price: 379, stock: 33 },
      { weight: 500, price: 719, stock: 30 },
      { weight: 1000, price: 1399, stock: 25 }
    ]
  },
  {
    name: 'Sugar-Free Dry Fruit Laddu',
    description: 'Diabetic-friendly laddu made with natural sweeteners, premium dry fruits, and seeds. Zero added sugar, high in protein. Safe for diabetics and health-conscious customers.',
    basePrice: 399,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 28,
    category: 'Healthy Laddus',
    weightOptions: [
      { weight: 250, price: 399, stock: 28 },
      { weight: 500, price: 749, stock: 25 },
      { weight: 1000, price: 1449, stock: 22 }
    ]
  },
  {
    name: 'Motichoor Laddu',
    description: 'Festive favorite motichoor laddu with tiny pearl-like boondi, ghee, and sugar syrup. Soft, sweet, and aromatic. A must-have for celebrations and festivals.',
    basePrice: 319,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
    stock: 48,
    category: 'Traditional Laddus',
    weightOptions: [
      { weight: 250, price: 319, stock: 48 },
      { weight: 500, price: 599, stock: 43 },
      { weight: 1000, price: 1149, stock: 38 }
    ]
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert products
    const created = await Product.insertMany(products);
    console.log(`✅ Successfully seeded ${created.length} NutriBites Laddus products!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
