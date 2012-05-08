
/* 
 * Particles
 *
 * A simple mass-spring simulator.
 *
 * ©2010 pmneila
 * p.mneila at upm.es
 */

// Canvas.
var canvas;
var canvasWidth = 1000;
var canvasHeight = 500;
var ctx;
var simulation;

// World constants.
var airFriction = 0.05;
var floorFriction = 0.8;
var gravity = 9.8;
var pixelsPerMeter = 50;

var particleMass = 0.1;

var springLength = 100; // In pixels.
var springStiffness = 0.5;
var springDamping = 0.2;

// Physical world.
var particles = [];
var springs = [];

// Mouse.
var mouseX, mouseY, mouseDown;
var clickRadius = 30;
var heldParticle = 0;

// Time variables.
var simStep = 0.033;
var simSpeedup = 1;

// Scale show.
var scaleAlpha = 0;

function Particle(pos, vel)
{
    this.position = pos;
    this.velocity = vel;
    this.radius = 3;//Math.log(mass);
    this.style = "rgba(200, 255, 255, 1)";
    this.hold = false;
    this.pin = false;
    
    this.force = [0,0];
    
    this.update = function(step) 
    {
        // Ignore held particles.
        if(this.hold)
        {
            this.velocity = [0,0];
            this.position = [mouseX, mouseY];
            this.force = [0,0];
            return;
        }
        
        if(this.pin)
        {
            this.velocity = [0,0];
            this.force = [0,0];
            return;
        }
        
        // Euler method (slightly different version).
        this.velocity[0] += this.force[0] * step / particleMass;
        this.velocity[1] += this.force[1] * step / particleMass;
        this.position[0] += pixelsPerMeter * this.velocity[0] * step;
        this.position[1] += pixelsPerMeter * this.velocity[1] * step;
        
        // Rough collision detection.
        if(this.position[0] < 0)
        {
            this.position[0] = 0;
            if(this.velocity[0] < 0)
                this.velocity[0] = 0;
            this.velocity[1] -= floorFriction * this.velocity[1];
        }
        if(this.position[1] < 0)
        {
            this.position[1] = 0;
            if(this.velocity[1] < 0)
                this.velocity[1] = 0;
            this.velocity[0] -= floorFriction * this.velocity[0];
        }
        if(this.position[0] > canvasWidth)
        {
            this.position[0] = canvasWidth;
            if(this.velocity[0] > 0)
                this.velocity[0] = 0;
            this.velocity[1] -= floorFriction * this.velocity[1];
        }
        if(this.position[1] > canvasHeight)
        {
            this.position[1] = canvasHeight;
            if(this.velocity[1] > 0)
                this.velocity[1] = 0;
            this.velocity[0] -= floorFriction * this.velocity[0];
        }
        
        this.force = [0,0];
    }
    
    this.addForce = function(force)
    {
        this.force[0] += force[0];
        this.force[1] += force[1];
    }
    
    this.addGravity = function()
    {
        this.addForce([0, particleMass * gravity]);
    }
    
    this.addAirFriction = function()
    {
        this.force[0] -= this.velocity[0] * airFriction;
        this.force[1] -= this.velocity[1] * airFriction;
    }
    
    this.setHold = function(val)
    {
        this.hold = val;
    }
    
    this.setPin = function(val)
    {
        this.pin = val;
        if(val)
            this.style = "rgba(200, 100, 100, 1)";
        else
            this.style = "rgba(200, 255, 255, 1)";
    }
}

function Spring(p1, p2)
{
    this.particle1 = p1;
    this.particle2 = p2;
    this.length = 0;
    this.v12 = [0,0];
    this.dir12 = [0,0];
    
    this.updateValues = function()
    {
        var p1 = this.particle1;
        var p2 = this.particle2;
        this.v12 = [p2.position[0] - p1.position[0], p2.position[1] - p1.position[1]];
        this.length = norm(this.v12);
        if(this.length == 0)
        {
            this.v12 = [Math.random()/10 - 0.05, Math.random()/10 - 0.05];
            this.length = norm(this.v12);
        }
        this.dir12 = [this.v12[0]/this.length, this.v12[1]/this.length];
    }
    
    this.getVector12 = function()
    {
        return this.v12;
    }
    
    this.getVector21 = function()
    {
        return [-this.v12[0], -this.v12[1]];
    }
    
    this.getDir12 = function()
    {
        return this.dir12;
    }
    
    this.getDir21 = function()
    {
        return [-this.dir12[0], -this.dir12[1]]
    }
    
    this.getLength = function()
    {
        return this.length;
    }
}

function init()
{
	init_controls();
	
    canvas = document.getElementById("myCanvas");
    simulation = document.getElementById("simulation");
    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;
    ctx = canvas.getContext("2d");
    
    loadPentagon();
    
    setInterval(run, simStep*1000);
}

function createPolygon(center, radius, nsides)
{
    var particles = [];
    var springs = [];
    
    var i = 0;
    for(i = 0; i < nsides; ++i)
    {
        var angle = i*2*Math.PI/nsides + 0.1;
        var x =  center[0] + radius * Math.cos(angle);
        var y = center[1] + radius * Math.sin(angle);
        particles[i] = new Particle([x,y], [0,0]);
        
        var j;
        for(j = 0; j < i; ++j)
            springs.push(new Spring(particles[i], particles[j]));
    }
    
    return [particles, springs];
}

function createGrid(lu, M, N, side)
{
    var particles = [];
    var springs = [];
    
    var i, j;
    for(i = 0; i < M; ++i)
    {
        var y = lu[1] + i*side;
        for(j = 0; j < N; ++j)
        {
            var x = lu[0] + j*side;
            var idx = i * N + j;
            particles[idx] = new Particle([x,y], [0,0]);
            if(j > 0)
                springs.push(new Spring(particles[idx], particles[idx-1]));
            if(i > 0)
                springs.push(new Spring(particles[idx], particles[idx-N]));
            if(i==0 && j%3==0)
                particles[idx].setPin(true);
        }
    }
    
    return [particles, springs];
}

function run()
{
    // Update forces.
    var i;
    for(i in springs)
    {
        var s = springs[i];
        var p = s.particle1;
        var q = s.particle2;
        
        s.updateValues();
        var r = s.getLength();
        var dir12 = s.getDir12();
        var cte = springStiffness * (r - springLength);
        cte -= springDamping * dot(diff(p.velocity, q.velocity), dir12);
        var force1 = [cte*dir12[0], cte*dir12[1]];
        var force2 = [-force1[0], -force1[1]];
        p.addForce(force1);
        q.addForce(force2);
    }
    
    for(i in particles)
    {
        var p = particles[i];
        p.addAirFriction();
        p.addGravity();
        p.update(simStep * simSpeedup);
    }
    
    // Update the view.
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";//"#000000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.strokeStyle = "#666666";
    for(i in springs)
    {
        var s = springs[i];
        var p = s.particle1;
        var q = s.particle2;
        ctx.beginPath();
        ctx.moveTo(p.position[0], p.position[1]);
        ctx.lineTo(q.position[0], q.position[1]);
        ctx.stroke();
    }
    
    for(i in particles)
    {
        var p = particles[i];
        ctx.fillStyle = p.style;
        ctx.beginPath();
        ctx.arc(p.position[0], p.position[1], p.radius, 0, 2*Math.PI, false);
        ctx.closePath();
        ctx.fill();
    }
    
    if(scaleAlpha > 0)
    {
        drawScale(scaleAlpha);
        scaleAlpha -= 0.01;
    }
}

function drawScale(scaleAlpha)
{
    ctx.strokeStyle = "rgba(255, 255, 255, " + scaleAlpha + ")";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    // Top line.
    ctx.moveTo(5, 20);
    ctx.lineTo(canvasWidth/2-40, 20);
    ctx.moveTo(canvasWidth/2+40, 20);
    ctx.lineTo(canvasWidth-5, 20);
    // Right line.
    ctx.moveTo(canvasWidth-20, 5);
    ctx.lineTo(canvasWidth-20, canvasHeight/2-40);
    ctx.moveTo(canvasWidth-20, canvasHeight/2+40);
    ctx.lineTo(canvasWidth-20, canvasHeight-5);
    ctx.stroke();
    // Top text.
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((canvasWidth/pixelsPerMeter).toFixed(2) + "m", canvasWidth/2, 20);
    // Right text.
    ctx.save();
    ctx.translate(canvasWidth-20, canvasHeight/2);
    ctx.rotate(Math.PI/2);
    ctx.fillText((canvasHeight/pixelsPerMeter).toFixed(2) + "m", 0, 0);
    ctx.restore();
}

function getNearestParticle(pos)
{
    var i = 0;
    for(i = 0; i < particles.length; ++i)
    {
        var p = particles[i];
        var dist = norm(diff(p.position, pos));
        if(dist < clickRadius)
            return p;
    }
    return 0;
}

function holdParticle(p)
{
    if(p != 0)
    {
        heldParticle = p;
        heldParticle.setHold(true);
    }
}

function releaseParticle()
{
    if(!heldParticle)
        return;
    
    heldParticle.setHold(false);
    heldParticle = 0;
}

function diff(p1, p2)
{
    var res = [];
    var i = 0;
    for(i = 0; i < p1.length; ++i)
        res[i] = p1[i] - p2[i];
    return res;
}

function dot(v1, v2)
{
    var sum = 0;
    var i;
    for (i in v1)
        sum += v1[i]*v2[i];
    return sum;
}

function norm(vector)
{
    var sum = 0;
    var i;
    for (i in vector)
        sum += vector[i]*vector[i];
    return Math.sqrt(sum);
}

function onMouseMove(e)
{
    var ev = e ? e : window.event;
    mouseX = ev.pageX - simulation.offsetLeft;
    mouseY = ev.pageY - simulation.offsetTop;
}

function onMouseDown(e)
{
    var ev = e ? e : window.event;
    mouseDown = true;
    var p = getNearestParticle([mouseX, mouseY]);
    if(!p)
        return;
    
    if(ev.button == 0)
        holdParticle(p);
    if(ev.button == 1)
        p.setPin(!p.pin);
}

function onMouseUp(e)
{
    mouseDown = false;
    releaseParticle();
}

function worldToForm()
{
    $("#sld_gravity").slider("value", gravity);
    $("#sld_length").slider("value", springLength);
    $("#sld_stiffness").slider("value", springStiffness);
    $("#sld_floor_friction").slider("value", floorFriction);
    $("#sld_air_friction").slider("value", airFriction);
    $("#sld_mass").slider("value", particleMass);
}

function init_controls()
{
	$("#sld_air_friction").slider({
		value: 0.05, min: -0.05, max:1, step:0.05,
		change: function(event, ui) {$("#airFriction").html(ui.value); airFriction = ui.value;},
		slide: function(event, ui) {$("#airFriction").html(ui.value); airFriction = ui.value;}
	});
	$("#sld_floor_friction").slider({
		value: 0.8, min: -0.1, max:1, step:0.05,
		change: function(event, ui) {$("#floorFriction").html(ui.value); floorFriction = ui.value;},
		slide: function(event, ui) {$("#floorFriction").html(ui.value); floorFriction = ui.value;}
	});
	$("#sld_gravity").slider({
		value: 9.8, min: -10, max:40, step:0.1,
		change: function(event, ui) {$("#gravity").html(ui.value); gravity = ui.value;},
		slide: function(event, ui) {$("#gravity").html(ui.value); gravity = ui.value;}
	});
	$("#sld_mass").slider({
		value: 0.1, min: 0.1, max:2, step:0.1,
		change: function(event, ui) {$("#mass").html(ui.value); particleMass = ui.value;},
		slide: function(event, ui) {$("#mass").html(ui.value); particleMass = ui.value;}
	});
	$("#sld_length").slider({
		value: 100, min: 20, max:150, step:1,
		change: function(event, ui) {$("#length").html(ui.value); springLength = ui.value;},
		slide: function(event, ui) {$("#length").html(ui.value); springLength = ui.value;}
	});
	$("#sld_stiffness").slider({
		value: 0.5, min: 0.1, max:2, step:0.1,
		change: function(event, ui) {$("#stiffness").html(ui.value); springStiffness = ui.value;},
		slide: function(event, ui) {$("#stiffness").html(ui.value); springStiffness = ui.value;}
	});
	//$("#btn_reset").button();
}

function showScale()
{
    scaleAlpha = 1;
}

function showParticles()
{
    var i;
    for (i in particles)
    {
        var p = particles[i];
        alert(p.position);
    }
}
