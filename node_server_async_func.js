
const https = require('https');
var url = require('url');
const cheerio = require('cheerio');
const express = require('express');

const app = express();
const PORT = 8000;

app.listen(PORT, () => console.log('Express ASYNC function server currently running on port ' + PORT));

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

    // if no address found then return error message
    if(Array.isArray(addresses)) {
        addresses_array = addresses;
    }
    else {
        addresses_array.push(addresses);
    }
    
    // async function will execute code synchronously
    (async function () {
        // concate required html
        let result = "<!DOCTYPE html>\n<html>\n";
        result = result + "<head></head>\n";
        result = result + "<body>\n\n\t";
        result = result + "<h1> Following are the titles of given websites: </h1>\n\n\t";
        result = result + "<ul>\n";

        // response_title will contain an array of titles extracted from response
        let response_title = await makeSynchronousRequest(addresses_array, addresses_array.length);

        // concate given address and the title extracted from reponse in html
        for(var i = 0; i < addresses_array.length; i++)
        {
            result = result + "\t<li> ";
            result = result + addresses_array[i] + " - " + response_title[i];
            result = result + " </li>\n";
        }
        
        // concate closing tags
        result = result + "\t</ul>\n";
        result = result + "</body>\n";
        result = result + "</html>";

        response.send(result);
    })();
});

// for all other routes return 404 error
app.all('*', function(req, response){
    response.sendStatus(404);
});

// async function to make Synchronous https request
async function makeSynchronousRequest(addresses, count) 
{
    let answer = [];
    let myURL, address;

    // iterate through every address in addresses
    for(var counter = 0; counter < count; counter++)
    {
        address = addresses[counter];

        // make address a valid URL
        if(!address.includes('https:') && !address.includes('http:')) {
            address = 'http://' + address;
        }
        try {
            myURL = new URL(address);

            // make sure hostname should start with 'www.'
            let host_name = myURL.hostname;
            if(!host_name.includes('www.')) {
                host_name = 'www.' + host_name;
            }

            // http_promise will contain response from https request
            let http_promise = getPromise(host_name, myURL.pathname);
            // wait for getPromise() to return a resolve
            let response_body = await http_promise;

            // extract title from response_body
            const $ = cheerio.load(response_body);
            const webpageTitle = $("title").text();
            
            // push the title in answer array
            answer.push("\"" + webpageTitle + "\"");
            console.log(webpageTitle);
        }
        catch(error) {
            // error will be catched if Promise is rejected
            console.log(error);
            answer.push("NO RESPONSE");
        }
    }
    return answer;
}

// function returns a Promise
function getPromise(hostname, pathname) 
{
	return new Promise((resolve, reject) => {
        // options will contain host, port, path and method information
        const options = {
            host: hostname,
            port: 443,
            path: pathname + "/",
            method: 'GET'
        };

        // make https request
        const request = https.request(options, (response) => {
            let chunks_of_data = [];

            // when 'data' found push it into chunks_of_data array
            response.on('data', (fragments) => {
                chunks_of_data.push(fragments);
            });

            // when request ends
            response.on('end', () => {
                let response_body = Buffer.concat(chunks_of_data);
                
                // return response_body in string format as a resolve
                resolve(response_body.toString());
            });

            // if there is an error in response 
            response.on('error', (error) => {
                // return error as a reject
                reject(error);
            });
        });

        // if request fails 
        request.on('error', (error) => {
            // return error as a reject
            reject(error);
        });

        // end the request
        request.end();
	});
}