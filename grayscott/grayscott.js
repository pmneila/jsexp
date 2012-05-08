
/* 
 * Gray-Scott
 *
 * A solver of the Gray-Scott model of reaction diffusion.
 *
 * ©2011 pmneila.
 * p.mneila at upm.es
 */

// Canvas.
var canvas;
var canvasWidth = 128;
var canvasHeight = 128;
var canvasScale = 4.0;
var ctx;
var mouseDown = false;
var mouseX, mouseY;
var simulation;

// Configuration.
var feed = 0.033;
var kill = 0.06;
var timeStep = 1.0;

// Buffers.
var buffer;
var imageData;
var srcBuffer = 0;

// Some presets.
var presets = [
    { // Default
        feed: 0.033,
        kill: 0.060
    },
    { // Mitosis
        feed: 0.047,
        kill: 0.073
    },
    { // Blobs
        feed: 0.033,
        kill: 0.064
    },
    { // Mazes
        feed: 0.032,
        kill: 0.057
    },
    { // Holes
        feed: 0.033,
        kill: 0.054
    },
    { // Pulsating blobs
        feed: 0.012,
        kill: 0.044
    },
    { // Waves
        feed: 0.006,
        kill: 0.037
    }
];

function init()
{
	init_controls();
	
    canvas = document.getElementById("myCanvas");
    // Fix a bug in the mouse behavior in Firefox.
    simulation = document.getElementById("simulation");
    
    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;
    ctx = canvas.getContext("2d");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Initialize the buffers.
    buffer = new Array(2); // Double buffer.
    buffer[0] = new Array(2); // Two components.
    buffer[1] = new Array(2);
    buffer[0][0] = new Array(canvasHeight);
    buffer[0][1] = new Array(canvasHeight);
    buffer[1][0] = new Array(canvasHeight);
    buffer[1][1] = new Array(canvasHeight);
    for(var i=0; i<canvasHeight; i++)
    {
        buffer[0][0][i] = new Array(canvasWidth);
        buffer[0][1][i] = new Array(canvasWidth);
        buffer[1][0][i] = new Array(canvasWidth);
        buffer[1][1][i] = new Array(canvasWidth);
    }
    
    // Create the image data object
    imageData = ctx.createImageData(canvasWidth, canvasHeight);
    
    clean();
    setInterval(run, 10);
}

function run()
{
    ctx.strokeStyle = "rgba(255, 255, 255, 255)";
    ctx.fillStyle = ctx.strokeStyle;
    
    // Double buffer.
    src = buffer[srcBuffer];
    dst = buffer[1 - srcBuffer];
    src_u = src[0];
    src_v = src[1];
    dst_u = dst[0];
    dst_v = dst[1];
    
    // Solve the PDEs.
    var imgd = imageData.data;
    for(i=1; i<canvasHeight-1; i++)
    {
        base = i*imageData.width*4;
        for(j=1; j<canvasWidth-1; j++)
        {
            u = src_u[i][j];
            v = src_v[i][j];
            lapl_u = src_u[i+1][j]+src_u[i-1][j]+src_u[i][j+1]+src_u[i][j-1]-4*u;
            lapl_v = src_v[i+1][j]+src_v[i-1][j]+src_v[i][j+1]+src_v[i][j-1]-4*v;
            uvv = u*v*v;
            du = 0.095*lapl_u - uvv + feed*(1-u);
            dv = 0.03*lapl_v + uvv - (feed+kill)*v;
            dst_u[i][j] = u + du*timeStep;
            dst_v[i][j] = v + dv*timeStep;
            
            idx = base + j*4;
            imgd[idx] = dst_v[i][j]*255;
            imgd[idx+1] = dst_v[i][j]*255;
            imgd[idx+2] = dst_v[i][j]*255;
            imgd[idx+3] = 255;
        }
    }
    
    // Update the image.
    ctx.putImageData(imageData, 0, 0);
    srcBuffer = 1 - srcBuffer;
}

// Clear the screen.
function clean()
{
    for(var i=0; i<canvasHeight; i++)
    {
        for(var j=0; j<canvasWidth; j++)
        {
            buffer[0][0][i][j] = 0.5;
            buffer[0][1][i][j] = 0;
            buffer[1][0][i][j] = 0;
            buffer[1][1][i][j] = 0;
        }
    }
}

function loadPreset(idx)
{
    feed = presets[idx].feed;
    kill = presets[idx].kill;
    worldToForm();
}

function brush(x, y)
{
    b = buffer[srcBuffer][1];
    if(x-3<=0 || x+4>=canvasWidth || y-3<=0 || y+4>=canvasHeight)
        return;
    
    for(i=y-3; i<=y+3; i++)
    {
        for(j=x-3; j<=x+3; j++)
        {
            b[i][j] = 0.9;
        }
    }
}

function onMouseMove(e)
{
    var ev = e ? e : window.event;
    mouseX = Math.round((ev.clientX - simulation.offsetLeft)/canvasScale);
    mouseY = Math.round((ev.clientY - simulation.offsetTop)/canvasScale);
    
    if(mouseDown)
        brush(mouseX, mouseY);
}

function onMouseDown(e)
{
    var ev = e ? e : window.event;
    mouseDown = true;
    
    brush(mouseX, mouseY);
}

function onMouseUp(e)
{
    mouseDown = false;
}

function worldToForm()
{
    //document.ex.sldReplenishment.value = feed * 1000;
    $("#sld_replenishment").slider("value", feed);
    $("#sld_diminishment").slider("value", kill);
}

function init_controls()
{
	$("#sld_replenishment").slider({
		value: 0.033, min: 0, max:0.1, step:0.001,
		change: function(event, ui) {$("#replenishment").html(ui.value); feed = ui.value;},
		slide: function(event, ui) {$("#replenishment").html(ui.value); feed = ui.value;}
	});
	$("#sld_replenishment").slider("value", 0.033);
	$("#sld_diminishment").slider({
		value: 0.060, min: 0, max:0.073, step:0.001,
		change: function(event, ui) {$("#diminishment").html(ui.value); kill = ui.value;},
		slide: function(event, ui) {$("#diminishment").html(ui.value); kill = ui.value;}
	});
	$("#sld_diminishment").slider("value", 0.060);
}
