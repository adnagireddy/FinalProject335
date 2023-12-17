/* Constants */
const http = require('http');
const express = require("express");
const fetch = require('node-fetch');
const app = express();
const portNumber = 4066;
const httpSuccessStatus = 200;
const path = require("path");
const bodyParser = require("body-parser");
app.listen(portNumber);
app.set("views", path.resolve(__dirname, "templates"));
app.use(express.static(__dirname + '/images'));
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended:false}));
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config({ path: path.resolve(__dirname, 'vars.env') })  
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = {db: "eCardDB", collection:"cards"};
const client = new MongoClient(uri, {serverApi: ServerApiVersion.v1 });


/* API Key */
const apiKey = 'PlebImY69Q3EZFqDNrlVQNspn4390Gei';
const urlAndApi = `https://api.giphy.com/v1/gifs/random?api_key=${apiKey}&tag=&rating=g`;

console.log(`web server starting at http://localhost:${portNumber}`)

/* MONGO DB METHODS */
let cardName = "";

/* insertCard(): adds a new card to the database with all form details */
async function insertCard(client, databaseAndCollection, data) {
  try{
    await client.connect(); 
    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(data);
  } catch(e){
    console.error(e);
  } finally{
    await client.close();

  }
 
}

/* lookUpCard(): User provides card name to retrieve the card from the database. 
                 Returns a map of all card info */
async function lookUpCard(client, databaseAndCollection, name) {
  try{
    await client.connect(); 
    let filter = {title: name};
    const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);
    console.log(`looked up and found: ${result}`);
    return result; 
  } catch(e){
    console.error(e);
  } finally {
    await client.close();
  }
}

/* generateCard(): populates the div on cardDisplay page with value returned by lookUpCard */
function generateCard(cardInfo) {

  //assume cardInfo is a map 
  let content =" ";

  content += `<p>Dear,<br>${cardInfo.to}</p><br>`;
  content += `<p>${cardInfo.message}</p><br>`;
  content += `<p>${cardInfo.signoff}, <br>${cardInfo.from}</p><br><br>`;

  return content; 

}

/* randomGenerateImage(): uses giphy API to populate random image onto the card */
async function randomGenerateImage(){
  //API USE
  try {

    let resp = await fetch(urlAndApi);
    let json = await resp.json();
    let img = `<img src="${json.data.images.original.url}" alt="photo did not load" width="400" height ="350">`;
    return img;
  } catch (e) {

    console.error(e);
  }
}

/* ROUTING ENDPOINTS */

/* ENDPOINT #0: link css with .ejs files */
app.use(express.static(__dirname + '/public'));

/* ENDPOINT #1: Render Home */
app.get("/", (request, response) => { response.render("mainhome");}); 

/* ENDPOINT #2: Home → Form */
app.get("/form.ejs", (request, response) => { response.render("form");}); 

/* ENDPOINT #3: Submit Form to MongoDB */
app.post("/form.ejs", async function (request, response) { 
  const variables = {title: request.body.title, to: request.body.to, from: request.body.from, message: request.body.message, signoff: request.body.signoff};
  console.log(`sup: ${variables}`);
  await insertCard(client, databaseAndCollection, variables)
  response.redirect("/enterCardName.ejs");
}); 

app.get("/enterCardName.ejs", (request, response) => {
  response.render("enterCardName");
});

/* ENDPOINT #4: Render enterCardName Page*/
app.post("/enterCardName.ejs", (request, response) => { 
  cardName = request.body.message2;
  response.redirect("/cardsplay.ejs");
});

/* ENDPOINT #5: Redirect and Render enterCardName */
/*
app.post("/submit", (request, response) => {
  response.redirect("/enterCardName.ejs");
});
*/

/* ENDPOINT #6: Redirect and Render cardsplay */
app.get("/cardsplay.ejs", async function (request, response) { 
  let result = await lookUpCard(client, databaseAndCollection, cardName);
  let img = await randomGenerateImage();
  let card = generateCard(result);  
  const variables = {eCard: card, apiImage: img};
  response.render("cardsplay", variables); 
}); 


/* RENDERING CARD */

/* ENDPOINT #7: Sending Form Response to Database */

/* ENDPOINT #8: render the generated eCard on page */


