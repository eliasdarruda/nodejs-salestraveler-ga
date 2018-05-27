var Genetic = require("./node_modules/genetic-js/lib/genetic");
var Rota = require('./Rota');
var mapa = require('./Mapa');
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

var Mapa = mapa();

app.get('/mapa', function (req, res) {
    res.header("Content-Type", "application/json");
    Mapa.gerarMapa(function(map) {
        res.send(JSON.stringify(map));
    });
});

app.post('/postos', function (req, res) {
    res.header("Content-Type", "application/json");
    var genConfig = {
        ignoreRatio: req.body.ignoreRatio,
        iterations: req.body.iterations,
        size: req.body.size,
        mutation: req.body.mutation
    };
    Mapa.gerarPostos(genConfig, function(postos) {
        res.send(JSON.stringify(postos));
    });
});

app.post('/caminho', function (req, res) {
    initGenetic(req.body.mapa, req.body.iterations, req.body.size, req.body.mutation, function(rotas) {
        res.header("Content-Type", "application/json");
        var rotaDist = tourDistance(rotas);

        console.log('Rota enviada - ' + rotaDist);
        res.send({ distancia: rotaDist, rotas: rotas });
    });
});

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

function tourDistance(ent) {
    var distanceTo = function(fromPosto, posto) {
        var xDistance = Math.abs(fromPosto.x - posto.x);
        var yDistance = Math.abs(fromPosto.y - posto.y);
        var distance = Math.sqrt( (xDistance*xDistance) + (yDistance*yDistance) );
        
        return distance;
    }

    var tourDistance = 0;
    // Loop through our this.rota's cities
    for ( var cityIndex=0; cityIndex < ent.length; cityIndex++) {
        // Get city we're travelling from
        var fromPosto = ent[cityIndex];
        //  we're travelling to destinationPosto;
        var destinationPosto;
        // Check we're not on our this.rota's last city, if we are set our 
        // this.rota's final destination city to our starting city
        if(cityIndex+1 < ent.length){
            destinationPosto = ent[cityIndex + 1];
        }
        else{
            destinationPosto = ent[0];
        }
        // Get the distance between the two cities
        tourDistance += distanceTo(fromPosto, destinationPosto);
    }
    return tourDistance;
};

function initGenetic(mapa, iterations, size, mutation, callback) {
    var genetic = Genetic.create();
    var rota = new Rota(mapa).rota;
    rota.maxSize = rota.length;

    var config = {
        iterations: parseInt(iterations),
        size: parseInt(size),
        mutation: parseFloat(mutation),
        skip: parseInt(parseInt(iterations)/5)
    };

    genetic.optimize = Genetic.Optimize.Minimize;
    genetic.select1 = Genetic.Select1.Fittest;
    genetic.select2 = Genetic.Select2.Tournament2;

    var seedAndMutateFunc = function(ent) {
        var shuffle = function(array) {
            var currentIndex = array.length, temporaryValue, randomIndex;
          
            // While there remain elements to shuffle...
            while (0 !== currentIndex) {
          
              // Pick a remaining element...
              randomIndex = Math.floor(Math.random() * currentIndex);
              currentIndex -= 1;
          
              // And swap it with the current element.
              temporaryValue = array[currentIndex];
              array[currentIndex] = array[randomIndex];
              array[randomIndex] = temporaryValue;
            }
            return array;
        }

        if (ent) {
            return shuffle(ent);
        }

        var list = [];
        for (var i = 0; i < this.userData.maxSize; i++)
            list.push(this.userData[i]);

        return shuffle(list);
    }

    genetic.seed = seedAndMutateFunc;
    genetic.mutate = seedAndMutateFunc;
    genetic.fitness = tourDistance;

    genetic.notification = function (pop, generation, stats, isFinished) {
        console.log('GERACAO: ' + generation + '----' + stats);
        if (isFinished) {
            var route;
            for (var i = 0; i < pop.length; i++) {
                if (pop[i].fitness == stats.maximum) {
                    route = pop[i].entity;
                    break;
                }
            }
            callback(route);
        }
    };

    genetic.evolve(config, rota);
}
