
var RSVP = require('rsvp');
const https = require('https');
var url = require('url');
const cheerio = require('cheerio');
const express = require('express');

const app = express();
const PORT = 8000;

app.listen(PORT, () => console.log('Express RSVP server currently running on port ' + PORT));

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
    
    // create a promise to do https request on every address
    var promise = new RSVP.Promise(function(fulfill, reject)
    {
        let answer = [];
        let count = addresses_array.length;

        // iterate through every address in address_array
        for(var counter = 0; counter < count; counter++)
        {
            let original_address = addresses_array[counter];
            let address = addresses_array[counter];
            
            // make address a valid URL
            if(!address.includes('https:') && !address.includes('http:')) {
                address = 'http://' + address;
            }
            let myURL = new URL(address);

            // make sure hostname should start with 'www.'
            let host_name = myURL.hostname;
            if(!host_name.includes('www.')) {
                host_name = 'www.' + host_name;
            }

            // options will contain host, port, path and method information
            const options = {
                host: host_name,
                port: 443,
                path: myURL.pathname + "/",
                method: 'GET'
            };

            // make https request
            const request = https.get(options, (response) => {
                let chunks_of_data = [];

                // when 'data' found push it into chunks_of_data array
                response.on('data', (fragments) => {
                    chunks_of_data.push(fragments);
                });

                // when request ends
                response.on('end', () => {
                    // convert gathered data into string
                    let response_body = Buffer.concat(chunks_of_data);
                    response_body = response_body.toString();

                    // extract title from response_body
                    const $ = cheerio.load(response_body);
                    const webpageTitle = $("title").text();

                    // push provided address and extracted title into answer array
                    answer.push(original_address + " - \"" + webpageTitle + "\"");
                    console.log(webpageTitle);

                    // when all answer are pushed into answer array return fulfill with answer
                    if(answer.length == count) {
                        fulfill(answer);
                    }
                });

                // if there is an error in response
                response.on('error', (error) => {
                    console.log(error);
                    answer.push(original_address + " - NO RESPONSE");
                    // when all answer are pushed into answer array return fulfill with answer
                    if(answer.length == count) {
                        fulfill(answer);
                    }
                });
            });

            // if request fails 
            request.on('error', (error) => {
                console.log(error);
                answer.push(original_address + " - NO RESPONSE");
                // when all answer are pushed into answer array return fulfill with answer
                if(answer.length == count) {
                    fulfill(answer);
                }
            });

            // end the request
            request.end();
        }
    });
    
    // when promise ends these functions will be executed
    promise.then( 
    
    // when promise fulfilled this function will be executed
    function(response_title) 
    {
        // concate required html
        let result = "<!DOCTYPE html>\n<html>\n";
        result = result + "<head></head>\n";
        result = result + "<body>\n\n\t";
        result = result + "<h1> Following are the titles of given websites: </h1>\n\n\t";
        result = result + "<ul>\n";

        // concate response_title in html
        for(var i = 0; i < addresses_array.length; i++)
        {
            result = result + "\t<li> ";
            result = result + response_title[i];
            result = result + " </li>\n";
        }
        
        // concate closing tags
        result = result + "\t</ul>\n";
        result = result + "</body>\n";
        result = result + "</html>";

        response.send(result); 
    }, 
    // when promise rejected this function will be executed
    function(response_title) 
    {
        console.log(response_title);
    });
});

// for all other routes return 404 error
app.all('*', function(req, response){
    response.sendStatus(404);
});