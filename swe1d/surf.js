var canvasWidth;
var canvasHeight;

// Physical world.
var particles = [];
var springs = [];

var simStep = 0.033;

function init()
{
    // init_controls();
    
    canvas = document.getElementById("myCanvas");
    simulation = document.getElementById("simulation");

    ctx = canvas.getContext("2d");
    
    loadPentagon();
    
    setInterval(run, simStep*1000);
}


function loadPentagon()
{
    var res = createPolygon([canvasWidth/2, canvasHeight/2], 50, 5);
    particles = res[0];
    springs = res[1];
}


//---Create Polygon stuff

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


function Particle(pos, vel)
{
    this.position = pos;
    this.radius = 3;//Math.log(mass);
    this.style = "rgba(200, 255, 255, 1)";
    
    this.force = [0,0];
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


//run and draw
function run()
{
     
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
    
    // if(scaleAlpha > 0)
    // {
    //     drawScale(scaleAlpha);
    //     scaleAlpha -= 0.01;
    // }
}

