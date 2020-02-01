var google = require("google");
var axios = require("axios");
const htmlToJson = require("html-to-json");
var request = require('request');
var cheerio = require('cheerio');

google.resultsPerPage = 1;

let self = this;

const search = function (query, language) {
  return new Promise((resolve, reject) => {
    let searchString = `${query} in ${language} site:stackoverflow.com`;

    google(searchString, (err, res) => {
        if (err) {
          reject({reason: 'A search error has occured :('})
        }
        else {
          axios.get(res.url).then((response) => {
              var promise = htmlToJson.parse(response.data,{
                'link': function ($doc) {
                    return $doc.find('div.kCrYT a').attr('href');
                  }
              }, function (err, result){
              });

              promise.done(function(result){
                var properResult = Object.assign(result);
                resolve(properResult.link.replace('\/url?q=',''));
              });
          });
        }
    });
  });
}

const scrape = function (html) {
    $ = cheerio.load(html)
    return $('div.accepted-answer pre code').text()
}

const download = function (url) {
    return new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          resolve(body)
        } else {
          reject({
            reason: 'Unable to download page'
          })
        }
      })
    })
  }

const args = process.argv;

let query = args[2].replace('\'','');
let language="java";  //default language is java, if  language argument is not provided

if (typeof args[3]!=="undefined") {
language = args[3].replace('\'','');
}

search(query,language).then((url) => {
   download(url).then((html) => {
        let answer = scrape(html)
        if (answer === '') {
          console.log('No answer found :(');
        } else {
          console.log("\n" + "Code: " + "\n");
          console.log(answer);
        }
      }).catch((error) => {
          console.log(error);
      })
});
