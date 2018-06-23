var fs = require('fs');
var Genetic = require("./node_modules/genetic-js/lib/genetic");

const WIDTH = 500;

function tourDistance(ent) {
    var distanceTo = function(p1, p2) {
        var xDistance = Math.abs(p1.x - p2.x);
        var yDistance = Math.abs(p1.y - p2.y);
        var distance = Math.sqrt( (xDistance*xDistance) + (yDistance*yDistance) );
        
        return distance;
    }
    if (!this.getCoord) {
        this.getCoord = function(index) {
            var width = WIDTH || this.userData.coords[0];

            var x = index % width;
            var y = (index - x) / width;

            return {
                x: x,
                y: y
            };
        }
    }

    var tourDistance = 0;
    // Loop through our this.rota's cities
    for ( var t=0; t < ent.rota.length; t++) {
        // Get city we're travelling from
        var fromPosto = ent.postos[ent.rota[t]];
        //  we're travelling to destinationPosto;
        var destinationPosto;
        // Check we're not on our this.rota's last city, if we are set our 
        // this.rota's final destination city to our starting city
        if(t+1 < ent.rota.length){
            destinationPosto = ent.postos[ent.rota[t + 1]];
        }
        else{
            destinationPosto = ent.postos[ent.rota[0]];
        }
        // Get the distance between the two cities
        tourDistance += distanceTo(this.getCoord(fromPosto), this.getCoord(destinationPosto));
    }
    return tourDistance;
};

function initGenetic(map, areaEmPx, genConfig, sucess) {
    var genetic = Genetic.create();

    var config = {
        iterations: genConfig.iterations,
        size: genConfig.size,
        mutation: genConfig.mutation,
        skip: genConfig.iterations / 5,
        webWorkers: true
    };

    genetic.optimize = Genetic.Optimize.Minimize;
    genetic.select1 = Genetic.Select1.Fittest;
    genetic.select2 = Genetic.Select2.Random;

    genetic.isCoordInsideMap = function(w, h) {
        return this.userData.map[w][h] == 1;
    }

    genetic.getRandomPosFromInsideMap = function() {
        var map = this.userData.map;
        var WIDTH = this.userData.coords[0];
        var HEIGHT = this.userData.coords[1];

        var w = 0;
        var h = 0;

        do {
            w = this.getRandomInt(0, WIDTH);
            h = this.getRandomInt(0, HEIGHT);
        } while (map[w][h] !== 1);

        return [w, h];
    }

    genetic.tourDistance = tourDistance;

    genetic.areaPreechida = function(area) {
        var areaTotal = 0;
        var WIDTH = this.userData.coords[0];
        var HEIGHT = this.userData.coords[1];

        for (var i = 0; i < WIDTH; i++) {
            for (var j = 0; j < HEIGHT; j++) {
                var n = area[this.getIndex(i, j)];
                if (isNaN(n)) break;
                areaTotal += n;
            }
        }
        
        return areaTotal;
    }

    genetic.getIndex = function(x, y) {
        return (x + y * this.userData.coords[0]);
    }

    genetic.getCoord = function(index) {
        var WIDTH = this.userData.coords[0];

        var x = index % WIDTH;
        var y = (index - x) / WIDTH;

        return {
            x: x,
            y: y
        };
    }

    genetic.reduceArea = function(area, index) {
        var a = area;

        var WIDTH = this.userData.coords[0];
        var HEIGHT = this.userData.coords[1];
        var RAD = 60;

        var circle = this.getCoord(index);

        for (var x = 0; x < WIDTH; x++) {
            for (var y = 0; y < HEIGHT; y++) {
                var dx = x - circle.x;
                var dy = y - circle.y;
                var distanceSquared = dx * dx + dy * dy;

                if (distanceSquared <= RAD*RAD && this.userData.map[x][y] === 1)
                {
                    a[this.getIndex(x, y)] = 1;
                }
            }
        }

        return a;
    }

    genetic.shuffle = function(array) {
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

    genetic.getRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    // GENETIC FUNCTIONS
    genetic.seed = function() {
        if (this.userData.ultimo) {
            return this.userData.ultimo;
        }

        var postos = [];

        for (var i = 0; i < this.userData.qtdPostos; i++) {
            var coords = this.getRandomPosFromInsideMap();
            postos.push(this.getIndex(coords[0], coords[1]));
        }

        var ordem = [];
        for (var i = 0; i < postos.length; i++) {
            ordem.push(i);
        }
        ordem = this.shuffle(ordem);

        return {
            postos: postos,
            rota: ordem
        }
    };

    genetic.fitness = function(ent) {
        var err = 0;

        var WIDTH = this.userData.coords[0];
        var HEIGHT = this.userData.coords[1];

        var buffer = new ArrayBuffer(WIDTH * HEIGHT);
        var areaPreenchidaOverlap = new Int8Array(buffer);
        
        for (var i = 0; i < ent.postos.length; i++) {
            areaPreenchidaOverlap = this.reduceArea(areaPreenchidaOverlap, ent.postos[i]);
        }
        var areaPreenchidaTotal = this.areaPreechida(areaPreenchidaOverlap);

        ent.areaTotalPreenchida = areaPreenchidaTotal;
        err += Math.abs((this.userData.area - areaPreenchidaTotal) * 4);
        err += this.tourDistance(ent) * 2;

        return err;
    };

    genetic.mutate = function(ent) {
        for (var i = 0; i < ent.postos.length / 6; i++) {
            var coords = this.getRandomPosFromInsideMap();
            ent.postos[this.getRandomInt(0, ent.postos.length)] = this.getIndex(coords[0], coords[1]);
        }
        ent.rota = this.shuffle(ent.rota);
        return ent;
    };

    genetic.notification = function (pop, generation, stats, isFinished) {
        console.log(pop[0].entity);
        console.log('-------------');
        console.log(stats);
        console.log('-------------');
        console.log(generation);

        if (isFinished) {
            console.log('Postos processados com sucesso!');
            sucess(pop);
        }
    };

    console.log('Iniciando genético para gerar os postos...');
    genetic.evolve(config, {
        map: map,
        coords: [500, 734],
        area: areaEmPx,
        qtdPostos: genConfig.qtdPostos || 35,
        ultimo: genConfig.ultimoResultado || null
    });
}

module.exports = function() {
    var returnObj = {};
    var that = this;
    this.map = [];
    this.postos = [];

    returnObj.gerarMapa = function(success) {
        fs.readFile('./mapa.dat', 'utf8', function(err, data) {
            var c = 0;
            var linha = [];
            var areapx = 0;
            data = data.split(' ').join('');
            for (var i = 0; i < data.length; i++) {
                linha[c] = parseInt(data[i], 10);
                c++;
                if (data[i] == '\n') {
                    that.map.push(linha);
                    linha = [];
                    c = 0;
                }
                if (data[i] == 1) {
                    areapx++;
                }
            }
            that.map.areaTotal = areapx;
            success(that.map);
        });
    };
    returnObj.gerar = function(genConfig, success) {      
        initGenetic(that.map, that.map.areaTotal, genConfig, function(postos) {
            var obj = {
                rota: postos[0].entity.rota,
                postos: postos[0].entity.postos,
                fitness: postos[0].fitness,
                distancia: tourDistance(postos[0].entity),
                areaPreenchida: postos[0].entity.areaTotalPreenchida
            };
            console.log(obj);
            success(obj);
        });
    }
    return returnObj;
}
