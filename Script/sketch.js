var map, postos, rota, areaTotal = 0;
var GA = JSON.parse(localStorage.getItem("GAMAPAFIT"));

// canvas size
const WIDTH = 500;
const HEIGHT = 734;
const RAD = 60;

function setCarregando(loading) {
    if (loading) {
        $("#loading").show();
    } else {
        $("#loading").hide();
    }
}

function resetMapCanvas() {
    createCanvas(WIDTH, HEIGHT);
    background("#ccc");
    drawMap(map);
    drawPostos(GA.postos);
    drawRota(GA);
}

function Circle(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;

    this.show = function () {
        fill(255, 255, 255, 0);
        stroke('#666');
        ellipse(x, y, radius * 2, radius * 2);
        stroke('red');
        rect(x, y, 1, 1);
    }
}

function drawMap(map) {
    stroke('gray');
    areaTotal = 0;
    for (var i = 0; i < WIDTH; i++) {
        for (var j = 0; j < HEIGHT; j++) {
            if (map[i] != undefined && map[i][j] === 1) {
                rect(i, j, 1, 1);
                areaTotal++;
            }
        }
    }
}
function getCoord(index) {
    var x = index % WIDTH;
    var y = (index - x) / WIDTH;

    return {
        x: x,
        y: y
    };
}
function drawPostos(posts) {
    stroke('#444');
    for (var p = 0; p < posts.length; p++) {
        var coords = getCoord(posts[p]);
        var circle = new Circle(coords.x, coords.y, RAD);
        circle.show();
    }
}

function drawRota(res) {
    var rota = res.rota;
    var postos = res.postos;
    var first = true;

    for(var i = 0; i < rota.length; i++) {
        first ? stroke("blue") : stroke("red");
        first = false;
        var c = getCoord(postos[rota[i]]);
        var p = getCoord(postos[rota[i + 1]]);

        if (i == rota.length - 1) {
            stroke("green");
            var inicio = getCoord(postos[rota[0]]);
            line(c.x, c.y, inicio.x, inicio.y);
        } else {

            line(c.x, c.y, p.x, p.y)
        }
    }
}
function mostrarMelhorRota() {
    if (!GA) return;
    GA = JSON.parse(localStorage.getItem("GAMAPAFIT"));

    resetMapCanvas();
    $("#info").html("Quantidade de postos: " + GA.postos.length
        + "<br>Distância total: " + GA.distancia
        + "<br>Fitness: " + GA.fitness
        + "<br>Area preenchida: " + GA.areaPreenchida + "/" + areaTotal + " (" + (GA.areaPreenchida*100)/areaTotal + "%)"
    );
}
function gerarPostos() {
    var it = parseInt($("#iteracoes").val());
    var size = parseInt($("#tamanho").val());
    var mtRate = parseFloat($("#mutation").val());
    var ignore = parseFloat($("#ignoreRatio").val());
    var qtdpostos = parseInt($("#qtdPosto").val());
    var ultimo = $("#ultimo").is(":checked");
    console.log(ultimo);

    setCarregando(true);
    var ajaxData = {
        ignoreRatio: ignore,
        iterations: it,
        size: size,
        mutation: mtRate,
        qtdPostos: qtdpostos
    };

    if (ultimo) {
        ajaxData.ultimo = {
            postos: GA.postos,
            rota: GA.rota
        };
    }

    var genConfig = {
        ignoreRatio: ajaxData.ignoreRatio,
        iterations: ajaxData.iterations,
        size: ajaxData.size,
        mutation: ajaxData.mutation,
        qtdPostos: ajaxData.qtdPostos,
        ultimoResultado: ajaxData.ultimo
    };

    G().gerar(genConfig, function(res) {
        setCarregando(false);

        if (!GA || (GA.areaPreenchida <= (res.areaPreenchida * 0.9) && GA.distancia >= res.distancia)) {
            localStorage.setItem("GAMAPAFIT", JSON.stringify(res));
        }
        GA = res;
        $("#info").html("Quantidade de postos: " + res.postos.length
            + "<br>Distância total: " + res.distancia
            + "<br>Fitness: " + res.fitness
            + "<br>Area preenchida: " + res.areaPreenchida + "/" + areaTotal + " (" + (res.areaPreenchida*100)/areaTotal + "%)"
        );
        resetMapCanvas();
    });
}

function setup() {
    createCanvas(WIDTH, HEIGHT);
    background("#ccc");

    stroke('red');
    strokeWeight(1);

    setCarregando(true);

    $.ajax('/mapa')
        .done(function (mapa) {
            setCarregando(false);

            map = mapa;

            if (GA) {
                drawMap(map);
                drawPostos(GA.postos);
                drawRota(GA);
                $("#info").html("Quantidade de postos: " + GA.postos.length
                    + "<br>Distância total: " + GA.distancia
                    + "<br>Fitness: " + GA.fitness
                    + "<br>Area preenchida: " + GA.areaPreenchida + "/" + areaTotal + " (" + (GA.areaPreenchida*100)/areaTotal + "%)"
                );
            } else {
                drawMap(map);
            }
        })
        .error(function() {
            setCarregando(false);
        });
}

//var Genetic = ("../node_modules/genetic-js/lib/genetic");

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
    areaEmPx = 221478;
    var genetic = Genetic.create();

    var config = {
        iterations: genConfig.iterations,
        size: genConfig.size,
        mutation: genConfig.mutation,
        skip: genConfig.iterations / 8,
        webWorkers: true
    };

    var userData = {
        map: map,
        coords: [500, 734],
        area: areaEmPx,
        qtdPostos: genConfig.qtdPostos || 35,
        ultimo: genConfig.ultimoResultado || null
    };

    genetic.optimize = Genetic.Optimize.Minimize;
    genetic.select1 = Genetic.Select1.Fittest;
    genetic.select2 = Genetic.Select2.Random;

    userData.isCoordInsideMap = function(w, h, t) {
        return t.userData.map[w][h] == 1;
    }

    userData.getRandomPosFromInsideMap = function(t) {
        var map = t.userData.map;
        var WIDTH = 500;
        var HEIGHT = 734;

        var w = 0;
        var h = 0;

        do {
            w = t.userData.getRandomInt(0, WIDTH);
            h = t.userData.getRandomInt(0, HEIGHT);
        } while (map[w][h] !== 1);

        return [w, h];
    }

    userData.tourDistance = tourDistance;

    userData.getIndex = function(x, y, t) {
        return (x + y * 500);
    }

    userData.getCoord = function(index, t) {
        var WIDTH = 500;

        var x = index % WIDTH;
        var y = (index - x) / WIDTH;

        return {
            x: x,
            y: y
        };
    }

    userData.calculateAreaPreenchida = function(postos, t) {
        var areaPrenchida = 0;

        var that = t;
        var WIDTH = t.userData.coords[0];
        var HEIGHT = t.userData.coords[1];
        var RAD = 60;

        var buffer = new ArrayBuffer(WIDTH * HEIGHT);
        var a = new Int8Array(buffer);

        var addArea = function(x, y) {
            var id = that.userData.map[x] && that.userData.map[x][y] === 1 ? that.userData.getIndex(x, y, t) : -1;

            if (id != -1 && a[id] == 0) {
                a[id] = 1;
                return 1;
            }
            return 0;
        }

        for (var i = 0; i < postos.length; i++) {
            var circle = t.userData.getCoord(postos[i], t);
            var xCenter = circle.x;
            var yCenter = circle.y;

            // Pega todas as coordenadas de dentro do circulo
            for (var x = xCenter - RAD ; x <= xCenter; x++) {
                for (var y = yCenter - RAD ; y <= yCenter; y++) {
                    if ((x - xCenter)*(x - xCenter) + (y - yCenter)*(y - yCenter) <= RAD*RAD) {
                        var xSym = xCenter - (x - xCenter);
                        var ySym = yCenter - (y - yCenter);

                        areaPrenchida += addArea(x, y);
                        areaPrenchida += addArea(x, ySym);
                        areaPrenchida += addArea(xSym, y);
                        areaPrenchida += addArea(xSym, ySym);       
                    }
                }
            }
        }
        return areaPrenchida;
    }

    userData.shuffle = function(array) {
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

    userData.getRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    // GENETIC FUNCTIONS
    genetic.seed = function() {
        if (this.userData.ultimo) {
            return this.userData.ultimo;
        }

        var postos = [];

        for (var i = 0; i < this.userData.qtdPostos; i++) {
            var coords = this.userData.getRandomPosFromInsideMap(this);
            postos.push(this.userData.getIndex(coords[0], coords[1], this));
        }

        var ordem = [];
        for (var i = 0; i < postos.length; i++) {
            ordem.push(i);
        }
        ordem = this.userData.shuffle(ordem, this);

        return {
            postos: postos,
            rota: ordem
        }
    };

    genetic.fitness = function(ent) {
        var err = 0;

        var areaPreenchidaTotal = this.userData.calculateAreaPreenchida(ent.postos, this);
        this.userData.areaTotalPreenchida = areaPreenchidaTotal;
        
        err += Math.abs((this.userData.area - areaPreenchidaTotal) * 1.5);
        err += this.userData.tourDistance(ent, this) * 2.5;

        return err;
    };

    genetic.mutate = function(ent) {
        for (var i = 0; i < ent.postos.length / 6; i++) {
            var coords = this.userData.getRandomPosFromInsideMap(this);
            ent.postos[this.userData.getRandomInt(0, ent.postos.length, this)] = this.userData.getIndex(coords[0], coords[1], this);
        }
        ent.rota = this.userData.shuffle(ent.rota);
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
    genetic.evolve(config, userData);
}

function G() {
    var returnObj = {};
    var that = this;
    this.map = map;
    this.postos = [];

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
