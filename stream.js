const fs = require('fs')
const path = require('path');
const csv = require('csv');

const config = require('./config.json');
const helpers = require('./helpers');
const argv = require('minimist')(process.argv);

const 
  short = argv.short || config.short || false,
  rateLimit = argv.rateLimit || config.rateLimit,
  oldStemUrl = argv.oldStemUrl || config.oldStemUrl,
  newStemUrl = argv.newStemUrl || config.newStemUrl,
  openUrlVid = argv.openUrlVid || config.openUrlVid,
  inputFileName = argv.inputFileName || config.inputFileName,
  outputFileName = argv.outputFileName || config.outputFileName

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
if (short) parseParams.to_line = 3;
const parser = csv.parse(parseParams);
parser.on('error', function(err){
  console.error('CSV parse error: ', err.message);
});

const transformer = csv.transform(async (row, cb) => {
  // limit rate so we don't get rejects or banned
  parser.pause();
  setTimeout(() => {parser.resume()}, rateLimit);

  let mangoTitle = row.Name;
  let mangoUrl, isbn = '';

  if (row.URL.includes(oldStemUrl)) { mangoUrl = row.URL; }
  if (mangoUrl) isbn = helpers.mangoISBN(mangoUrl);

  let openUrl = helpers.replaceUrl(isbn, mangoTitle, newStemUrl, openUrlVid);

  if (isbn ) {
    row.URL = openUrl; 
    console.log(`Changed ${row.ID} URL to: `, openUrl);
  } else {
    row.SuggestedUrl = openUrl;
    console.log('Attempting new open url based on title');
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