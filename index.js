var Genetic = require("./node_modules/genetic-js/lib/genetic");
var mapa = require('./Genetico');
var express = require('express');
var bodyParser = require('body-parser');

// Configurações
var app = express();
var server = app.listen(3000, function () {
    console.log('App listening on port 3000!');
});

app.use(express.static(__dirname + '/View'));
app.use(express.static(__dirname + '/Script'));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:1000000}));

var Genetico = mapa();

app.get('/mapa', function (req, res) {
    res.header("Content-Type", "application/json");
    Genetico.gerarMapa(function(map) {
        res.send(JSON.stringify(map));
    });
});

app.post('/genetic', function (req, res) {
    res.header("Content-Type", "application/json");
    var genConfig = {
        ignoreRatio: req.body.ignoreRatio,
        iterations: req.body.iterations,
        size: req.body.size,
        mutation: req.body.mutation,
        qtdPostos: req.body.qtdPostos,
        ultimoResultado: req.body.ultimo
    };
    Genetico.gerar(genConfig, function(r) {
        res.send(JSON.stringify(r));
    });
});

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});


