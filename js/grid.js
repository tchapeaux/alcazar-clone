Tile = function(x, y) {
    this.x = x;
    this.y = y;
    this.neighborsLink = [];
}

Tile.directions = {
    UP : "UP",
    DOWN : "DOWN",
    LEFT : "LEFT",
    RIGHT : "RIGHT"
};

TileLink = function(tile1, tile2) {
    this.tiles = [tile1, tile2];
    this.state = TileLink.stateEnum.CLEAR;
    this.highlighted = false
}

TileLink.prototype.other = function(tile) {
    // return the other endpoint
    if (tile == this.tiles[0]) { return this.tiles[1]; }
    else if (tile == this.tiles[1]) { return this.tiles[0]; }
    else { throw new Error("Provided tile not in TileLink"); }
}

TileLink.stateEnum = {
    USER_WALL : "USER WALL",
    LEVEL_WALL : "LEVEL WALL",
    IN_PATH : "IN PATH",
    CLEAR : "CLEAR"
};

TileLinkDescriptor = function(x, y, dir) {
    this.x = x;
    this.y = y;
    this.dir = dir;
}

Grid = function(sizeX, sizeY) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.tiles = [];
    for (var i = 0; i < sizeX; i++) {
        this.tiles[i] = [];
        for (var j = 0; j < sizeY; j++) {
            this.tiles[i][j] = new Tile(i, j);
            var cur = this.tiles[i][j];
            if (i > 0) {
                var left = this.tiles[i-1][j];
                var link = new TileLink(cur, left);
                cur.neighborsLink[Tile.directions.LEFT] = link;
                left.neighborsLink[Tile.directions.RIGHT] = link;
            }
            if (j > 0) {
                var up = this.tiles[i][j-1];
                var link = new TileLink(cur, up);
                cur.neighborsLink[Tile.directions.UP] = link;
                up.neighborsLink[Tile.directions.DOWN] = link;
            }
        }
    }
    this.outerTile = new Tile(-1, -1); // represent "outside"
}

Grid.prototype.getTile = function(i, j) { return this.tiles[i][j]; }
Grid.prototype.getLink = function(linkDescriptor) {
    x = linkDescriptor.x;
    y = linkDescriptor.y;
    dir = linkDescriptor.dir;
    return this.tiles[x][y].neighborsLink[dir];
}

Grid.prototype.getDoors = function() {
    var doors = [];
    for (var i = 0; i < this.outerTile.neighborsLink.length; i++) {
        var doorLink = this.outerTile.neighborsLink[i];
        doorTile = doorLink.other(this.outerTile);
        var directionsArray = [
            Tile.directions.UP,
            Tile.directions.DOWN,
            Tile.directions.LEFT,
            Tile.directions.RIGHT
        ];
        for (var j = 0; j < directionsArray.length; j++ ) {
            var dir = directionsArray[j];
            if (doorTile.neighborsLink[dir] == doorLink) {
                doors.push(new TileLinkDescriptor(doorTile.x, doorTile.y, dir));
            }
        }
    }
    return doors;
}
