/*global Grid, Tile, TileLink, TileLinkDescriptor */
"use strict";

var AlcazarAI = function (level) {
  this.level = level;
};

AlcazarAI.prototype.solve = function () {
  while (true) {
    // apply "trivial" procedures until it is not efficient anymore
    var wallUnstable = true;
    var pathUnstable = true;
    var loopUnstable = true;
    var doorUnstable = true;
    while (wallUnstable || pathUnstable || loopUnstable || doorUnstable) {
      wallUnstable = this.fillObviousWalls();
      pathUnstable = this.fillObviousPaths();
      loopUnstable = this.preventObviousLoops();
      doorUnstable = this.openCloseObviousDoors();
    }

    break; // todo: add random walls (one level, then two, then ... )
  }
};

AlcazarAI.prototype.fillObviousWalls = function () {
  // Fill tiles with two paths => other two links are walls
  // return true if any link is changed
  var foundObviousWall = false;
  for (var i = this.level.grid.sizeX - 1; i >= 0; i--) {
    for (var j = this.level.grid.sizeY - 1; j >= 0; j--) {
      var tile = this.level.grid.getTile(i, j);
      var neighborPaths = tile.getNeighborPaths();
      if (neighborPaths.length > 2) {
        throw new Error(
          "Tile " + String(i) + ", " + String(j) + " has more than 2 paths"
        );
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

AlcazarAI.prototype.fillObviousPaths = function () {
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
        throw new Error(
          "Tile " + String(i) + ", " + String(j) + " with more than 2 walls"
        );
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

AlcazarAI.prototype.preventObviousLoops = function () {
  // Prevent partial paths to form a loop, i.e:
  // if both ends are adjacent, add a wall between them
  // if both ends are one tile apart, prevent the separation tile to connect them (if possible)
  // return true if any link is changed
  var foundPreventableLoop = false;

  var i, j;

  // create marker array with the same size as the level
  // to mark already visited loop/tiles
  var marks = [];
  for (i = 0; i < this.level.grid.sizeX; i++) {
    marks.push([]);
    for (j = 0; j < this.level.grid.sizeY; j++) {
      marks[i].push(false);
    }
  }
  marks[-1] = [];
  marks[-1][-1] = false; // outerTile

  // look for partial paths endpoints (tile with exactly one path link)
  for (i = this.level.grid.sizeX - 1; i >= 0; i--) {
    for (j = this.level.grid.sizeY - 1; j >= 0; j--) {
      var firstTile = this.level.grid.getTile(i, j);
      var firstPaths = firstTile.getNeighborPaths();
      var firstPathCount = firstPaths.length;
      if (firstPathCount > 2) {
        throw new Error(
          "Tile " + String(i) + ", " + String(j) + " has more than 2 paths"
        );
      }
      if (firstPathCount == 1 && marks[i][j] === false) {
        // find other endpoint
        var pathLength = 2;
        var currentLink = firstPaths[0];
        var currentTile = currentLink.other(firstTile);
        while (currentTile.getNeighborPaths().length == 2) {
          if (currentTile === firstTile) {
            throw new Error(
              "Loop detected at tile " + String(i) + ", " + String(j)
            );
          }
          var paths = currentTile.getNeighborPaths();
          pathLength = pathLength + 1;
          currentLink = paths[0] === currentLink ? paths[1] : paths[0];
          currentTile = currentLink.other(currentTile);
        }
        var lastTile = currentTile;
        // mark both endpoints
        marks[firstTile.x][firstTile.y] = true;
        marks[lastTile.x][lastTile.y] = true;

        // skip trivial paths (only one link)
        if (pathLength == 2) {
          continue;
        }

        // compare endpoints position
        var dx = lastTile.x - firstTile.x;
        var dy = lastTile.y - firstTile.y;

        // handle adjacent endpoints
        var separationLink = null;
        if (dy === 0) {
          if (dx == 1) {
            separationLink = firstTile.neighborLinks[Tile.directions.RIGHT];
          } else if (dx == -1) {
            separationLink = firstTile.neighborLinks[Tile.directions.LEFT];
          }
        } else if (dx === 0) {
          if (dy == 1) {
            separationLink = firstTile.neighborLinks[Tile.directions.DOWN];
          } else if (dy == -1) {
            separationLink = firstTile.neighborLinks[Tile.directions.UP];
          }
        }
        if (separationLink !== null) {
          if (separationLink.state == TileLink.stateEnum.IN_PATH) {
            throw new Error(
              "Invalid State: loop separation link in path " +
                String(i) +
                ", " +
                String(j)
            );
          }
          if (separationLink.state == TileLink.stateEnum.CLEAR) {
            foundPreventableLoop = true;
            separationLink.state = TileLink.stateEnum.USER_WALL;
          }
        }

        // handle bouncing (endpoints separated by one tile)
        // we have possible bouncing here if abs(dx) === abs(dy) === 1
        // then we must check the diagonally adjacent tile
        // TODOOOO...

        // If one of the endpoint is the outerTile (i.e. the path contain a door),
        // and the other endpoint is next to a door --> close the door
        var notOuterEndTile = null;
        var outerTile = this.level.grid.outerTile;
        if (firstTile === outerTile || lastTile === outerTile) {
          if (firstTile === outerTile) {
            notOuterEndTile = lastTile;
          }
          if (lastTile === outerTile) {
            notOuterEndTile = firstTile;
          }

          var doors = this.level.grid.getDoors();

          // check if notouter adjacent to a door
          for (var d = doors.length - 1; d >= 0; d--) {
            var doorLink = this.level.grid.getLink(doors[d]);
            var neighborLinks = notOuterEndTile.getNeighborLinks();
            for (var l = 0; l < neighborLinks.length; l++) {
              var link = neighborLinks[l];
              if (link === doorLink) {
                // make sure that we are not closing the last door
                // in that case it will be in IN_PATH state after this
                this.openCloseObviousDoors();

                if (link.state === TileLink.stateEnum.CLEAR) {
                  link.state = TileLink.stateEnum.USER_WALL;
                  foundPreventableLoop = true;
                }
              }
            }
          }
        }
      }
    }
  }

  return foundPreventableLoop;
};

AlcazarAI.prototype.bounce = function(x, y, direction) {
  // TODO
};

AlcazarAI.prototype.openCloseObviousDoors = function (first_argument) {
  // Only two doors must be used in the path
  // I.e. if two doors are left open, use them
  // and if two doors are already used, close the others
  // return true if any link is changed
  var changedDoorState = false;

  var doors = this.level.grid.getDoors();
  var openDoors = [];
  for (var i = doors.length - 1; i >= 0; i--) {
    var doorLink = this.level.grid.getLink(doors[i]);
    if (doorLink.state != TileLink.stateEnum.USER_WALL) {
      openDoors.push(doorLink);
    }
  }

  if (openDoors.length < 2) {
    throw new Error("Not enough open doors left");
  } else if (openDoors.length == 2) {
    var firstDoor = openDoors[0];
    var secondDoor = openDoors[1];
    if (firstDoor.state != TileLink.stateEnum.IN_PATH) {
      firstDoor.state = TileLink.stateEnum.IN_PATH;
      changedDoorState = true;
    }
    if (secondDoor.state != TileLink.stateEnum.IN_PATH) {
      secondDoor.state = TileLink.stateEnum.IN_PATH;
      changedDoorState = true;
    }
  } else {
    // more than two open doors
    // if two are in the path => close the others
    var doors_inpath = [];
    for (var j = openDoors.length - 1; j >= 0; j--) {
      var door = openDoors[j];
      if (door.state == TileLink.stateEnum.IN_PATH) {
        doors_inpath.push(door);
      }
    }

    if (doors_inpath.length == 2) {
      for (var k = openDoors.length - 1; k >= 0; k--) {
        if (openDoors[k].state == TileLink.stateEnum.CLEAR) {
          openDoors[k].state = TileLink.stateEnum.USER_WALL;
          changedDoorState = true;
        }
      }
    } else if (doors_inpath.length > 2) {
      throw new Error("More than two used doors");
    }
  }

  return changedDoorState;
};
