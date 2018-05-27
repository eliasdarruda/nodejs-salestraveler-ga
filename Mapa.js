var fs = require('fs');
var Genetic = require("./node_modules/genetic-js/lib/genetic");
var Posto = require('./Posto');

function seedFunc(ent) {
    var that = this;
    var map;
    var pontos = [];

    // maximum and minimum radius
    const RAD = 60;

    // canvas size
    const WIDTH = 500;
    const HEIGHT = 734;
    const SIZE = WIDTH * HEIGHT;

    // buffer for store ineligible positions of circles 
    var buffer = new ArrayBuffer(SIZE);
    var area = new Int8Array(buffer);

    // chunk size
    var CHUNK_SIZE = RAD * this.userData.ignoreRatio > 0 ? this.userData.ignoreRatio : 1;
    var CHUNK_COLS = Math.ceil(WIDTH / CHUNK_SIZE);
    var CHUNK_ROWS = Math.ceil(HEIGHT / CHUNK_SIZE);

    var chunks = [];

    var lista = [];
    for (var i = 0; i < this.userData.maxVal; i++) {
        lista.push(this.userData.mapa[i]);
    }

    var hypot = function(x, y, z) {
        if (typeof Math.hypot === 'function') {
            return Math.hypot.apply(null, arguments);
        }
    }

    var dist = function(a,b,c,d) {
        return hypot(arguments[2] - arguments[0], arguments[3] - arguments[1]);
    };

    var createVector = function(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    };

    var constrain = function(n, low, high) {
        return Math.max(Math.min(n, high), low);
    };

    // coordinate to index
    var getIndex = function(x, y) {
        return x + y * WIDTH;
    }

    // select chunk that corresponds to the coordinates
    var getChunk = function(x, y) {
        return {
            col: Math.floor(x / (CHUNK_SIZE)),
            row: Math.floor(y / (CHUNK_SIZE))
        };
    }

    // select neighbor chunks
    var getNeighborChunks = function(row, col) {
        var result = [];

        result.push(chunks[row][col]);

        if (col > 0) {
            result.push(chunks[row][col - 1]);

            if (row > 0) {
                result.push(chunks[row - 1][col - 1]);
            }
        }
        if (col < CHUNK_COLS - 1) {
            result.push(chunks[row][col + 1]);

            if (row < CHUNK_ROWS - 1) {
                result.push(chunks[row + 1][col + 1]);
            }
        }
        if (row > 0) {
            result.push(chunks[row - 1][col]);

            if (col < CHUNK_COLS - 1) {
                result.push(chunks[row - 1][col + 1]);
            }
        }
        if (row < CHUNK_ROWS - 1) {
            result.push(chunks[row + 1][col]);

            if (col > 0) {
                result.push(chunks[row + 1][col - 1]);
            }
        }

        return result;
    }

    // random integer
    var getRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    // get random from possible radius of the circle in spicified position
    // or return false if the circle can not be placed in this position
    var getRadius = function(x, y) {
        var chunk = getChunk(x, y);
        var neighbors = getNeighborChunks(chunk.row, chunk.col);

        // distance to nearest circle
        var max = RAD;

        // for each circle in neighbors chunks
        for (var i = 0; i < neighbors.length; ++i) {
            for (var j = 0; j < neighbors[i].length; ++j) {

                var circle = neighbors[i][j];
                // distance to the circle edge
                var r = dist(x, y, circle.x, circle.y) - circle.radius;

                if (r < max) {
                    max = r;
                }

                if (max < RAD) {
                    // circle can not be placed in this position
                    return false;
                }
            }
        }

        if (max > RAD) {
            max = RAD;
        }

        // return max;
        // return random(RAD, max);
        return constrain(RAD, RAD, max);
    }

    // disallow positions in area under the circle
    var reduceArea = function(circle) {
        for (var x = 0; x < WIDTH; x++) {
            for (var y = 0; y < HEIGHT; y++) {
                var dx = x - circle.x;
                var dy = y - circle.y;
                var distanceSquared = dx * dx + dy * dy;

                if (distanceSquared <= RAD*RAD && map[x][y] === 1)
                {
                    area[(x + y * WIDTH)] = 1;
                }
            }
        }
    }

    var setup = function(mapa) {
        map = that.userData.mapa;

        if (that.userData.ignoreRatio > 0) {
            for (var j = 0; j < CHUNK_ROWS; ++j) {
                chunks[j] = [];
                for (var i = 0; i < CHUNK_COLS; ++i) {
                    chunks[j][i] = [];
                }
            }
        }

        pontos = [];
        
        generate();

        return pontos;
    }

    var getRandomPosFromInsideMap = function() {
        var w = 0;
        var h = 0;

        do {
            w = getRandomInt(0, WIDTH);
            h = getRandomInt(0, HEIGHT);
        } while (map[w][h] !== 1);

        return new createVector(w, h);
    }

    var areaPreenchida = function() {
        var areaTotal = 0;

        for (var i = 0; i < WIDTH; i++) {
            for (var j = 0; j < HEIGHT; j++) {
                var n = area[getIndex(i, j)];
                if (isNaN(n)) break;
                areaTotal += n;
            }
        }

        return areaTotal >= that.userData.areaEmPx;
    }

    // generate circles
    var generate = function() {
        do {
            var center = getRandomPosFromInsideMap();
            var radius = true;

            if (that.userData.ignoreRatio != 0) {
                radius = getRadius(center.x, center.y);
            }
        
            if (radius) {
                var posto = new (that.userData.Posto)(center.x, center.y, RAD);
                var chunk;
                if (that.userData.ignoreRatio != 0) {
                    chunk = getChunk(center.x, center.y);
                    chunks[chunk.row][chunk.col].push(posto);
                }
                reduceArea(posto);
                pontos.push(posto);
            }
        } while(!areaPreenchida());
    }
    
    return setup(ent ? ent : lista);
}

function initGenetic(map, areaEmPx, genConfig, sucess) {
    var genetic = Genetic.create();
    var postos = {};
    postos.mapa = map;
    postos.maxVal = postos.length;
    postos.areaEmPx = areaEmPx;
    postos.Posto = Posto;
    postos.ignoreRatio = genConfig.ignoreRatio;

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

    genetic.seed = seedFunc;
    genetic.mutate = seedFunc;

    genetic.fitness = function(ent) {
        return ent.length;
    };

    genetic.notification = function (pop, generation, stats, isFinished) {
        if (isFinished) {
            console.log('Postos processados com sucesso!');
            sucess(pop[0].entity);
        }
    };

    console.log('Iniciando genético para gerar os postos...');
    genetic.evolve(config, postos);
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
    returnObj.gerarPostos = function(genConfig, success) {      
        initGenetic(that.map, that.map.areaTotal, genConfig, function(postos) {
            that.postos = postos.filter (function () {return true;});
            success(that.postos);
        });
    }
    returnObj.getPostos = function() {
        return that.postos;
    }
    returnObj.getMapa = function() {
        return that.map;
    }
    return returnObj;
}
