/*global W, H, Level, Tile, TileLinkDescriptor */
"use strict";

function getTrivialTestLevel() {
    var walls = [];
    walls.push(new TileLinkDescriptor(0, 0, Tile.directions.DOWN));
    var doors = [];
    doors.push(new TileLinkDescriptor(0, 0, Tile.directions.UP));
    doors.push(new TileLinkDescriptor(0, 1, Tile.directions.DOWN));
    var level = new Level(2, 2, walls, doors, "001 (Trivial)", "Altom");
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
    var level = new Level(4, 4, walls, doors, "002 (Easy)", "Altom");
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
    var level = new Level(5, 8, walls, doors, "Demo Level 5", "Alcazar demo");
    return level;
}

function serializeLevel(level) {
    var levelString = "";
    // name and author
    levelString += String(level.name.length) + "|" + level.name + "|";
    levelString += String(level.author.length) + "|" + level.author + "|";
    // grid dimension
    levelString += "W" + level.grid.sizeX + "H" + level.grid.sizeY + "|";
    // walls description
    levelString += "WALLS|";
    var levelWalls = level.grid.getLevelWalls();
    levelString += String(levelWalls.length) + "|";
    for (var i = 0; i < levelWalls.length; i++) {
        var descr = levelWalls[i];
        levelString += descr.x + "-" + descr.y + "-" + descr.dir + "|";
    }

    // doors description
    levelString += "DOORS|";

    var doors = level.grid.getDoors();
    levelString += String(doors.length) + "|";
    for (var i = 0; i < doors.length; i++) {
        var door = doors[i];
        levelString += door.x + "-" + door.y + "-" + door.dir + "|";
    }

    return levelString;
}

function deserializeLevel(levelString) {
    // get level name
    if (levelString.split("|").length == 1) {
        throw new Error("Missing separators");
    }
    var nameLength = levelString.split("|")[0];
    levelString = levelString.slice(nameLength.length + 1); // +1 is "|"
    nameLength = parseInt(nameLength);
    if (isNaN(nameLength)) {
        throw new Error("Invalid name length");
    }
    if (nameLength > Level.MAX_LEVELNAME_LENGTH) {
        throw new Error("Level name cannot exceed 140 characters");
    }
    var nameInfo = levelString.substring(0, nameLength);
    levelString = levelString.slice(nameLength + 1); // +1 is "|"

    // get level author name

    if (levelString.split("|").length == 1) {
        throw new Error("Missing separators");
    }
    var authorLength = levelString.split("|")[0];
    levelString = levelString.slice(authorLength.length + 1); // +1 is "|"
    authorLength = parseInt(authorLength);
    if (isNaN(authorLength)) {
        throw new Error("Invalid author length");
    }
    if (authorLength > Level.MAX_AUTHORNAME_LENGTH) {
        throw new Error("Level author name cannot exceed 140 characters");
    }
    var authorInfo = levelString.substring(0, authorLength);
    levelString = levelString.slice(authorLength + 1); // +1 is "|"

    // get grid size info

    var sizeInfo = /^W(\d+)H(\d+)/.exec(levelString);
    if (!sizeInfo) {
        throw new Error("Invalid size information");
    }
    var sizeX = parseInt(sizeInfo[1]);
    var sizeY = parseInt(sizeInfo[2]);
    if (isNaN(sizeX) || isNaN(sizeY)) {
        throw new Error("Invalid level sizes");
    }
    levelString = levelString.slice(sizeInfo[0].length + 1); // +1 is "|"

    // get WALLS info (if any)

    var walls = [];
    if (/^WALLS|/.exec(levelString)) {
        levelString = levelString.slice(6); // "WALLS|".length
        var wallsNumber = /^(\d+)|/.exec(levelString);
        if (!wallsNumber) {
            throw new Error("Invalid WALLS tag");
        }
        levelString = levelString.slice(wallsNumber[0].length + 1);
        for (var i = 0; i < parseInt(wallsNumber[1]); i++) {
            var wallInfo = /^(\d+)-(\d+)-(LEFT|RIGHT|UP|DOWN)\|/.exec(
                levelString
            );
            if (!wallInfo) {
                throw new Error("Invalid wall info for wall #" + i);
            }
            var x = parseInt(wallInfo[1]);
            var y = parseInt(wallInfo[2]);
            var dir = wallInfo[3];
            walls.push(new TileLinkDescriptor(x, y, dir));
            levelString = levelString.slice(wallInfo[0].length);
        }
    }

    // get DOORS info (if any)

    var doors = [];
    if (/^DOORS|/.exec(levelString)) {
        levelString = levelString.slice(6); // "DOORS|".length
        var doorsNumber = /^(\d+)|/.exec(levelString);
        if (!doorsNumber) {
            throw new Error("Invalid WALLS tag");
        }
        levelString = levelString.slice(doorsNumber[0].length + 1);
        for (var i = 0; i < parseInt(doorsNumber[1]); i++) {
            var doorInfo = /^(\d+)-(\d+)-(LEFT|RIGHT|UP|DOWN)\|/.exec(
                levelString
            );
            if (!doorInfo) {
                throw new Error("Invalid door info for door #" + i);
            }
            var x = parseInt(doorInfo[1]);
            var y = parseInt(doorInfo[2]);
            var dir = doorInfo[3];
            doors.push(new TileLinkDescriptor(x, y, dir));
            levelString = levelString.slice(doorInfo[0].length);
        }
    } else {
        throw new Error("No door information (level need at least 2)");
    }

    if (levelString.length > 0) {
        throw new Error(
            "Superfluous information at the end of level string: " + levelString
        );
    }

    return new Level(sizeX, sizeY, walls, doors, nameInfo, authorInfo);
}
