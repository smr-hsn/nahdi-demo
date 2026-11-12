import assert from 'node:assert/strict'
import test from 'node:test'
import { extractProductPageMetadata } from './parse-product-page.ts'

test('extracts the current SAR price from product structured data', () => {
  const html = `
    <script type="application/ld+json">
      {
        "@type": "Product",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "SAR",
          "lowPrice": 92.69,
          "highPrice": 142.6
        }
      }
    </script>
  `

  assert.deepEqual(extractProductPageMetadata(html), { price: 'SAR 92.69' })
})

test('includes verified rating and review count when present', () => {
  const html = `
    <script type="application/ld+json">
      {
        "@type": "Product",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": 4.7,
          "reviewCount": 28
        },
        "offers": { "@type": "Offer", "price": "89", "priceCurrency": "SAR" }
      }
    </script>
  `

  assert.deepEqual(extractProductPageMetadata(html), {
    price: 'SAR 89',
    rating: '4.7',
    ratingCount: '28',
  })
})

test('does not infer price or rating from pages without product data', () => {
  assert.deepEqual(
    extractProductPageMetadata('<script type="application/ld+json">{"@type":"Organization"}</script>'),
    {},
  )
})
