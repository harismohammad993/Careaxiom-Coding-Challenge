
const express = require('express');
const cheerio = require('cheerio');
var https = require('https');
var url = require('url');

const app = express();
const PORT = 8000;

app.listen(PORT, () => console.log('Express Callback simple server is currently running on port ' + PORT));

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

    let answer = [];
    let count = addresses_array.length;

    // iterate through every address in address_array
    for(var counter = 0; counter < count; counter++)
    {
        let address = addresses_array[counter];
        
        // options will contain host, path, method and port information
        const options = getOptions(address);

        // make https request
        const req = https.get(options, (res) => {
            let chunks_of_data = [];

            // when 'data' found push it into chunks_of_data array
            res.on('data', (fragments) => {
                chunks_of_data.push(fragments);
            });

            // when request ends
            res.on('end', () => {
                // convert gathered data into string
                let response_body = Buffer.concat(chunks_of_data);
                response_body = response_body.toString();

                // extract title from response_body
                const $ = cheerio.load(response_body);
                const webpageTitle = $("title").text();
                
                // push provided address and extracted title into answer array
                answer.push(address + " - \"" + webpageTitle + "\"");
                console.log("\n" + webpageTitle);

                // when all answer are pushed into answer array
                if(answer.length == count) {
                    // result will contain response titles in required html form
                    let result = createResult(answer);
                    response.send(result); 
                }
            });

            // if there is an error in response 
            res.on('error', (error) => {
                console.log(error);
                answer.push(address + " - NO RESPONSE");
                // when all answer are pushed into answer array
                if(answer.length == count) {
                    // result will contain response titles in required html form
                    let result = createResult(answer);
                    response.send(result); 
                }
            });
        });

        // if request fails 
        req.on('error', (error) => {
            console.log(error);
            answer.push(address + " - NO RESPONSE");
            // when all answer are pushed into answer array
            if(answer.length == count) {
                // result will contain response titles in required html form
                let result = createResult(answer);
                response.send(result); 
            }
        });

        // end the request
        req.end();
    }
});

// for all other routes return 404 error
app.all('*', function(req, response){
    response.sendStatus(404);
});

function getOptions(address)
{
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
    return options;
}

function createResult(answers)
{
    // concate required html
    let result = "<!DOCTYPE html>\n<html>\n";
    result = result + "<head></head>\n";
    result = result + "<body>\n\n\t";
    result = result + "<h1> Following are the titles of given websites: </h1>\n\n\t";
    result = result + "<ul>\n";

    // add given address and the title extracted from reponse in html
    for(var i = 0; i < answers.length; i++)
    {
        result = result + "\t<li> ";
        result = result + answers[i];
        result = result + " </li>\n";
    }
    
    // concate closing tags
    result = result + "\t</ul>\n";
    result = result + "</body>\n";
    result = result + "</html>";
    return result;
}