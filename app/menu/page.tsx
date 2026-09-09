"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type MenuItem = {
  name: string;
  description: string;
  price: number;
  category: string;
  type: "Veg" | "Non-Veg";
  image: string;
  signature?: boolean;
};

const categories = [
  "All",
  "Starters",
  "Tandoor",
  "Main Course",
  "Biryani",
  "Rice",
  "Chinese",
  "Breads",
  "Dal & Accompaniments",
  "Maharashtrian Specials",
  "Desserts",
  "Beverages",
];

const menuItems: MenuItem[] = [
  // =====================================================
  // VEGETARIAN STARTERS
  // =====================================================

  {
    name: "Paneer Tikka",
    description:
      "Charcoal-grilled paneer marinated with aromatic Indian spices.",
    price: 240,
    category: "Starters",
    type: "Veg",
    image: "/images/signature-dish.png",
    signature: true,
  },
  {
    name: "Paneer Chilli",
    description:
      "Crisp paneer tossed with peppers, onions and chilli sauce.",
    price: 220,
    category: "Starters",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Manchurian",
    description:
      "Crispy vegetable dumplings tossed in a savoury Manchurian sauce.",
    price: 190,
    category: "Starters",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Crispy Corn",
    description:
      "Crispy golden corn tossed with aromatic spices and seasoning.",
    price: 180,
    category: "Starters",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Spring Roll",
    description:
      "Crisp rolls filled with seasoned vegetables and served with dip.",
    price: 180,
    category: "Starters",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Hara Bhara Kebab",
    description:
      "Green vegetable and herb kebabs with a delicate spiced flavour.",
    price: 200,
    category: "Starters",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Cheese Corn Balls",
    description:
      "Golden cheese and sweet corn bites with a crisp outer layer.",
    price: 220,
    category: "Starters",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Tandoori Mushroom",
    description:
      "Mushrooms marinated in Indian spices and roasted in the tandoor.",
    price: 230,
    category: "Starters",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Aloo Tikka",
    description:
      "Spiced potato tikka roasted until golden and lightly charred.",
    price: 180,
    category: "Starters",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Seekh Kebab",
    description:
      "Aromatic vegetable seekh kebabs prepared with traditional spices.",
    price: 210,
    category: "Starters",
    type: "Veg",
    image: "/images/signature-dish.png",
  },

  // =====================================================
  // NON-VEG STARTERS
  // =====================================================

  {
    name: "Chicken Tikka",
    description:
      "Tender chicken pieces marinated in spices and roasted in the tandoor.",
    price: 280,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
    signature: true,
  },
  {
    name: "Chicken 65",
    description:
      "Crispy fried chicken tossed with aromatic spices and herbs.",
    price: 260,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Chilli",
    description:
      "Chicken tossed with peppers, onions and spicy chilli sauce.",
    price: 270,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Lollipop",
    description:
      "Crispy chicken wings prepared with a flavourful spicy coating.",
    price: 290,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Seekh Kebab",
    description:
      "Minced chicken kebabs seasoned with aromatic Indian spices.",
    price: 300,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Tandoori Chicken Half",
    description:
      "Classic tandoori chicken marinated with yoghurt and Indian spices.",
    price: 320,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
    signature: true,
  },
  {
    name: "Tandoori Chicken Full",
    description:
      "Full tandoori chicken prepared with a traditional spice marinade.",
    price: 580,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Mutton Seekh Kebab",
    description:
      "Juicy minced mutton kebabs prepared with traditional spices.",
    price: 350,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Fish Fry",
    description:
      "Crispy fried fish coated with a flavourful Indian spice marinade.",
    price: 320,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Malai Tikka",
    description:
      "Tender chicken marinated in a creamy, mildly spiced marinade.",
    price: 300,
    category: "Starters",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },

  // =====================================================
  // TANDOOR
  // =====================================================

  {
    name: "Paneer Malai Tikka",
    description:
      "Soft paneer marinated in a creamy mild spice mixture and grilled.",
    price: 260,
    category: "Tandoor",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Tandoori Aloo",
    description:
      "Baby potatoes marinated with Indian spices and roasted in the tandoor.",
    price: 200,
    category: "Tandoor",
    type: "Veg",
    image: "/images/signature-dish.png",
  },

  // =====================================================
  // MAIN COURSE - VEG
  // =====================================================

  {
    name: "Paneer Butter Masala",
    description:
      "Paneer cooked in a rich tomato, butter and aromatic spice gravy.",
    price: 240,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
    signature: true,
  },
  {
    name: "Paneer Kadai",
    description:
      "Paneer cooked with capsicum, onion and freshly ground kadai spices.",
    price: 230,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Paneer Tikka Masala",
    description:
      "Tandoor-roasted paneer finished in a rich spiced tomato gravy.",
    price: 250,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Paneer Handi",
    description:
      "Paneer simmered in a creamy and aromatic handi-style gravy.",
    price: 250,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Kaju Masala",
    description:
      "Cashews cooked in a rich, creamy and mildly spiced gravy.",
    price: 260,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Kolhapuri",
    description: 
      "Mixed vegetables cooked in a bold and spicy Kolhapuri masala.",
    price: 220,
    category: "Main Course",
    type: "Veg",
    image: "/images/menu/veg-kolhapuri.jpg",
  },
  {
    name: "Veg Handi",
    description:
      "Seasonal vegetables slow-cooked in an aromatic handi gravy.",
    price: 220,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Kadai",
    description:
      "Mixed vegetables tossed with capsicum, onion and kadai spices.",
    price: 210,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Mix Veg",
    description:
      "A comforting combination of vegetables cooked with Indian spices.",
    price: 200,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Dal Tadka",
    description:
      "Yellow lentils finished with a fragrant tempering of spices.",
    price: 160,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Dal Fry",
    description:
      "Classic yellow dal tempered with aromatic Indian spices.",
    price: 150,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Dal Makhani",
    description:
      "Slow-cooked black lentils finished with butter and cream.",
    price: 190,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chole Masala",
    description:
      "Chickpeas cooked in a rich and aromatic Indian masala.",
    price: 170,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Malai Kofta",
    description:
      "Soft vegetable koftas served in a rich and creamy gravy.",
    price: 230,
    category: "Main Course",
    type: "Veg",
    image: "/images/signature-dish.png",
  },

  // =====================================================
  // MAIN COURSE - NON VEG
  // =====================================================

  {
    name: "Chicken Masala",
    description:
      "Chicken cooked with onion, tomato and aromatic Indian spices.",
    price: 280,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Handi",
    description:
      "Tender chicken slow-cooked in a rich handi-style gravy.",
    price: 300,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Kolhapuri",
    description:
      "Spicy chicken preparation made with bold Kolhapuri masala.",
    price: 300,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
    signature: true,
  },
  {
    name: "Chicken Kadai",
    description:
      "Chicken cooked with capsicum, onion and freshly ground spices.",
    price: 290,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Tikka Masala",
    description:
      "Tandoor-roasted chicken pieces served in a rich spiced gravy.",
    price: 310,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Butter Chicken",
    description:
      "Tender chicken in a rich tomato, butter and aromatic spice sauce.",
    price: 320,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Curry",
    description:
      "Classic Indian chicken curry prepared with aromatic spices.",
    price: 270,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Mutton Masala",
    description:
      "Tender mutton cooked slowly with a rich blend of Indian spices.",
    price: 360,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Mutton Handi",
    description:
      "Slow-cooked mutton prepared in a rich and aromatic handi gravy.",
    price: 380,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
    signature: true,
  },
  {
    name: "Mutton Kolhapuri",
    description:
      "Mutton cooked in a bold, spicy and aromatic Kolhapuri masala.",
    price: 380,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Fish Curry",
    description:
      "Fish simmered in a flavourful Indian curry with aromatic spices.",
    price: 320,
    category: "Main Course",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },

  // =====================================================
  // BIRYANI
  // =====================================================

  {
    name: "Veg Biryani",
    description:
      "Fragrant basmati rice layered with vegetables and aromatic spices.",
    price: 220,
    category: "Biryani",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Paneer Biryani",
    description:
      "Aromatic basmati rice cooked with paneer and fragrant spices.",
    price: 240,
    category: "Biryani",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Handi Biryani",
    description:
      "Vegetable biryani prepared in handi style for rich flavour.",
    price: 280,
    category: "Biryani",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Biryani",
    description:
      "Aromatic basmati rice layered with tender chicken and spices.",
    price: 280,
    category: "Biryani",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Handi Biryani",
    description:
      "Rich chicken biryani prepared in traditional handi style.",
    price: 340,
    category: "Biryani",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Mutton Biryani",
    description:
      "Fragrant basmati rice cooked with tender mutton and aromatic spices.",
    price: 360,
    category: "Biryani",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Mutton Handi Biryani",
    description:
      "Slow-cooked mutton biryani prepared in traditional handi style.",
    price: 420,
    category: "Biryani",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Egg Biryani",
    description:
      "Aromatic basmati rice prepared with eggs and fragrant spices.",
    price: 220,
    category: "Biryani",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Aarambh Special Chicken Biryani",
    description:
      "Aarambh's special chicken biryani prepared with fragrant rice and aromatic spices.",
    price: 360,
    category: "Biryani",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
    signature: true,
  },

  // =====================================================
  // RICE
  // =====================================================

  {
    name: "Steamed Rice",
    description: "Simple steamed rice, perfect with curries and gravies.",
    price: 120,
    category: "Rice",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Jeera Rice",
    description:
      "Fragrant basmati rice tempered with roasted cumin seeds.",
    price: 150,
    category: "Rice",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Fried Rice",
    description:
      "Wok-tossed rice with vegetables and aromatic Asian seasoning.",
    price: 180,
    category: "Rice",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Egg Fried Rice",
    description:
      "Wok-fried rice with egg, vegetables and Asian seasoning.",
    price: 200,
    category: "Rice",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Fried Rice",
    description:
      "Wok-tossed rice with chicken, vegetables and aromatic sauces.",
    price: 230,
    category: "Rice",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Schezwan Fried Rice",
    description:
      "Spicy fried rice tossed with vegetables and Schezwan seasoning.",
    price: 200,
    category: "Rice",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Schezwan Rice",
    description:
      "Spicy Schezwan rice tossed with chicken and vegetables.",
    price: 250,
    category: "Rice",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },

  // =====================================================
  // CHINESE
  // =====================================================

  {
    name: "Veg Hakka Noodles",
    description:
      "Wok-tossed noodles with fresh vegetables and savoury sauces.",
    price: 180,
    category: "Chinese",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Schezwan Noodles",
    description:
      "Spicy noodles tossed with vegetables and Schezwan sauce.",
    price: 200,
    category: "Chinese",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Manchurian",
    description:
      "Crispy vegetable dumplings served in a flavourful Manchurian sauce.",
    price: 190,
    category: "Chinese",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chilli Paneer",
    description:
      "Paneer tossed with peppers, onions and a spicy chilli sauce.",
    price: 220,
    category: "Chinese",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Schezwan",
    description:
      "Mixed vegetables tossed with spicy Schezwan sauce.",
    price: 200,
    category: "Chinese",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Hakka Noodles",
    description:
      "Wok-tossed noodles with chicken, vegetables and savoury sauces.",
    price: 230,
    category: "Chinese",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Schezwan Noodles",
    description:
      "Spicy noodles tossed with chicken and Schezwan sauce.",
    price: 250,
    category: "Chinese",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Manchurian",
    description:
      "Crispy chicken tossed in a savoury Manchurian sauce.",
    price: 250,
    category: "Chinese",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chilli Chicken",
    description:
      "Chicken tossed with peppers, onions and spicy chilli sauce.",
    price: 270,
    category: "Chinese",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chicken Schezwan",
    description:
      "Chicken tossed with vegetables and spicy Schezwan sauce.",
    price: 270,
    category: "Chinese",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },

  // =====================================================
  // INDIAN BREADS
  // =====================================================

  {
    name: "Tandoori Roti",
    description: "Traditional whole-wheat roti baked in the tandoor.",
    price: 30,
    category: "Breads",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Butter Roti",
    description: "Soft tandoori roti finished with butter.",
    price: 40,
    category: "Breads",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Plain Naan",
    description: "Soft traditional naan baked in the tandoor.",
    price: 50,
    category: "Breads",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Butter Naan",
    description: "Soft naan finished with a touch of butter.",
    price: 60,
    category: "Breads",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Garlic Naan",
    description: "Tandoor-baked naan topped with aromatic garlic.",
    price: 80,
    category: "Breads",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Cheese Garlic Naan",
    description: "Garlic naan filled and finished with melted cheese.",
    price: 120,
    category: "Breads",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Plain Paratha",
    description: "Flaky Indian flatbread cooked to a golden finish.",
    price: 60,
    category: "Breads",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Butter Paratha",
    description: "Flaky paratha finished with butter.",
    price: 70,
    category: "Breads",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Laccha Paratha",
    description: "Layered and flaky paratha cooked until golden.",
    price: 80,
    category: "Breads",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Stuffed Kulcha",
    description: "Soft stuffed kulcha baked in the tandoor.",
    price: 110,
    category: "Breads",
    type: "Veg",
    image: "/images/signature-dish.png",
  },

  // =====================================================
  // DAL & ACCOMPANIMENTS
  // =====================================================

  {
    name: "Green Salad",
    description: "Fresh seasonal vegetables served as a crisp accompaniment.",
    price: 100,
    category: "Dal & Accompaniments",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Onion Salad",
    description: "Fresh sliced onions served with a light seasoning.",
    price: 70,
    category: "Dal & Accompaniments",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Boondi Raita",
    description: "Creamy yoghurt with seasoned boondi and mild spices.",
    price: 100,
    category: "Dal & Accompaniments",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Raita",
    description: "Fresh yoghurt mixed with vegetables and mild seasoning.",
    price: 110,
    category: "Dal & Accompaniments",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Plain Curd",
    description: "Fresh and creamy plain yoghurt.",
    price: 80,
    category: "Dal & Accompaniments",
    type: "Veg",
    image: "/images/signature-dish.png",
  },

  // =====================================================
  // MAHARASHTRIAN SPECIALS
  // =====================================================

  {
    name: "Kolhapuri Chicken",
    description:
      "Spicy chicken preparation made with bold traditional Kolhapuri masala.",
    price: 300,
    category: "Maharashtrian Specials",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
    signature: true,
  },
  {
    name: "Mutton Kolhapuri",
    description:
      "Tender mutton cooked in a rich and spicy Kolhapuri masala.",
    price: 380,
    category: "Maharashtrian Specials",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Pandhra Rassa",
    description:
      "Traditional Maharashtrian white mutton gravy with aromatic spices.",
    price: 180,
    category: "Maharashtrian Specials",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Tambda Rassa",
    description:
      "Bold and spicy Maharashtrian red mutton gravy.",
    price: 180,
    category: "Maharashtrian Specials",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Bhakri",
    description: "Traditional Maharashtrian flatbread.",
    price: 40,
    category: "Maharashtrian Specials",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Thecha",
    description: "Traditional spicy Maharashtrian green chilli chutney.",
    price: 40,
    category: "Maharashtrian Specials",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Bharli Vangi",
    description:
      "Stuffed baby brinjals cooked with a traditional Maharashtrian masala.",
    price: 190,
    category: "Maharashtrian Specials",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Pithla Bhakri",
    description:
      "Traditional Maharashtrian pithla served with fresh bhakri.",
    price: 180,
    category: "Maharashtrian Specials",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Misal Pav",
    description:
      "Classic Maharashtrian misal served with soft pav.",
    price: 140,
    category: "Maharashtrian Specials",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Veg Thali",
    description:
      "A wholesome selection of vegetarian favourites served together.",
    price: 220,
    category: "Maharashtrian Specials",
    type: "Veg",
    image: "/images/signature-dish.png",
    signature: true,
  },
  {
    name: "Chicken Thali",
    description:
      "A generous thali featuring chicken and traditional accompaniments.",
    price: 320,
    category: "Maharashtrian Specials",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
    signature: true,
  },
  {
    name: "Mutton Thali",
    description:
      "Traditional thali featuring mutton and complementary dishes.",
    price: 380,
    category: "Maharashtrian Specials",
    type: "Non-Veg",
    image: "/images/signature-dish.png",
  },

  // =====================================================
  // DESSERTS
  // =====================================================

  {
    name: "Gulab Jamun",
    description:
      "Soft warm milk dumplings served with fragrant sugar syrup.",
    price: 90,
    category: "Desserts",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Gulab Jamun with Ice Cream",
    description:
      "Warm gulab jamun served with a scoop of creamy ice cream.",
    price: 150,
    category: "Desserts",
    type: "Veg",
    image: "/images/signature-dish.png",
    signature: true,
  },
  {
    name: "Gajar Halwa",
    description:
      "Traditional carrot dessert prepared with milk and aromatic flavours.",
    price: 120,
    category: "Desserts",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Kulfi",
    description: "Classic Indian frozen dessert with a rich creamy texture.",
    price: 100,
    category: "Desserts",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Vanilla Ice Cream",
    description: "Classic smooth and creamy vanilla ice cream.",
    price: 100,
    category: "Desserts",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chocolate Ice Cream",
    description: "Rich and creamy chocolate ice cream.",
    price: 120,
    category: "Desserts",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Brownie with Ice Cream",
    description:
      "Warm chocolate brownie served with creamy ice cream.",
    price: 180,
    category: "Desserts",
    type: "Veg",
    image: "/images/signature-dish.png",
  },

  // =====================================================
  // BEVERAGES
  // =====================================================

  {
    name: "Masala Chaas",
    description:
      "Refreshing yoghurt-based drink with herbs and Indian spices.",
    price: 70,
    category: "Beverages",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Sweet Lassi",
    description: "Creamy traditional yoghurt drink with a naturally sweet flavour.",
    price: 100,
    category: "Beverages",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Mango Lassi",
    description: "Creamy yoghurt blended with mango.",
    price: 120,
    category: "Beverages",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Fresh Lime Soda",
    description:
      "Refreshing lime drink with soda and a balanced citrus flavour.",
    price: 90,
    category: "Beverages",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Fresh Lime Water",
    description: "Refreshing fresh lime drink.",
    price: 70,
    category: "Beverages",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Cold Coffee",
    description: "Chilled creamy coffee prepared for a refreshing finish.",
    price: 130,
    category: "Beverages",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Chocolate Shake",
    description: "Rich and creamy chocolate milkshake.",
    price: 150,
    category: "Beverages",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Mango Shake",
    description: "Creamy chilled mango shake.",
    price: 150,
    category: "Beverages",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Mineral Water",
    description: "Packaged drinking water.",
    price: 30,
    category: "Beverages",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
  {
    name: "Soft Drink",
    description: "Chilled soft drink.",
    price: 60,
    category: "Beverages",
    type: "Veg",
    image: "/images/signature-dish.png",
  },
];

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeType, setActiveType] = useState<
    "All" | "Veg" | "Non-Veg"
  >("All");

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const categoryMatch =
        activeCategory === "All" ||
        item.category === activeCategory;

      const typeMatch =
        activeType === "All" ||
        item.type === activeType;

      return categoryMatch && typeMatch;
    });
  }, [activeCategory, activeType]);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* =====================================================
          MENU HERO
      ===================================================== */}

      <section className="border-b border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-40 sm:px-6 sm:pb-24 sm:pt-48 lg:px-8">
          <div className="max-w-4xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
              The Aarambh Menu
            </p>

            <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-8xl">
              Flavours for
              <br />
              <span className="text-white/45">
                every occasion.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              Explore Indian, Maharashtrian, North Indian, Chinese and
              tandoor favourites, prepared with care and served with
              warmth.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/order"
                className="inline-flex min-h-11 items-center rounded-full bg-[#c9a45c] px-6 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#dfbd78]"
              >
                Order Online
                <span className="ml-2">→</span>
              </Link>

              <Link
                href="/booking"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-6 text-sm font-medium text-white transition-all duration-300 hover:border-[#c9a45c] hover:text-[#c9a45c]"
              >
                Book a Table
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <section className="sticky top-0 z-30 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const active = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-medium transition-all duration-200 ${
                    active
                      ? "bg-white text-black"
                      : "border border-white/10 text-white/50 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            {(["All", "Veg", "Non-Veg"] as const).map((type) => {
              const active = activeType === type;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    active
                      ? "border-[#c9a45c] bg-[#c9a45c]/10 text-[#c9a45c]"
                      : "border-white/10 text-white/40 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          MENU GRID
      ===================================================== */}

      <section className="bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#c9a45c]">
                Our Selection
              </p>

              <p className="mt-2 text-sm text-white/40">
                {filteredItems.length} dishes
              </p>
            </div>

            {(activeCategory !== "All" || activeType !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All");
                  setActiveType("All");
                }}
                className="text-xs text-white/40 transition hover:text-[#c9a45c]"
              >
                Clear Filters
              </button>
            )}
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <article
                  key={`${item.name}-${item.category}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-black transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
                >
                  {/* Image */}

                  <div className="relative aspect-[4/3] overflow-hidden bg-[#111]">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {item.signature && (
                      <div className="absolute left-4 top-4 rounded-full border border-[#c9a45c]/40 bg-black/75 px-3 py-1.5 backdrop-blur">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#c9a45c]">
                          Aarambh Special
                        </span>
                      </div>
                    )}

                    <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 backdrop-blur">
                      <span
                        className={`text-[10px] uppercase tracking-[0.15em] ${
                          item.type === "Veg"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                  </div>

                  {/* Content */}

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-xl font-medium tracking-tight text-white">
                        {item.name}
                      </h2>

                      <p className="shrink-0 text-sm font-semibold text-[#c9a45c]">
                        ₹{item.price}
                      </p>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-white/45">
                      {item.description}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                        {item.category}
                      </span>

                      <Link
                        href="/order"
                        className="text-xs font-medium text-white/60 transition-colors hover:text-[#c9a45c]"
                      >
                        Add to Order →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 py-24 text-center">
              <p className="text-sm text-white/40">
                No dishes found for this selection.
              </p>

              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All");
                  setActiveType("All");
                }}
                className="mt-5 text-xs text-[#c9a45c]"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          KITCHEN NOTE
      ===================================================== */}

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-6 sm:py-24">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c9a45c] sm:text-xs">
            A Note From Our Kitchen
          </p>

          <p className="mt-6 text-sm leading-8 text-white/45">
            Please inform our team about any dietary requirements or
            allergies before ordering. Dish availability may vary based
            on ingredient availability.
          </p>
        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="border-t border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-5xl px-5 py-24 text-center sm:px-6 sm:py-32">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c9a45c] sm:text-xs">
            Your Table Awaits
          </p>

          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Good food.
            <br />
            <span className="text-white/45">
              Good moments.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-white/50">
            Enjoy the flavours of Aarambh with your family and friends.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/order"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#c9a45c] sm:w-auto"
            >
              Order Online
              <span className="ml-2">→</span>
            </Link>

            <Link
              href="/booking"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/20 px-7 text-sm font-medium text-white transition-all duration-300 hover:border-[#c9a45c] hover:text-[#c9a45c] sm:w-auto"
            >
              Book a Table
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}