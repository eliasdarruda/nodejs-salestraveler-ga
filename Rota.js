function Rota(map) {
    this.totalCidades = map.length;
    this.postos = map;

    var ud = [];
    for (var i = 0; i < this.totalCidades; i++)
        ud.push( { x: this.postos[i].x, y: this.postos[i].y });

    this.rota = ud;
}

// Gets a city from the this.rota
Rota.prototype.getPosto = function(tourPosition) {
    return this.rota[tourPosition];
}

// Sets a city in a certain position within a this.rota
Rota.prototype.setPosto = function(tourPosition, posto) {
    this.rota[tourPosition] = posto;
}

// Get number of cities on our this.rota
Rota.prototype.rotaSize = function() {
    return this.rota.length;
}

// Check if the this.rota contains a city
Rota.prototype.containsPosto = function(posto){
    return this.rota.includes(posto);
}

Rota.prototype.toString = function() {
    var geneString = "|";
    for ( i = 0; i < this.rotaSize(); i++) {
        geneString += this.getPosto(i)+"|";
    }
    return geneString;
}

Rota.prototype.tourDistance = function(ent) {
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

module.exports = Rota;