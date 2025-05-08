import { GraphQLClient } from 'graphql-request';

const SHOPIFY_STORE_URL = 'kujsbw-1a.myshopify.com';
const SHOPIFY_STOREFRONT_TOKEN = 'c4b78504bdff122a8bd58e79c4cac1e5';

export const shopifyClient = new GraphQLClient(
  `https://${SHOPIFY_STORE_URL}/api/2024-01/graphql.json`,
  {
    headers: {
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      'Content-Type': 'application/json',
    },
  }
);