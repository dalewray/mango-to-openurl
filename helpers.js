const http = require('follow-redirects').http;
const https = require('https');
const cheerio = require('cheerio');

exports.makeRequest = async function (url) {
    return new Promise((resolve, reject) => {
      let body = '';
      if (url.includes('https')) {
        const req = https.request(new URL(url), res => {
          res.on('data', function (chunk) {
            body += chunk;
          });
  
          res.on('end', () => {
            resolve(body);
          });
        });
        req.on('error', error => {
          reject(error);
          console.error(error);
        })
  
        req.end();
      } else {
        const req = http.request(new URL(url), res => {
          res.on('data', function (chunk) {
            body += chunk;
          });
  
          res.on('end', () => {
            resolve(body);
          });
          req.on('error', error => {
            console.error(error);
          })
        });
        req.end();
  
      }
  
    })
  };
  
exports.mangoISBN = async (mangoUrl) => {
  let data = await exports.makeRequest(mangoUrl);
  let data2 = {};
  let $ = cheerio.load(data);
  // mango uses improper forwarding, need to pull out the new url and retrieve
  let forward = $("meta").attr("content") || ''
  let url = forward.substring('0; URL'.length + 1);
  if (url) {
    data2 = await exports.makeRequest(url);
  } else {
    data2 = data; // attempt to recover if mango returns a good forward
  }
  $ = cheerio.load(data2);

  let isbn = $('#ISBN').first().text();
  return isbn;
};

exports.replaceUrl = (isbn, title, newStemUrl, openUrlVid) =>  {
  const openUrlFormat = {
    "&ctx_ver=": "Z39.88-2004",
    "&rft.genre=": "book",
    "&ctx_enc=": "info:ofi%2Fenc:UTF-8",
    "&url_ver=": "Z39.88-2004",
    "&url_ctx_fmt=": "infofi%2Ffmt:kev:mtx:ctx",
    "&rft.isbn=": ""
  };

  openUrlFormat["&vid="] = openUrlVid;
  if (isbn) {
    openUrlFormat["&rft.isbn="] = isbn;
  } else {
    openUrlFormat["&rft.btitle="] = encodeURI(title);
  }

  let newOpenFormatUrl = newStemUrl;

  for (const [key, value] of Object.entries(openUrlFormat)) {
    newOpenFormatUrl = newOpenFormatUrl + key + value
  }

  return newOpenFormatUrl;
};