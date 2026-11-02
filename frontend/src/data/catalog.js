export const pages = [
  'Membership',
  'Equipment',
  'Shop',
  'Workouts',
  'Nutrition',
];
export const plans = [
  {
    name: 'Starter',
    monthlyPrice: 15000,
    description: 'A strong beginning.',
  },
  {
    name: 'Standard',
    monthlyPrice: 17000,
    description: 'Build your routine.',
  },
  {
    name: 'Premium',
    monthlyPrice: 29000,
    description: 'Unlock your potential.',
  },
  {
    name: 'VIP',
    monthlyPrice: 40000,
    description: 'The elevated experience.',
  },
];
export const equipment = [
  {
    name: 'Performance treadmill',
    category: 'Cardio · Legs · Endurance',
    image: 'treadmill',
  },
  {
    name: 'Cable station',
    category: 'Strength · Chest · Back · Arms',
    image: 'cable',
  },
  {
    name: 'Functional rig',
    category: 'Functional · Full body',
    image: 'rig',
  },
];
export const workouts = [
  {
    name: 'Full body strength',
    description: '45 min · Intermediate',
    image: 'hero',
  },
  {
    name: 'HIIT conditioning',
    description: '30 min · Advanced',
    image: 'marcus',
  },
  {
    name: 'Mobility and recovery',
    description: '20 min · All levels',
    image: 'elena',
  },
  {
    name: 'Upper body foundations',
    description: '35 min · Beginner',
    image: 'jordan',
  },
  {
    name: 'Core control',
    description: '20 min · Intermediate',
    image: 'hero',
  },
  {
    name: 'Lower body power',
    description: '40 min · Intermediate',
    image: 'marcus',
  },
];
export const photography = {
  hero: 'hero-nigeria',
  marcus: 'coach-tunde',
  elena: 'coach-amara',
  jordan: 'coach-chidi',
  treadmill: 'equipment-treadmill',
  cable: 'equipment-cable',
  rig: 'equipment-rig',
  tee: 'product-tee',
  shoes: 'product-shoes',
  gloves: 'product-gloves',
  bottle: 'product-bottle',
  bag: 'product-bag',
  shorts: 'product-shorts',
};
export const imageSrc = (key) => `/assets/${photography[key] || key}.jpg`;
