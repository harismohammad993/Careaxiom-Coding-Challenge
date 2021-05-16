
const express = require('express');
const cheerio = require('cheerio');
var url = require('url');
var async = require("async");
const fetch = require("node-fetch");

const app = express();
const PORT = 8000;

app.listen(PORT, () => console.log('Express ASYNC server currently running on port ' + PORT));

app.get('/I/want/title', (request, response) => 
{
    // parse provided addresses
    const query_strings = url.parse(request.url, true).query;
    var addresses = query_strings.address;
    var addresses_array = [];

    // if no address found then return error message
    if(!addresses) {
        response.send("No address found");
        return;
    }

    // populate addresses_array with adresses
    if(Array.isArray(addresses)) {
        addresses_array = addresses;
    }
    else {
        addresses_array.push(addresses);
    }

    // concate required html
    let result = "<!DOCTYPE html>\n<html>\n";
    result = result + "<head></head>\n";
    result = result + "<body>\n\n\t";
    result = result + "<h1> Following are the titles of given websites: </h1>\n\n\t";
    result = result + "<ul>\n";

    // urls will contain valid URLS
    let urls = makeURLs(addresses_array);
    let collected_response = 0;

    // iterate through every url in urls
    for(var count = 0; count < urls.length; count++)
    {
        let original_address = addresses_array[count];
        let temp_array = [];
        temp_array.push(urls[count]);

        async.mapLimit(temp_array, 1, 
            // async function will return an error or response.text()
            async function(url) 
            {
                const response = await fetch(url);
                return response.text();
            }, (err, response_text) => 
            {
                result = result + "\t<li> ";

                if (err) {
                    console.log(err);
                    result = result + original_address + " - NO RESPONSE";
                    collected_response++;
                }
                else {
                    // extract title from response_text
                    const $ = cheerio.load(response_text.toString());
                    const webpageTitle = "\"" + $("title").text() + "\"";

                    // concate given address and the title in html
                    result = result + original_address + " - " + webpageTitle;
                    collected_response++;
                    
                    console.log(webpageTitle);
                }

                result = result + " </li>\n";

                // if all urls have been serached concate closing tags and send response
                if(collected_response == urls.length) {
                    result = result + "\t</ul>\n";
                    result = result + "</body>\n";
                    result = result + "</html>";

                    response.send(result);
                }
            }
        );
    }
});

// for all other routes return 404 error
app.all('*', function(req, response){
    response.sendStatus(404);
});

function makeURLs(addresses)
{
    let urls = [];
    for(var count = 0; count < addresses.length; count++)
    {
        let address = addresses[count];
        // make address a valid URL
        if(!address.includes('https:') && !address.includes('http:')) {
            address = 'https://' + address;
        }
        let myURL = new URL(address);
        urls.push(myURL);
    }
    return urls;
}