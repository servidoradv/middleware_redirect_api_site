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

const staticRedirectTable = [
  {
    origin: 'noticias.html',
    target: 'informes'
  },
  {
    origin: 'todas_noticias',
    target: 'informes'
  },
  {
    origin: 'interesses-clientes',
    target: 'areas-atuacao'
  },
  {
    origin: 'app',
    target: 'areas-atuacao'
  },
  {
    origin: 'perfis',
    target: 'areas-atuacao'
  },
  {
    origin: 'perfil-cliente',
    target: 'areas-atuacao'
  }
]

console.log("STARTING Middleware...");
var server = http.createServer((req, res) => {

  // console.log('Redirect Middleware activated... ' + req.url);
  var slashesParamArray = req.url.split('/');


  if (req.url.indexOf('na_midia') != -1 || req.url.indexOf('noticias') != -1) { //url do site antigo
    try {
      var id = slashesParamArray[slashesParamArray.length - 1];
      var type = slashesParamArray[slashesParamArray.length - 3];
      // console.log(`id do conteudo ${id}`);
      var isNotValidId = isNaN(id) || (id <= 0);
      var isNotValidType = !type;
      if (isNotValidId || isNotValidType) {
        const result = handleStaticRoute(req.url, res)
        if (result == null) {
          res.writeHead(404)
        }
        return res.end();
        // console.log("Proxying to ", proxiedWebsite);
        // return proxy.web(req, res, { target: proxiedWebsite });
      } else {
        var typeApi = type;
        if (typeApi == "na_midia") {
          typeApi = "na-midia";
        }

        var getNewUrlService = conf.urlApi + 'public/v1/' + typeApi + '/url-composition/' + id;
        request(getNewUrlService, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var urlComposition = JSON.parse(body);
            if (urlComposition == null) {
              if (req.url.indexOf('/noticias/') != -1) {
                const www1URL = 'http://www1.servidor.adv.br' + req.url
                res.writeHead(302, { 'Location': www1URL });
                return res.end();
              }else{
                const result = handleStaticRoute(req.url, res)
                if (result == null) {
                  res.writeHead(404)
                }
                return res.end();
              }
            }
            if (urlComposition) {
              var title = friendlyUrl(urlComposition.titulo.trim());

              tipoOriginal = urlComposition.tipo;
              tipoOriginal = tipoOriginal == "na_midia" ? "na-midia" : tipoOriginal
              tipoOriginal = tipoOriginal == "noticias" ? "clippings" : tipoOriginal
              var newUrl = 'http://www.servidor.adv.br/' + (tipoOriginal || type) + '/' + title + '/' + urlComposition.id;

              if (newUrl && newUrl.length > 0) {
                // console.log('NOVO: ' + newUrl);
                res.writeHead(302, { 'Location': newUrl });
                return res.end();
              } else {
                return proxy.web(req, res, { target: proxiedWebsite });
              }
            } else {
              return proxy.web(req, res, { target: proxiedWebsite });
            }

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
    const result = handleStaticRoute(req.url, res)
    if (result == null) {
      return proxy.web(req, res, { target: proxiedWebsite });
    }else{
      return res.end();
    }
  }

});

const handleStaticRoute = (url, res) => {

  if (url.indexOf('/boletim/') != -1) {
    res.writeHead(302, { 'Location': 'http://www1.servidor.adv.br' + url });
    return '/boletim/';
  }
  const urlTarget = staticRedirectTable.filter((el) => {
    return url.indexOf(el.origin) != -1
  })
  console.log(urlTarget);
  if (urlTarget.length > 0) {
    res.writeHead(301, { 'Location': '/' + urlTarget[0].target });
    return urlTarget;
  }else{
    return null
  }
}

console.log("listening on port 8881")
server.listen(8881);
