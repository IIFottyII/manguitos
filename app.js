var fs = require('fs');
var mqtt = require('mqtt');
var path = require('path');
var https = require('https');
var assert = require('assert');
var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;

(async function() {
	var PORT = process.env.PORT || 8080;

	var app = express();
	app.use(bodyParser.json());
	app.use(express.static("pagina"));
	app.use(bodyParser.urlencoded({ extended: true }));

	// Conexion mongo
	var uri = "mongodb+srv://Roberto:Robert060500@$@cluster0.vradk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
	var client = MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
	await client.connect();
	var collection = client.db('MangoProject').collection('Humedad');

	// Rutas
	app.get('/', function(request, response) {
  		response.sendFile('index.html');
	});
	app.get('/obtenerHumedad', (request, response) => {
		collection.find({}).toArray((err, docs) => {
			assert.equal(null, err);
			response.status(200).json(docs);
		});
	});

	var ultimoDato = 0;

	// Conexion mqtt
	var client = mqtt.connect('mqtt://broker.emqx.io', { clientId: "Servidor1" });
	client.on('message', (topic, message, packet) => {
		var humedad = JSON.parse(message).humedad;
		if (ultimoDato !== humedad) {
			ultimoDato = humedad;
			collection.insertOne(JSON.parse(message), (err, r) => {
				assert.equal(null, err);
			});
		}
	});

	client.on("error", (error) => {console.log(error);});
	client.on("connect", () => { });
	client.subscribe("MangoProject", { qos:1 });

	app.listen(PORT, function () {
	  console.log(`Listening on port ${PORT}!`)
	})
})();