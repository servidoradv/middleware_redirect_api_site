var express = require('express');
var request = require('request');
var querystring = require('querystring');
var friendlyUrl = require('friendly-url');
var app = express();

var conf = {
  urlApi: 'http://api.sharepoint.servidor.adv.br/api/'
};

app.use(function (req, res, next) {
  console.log('Redirect Middleware activated.');
  var slashesParamArray = req.url.split('/');
  var isNotValidArray = !slashesParamArray;
  if (isNotValidArray || req.url.indexOf('www2') != -1) {
    letItGo(res, next);
    return;
  } else {
    var id = slashesParamArray[slashesParamArray.length - 1];
    var type = slashesParamArray[slashesParamArray.length - 3];
    console.log(`id do conteudo ${id}`);
    var isNotValidId = isNaN(id) || (id <= 0);
    var isNotValidType = !type;
    if (isNotValidId || isNotValidType) {
      letItGo(res, next);
      return;
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
              next();
            } else {
              letItGo(res, next);
            }
          } else {
            letItGo(res, next);
          }
          return;
        } else {
          console.error(error);
          console.log(`houve um erro ao executar a requisição. status=${response.statusCode}`);
          letItGo(res, next);
        }
      });
    }
  }
});

function letItGo(res, next) {
  res.end();
  next();
}

app.listen(8084);
