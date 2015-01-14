/*global Grid, Tile, TileLink, TileLinkDescriptor */
"use strict";

var AlcazarAI = function(level) {
    this.level = level;
};

AlcazarAI.prototype.solve = function() {
    var wallUnstable = true;
    var pathUnstable = true;
    while (wallUnstable || pathUnstable) {
        wallUnstable = this.fillObviousWalls();
        pathUnstable = this.fillObviousPaths();
    }
};

AlcazarAI.prototype.fillObviousWalls = function() {
    // Fill tiles with two paths => other two links are walls
    // return true if any link is changed
    var foundObviousWall = false;
    for (var i = this.level.grid.sizeX - 1; i >= 0; i--) {
        for (var j = this.level.grid.sizeY - 1; j >= 0; j--) {
            var tile = this.level.grid.getTile(i, j);
            var neighborPaths = tile.getNeighborPaths();
            if (neighborPaths.length > 2) {
                throw new Error("Level in invalid state: Tile with more than 2 paths");
            } else if (neighborPaths.length == 2) {
                // exactly two neighbor paths => any clear neighbor link can be a wall
                var neighborClears = tile.getNeighborClears();
                for (var c = neighborClears.length - 1; c >= 0; c--) {
                    var link = neighborClears[c];
                    link.state = TileLink.stateEnum.USER_WALL;
                    foundObviousWall = true;
                }
            }
        }
    }
    return foundObviousWall;
};

AlcazarAI.prototype.fillObviousPaths = function() {
    // Fill tiles with two walls => other two links are paths
    // return true if any link is changed
    var foundObviousPath = false;
    for (var i = this.level.grid.sizeX - 1; i >= 0; i--) {
        for (var j = this.level.grid.sizeY - 1; j >= 0; j--) {
            var tile = this.level.grid.getTile(i, j);
            var neighborWalls = tile.getNeighborWalls();
            // dirty trick for borders: count them as missing neighbor links
            var neighborLinks = tile.getNeighborLinks();
            var wallCount = neighborWalls.length + (4 - neighborLinks.length);
            if (wallCount > 2) {
                throw new Error("Level in invalid state: Tile with more than 2 paths");
            } else if (wallCount == 2) {
                // exactly two neighbor walls => any clear neighbor link can be a path
                var neighborClears = tile.getNeighborClears();
                for (var c = neighborClears.length - 1; c >= 0; c--) {
                    var link = neighborClears[c];
                    link.state = TileLink.stateEnum.IN_PATH;
                    foundObviousPath = true;
                }
            }
        }
    }
    return foundObviousPath;
};
