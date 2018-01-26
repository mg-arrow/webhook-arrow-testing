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

            var speech = getItemInfo(data) ? getItemInfo(data) : "Seems like some problem. Speak again.";      
            sendResultsToFlow(res, speech);
        
          });

      break;


    //case availability
    case "item.details.availability" :

      var sku = req.body.result.parameters.sku;
      var zipcode = req.body.result.parameters.zipcode;

      bby.realTimeAvailability(sku, {postalCode: zipcode}, function (err, data) {

        if (err) console.error(err);
        

         if(data.stores.length > 0) {

           var storeList = data.stores.map(s => `${s.name}`).join(',');
           console.log(storeList);

            var speech = "Yes, this Item is avilable in " + data.stores.length + " stores in this area";
         } else {
           var speech = "Sorry, this item is not available at this location"
         }

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
