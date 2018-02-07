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


//get information about products from Best Buy Site
restService.post("/assistant", function(req, res) {

  switch (req.body.result.action) {

    //item details
    case "item.details" :

       var search = bby.products('sku=' + req.body.result.parameters.sku);

        search.then(function (data) {

            var product = getItemInfo(data);

            if (product) {
              var productInfo = "Item " + product.name + " sold for $" + product.regularPrice + " by " + product.manufacturer;
            } else {
              var productInfo = "No Product Informartion found for this item"
            }

            var speech = productInfo ? productInfo : "Seems like some problem. Speak again.";      
            sendResultsToFlow(res, speech);
        
          });

      break;


    //case real time availability
    case "item.details.availability" :

      var sku = req.body.result.parameters.sku;
      var zipcode = req.body.result.parameters.zipcode;

      bby.realTimeAvailability(sku, {postalCode: zipcode}, function (err, data) {

        if (err) console.error(err);
        
         if(data.stores.length > 0) {

           var storeList = data.stores.map(s => `${s.name}`).join(',');
           
            var speech = "Yes, this Item is avilable in " + data.stores.length + " stores in this area";
         } else {
           var speech = "Sorry, this item is not available at this location"
         }

          sendResultsToFlow(res, speech);
             
      });

      break;

      //case checking if product on sale and what is the sale price
      case "item.details.onsalecheck" :

       var sku = req.body.result.parameters.sku;

       var search = bby.products('sku=' + req.body.result.parameters.sku);

          search.then(function (data) {

            var product = getItemInfo(data);

            if (product) {

                if (product.onSale) {
                  var productInfo = "Item is on Sale with Sale Price of $" + product.salePrice;
                } else {
                  var productInfo = "Item is not on Sale and sold for regular price $" + product.regularPrice;
                }
           }

            var speech = productInfo ? productInfo : "Seems like some problem. Speak again.";      
            sendResultsToFlow(res, speech);
        
          });

        break;

   }

 
 });

 
   //post results back to Flow
   function sendResultsToFlow(res, results) {

     // return to caller
        return res.json({
          speech: results,
          displayText: results,
          source: "webhook-arrow-testing"
        });

   }



  //get item informartion from best buy
  function getItemInfo (data) {

    if (!data.total) {
      return null;
    } else {
      var product = data.products[0];      
    }
      
      return product;        
  }


restService.listen(process.env.PORT || 8000, function() {
  console.log("Server up and listening");
});
