import {createProductsSearchEndpointRequest} from '../endpoints/products/products';
import {execute} from '../helpers/execute';
import {
  nockWithBapiScope,
  disableNetAndAllowBapiCors,
} from '../test-helpers/nock';
import {createProductByIdEndpointRequest} from '../endpoints/products/productById';

disableNetAndAllowBapiCors();

test.skip('Fetch category products', async () => {
  nockWithBapiScope()
    .defaultReplyHeaders({'access-control-allow-origin': '*'})
    .get(
      `/v1/products?filters%5Bcategory%5D=20201&sortScore=category_scores&sortChannel=etkp&perPage=2&shopId=139`,
    )
    .replyWithFile(200, __dirname + '/responses/products.json', {
      'Content-Type': 'application/json',
    });

  const result = await execute(
    'https://api-cloud.example.com/v1/',
    139,
    createProductsSearchEndpointRequest({
      where: {
        categoryId: 20201,
      },
      pagination: {
        perPage: 2,
      },
      sort: {
        score: 'category_scores',
        channel: 'etkp',
      },
    }),
  );

  expect(result.data.entities.length).toBe(2);

  return true;
});

test.skip('Fetch unavailable product', async () => {
  nockWithBapiScope()
    .defaultReplyHeaders({'access-control-allow-origin': '*'})
    .get(`/v1/products/123?shopId=139`)
    .replyWithFile(404, __dirname + '/responses/product-not-found.json', {
      'Content-Type': 'application/json',
    });

  try {
    await execute(
      'https://api-cloud.example.com/v1/',
      139,
      createProductByIdEndpointRequest({
        productId: 123,
      }),
    );
  } catch (e) {
    expect((e as any).message).toBe(`Request failed with status code 404`);
    return;
  }

  fail('Expected exception');
});

test('Product by ID request', async () => {
  expect(
    createProductByIdEndpointRequest({
      productId: 123,
      with: {
        attributes: 'all',
      },
    }),
  ).toMatchInlineSnapshot(`
{
  "endpoint": "products/123",
  "method": "GET",
  "params": {
    "with": "attributes,images.attributes:legacy(false)",
  },
}
`);
});

test('Product by ID request with price promotion key', async () => {
  expect(
    createProductByIdEndpointRequest({
      productId: 123,
      pricePromotionKey: 'abc123',
    }),
  ).toMatchInlineSnapshot(`
{
  "endpoint": "products/123",
  "method": "GET",
  "params": {
    "pricePromotionKey": "abc123",
  },
}
`);
});

test('Product by ID with categories', async () => {
  expect(
    createProductByIdEndpointRequest({
      productId: 123,
      with: {
        categories: {
          properties: 'all',
        },
      },
    }),
  ).toMatchInlineSnapshot(`
{
  "endpoint": "products/123",
  "method": "GET",
  "params": {
    "with": "images.attributes:legacy(false),categories",
  },
}
`);

  expect(
    createProductByIdEndpointRequest({
      productId: 123,
      with: {
        categories: 'all',
      },
    }),
  ).toMatchInlineSnapshot(`
{
  "endpoint": "products/123",
  "method": "GET",
  "params": {
    "with": "images.attributes:legacy(false),categories:properties()",
  },
}
`);
});

test('sellable for free parameter', () => {
  expect(
    createProductByIdEndpointRequest({
      productId: 123,
      includeSellableForFree: true,
    }),
  ).toMatchInlineSnapshot(`
{
  "endpoint": "products/123",
  "method": "GET",
  "params": {
    "includeSellableForFree": true,
  },
}
`);

  expect(
    createProductsSearchEndpointRequest({
      where: {
        categoryId: 20201,
      },
      includeSellableForFree: true,
    }),
  ).toMatchInlineSnapshot(`
{
  "endpoint": "products",
  "method": "GET",
  "params": {
    "filters[category]": 20201,
    "includeSellableForFree": true,
  },
}
`);
});
