import assert from 'node:assert/strict'
import test from 'node:test'
import { extractAskAnswer, extractProducts } from './parse-idrak.ts'

test('extracts product links and images from nested response envelopes', () => {
  const products = extractProducts({
    data: {
      result: {
        recommendations: [
          {
            name: 'Verified moisturizer',
            product_url: 'https://nahdi.example/products/moisturizer',
            images: ['https://cdn.nahdi.example/moisturizer.jpg'],
          },
        ],
      },
    },
  })

  assert.deepEqual(products, [
    {
      name: 'Verified moisturizer',
      url: 'https://nahdi.example/products/moisturizer',
      imageUrl: 'https://cdn.nahdi.example/moisturizer.jpg',
    },
  ])
})

test('preserves verified product price and rating metadata', () => {
  const products = extractProducts({
    products: [
      {
        name: 'Verified serum',
        url: 'https://nahdi.example/products/serum',
        price: { amount: 89, currency: 'SAR' },
        rating: { value: 4.7, count: 28 },
      },
    ],
  })

  assert.deepEqual(products, [
    {
      name: 'Verified serum',
      url: 'https://nahdi.example/products/serum',
      price: 'SAR 89',
      rating: '4.7',
      ratingCount: '28',
    },
  ])
})

test('collects citations and links from nested answers without duplicates', () => {
  const payload = {
    result: {
      data: {
        answer: 'See [Hydrating serum](https://nahdi.example/products/serum).',
        citations: [
          {
            title: 'Hydrating serum',
            source_url: 'https://nahdi.example/products/serum',
          },
          {
            title: 'Daily SPF',
            url: 'https://nahdi.example/products/spf',
          },
        ],
      },
    },
  }

  assert.equal(
    extractAskAnswer(payload),
    'See [Hydrating serum](https://nahdi.example/products/serum).',
  )
  assert.deepEqual(
    extractProducts(payload).map(({ name, url }) => ({ name, url })),
    [
      {
        name: 'Hydrating serum',
        url: 'https://nahdi.example/products/serum',
      },
      {
        name: 'Daily SPF',
        url: 'https://nahdi.example/products/spf',
      },
    ],
  )
})
