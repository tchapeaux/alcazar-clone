/*global Grid, Tile, TileLink, TileLinkDescriptor */
"use strict";

var Level = function(sizeX, sizeY, walls, doors, name, author) {
    /***
    walls: array of TileLinkDescriptor
    doors: array of TileLinkDescriptor
    ***/

    // default parameters
    name = typeof name !== "undefined" ? name : "Unnamed level";
    author = typeof author !== "undefined" ? author : "Anonymous";

    if (name.length > Level.MAX_LEVELNAME_LENGTH) { throw new Error("Level name cannot exceed 140 characters"); }
    if (author.length > Level.MAX_AUTHORNAME_LENGTH) { throw new Error("Level author name cannot exceed 140 characters"); }

    this.grid = new Grid(sizeX, sizeY);
    this.name = name;
    this.author = author;
    this.tileSize = 50;
    this.borderWidth = 30;

    for (var w = 0; w < walls.length; w++) {
        var wall = walls[w];
        var link = this.grid.getLink(wall);
        link.state = TileLink.stateEnum.LEVEL_WALL;
    }

    for (var d = 0; d < doors.length; d++) {
        this.makeDoor(doors[d]);
    }
};

Level.MAX_LEVELNAME_LENGTH = 140;
Level.MAX_AUTHORNAME_LENGTH = 30;

Level.prototype.makeDoor = function(door) {
    // assert valid door position
    if (door.dir == Tile.directions.LEFT ||
        door.dir == Tile.directions.RIGHT) {
        if (door.x !== 0 && door.x != this.grid.sizeX - 1) {
            throw new RangeError("Invalid x door position: " + String(door.x));
        }
    }
    if (door.dir == Tile.directions.UP ||
        door.dir == Tile.directions.DOWN) {
        if (door.y !== 0 && door.y != this.grid.sizeY - 1) {
            throw new RangeError("Invalid y door position: " + String(door.y));
        }
    }
    var tile = this.grid.getTile(door.x, door.y);
    var link = new TileLink(tile, this.grid.outerTile);
    tile.neighborLinks[door.dir] = link;
    this.grid.outerTile.neighborLinks.push(link);
};

Level.prototype.removeDoor = function(doorDescriptor) {
    var door = this.grid.getLink(doorDescriptor);
    // assert door exist
    if (!door) {
        throw new Error("removeDoor: door does not exist.");
    }
    var tile = this.grid.getTile(doorDescriptor.x, doorDescriptor.y);
    tile.neighborLinks[doorDescriptor.dir] = null;
    for (var i = 0; i < this.grid.outerTile.neighborLinks.length; i++) {
        var link = this.grid.outerTile.neighborLinks[i];
        if (link == door) {
            this.grid.outerTile.neighborLinks.splice(i, 1);
        }
    }
};

Level.prototype.resize = function(newSizeX, newSizeY) {
    // get doors and walls info
    var walls = this.grid.getLevelWalls();
    var doors = this.grid.getDoors();

    // Filter invalid walls and doors with regards to new sizes
    var newWalls = [];
    for (var w = 0; w < walls.length; w++) {
        var wall = walls[w];
        // down and right walls might become borders (difficult to handle)
        // -> translate them into up and left walls
        if (wall.dir == Tile.directions.RIGHT) {
            wall.x += 1;
            wall.dir = Tile.directions.LEFT;
        }
        if (wall.dir == Tile.directions.DOWN) {
            wall.y += 1;
            wall.dir = Tile.directions.UP;
        }
        if (wall.x < newSizeX && wall.y < newSizeY) {
            newWalls.push(wall);
        }
    }
    var newDoors = [];
    for (var d = 0; d < doors.length; d++) {
        var door = doors[d];
        // keep outer doors (right/down) at the border
        if (door.dir == Tile.directions.RIGHT) {
            door.x = newSizeX - 1;
        }
        if (door.dir == Tile.directions.DOWN) {
            door.y = newSizeY - 1;
        }
        if (door.x < newSizeX && door.y < newSizeY ) {
            newDoors.push(door);
        }
    }

    var newLevel = new Level(newSizeX, newSizeY, newWalls, newDoors);
    this.grid = newLevel.grid;
};

Level.prototype.fitCanvasDimension = function(W, H) {
    this.tileSize = Math.min(
        (W - 2 * this.borderWidth) / this.grid.sizeX,
        (H - 2 * this.borderWidth) / this.grid.sizeY
        );
};

Level.prototype.draw = function(c) {
    var i, j; // loop variables
    c.save();

    c.translate(-this.grid.sizeX * this.tileSize / 2, -this.grid.sizeY * this.tileSize / 2);

    // border
    c.fillStyle = "rgb(100, 100, 100)";
    c.beginPath();
    c.rect(-this.borderWidth, -this.borderWidth,
        this.grid.sizeX * this.tileSize + this.borderWidth * 2,
        this.grid.sizeY * this.tileSize + this.borderWidth * 2);
    c.fill();

    // draw tile in a chess-like pattern
    c.fillStyle = "#E9E1C5";
    c.beginPath();
    c.rect(0, 0, this.grid.sizeX * this.tileSize, this.grid.sizeY * this.tileSize);
    c.fill();
    // darker tiles
    c.fillStyle = "#cbc0a6";
    c.beginPath();
    for (i = 0; i < this.grid.sizeX; i++) {
        for (j = 0; j < this.grid.sizeY; j++) {
            if ((i + j) % 2 == 1) {
                c.rect(i * this.tileSize, j * this.tileSize, this.tileSize, this.tileSize);
            }
        }
    }
    c.fill();

    // highlight completed tiles (exactly two links in path)
    c.save();
    c.fillStyle = "blue";
    c.globalAlpha = "0.3";
    c.beginPath();
    for (i = 0; i < this.grid.sizeX; i++) {
        for (j = 0; j < this.grid.sizeY; j++) {
            var tile = this.grid.getTile(i, j);
            var pathLinkCount = 0;
            var neighborLinks = tile.getNeighborLinks();
            for (var d = 0; d < neighborLinks.length; d++) {
                var link = neighborLinks[d];
                if (link && link.state == TileLink.stateEnum.IN_PATH) {
                    pathLinkCount++;
                }
            }
            if (pathLinkCount == 2) {
                c.rect(i * this.tileSize, j * this.tileSize, this.tileSize, this.tileSize);
            }
        }
    }
    c.fill();
    c.restore();

    // draw tile separation lines
    c.strokeStyle = "black";
    c.lineWidth = 2;
    c.setLineDash([5]);
    for (i = 0; i < this.grid.sizeX + 1; i++) {
        c.beginPath();
        c.moveTo(i * this.tileSize, 0);
        c.lineTo(i * this.tileSize, this.tileSize * this.grid.sizeY);
        c.stroke();
    }
    for (j = 0; j < this.grid.sizeY + 1; j++) {
        c.beginPath();
        c.moveTo(0, j * this.tileSize);
        c.lineTo(this.tileSize * this.grid.sizeX, j * this.tileSize);
        c.stroke();
    }

    // draw link state
    // each tile draws its LEFT and UP link, so each link is drawn exactly once
    for (i = 0; i < this.grid.sizeX; i++) {
        for (j = 0; j < this.grid.sizeY; j++) {
            var cur = this.grid.getTile(i, j);
            if (i >= 1 && cur.neighborLinks[Tile.directions.LEFT]) {
                this.drawLink(c, new TileLinkDescriptor(i, j, Tile.directions.LEFT));
            }
            if (j >= 1 && cur.neighborLinks[Tile.directions.UP]) {
                this.drawLink(c, new TileLinkDescriptor(i, j, Tile.directions.UP));
            }
        }
    }

    var doors = this.grid.getDoors();
    for (i = 0; i < doors.length; i++) {
        var door = doors[i];
        this.drawLink(c, door);
    }

    c.restore();
};

Level.prototype.getClosestLink = function(x, y) {
    // apply grid centering offsets
    x += Math.floor((this.grid.sizeX * this.tileSize) / 2);
    y += Math.floor((this.grid.sizeY * this.tileSize) / 2);

    // find closest tile
    var tileX = Math.floor(x / this.tileSize);
    var tileY = Math.floor(y / this.tileSize);

    // find quadrant in tile
    var dx = x - (tileX + 0.5) * this.tileSize;
    var dy = y - (tileY + 0.5) * this.tileSize;
    var quadrant = null;
    var angle = Math.atan2(dy, dx);
    if (- Math.PI / 4 < angle && angle < Math.PI / 4) {
        quadrant = Tile.directions.RIGHT;
    } else if (Math.PI / 4 < angle && angle < 3 * Math.PI / 4) {
        quadrant = Tile.directions.DOWN;
    } else if (- 3 * Math.PI / 4 < angle && angle < - Math.PI / 4) {
        quadrant = Tile.directions.UP;
    } else {
        quadrant = Tile.directions.LEFT;
    }

    var closestLink = null;
    if (tileX >= 0 && tileX < this.grid.sizeX && tileY >= 0 && tileY < this.grid.sizeY) {
        closestLink = new TileLinkDescriptor(tileX, tileY, quadrant);
    }
    return closestLink;
};

Level.prototype.getClosestDoorPosition = function(x, y) {
    // apply grid centering offsets
    x += Math.floor((this.grid.sizeX * this.tileSize) / 2);
    y += Math.floor((this.grid.sizeY * this.tileSize) / 2);

    if (y > 0 && y < this.grid.sizeY * this.tileSize) {
        if (x < 0) {
            return new TileLinkDescriptor(0, Math.floor(y / this.tileSize), Tile.directions.LEFT);
        } else if ( x > this.tileSize * this.grid.sizeX) {
            return new TileLinkDescriptor(this.grid.sizeX - 1, Math.floor(y / this.tileSize), Tile.directions.RIGHT);
        }
    } else if ( x > 0 && x < this.grid.sizeX * this.tileSize) {
        if (y < 0) {
            return new TileLinkDescriptor(Math.floor(x / this.tileSize), 0, Tile.directions.UP);
        } else if (y > this.grid.sizeY * this.tileSize) {
            return new TileLinkDescriptor(Math.floor(x / this.tileSize), this.grid.sizeY - 1, Tile.directions.DOWN);
        }
    }
};

Level.prototype.isFinished = function() {
    var i, j, link, neighborLinks; // TODO: separate in subfunctions
    // first condition -- exactly two doors are used
    var oTile = this.grid.outerTile;
    var activeDoorCount = 0;
    for (i = 0; i < oTile.neighborLinks.length; i++) {
        link = oTile.neighborLinks[i];
        if (link.state == TileLink.stateEnum.IN_PATH) {
            activeDoorCount++;
        }
    }
    if (activeDoorCount != 2) {
        return false;
    }

    // second condition -- each tile is in the path (has exactly two links in path)
    // note that this does not detect loops
    for (i = 0; i < this.grid.sizeX; i++) {
        for (j = 0; j < this.grid.sizeY; j++) {
            var tile = this.grid.tiles[i][j];
            var pathCount = 0;
            neighborLinks = tile.getNeighborLinks();
            for (var d = 0; d < neighborLinks.length; d++) {
                link = neighborLinks[d];
                if (link && link.state == TileLink.stateEnum.IN_PATH) {
                    pathCount++;
                }
            }
            if (pathCount != 2) {
                return false;
            }
        }
    }

    // third condition -- no loops
    // we test this by following the path and counting tiles
    var startTile;
    for (i = 0; i < oTile.neighborLinks.length; i++) {
        link = oTile.neighborLinks[i];
        if (link.state == TileLink.stateEnum.IN_PATH) {
            if (!startTile) { startTile = link.other(oTile); }
            else { break; }
        }
    }
    var cur = startTile;
    var prev = oTile;
    var tileCount = 0;
    var loopCount = 0;
    while (cur != oTile && loopCount <= this.grid.sizeX * this.grid.sizeY + 1) {
        neighborLinks = cur.getNeighborLinks();
        for (i = 0; i < neighborLinks.length; i++) {
            link = neighborLinks[i];
            if (link && link.state == TileLink.stateEnum.IN_PATH) {
                var next = link.other(cur);
                if (next != prev) {
                    prev = cur;
                    cur = link.other(cur);
                    tileCount++;
                    break;
                }
            }
        }
        loopCount++;
    }
    if (cur != oTile) {
        // the test for condition 2 should have prevented the infinite loop
        throw new Error("Infinite loop");
    }
    if (tileCount != this.grid.sizeX * this.grid.sizeY) {
        return false;
    }

    // all conditions passed
    return true;
};

Level.prototype.reset = function() {
    for (var i = 0; i < this.grid.sizeX; i++) {
        for (var j = 0; j < this.grid.sizeY; j++) {
            var tile = this.grid.getTile(i, j);
            var neighborLinks = tile.getNeighborLinks();
            for (var d = 0; d < neighborLinks.length; d++) {
                var link = neighborLinks[d];
                if (link && link.state != TileLink.stateEnum.LEVEL_WALL) {
                    link.state = TileLink.stateEnum.CLEAR;
                }
            }
        }
    }
};

Level.prototype.drawLink = function(c, linkDescriptor) {
    c.save();

    var tile = this.grid.getTile(linkDescriptor.x, linkDescriptor.y);
    var i = tile.x;
    var j = tile.y;
    var link = this.grid.getLink(linkDescriptor);

    // translate to the wall position
    switch (linkDescriptor.dir) {
        case Tile.directions.UP:
            c.translate((i + 0.5) * this.tileSize, j * this.tileSize);
            break;
        case Tile.directions.LEFT:
            c.translate(i * this.tileSize, (j + 0.5) * this.tileSize);
            break;
        case Tile.directions.DOWN:
            c.translate((i + 0.5) * this.tileSize, (j + 1) * this.tileSize);
            break;
        case Tile.directions.RIGHT:
            c.translate((i + 1) * this.tileSize, (j + 0.5) * this.tileSize);
            break;
    }

    // rotate to have an horizontal wall if necessary
    switch (linkDescriptor.dir) {
        case Tile.directions.UP:
        case Tile.directions.DOWN:
            c.rotate(Math.PI/2);
    }

    var width, length;
    switch (link.state) {
        case TileLink.stateEnum.LEVEL_WALL:
            c.strokeStyle = "black";
            c.fillStyle = "grey";
            c.setLineDash([]);
            width = this.tileSize / 5;
            length = this.tileSize - width;
            c.beginPath();
            c.rect(- width / 2, -length / 2, width, length);
            c.fill();
            c.stroke();
            break;
        case TileLink.stateEnum.CLEAR:
            var oTile = this.grid.outerTile;
            if (link.tiles[0] == oTile || link.tiles[1] == oTile) {
                width = this.tileSize / 20;
                c.fillStyle = "blue";
                c.globalAlpha = 0.5;
                c.beginPath();
                c.rect(- this.tileSize / 2 - width / 2 + 10, -width / 2, this.tileSize + width - 20, width);
                c.fill();
            }
            break;
        case TileLink.stateEnum.IN_PATH:
            width = this.tileSize / 5;
            c.fillStyle = "blue";
            c.beginPath();
            c.rect(- this.tileSize / 2 - width / 2, -width / 2, this.tileSize + width, width);
            c.fill();
            break;
        case TileLink.stateEnum.USER_WALL:
            c.strokeStyle = "black";
            c.fillStyle = "rgb(100, 100, 200)";
            c.setLineDash([]);
            width = this.tileSize / 10;
            length = this.tileSize * 0.7;
            c.beginPath();
            c.rect(- width / 2, -length / 2, width, length);
            c.fill();
            c.stroke();
            break;
    }

    if (link.highlighted) {
        c.save();
        c.beginPath();
        c.globalAlpha = 0.5;
        c.fillStyle = link.state == TileLink.stateEnum.LEVEL_WALL ? "red" : "blue";
        c.arc(0, 0, this.tileSize / 8, 0, Math.PI * 2);
        c.fill();
        c.restore();
        link.highlighted = false;
    }

    c.restore();
};
