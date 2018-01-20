"use strict";

const express = require("express");
const bodyParser = require("body-parser");

const restService = express();

restService.use(
  bodyParser.urlencoded({
    extended: true
  })
);

restService.use(bodyParser.json());

//enable best buy connection
var bby = require('bestbuy')('ozDm81EOVzjYE0Rm8Ovan7aL');

//sample to get information about products from Best Buy Site
restService.post("/item", function(req, res) {

 var search = bby.products('sku=' + req.body.result.parameters.sku);

  search
  .then(function (data) {

      var speech = getItemInfo(data) ? getItemInfo(data) : "Seems like some problem. Speak again.";

       // return to caller
        return res.json({
          speech: speech,
          displayText: speech,
          source: "webhook-arrow-testing"
        });
  
    });

   });

  //get item informartion from best buy
  function getItemInfo (data) {

    if (!data.total) {
      return 'No product information found found for this item';
    } else {
      var product = data.products[0];
      var productInfo = "Item " + product.name + " sold for $" + product.salePrice + " by " + product.manufacturer;
      
      return productInfo;    
    }
  }


restService.listen(process.env.PORT || 8000, function() {
  console.log("Server up and listening");
});
