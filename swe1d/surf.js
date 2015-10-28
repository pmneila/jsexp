var canvas;
var canvasWidth = 500;
var canvasHeight = 500;

//World constants.
var gravity = 9.81;
var hmin = 0;
// Physical world.
var water = [];


// Time
var simStep = 1 / 60; //30FPS

//Display world
var ylim = [];

// Mouse.
var mouseX, mouseY, mouseDown;
var clickRadius = 30;

function init() {
    // init_controls();

    //dom objects
    canvas = document.getElementById("myCanvas");
    simulation = document.getElementById("simulation");

    //mouse event handlers
    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    window.addEventListener('resize', resizeCanvas, false);
    canvas.addEventListener("touchstart", onTouchStart, false);
    canvas.addEventListener("touchmove", onTouchMove, false);
    canvas.addEventListener("touchend", onTouchEnd, false);


    //set the canvas context
    ctx = canvas.getContext("2d");

    loadDambreak();
    resizeCanvas();

    setInterval(run, simStep * 1000);
}

function resizeCanvas() {
    canvasWidth = $("#simulation").width();
    canvasHeight = canvasWidth / water.L * (ylim[1] - ylim[0])
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    water.disp_x = water.x.map(world2canvas_x);
}

function loadDambreak() {
    //1D Dambreak, 10m height first half, 5m second half, 10m long.
    var npoints = 100;
    var L = 30;
    var cfl = 0.45;
    var surface = new Array(npoints);
    var xmomentum = new Array(npoints);
    ylim = [0, 11];

    for (var i = 0; i < npoints; i++) {
        surface[i] = (i < npoints / 2) ? 10 : 3;
        xmomentum[i] = 0;
    }
    water = createWater(surface, xmomentum, [npoints, L, cfl]);
}


function createWater(surface, xmomentum, meshdata) {
    var water = [];
    water = new Water(surface, xmomentum, meshdata);
    return water;
}


function Water(surface, xmomentum, meshdata) {
    this.surface = surface;
    this.h = surface.slice();
    this.xmomentum = xmomentum;
    this.n = meshdata[0];
    this.L = meshdata[1];
    this.dx = this.L / this.n;
    this.cfl = meshdata[2];
    this.x = [];
    this.t = 0;
    this.nstep = -1;
    for (var i = 0; i < this.surface.length; i++) {
        this.x.push(i * this.dx);
    }

    //mouse holding parameters
    this.hold = false; //is any point held?
    this.held_index = -1; //which point is held, if any
    this.sigma = this.L / 10; //variance of the gaussian pulse in world units

    //display parameters
    this.radius = 3; //Math.log(mass);
    this.style = "rgba(200, 255, 255, 1)";

    //save canvas coordinates to plot
    //add left and right margins and scale to plot
    this.disp_x = this.x.map(
        function(xi, index, x) {
            return xi * (canvasWidth) / x[x.length - 1]
        });

    //add top margin and scale to plot
    this.disp_surface = this.surface.map(
        function(surfi, index, surf) {
            return world2canvas_y(surfi)
        });

    this.drawCurrent = function() {
        // Update the view.
        ctx.clearRect(0,0,canvasWidth, canvasHeight)

	//Trace surface path
        ctx.beginPath();
        var floor_y = world2canvas_y(0)
        ctx.moveTo(water.disp_x[0], floor_y)
        for (var i = 0; i < water.x.length; i++) {
            ctx.lineTo(water.disp_x[i], water.disp_surface[i]);
        }
        ctx.lineTo(water.disp_x[water.x.length - 1], floor_y);

	//complete the drawing
	ctx.closePath();
        ctx.fillStyle = "rgba(64, 164, 223, 1.0)";
        ctx.fill();
	ctx.strokeStyle = "#999999";
	ctx.stroke();

	//write the timestamp
        ctx.font = "14px Arial"
        ctx.fillStyle = "#BBB";
        ctx.fillText(water.t.toFixed(2), 50, 50);
    }
    this.update = function(step) {
        if (this.hold) {
            splinePulse(); //mas controles aqui despues.
        }
        simulate(water, bcs_closed);
        water.drawCurrent();
    }

    this.setHold = function(val) {
        this.hold = val;
    }

}

function splinePulse() {
    //transform to canvas units
    var sigma = water.sigma;
    var center = water.x[water.held_index];
    var amplitude = Math.abs(canvas2world_y(mouseY) - water.surface[water.held_index]);

    //spline formula with 0 derivative at control points
    // p(t) = (2t^3-3t^2+1)p0 + (-2t^3+t^2)p1
    var x0 = canvas2world_x(mouseX) - sigma;
    var xf = canvas2world_x(mouseX) + sigma;
    var xmid = canvas2world_x(mouseX);

    var i0 = getNearestFVCell([world2canvas_x(x0), 0]);
    var iF = getNearestFVCell([world2canvas_x(xf), 0]);
    x0 = (x0 > 0) ? water.x[i0] : x0;
    xf = (xf < water.x[water.n - 1]) ? water.x[iF] : xf;


    var surf0 = water.surface[i0];
    var surff = water.surface[iF];
    var surfmid = canvas2world_y(mouseY);

    for (i = 0; i < water.n; ++i) {
        if (water.x[i] >= xf) {
            return
        } else if (water.x[i] >= x0 && water.x[i] <= xf) {

            if (water.x[i] < xmid) {
                var t = (water.x[i] - x0) / (xmid - x0);
                water.surface[i] = (2 * t * t * t - 3 * t * t + 1) * surf0;
                water.surface[i] += (-2 * t * t * t + 3 * t * t) * surfmid;
            } else {
                var t = (water.x[i] - xmid) / (xf - xmid);
                water.surface[i] = (2 * t * t * t - 3 * t * t + 1) * surfmid;
                water.surface[i] += (-2 * t * t * t + 3 * t * t) * surff;
            }

            water.h = water.surface.slice();
            water.disp_surface[i] = world2canvas_y(water.surface[i]);
        }
    }
}


function world2canvas_y(y) {
    return canvasHeight * (1 - (y - ylim[0]) / (ylim[1] - ylim[0]));
}

function canvas2world_y(yc) {
    return (1 - yc / canvasHeight) * (ylim[1] - ylim[0]) + ylim[0];
}

function world2canvas_x(x) {
    return x * canvasWidth / water.L;
}

function canvas2world_x(xc) {
    return (xc) * water.L / (canvasWidth);
}

function run() {
    water.update();
}

//mouse interaction


function onMouseDown(e) {
  //get first coordinate and hold the cell
    var ev = e ? e : window.event;
    mouseX = ev.pageX - simulation.offsetLeft;
    mouseY = ev.pageY - simulation.offsetTop;
    var held_index = getNearestFVCell([mouseX, mouseY]);
    holdFVCell(held_index);
}
function onMouseMove(e) {
    var ev = e ? e : window.event;
    //update held cell
    mouseX = ev.pageX - simulation.offsetLeft;
    mouseY = ev.pageY - simulation.offsetTop;
    if (water.hold)
        water.held_index = getNearestFVCell([mouseX, 0]);
}
function onMouseUp(e) {
    releaseFVCell();
}

function onTouchStart(e) {
    var ev = e ? e : window.event;
    e.preventDefault();
    mouseX = ev.targetTouches[0].pageX - simulation.offsetLeft;
    mouseY = ev.targetTouches[0].pageY - simulation.offsetTop;
    var held_index = getNearestFVCell([mouseX, mouseY]);
    holdFVCell(held_index);
}

function onTouchMove(e){
  var ev = e ? e: window.event;
  e.preventDefault();
  mouseX = ev.targetTouches[0].pageX - simulation.offsetLeft;
  mouseY = ev.targetTouches[0].pageY - simulation.offsetTop;
  if (water.hold)
      water.held_index = getNearestFVCell([mouseX, 0]);
}
function onTouchEnd(e){
  releaseFVCell();
}
// Touch events analogous to mouse events
//needed by mouse
function getNearestFVCell(pos) {
    var i = 0;
    var mindist = canvasWidth;
    var minloc;
    for (i = 0; i < water.x.length; i++) {
        var canvas_fv_x = water.disp_x[i];
        var canvas_fv_y = water.disp_surface[i];
        var dist = Math.abs(canvas_fv_x - pos[0]);

        if (dist < mindist) {
            mindist = dist;
            minloc = i;
        }
    }
    return minloc;
}

function holdFVCell(held_index) {
    if (held_index > -1) {
        water.held_index = held_index
        water.setHold(true)
    }
}

function releaseFVCell() {
    if (water.held_index > -1) {
        water.held_index = -1;
        water.setHold(false);
    }
}
