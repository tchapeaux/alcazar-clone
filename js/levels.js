/*global W, H, Level, Tile, TileLinkDescriptor */
"use strict";

function getTrivialTestLevel() {
    var walls = [];
    walls.push(new TileLinkDescriptor(0, 0, Tile.directions.DOWN));
    var doors = [];
    doors.push(new TileLinkDescriptor(0, 0, Tile.directions.UP));
    doors.push(new TileLinkDescriptor(0, 1, Tile.directions.DOWN));
    var level = new Level(2, 2, walls, doors);
    level.fitCanvasDimension(W, H);
    return level;
}

function getEasyTestLevel() {
    var walls = [];
    walls.push(new TileLinkDescriptor(0, 0, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(1, 2, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(2, 2, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(2, 2, Tile.directions.DOWN));
    var doors = [];
    doors.push(new TileLinkDescriptor(0, 0, Tile.directions.UP));
    doors.push(new TileLinkDescriptor(0, 3, Tile.directions.DOWN));
    var level = new Level(4, 4, walls, doors);
    level.fitCanvasDimension(W, H);
    return level;
}


function getMediumTestLevel() {
    var walls = [];
    walls.push(new TileLinkDescriptor(3, 0, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(3, 1, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(0, 3, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(1, 3, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(2, 3, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(4, 3, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(2, 4, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(3, 4, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(0, 6, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(3, 6, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(3, 6, Tile.directions.DOWN));
    var doors = [];
    doors.push(new TileLinkDescriptor(3, 0, Tile.directions.UP));
    doors.push(new TileLinkDescriptor(4, 1, Tile.directions.RIGHT));
    doors.push(new TileLinkDescriptor(4, 2, Tile.directions.RIGHT));
    doors.push(new TileLinkDescriptor(4, 4, Tile.directions.RIGHT));
    doors.push(new TileLinkDescriptor(4, 6, Tile.directions.RIGHT));
    doors.push(new TileLinkDescriptor(0, 6, Tile.directions.LEFT));
    var level = new Level(5, 8, walls, doors);
    level.fitCanvasDimension(W, H);
    return level;
}

function getHardTestLevel() {
    // from http://www.theincrediblecompany.com/2014/07/19/an-excellent-hand-made-alcazar/
    var walls = [];
    walls.push(new TileLinkDescriptor(7, 0, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(8, 0, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(0, 1, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(1, 1, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(3, 1, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(4, 1, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(5, 1, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(0, 2, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(1, 2, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(2, 2, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(3, 2, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(4, 2, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(5, 2, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(7, 2, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(8, 2, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(1, 3, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(2, 3, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(3, 3, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(4, 3, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(5, 3, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(2, 4, Tile.directions.DOWN));
    walls.push(new TileLinkDescriptor(3, 4, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(5, 4, Tile.directions.RIGHT));
    walls.push(new TileLinkDescriptor(7, 4, Tile.directions.RIGHT));
    var doors = [];
    doors.push(new TileLinkDescriptor(0, 0, Tile.directions.UP));
    doors.push(new TileLinkDescriptor(9, 0, Tile.directions.UP));
    doors.push(new TileLinkDescriptor(0, 9, Tile.directions.DOWN));
    doors.push(new TileLinkDescriptor(9, 9, Tile.directions.DOWN));
    var level = new Level(10, 10, walls, doors);
    level.tileSize = 50;
    return level;}

function serializeLevel(level) {
    var levelString = "W" + level.grid.sizeX + "H" + level.grid.sizeY;
    levelString += "+WALLS+";
    var levelWalls = level.grid.getLevelWalls();
    for (var i = 0; i < levelWalls.length; i++) {
        var descr = levelWalls[i];
        levelString += descr.x + "-" + descr.y + "-" + descr.dir + "-";
    }

    levelString += "+DOORS+";

    var doors = level.grid.getDoors();
    for (var i = 0; i < doors.length; i++) {
        var door = doors[i];
        levelString += door.x + "-" + door.y + "-" + door.dir + "-";
    }

    return levelString;
}

function deserializeLevel(levelString) {
    if (levelString.split("+WALLS+").length != 2) {
        throw new Error("Missing wall tag");
    }
    var sizeInfo = levelString.split("+WALLS+")[0];
    sizeInfo = sizeInfo.slice(1);
    if (sizeInfo.split("H").length != 2) {
        throw new Error("Missing height tag");
    }
    var sizeX = parseInt(sizeInfo.split("H")[0]);
    var sizeY = parseInt(sizeInfo.split("H")[1]);
    if (isNaN(sizeX) || isNaN(sizeY)) {
        throw new Error("Invalid level sizes");
    }
    var wallsInfo = levelString.split("+WALLS+")[1].split("+DOORS+")[0].split("-");
    wallsInfo = wallsInfo.slice(0, -1); // remove last empty element
    var doorsInfo = levelString.split("+WALLS+")[1].split("+DOORS+")[1].split("-");
    doorsInfo = doorsInfo.slice(0, -1); // remove last empty element
    var walls = [];

    for (var i = 0; i < wallsInfo.length; i += 3) {
        var x = parseInt(wallsInfo[i]);
        var y = parseInt(wallsInfo[i + 1]);
        var dir = wallsInfo[i + 2];
        walls.push(new TileLinkDescriptor(x, y, dir));
    }
    var doors = [];
    for (var i = 0; i < doorsInfo.length; i += 3) {
        var x = doorsInfo[i];
        var y = doorsInfo[i + 1];
        var dir = doorsInfo[i + 2];
        doors.push(new TileLinkDescriptor(x, y, dir));
    }

    return new Level(sizeX, sizeY, walls, doors);

}
