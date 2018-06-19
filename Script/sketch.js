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

    $.ajax({
        type: "POST",
        url: '/genetic',
        data: ajaxData,
        success: function(res) {
            setCarregando(false);

            if (!GA || GA.fitness > res.fitness) {
                localStorage.setItem("GAMAPAFIT", JSON.stringify(res));
            }
            GA = res;
            $("#info").html("Quantidade de postos: " + res.postos.length
                + "<br>Distância total: " + res.distancia
                + "<br>Fitness: " + res.fitness
                + "<br>Area preenchida: " + res.areaPreenchida + "/" + areaTotal + " (" + (res.areaPreenchida*100)/areaTotal + "%)"
            );
            resetMapCanvas();
        }
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