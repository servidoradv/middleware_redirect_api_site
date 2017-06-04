var express = require('express');
var request = require('request');
var querystring = require('querystring');
var friendlyUrl = require('friendly-url');
var http = require('http'),
httpProxy = require('http-proxy');

var conf = {
  urlApi: 'http://api.sharepoint.servidor.adv.br/api/'
};

const proxiedWebsite = `http://${process.env.PROXIED_WEBSITE}`
var proxy = httpProxy.createProxyServer({});

console.log("STARTING Middleware...");
var server = http.createServer((req, res) => {

  console.log('Redirect Middleware activated.');
  var slashesParamArray = req.url.split('/');

  if (req.url.indexOf('na_midia') != -1 || req.url.indexOf('noticias') != -1) { //url do site antigo
    try {
      var id = slashesParamArray[slashesParamArray.length - 1];
      var type = slashesParamArray[slashesParamArray.length - 3];
      console.log(`id do conteudo ${id}`);
      var isNotValidId = isNaN(id) || (id <= 0);
      var isNotValidType = !type;
      if (isNotValidId || isNotValidType) {
        console.log("Proxying to ", proxiedWebsite);
        return proxy.web(req, res, { target: proxiedWebsite });
      } else {
        var typeApi = type;
        if (typeApi == "na_midia") {
          typeApi = "na-midia";
        }

        var getNewUrlService = conf.urlApi + 'public/v1/' + typeApi + '/url-composition/' + id;
        console.log(getNewUrlService);
        request(getNewUrlService, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var urlComposition = JSON.parse(body);
            if (urlComposition == null) {
              if (req.url.indexOf('/noticias/') != -1) {
                console.log('WWW1: ' + req.url.replace('www.', 'www1.'));
                res.writeHead(302, { 'Location': req.url.replace('www.', 'www1.') });
                return res.end();
              }else{
                res.writeHead(404)
                return res.end();
              }
            }
            console.log('urlComp: ' + urlComposition.tipo);
            if (urlComposition) {
              var title = friendlyUrl(urlComposition.titulo.trim());

              tipoOriginal = urlComposition.tipo;
              tipoOriginal = tipoOriginal == "na_midia" ? "na-midia" : tipoOriginal
              tipoOriginal = tipoOriginal == "noticias" ? "clippings" : tipoOriginal
              var newUrl = 'http://www2.servidor.adv.br/' + (tipoOriginal || type) + '/' + title + '/' + urlComposition.id;

              if (newUrl && newUrl.length > 0) {
                console.log('NOVO: ' + newUrl);
                res.writeHead(302, { 'Location': newUrl });
                res.end();
              } else {
                return proxy.web(req, res, { target: proxiedWebsite });
              }
            } else {
              return proxy.web(req, res, { target: proxiedWebsite });
            }

          } else if (req.url.indexOf('/noticias/') != -1) {
            const www1URL = 'http://www1.servidor.adv.br/' + req.url
            console.log('WWW1: ' + www1URL);
            res.writeHead(302, { 'Location': www1URL });
            return res.end();
          } else {
            console.error(error);
            console.log(`houve um erro ao executar a requisição. status=${response.statusCode}`);
            return proxy.web(req, res, { target: proxiedWebsite });
          }
        });
      }
    }catch(e){
      console.log("ERROOO", e);
    }
  }else{ //continue to the site
    return proxy.web(req, res, { target: proxiedWebsite });
  }

});
console.log("listening on port 8881")
server.listen(8881);

// app.use(function (req, res, next) {
//   console.log('Redirect Middleware activated.');
//   var slashesParamArray = req.url.split('/');
//   var isNotValidArray = !slashesParamArray;
//   if (isNotValidArray || req.url.indexOf('www2') != -1) {
//     letItGo(res, next);
//     return;
//   } else {
//     var id = slashesParamArray[slashesParamArray.length - 1];
//     var type = slashesParamArray[slashesParamArray.length - 3];
//     console.log(`id do conteudo ${id}`);
//     var isNotValidId = isNaN(id) || (id <= 0);
//     var isNotValidType = !type;
//     if (isNotValidId || isNotValidType) {
//       letItGo(res, next);
//       return;
//     } else {
//       var typeApi = type;
//       if (typeApi == "na_midia") {
//         typeApi = "na-midia";
//       }
//
//       var getNewUrlService = conf.urlApi + 'public/v1/' + typeApi + '/url-composition/' + id;
//       console.log(getNewUrlService);
//       request(getNewUrlService, function (error, response, body) {
//         if (!error && response.statusCode == 200) {
//           var urlComposition = JSON.parse(body);
//           console.log('urlComp: ' + urlComposition.tipo);
//           if (urlComposition) {
//             var title = friendlyUrl(urlComposition.titulo.trim());
//
//             tipoOriginal = urlComposition.tipo;
//             tipoOriginal = tipoOriginal == "na_midia" ? "na-midia" : tipoOriginal
//             tipoOriginal = tipoOriginal == "noticias" ? "clippings" : tipoOriginal
//             var newUrl = 'http://www2.servidor.adv.br/' + (tipoOriginal || type) + '/' + title + '/' + urlComposition.id;
//
//             if (newUrl && newUrl.length > 0) {
//               console.log('NOVO: ' + newUrl);
//               res.writeHead(302, { 'Location': newUrl });
//               res.end();
//               next();
//             } else {
//               letItGo(res, next);
//             }
//           } else {
//             letItGo(res, next);
//           }
//           return;
//         } else {
//           console.error(error);
//           console.log(`houve um erro ao executar a requisição. status=${response.statusCode}`);
//           letItGo(res, next);
//         }
//       });
//     }
//   }
// });

// function letItGo(res, next) {
//   res.end();
//   next();
// }
