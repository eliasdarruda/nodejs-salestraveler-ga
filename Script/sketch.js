var map, postos;
var melhorMapaGA = JSON.parse(localStorage.getItem("GAmelhorMapaFIT"));
var melhorRotaGA = JSON.parse(localStorage.getItem("GAmelhorROTA"));

// canvas size
const WIDTH = 500;
const HEIGHT = 734;

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
    drawPostos(postos);
}

function gerarRotas() {
    if (!map) return;

    var it = parseInt($("#iteracoes").val());
    var size = parseInt($("#tamanho").val());
    var mtRate = parseFloat($("#mutation").val());

    setCarregando(true);
    resetMapCanvas();

    $.ajax({
        type: "POST",
        url: '/caminho',
        data: {
            mapa: postos,
            iterations: it,
            size: size,
            mutation: mtRate
        },
        success: function(res) {
            setCarregando(false);
            drawRota(res.rotas);
            $("#distancia").text("Distância da rota: " + res.distancia);

            if (!melhorRotaGA || melhorRotaGA.distancia > res.distancia) {
                melhorRotaGA = res;
                localStorage.setItem("GAmelhorROTA", JSON.stringify(res));
            }
        }
    });
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
    for (var i = 0; i < WIDTH; i++) {
        for (var j = 0; j < HEIGHT; j++) {
            if (map[i] != undefined && map[i][j] === 1) {
                rect(i, j, 1, 1);
            }
        }
    }
}

function drawPostos(posts) {
    stroke('#444');
    for (var p = 0; p < posts.length; p++) {
        var circle = new Circle(posts[p].x, posts[p].y, posts[p].radius);
        circle.show();
    }
}

function drawRota(res) {
    var rota = res;
    var first = true;

    for(var i = 0; i < rota.length; i++) {
        first ? stroke("blue") : stroke("red");
        first = false;
        if (i == rota.length - 1) {
            stroke("green");
            line(rota[i].x, rota[i].y, rota[0].x, rota[0].y);
        } else {
            line(rota[i].x, rota[i].y, rota[i + 1].x, rota[i + 1].y)
        }
    }
}
function mostrarMelhorRota() {
    if (!melhorRotaGA) return;

    resetMapCanvas();
    drawRota(melhorRotaGA.rotas);
    $("#distancia").text("Distância da rota: " + melhorRotaGA.distancia);
}
function gerarPostos() {
    var it = parseInt($("#iteracoes").val());
    var size = parseInt($("#tamanho").val());
    var mtRate = parseFloat($("#mutation").val());
    var ignore = parseFloat($("#ignoreRatio").val());

    setCarregando(true);

    $.ajax({
        type: "POST",
        url: '/postos',
        data: {
            ignoreRatio: ignore,
            iterations: it,
            size: size,
            mutation: mtRate
        },
        success: function(res) {
            setCarregando(false);
            postos = res;

            if (!melhorMapaGA || melhorMapaGA.length > postos.length) {
                localStorage.setItem("GAmelhorMapaFIT", JSON.stringify(postos));
                melhorMapaGA = postos;
            }
            $("#postos").text("Quantidade de postos: " + postos.length);
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

            if (melhorMapaGA) {
                $("#postos").text("Quantidade de postos: " + melhorMapaGA.length);
                drawMap(map);
                drawPostos(melhorMapaGA);
                postos = melhorMapaGA;
            } else {
                drawMap(map);
            }
        })
        .error(function() {
            setCarregando(false);
        });
}