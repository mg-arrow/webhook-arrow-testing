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
        
          }).catch(function(err){
            console.warn(err);
          });

      break;

    //rich item details
    case "item.details.rich" :

       var search = bby.products('sku=' + req.body.result.parameters.sku);

        search.then(function (data) {

            var product = getItemInfo(data);

            var contextOut = [
                { 
                "name":"selected-product-info", 
                "lifespan":5, 
                "parameters":{}
                }
              ];

            if (product) {
              var productInfo = "Item " + product.name + " sold for $" + product.regularPrice + " by " + product.manufacturer;
              contextOut[0].parameters['sku'] = product.sku;
              contextOut[0].parameters['manufacturer'] = product.manufacturer;
              contextOut[0].parameters['category'] = product.categoryPath[product.categoryPath.length-1].id;
            } else {
              var productInfo = "No Product Informartion found for this item"
            }

            var richData = {
                display: 'card',
                img: product.thumbnailImage,
                title: product.name,
                text: product.shortDescription,
                button: 'View'
            };

            var speech = productInfo ? productInfo : "Seems like some problem. Speak again.";      
            sendRichResultsToFlow(res, speech, richData, contextOut);
        
          }).catch(function(err){
            console.warn(err);
          });

      break;


    //case real time availability
    case "item.details.availability" :

      var sku = req.body.result.parameters.sku;
      var zipcode = req.body.result.parameters.zipcode;

      bby.realTimeAvailability(sku, {postalCode: zipcode}, function (err, data) {

        if (err) console.error(err);

        console.log(data.stores);
        
         if(data.stores.length > 0) {
                                
            var speech = "Yes, this Item is avilable in " + data.stores.length + " stores in this area.";
            speech = speech + " You can try going to " + data.stores[0].name + " store at "  + data.stores[0].address + " in " +  data.stores[0].city;
         } else {
           var speech = "Sorry, this item is not available at this location"
         }

          sendResultsToFlow(res, speech);
             
      }).catch(function(err){
            console.warn(err);
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
        
          }).catch(function(err){
            console.warn(err);
          });

        break;

      //case checking if product has any warranty
      case "item.details.warrantycheck" :

       var sku = req.body.result.parameters.sku;

       bby.warranties(sku, function(err, data){
          if (err) 
            sendResultsToFlow(res, 'No warranty information found for this item');
          else {

            let warrantyText =  'The following warranties are available for this item: ' + getWarrantyText(data).join(',');
            
            sendResultsToFlow(res, warrantyText);
          }
       });

        break;


        //recommendations
        case "recommendations" :

        var contexts = req.body.result.contexts;

         let selectedProductInfo = contexts.find(o => o.name === 'selected-product-info');
         
        if (selectedProductInfo && selectedProductInfo != undefined) {
          //let selectedCategory = selectedProductInfo.parameters.category;           
          let selectedSku = selectedProductInfo.parameters.sku;
          var recommendations = bby.recommendations('alsoViewed', selectedSku);
        } else {
          var recommendations = bby.recommendations('mostViewed');
        }

        recommendations.then(function(data){

          var speech = 'Product Recommendations';

          if (data) {

            let finalData = data;
            finalData.display = 'carousel';

           sendRichResultsToFlow(res, speech, finalData);
          }

        }).catch(function(err){
            console.warn(err);
          });

          break; 
   }

 
 });

 
   //post results back to Flow
   function sendResultsToFlow(res, results, contextOut) {

     // return to caller
        return res.json({
          speech: results,
          displayText: results,
          source: "webhook-arrow-testing"
        });

   }
   
   //post rich results back to Flow
   function sendRichResultsToFlow(res, results,richData,contextOut) {

     return res.json ({
          speech: results,
          displayText: results,
          source: "webhook-arrow-testing",
          data: {
            richData: richData
          },
          contextOut: contextOut
        })
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

  //get warranty text
  function getWarrantyText(data) {
    return data.map(getWarrantyDetails);    
  }

  function getWarrantyDetails(item, index) {
    var warrantyText = [item.shortName,item.currentPrice].join(" for $");
    return warrantyText;
  }


restService.listen(process.env.PORT || 8000, function() {
  console.log("Server up and listening");
});
