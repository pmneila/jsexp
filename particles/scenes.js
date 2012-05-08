
function loadPentagon()
{
    airFriction = 0.05;
    floorFriction = 0.8;
    gravity = 9.8;
    pixelsPerMeter = 50;
    
    particleMass = 0.1;
    
    springLength = 100; // In pixels.
    springStiffness = 0.5;
    springDamping = 0.2;
    
    initialMass = 0.1;
    
    worldToForm();
    
    var res = createPolygon([canvasWidth/2, canvasHeight/2], 50, 5);
    particles = res[0];
    springs = res[1];
}

function loadHexagon()
{
    airFriction = 0.05;
    floorFriction = 0.8;
    gravity = 9.8;
    pixelsPerMeter = 50;
    
    particleMass = 0.1;
    
    springLength = 100; // In pixels.
    springStiffness = 0.5;
    springDamping = 0.2;
    
    initialMass = 0.1;
    
    worldToForm();
    
    var res = createPolygon([canvasWidth/2, canvasHeight/2], 50, 6);
    particles = res[0];
    springs = res[1];
}

function loadFabric()
{
    airFriction = 0.05;
    floorFriction = 0.8;
    gravity = 9.8;
    pixelsPerMeter = 100;
    
    particleMass = 0.1;
    
    springLength = 40; // In pixels.
    springStiffness = 0.2;
    springDamping = 0.2;
    
    initialMass = 0.1;
    
    worldToForm();
    
    var res = createGrid([250,30], 7, 10, springLength+10);
    particles = res[0];
    springs = res[1];
}

function loadFabric2()
{
    airFriction = 0.05;
    floorFriction = 0.8;
    gravity = 9.8;
    pixelsPerMeter = 100;
    
    particleMass = 0.1;
    
    springLength = 40; // In pixels.
    springStiffness = 0.2;
    springDamping = 0.2;
    
    initialMass = 0.1;
    
    worldToForm();
    
    var res = createGrid([250,30], 7, 10, springLength+10);
    particles = res[0];
    springs = res[1];
    
    particles[3].setPin(false);
    particles[6].setPin(false);
    particles[60].setPin(true);
    particles[69].setPin(true);
    particles[0].position = [100,50];
    particles[60].position = [350,80];
    particles[9].position = [650, 50];
    particles[69].position = [780, 70];
}

function loadPolygons()
{
    airFriction = 0.05;
    floorFriction = 0.8;
    gravity = 9.8;
    pixelsPerMeter = 50;
    
    particleMass = 0.1;
    
    springLength = 100; // In pixels.
    springStiffness = 0.5;
    springDamping = 0.2;
    
    initialMass = 0.1;
    
    worldToForm();
    
    var res = createPolygon([canvasWidth/2-300, canvasHeight/2], 50, 3);
    res[0][0].setPin(true);
    particles = res[0];
    springs = res[1];
    res = createPolygon([canvasWidth/2-150, canvasHeight/2], 50, 4);
    res[0][0].setPin(true);
    particles = particles.concat(res[0]);
    springs = springs.concat(res[1]);
    res = createPolygon([canvasWidth/2, canvasHeight/2], 50, 5);
    res[0][0].setPin(true);
    particles = particles.concat(res[0]);
    springs = springs.concat(res[1]);
    res = createPolygon([canvasWidth/2+150, canvasHeight/2], 50, 6);
    res[0][0].setPin(true);
    particles = particles.concat(res[0]);
    springs = springs.concat(res[1]);
}
