
const fs = require('fs');
const https = require('https');
const path = require('path');

const cheerio = require('cheerio');
const csv = require('csv');
const http = require('follow-redirects').http;
const config = require('./config.json');
const { parse } = require('path');

const 
  test = process.argv[8] || config.test || false,
  rateLimit = process.argv[7] || config.rateLimit,
  oldStemUrl = process.argv[2] || config.oldStemUrl,
  newStemUrl = process.argv[3] || config.newStemUrl,
  openUrlVid = process.argv[4] || config.openUrlVid,
  inputFileName = process.argv[5] || config.inputFileName,
  outputFileName = process.argv[6] || config.outputFileName, 

const readFile = path.join(__dirname, inputFileName);
const writeFile = path.join(__dirname, outputFileName);

const fileContent = fs.createReadStream(readFile);
fileContent.on('error', function(){  
  console.log('No input file found, check config.json:inputFileName');
});

const writeStream = fs.createWriteStream(writeFile);
writeStream.on('error', function(){  
  console.log('Cannot write to output file, check config.json:outputFileName');
});

let parseParams = {columns: true, bom: true};
if (test) parseParams.to_line = 10;
const parser = csv.parse(parseParams);

parser.on('error', function(err){
  console.error('CSV parse error: ', err.message);
})

const transformer = csv.transform(async (row, cb) => {
  // limit rate so we don't get rejects or banned
  parser.pause();
  setTimeout(() => {parser.resume()}, rateLimit);

  let mangoUrl = row.URL;
  let mangoTitle = row.Name;
  let isbn = '';
  
  if ((mangoUrl && mangoUrl.includes(oldStemUrl))) {
    data = await makeRequest(mangoUrl);
    let data2 = {};
    let $ = await cheerio.load(data);
    // mango uses improper forwarding, need to pull out the new url and retrieve
    let forward = $("meta").attr("content").substring('0; URL'.length + 1);
    if (forward) {
      data2 = await makeRequest(forward);
    } else {
      data2 = data; // attempt to recover if mango returned a good forward
    }
    $ = await cheerio.load(data2);
    isbn = $('#ISBN').text();
  }

  let openFormatUrl = openUrlFormat;
  openFormatUrl["&rft.btitle="] = encodeURI(mangoTitle);
  if (isbn) openFormatUrl["&rft.isbn="] = isbn;

  let newOpenFormatUrl = newStemUrl;
  
  if (mangoUrl === '' || mangoUrl.includes(oldStemUrl)) {
    for (const [key, value] of Object.entries(openFormatUrl)) {
      newOpenFormatUrl = newOpenFormatUrl + key + value
    }
    console.log(`Changed ${row.ID} URL to: `, newOpenFormatUrl);
  } else {
    newOpenFormatUrl = mangoUrl;
    console.log('Did not change URL for record ', row.ID);
  }

  if (!mangoUrl) {
    row.SuggestedUrl = newOpenFormatUrl;
    console.log('Attempting new open url based on title');
  } else {
    row.URL = newOpenFormatUrl;
    row.SuggestedUrl = '';
  }

  cb(null, row);
});

transformer.on('error', function(err){
  console.error('CSV transform error: ', err.message);
});

const stringify = csv.stringify({ header: true });
stringify.on('error', function(err){
  console.error('CSV convert error: ', err.message);
});

fileContent.pipe(parser).pipe(transformer).pipe(stringify).pipe(writeStream);

const openUrlFormat = {
  "&vid=": openUrlVid,
  "&ctx_ver=": "Z39.88-2004",
  "&rft.genre=": "book",
  "&ctx_enc=": "info:ofi%2Fenc:UTF-8",
  "&url_ver=": "Z39.88-2004",
  "&url_ctx_fmt=": "infofi%2Ffmt:kev:mtx:ctx",
  "&rft.isbn=": ""
};


const makeRequest = async function (url) {
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
}
