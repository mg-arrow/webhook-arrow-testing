var bby = require('bestbuy')('ozDm81EOVzjYE0Rm8Ovan7aL');

var search = bby.products('sku=' + process.argv[2]);

search.then(processData);

function processData (data) {
  if (!data.total) {
    console.log('No products found.');
  } else {
    var product = data.products[0];
    console.log('Name:', product.name);
    console.log('Price:', product.salePrice);
    console.log('Manufaturer:', product.manufacturer);
  }
}