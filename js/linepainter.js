/* global Tile, TileLink, W, H */
// TODO? remove the use of W and H

"use strict";

var LinePainter = function () {
  this.level = undefined;
  this.clickX = [];
  this.clickY = [];
  this.clickDrag = [];
};

LinePainter.prototype.addMousePosition = function (x, y, dragging) {
  this.clickX.push(x);
  this.clickY.push(y);
  this.clickDrag.push(dragging);
};

LinePainter.prototype.cleanLines = function () {
  this.clickX = [];
  this.clickY = [];
  this.clickDrag = [];
};

LinePainter.prototype.computeLines = function () {
  var found_borders = [];

  var rel_previous_x = 0;
  var rel_previous_y = 0;
  var linkDescr = { x: 0, y: 0, dir: Tile.directions.TOP };
  var doors = this.level.grid.getDoors();
  for (var i = 0; i < this.clickX.length; i++) {
    var posx = this.clickX[i] - W / 2;
    var posy = this.clickY[i] - H / 2;

    // this part is pretty ugly, but I don't want to change your js files
    var nbtiles_x = this.level.grid.sizeX;
    var nbtiles_y = this.level.grid.sizeY;
    var width_board = nbtiles_x * this.level.tileSize;
    var height_board = nbtiles_y * this.level.tileSize;
    var middle_x = width_board / 2;
    var middle_y = height_board / 2;

    var crossed_line = false;

    var relative_position_x = posx + middle_x;
    var relative_position_y = posy + middle_y;
    //var relative_link_x = level.tileSize * linkDescr.x;
    //var relative_link_y = level.tileSize * linkDescr.y;

    if (i === 0) {
      rel_previous_x = relative_position_x;
      rel_previous_y = relative_position_y;
    }

    // check for doors
    for (var doori = 0; doori < doors.length; doori++) {
      var curr_door = doors[doori];
      var crossing = false;
      var borderx = curr_door.x * this.level.tileSize;
      var bordery = curr_door.y * this.level.tileSize;
      var borderx2 = borderx; // +  this.level.tileSize;
      var bordery2 = bordery; // +  this.level.tileSize;

      switch (curr_door.dir) {
        case Tile.directions.UP:
          borderx2 += this.level.tileSize;
          break;
        case Tile.directions.DOWN:
          bordery += this.level.tileSize;
          bordery2 += this.level.tileSize;
          borderx2 += this.level.tileSize;
          break;
        case Tile.directions.LEFT:
          bordery2 += this.level.tileSize;
          break;
        case Tile.directions.RIGHT:
          borderx += this.level.tileSize;
          borderx2 += this.level.tileSize;
          bordery2 += this.level.tileSize;
          break;
      }
      crossing = lineIntersect(
        borderx,
        bordery,
        borderx2,
        bordery2, // line 1 : border
        relative_position_x,
        relative_position_y,
        rel_previous_x,
        rel_previous_y // line 2 : points
      );
      if (crossing) {
        var link = this.level.grid.getLink(curr_door);
        if (link && found_borders.indexOf(link) == -1) found_borders.push(link);
      }
    }

    // check for left and top borders of each tile
    for (var w = 0; w < nbtiles_x; w++) {
      for (var h = 0; h < nbtiles_y; h++) {
        linkDescr.x = w;
        linkDescr.y = h;
        var borderx = linkDescr.x * this.level.tileSize;
        var bordery = linkDescr.y * this.level.tileSize;
        var crossing_top = lineIntersect(
          // line 1 : top border
          borderx,
          bordery,
          borderx + this.level.tileSize,
          bordery,
          // line 2 : between the two last points
          relative_position_x,
          relative_position_y,
          rel_previous_x,
          rel_previous_y
        );
        if (crossing_top) {
          // I went for left and top but top is not working, don't ask me why, so here is a correction for down
          linkDescr.dir = Tile.directions.DOWN;
          if (linkDescr.y > 0) {
            linkDescr.y--;
            var link = this.level.grid.getLink(linkDescr);
            if (link && found_borders.indexOf(link) == -1) {
              found_borders.push(link);
            }
          }
        }

        var crossing_left = lineIntersect(
          // line 1 : left border
          borderx,
          bordery,
          borderx,
          bordery + this.level.tileSize,
          // line 2 : between the two last points
          relative_position_x,
          relative_position_y,
          rel_previous_x,
          rel_previous_y
        );
        if (crossing_left) {
          linkDescr.dir = Tile.directions.LEFT;
          var link = this.level.grid.getLink(linkDescr);
          if (link && found_borders.indexOf(link) == -1) {
            found_borders.push(link);
          }
        }
      }
    }
    rel_previous_x = relative_position_x;
    rel_previous_y = relative_position_y;
  }
  for (var i = 0; i < found_borders.length; i++) {
    var link = found_borders[i];
    if (link && link.lockLevel < 1) {
      switch (link.state) {
        case TileLink.stateEnum.CLEAR:
          link.state = TileLink.stateEnum.IN_PATH;
          break;
        case TileLink.stateEnum.IN_PATH:
        case TileLink.stateEnum.USER_WALL:
          link.state = TileLink.stateEnum.CLEAR;
          break;
      }
      link.highlighted = true;
    }
  }
  this.cleanLines();
};

LinePainter.prototype.drawLines = function (ctx) {
  ctx.strokeStyle = "blue";
  ctx.lineJoin = "round";
  ctx.lineWidth = this.level.tileSize / 5;

  for (var i = 0; i < this.clickX.length; i++) {
    ctx.beginPath();
    if (this.clickDrag[i] && i) {
      //~ ctx.fillRect(this.clickX[i-1], this.clickY[i-1], 10, 10);
      ctx.moveTo(this.clickX[i - 1], this.clickY[i - 1]);
    } else {
      ctx.moveTo(this.clickX[i] - 1, this.clickY[i]);
      //~ ctx.fillRect(this.clickX[i] - 1, this.clickY[i], 10, 10);
    }
    ctx.lineTo(this.clickX[i], this.clickY[i]);
    ctx.closePath();
    ctx.stroke();
  }
};

// helper function
function lineIntersect(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
  var s1_x, s1_y, s2_x, s2_y;
  s1_x = p1_x - p0_x;
  s1_y = p1_y - p0_y;
  s2_x = p3_x - p2_x;
  s2_y = p3_y - p2_y;

  var s, t;
  s =
    (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) /
    (-s2_x * s1_y + s1_x * s2_y);
  t =
    (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) /
    (-s2_x * s1_y + s1_x * s2_y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    // Collision detected
    return true;
  }

  return false; // No collision
}
