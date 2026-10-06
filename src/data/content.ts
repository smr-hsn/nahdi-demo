export type Category = {
  id: string
  name: string
  description: string
  image: string
  suggestedQuestions: string[]
}

export type Concern = {
  id: string
  name: string
  description: string
  suggestedQuestions: string[]
}

export type FaqItem = {
  id: string
  question: string
  answer: string
}

export const categories: Category[] = [
  {
    id: 'cleansers',
    name: 'Cleansers',
    description: 'Gentle daily rituals for a clear canvas',
    image: '/images/cleansers.jpg',
    suggestedQuestions: [
      'What cleanser suits combination skin?',
      'Should I double cleanse at night?',
      'Recommend a gentle cleanser for sensitive skin',
    ],
  },
  {
    id: 'moisturizers',
    name: 'Moisturizers',
    description: 'Hydration that feels light yet lasting',
    image: '/images/moisturizers.jpg',
    suggestedQuestions: [
      'Best moisturizer for dry winter skin?',
      'Recommend a lightweight gel moisturizer',
      'Can I use moisturizer under sunscreen?',
    ],
  },
  {
    id: 'serums',
    name: 'Serums',
    description: 'Targeted care in every drop',
    image: '/images/serums.jpg',
    suggestedQuestions: [
      'Which serum helps with dullness?',
      'How do I layer vitamin C and niacinamide?',
      'Suggest a beginner-friendly serum routine',
    ],
  },
  {
    id: 'sunscreens',
    name: 'Sunscreens',
    description: 'Everyday defense with elegance',
    image: '/images/sunscreens.jpg',
    suggestedQuestions: [
      'Recommend a non-greasy daily SPF',
      'Chemical vs mineral sunscreen for my face?',
      'How often should I reapply sunscreen indoors?',
    ],
  },
  {
    id: 'acne-care',
    name: 'Acne Care',
    description: 'Calm breakouts without harshness',
    image: '/images/acne-care.jpg',
    suggestedQuestions: [
      'How can I treat occasional breakouts gently?',
      'What ingredients help with acne-prone skin?',
      'Build me a simple acne-care routine',
    ],
  },
  {
    id: 'anti-aging',
    name: 'Anti-Aging',
    description: 'Support skin’s natural resilience',
    image: '/images/anti-aging.jpg',
    suggestedQuestions: [
      'When should I start retinol?',
      'Peptides vs retinoids for fine lines?',
      'Suggest an evening anti-aging routine',
    ],
  },
  {
    id: 'sensitive-skin',
    name: 'Sensitive Skin',
    description: 'Formulas that respect the barrier',
    image: '/images/sensitive-skin.jpg',
    suggestedQuestions: [
      'How do I soothe reactive, red skin?',
      'Fragrance-free routine for sensitive skin?',
      'What ingredients should I avoid if I’m sensitive?',
    ],
  },
  {
    id: 'korean-skincare',
    name: 'Korean Skincare',
    description: 'Layered glow, thoughtfully curated',
    image: '/images/korean-skincare.jpg',
    suggestedQuestions: [
      'Explain the K-beauty layering order',
      'Best essences for hydration?',
      'Create a simplified Korean skincare routine',
    ],
  },
]

export const concerns: Concern[] = [
  {
    id: 'dry-skin',
    name: 'Dry Skin',
    description: 'Restore comfort and lasting moisture',
    suggestedQuestions: [
      'My skin feels tight after cleansing — what should I change?',
      'Best hydrating ingredients for dry skin?',
    ],
  },
  {
    id: 'oily-skin',
    name: 'Oily Skin',
    description: 'Balance shine without stripping',
    suggestedQuestions: [
      'How do I control oil without over-drying?',
      'Lightweight products for oily T-zone?',
    ],
  },
  {
    id: 'acne',
    name: 'Acne',
    description: 'Clearer-looking skin with care',
    suggestedQuestions: [
      'Help me calm inflamed breakouts',
      'What routine works for hormonal acne?',
    ],
  },
  {
    id: 'pigmentation',
    name: 'Pigmentation',
    description: 'Even tone with patience and SPF',
    suggestedQuestions: [
      'How can I fade dark spots safely?',
      'Ingredients that help with uneven tone?',
    ],
  },
  {
    id: 'sensitive',
    name: 'Sensitive Skin',
    description: 'Less irritation, more calm',
    suggestedQuestions: [
      'My skin stings with most products — help',
      'Barrier-repair routine for sensitive skin?',
    ],
  },
  {
    id: 'sun-protection',
    name: 'Sun Protection',
    description: 'Daily SPF made effortless',
    suggestedQuestions: [
      'Find me a sunscreen I’ll actually wear daily',
      'Tips for reapplying SPF over makeup?',
    ],
  },
]

export const faqs: FaqItem[] = [
  {
    id: '1',
    question: 'What is Skincare AI Advisor?',
    answer:
      'This is a demo of an AI-powered skincare consultant. Ask in the floating chat for personalized guidance from the IDRAK agent and its product knowledge — or start a live voice call. It is not medical advice.',
  },
  {
    id: '2',
    question: 'Is this medical or dermatological advice?',
    answer:
      'No. This demo is for illustration only. It does not diagnose conditions, prescribe treatments, or replace professional dermatological care. Always consult a qualified clinician for medical concerns.',
  },
  {
    id: '3',
    question: 'Can I talk to the AI with voice?',
    answer:
      'Yes. Use Call to Assistant at the top of the chat widget to start a live voice session (microphone permission required). You can mute, unmute, or return to text at any time. Chrome and Edge are the most reliable browsers for two-way audio.',
  },
  {
    id: '4',
    question: 'Are product prices and reviews shown?',
    answer:
      'Not in this demo. We intentionally avoid inventing prices, ratings, or customer claims. When connected to a real catalog, recommendations can surface verified product details only.',
  },
  {
    id: '5',
    question: 'Who is IDRAK?',
    answer:
      'IDRAK powers the AI consultation layer behind this demo — enabling personalized, conversational skincare guidance that can later integrate with your brand’s catalog and policies.',
  },
]

export const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Skincare', href: '#categories' },
  { label: 'Categories', href: '#categories' },
  { label: 'AI Advisor', href: '#ai-advisor' },
] as const
