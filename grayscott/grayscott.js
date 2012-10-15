
/* 
 * Gray-Scott
 *
 * A solver of the Gray-Scott model of reaction diffusion.
 *
 * ©2012 pmneila.
 * p.mneila at upm.es
 */

(function(){

// Canvas.
var canvas;
var simulation;
var canvasWidth = 1024;
var canvasHeight = 512;

var mMouseX, mMouseY;
var mMouseDown = false;

var mRenderer;
var mScene;
var mCamera;
var mUniforms;

var mTexture1, mTexture2;
var mGSMaterial, mScreenMaterial;
var mScreenQuad;

var mToggled = false;

var mMinusOnes = new THREE.Vector2(-1, -1);

// Some presets.
var presets = [
    { // Default
        //feed: 0.018,
        //kill: 0.051
        feed: 0.037,
        kill: 0.06
    },
    { // Solitons
        feed: 0.03,
        kill: 0.062
    },
    { // Pulsating solitons
        feed: 0.025,
        kill: 0.06
    },
    { // Worms.
        feed: 0.078,
        kill: 0.061
    },
    { // Mazes
        feed: 0.029,
        kill: 0.057
    },
    { // Holes
        feed: 0.039,
        kill: 0.058
    },
    { // Chaos
        feed: 0.026,
        kill: 0.051
    },
    { // Moving spots.
        feed: 0.014,
        kill: 0.054
    },
    { // Spots and loops.
        feed: 0.018,
        kill: 0.051
    },
    { // Waves
        feed: 0.014,
        kill: 0.045
    },
    { // The U-Skate World
        feed: 0.062,
        kill: 0.06093
    }
];

// Configuration.
var feed = presets[0].feed;
var kill = presets[0].kill;

init = function()
{
    init_controls();
    
    canvas = document.getElementById("myCanvas");
    // Fix a bug in the mouse behavior in Firefox.
    simulation = document.getElementById("simulation");
    
    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;
    
    mRenderer = new THREE.WebGLRenderer({canvas: canvas, preserveDrawingBuffer: true});
    mRenderer.setSize(canvasWidth, canvasHeight);
    
    mScene = new THREE.Scene();
    mCamera = new THREE.OrthographicCamera(canvasWidth/-2, canvasWidth/2, canvasHeight/2, canvasHeight/-2, -10000, 10000);
    mCamera.position.z = 100;
    mScene.add(mCamera);
    
    mTexture1 = new THREE.WebGLRenderTarget(canvasWidth/2, canvasHeight/2,
                        {minFilter: THREE.LinearFilter,
                         magFilter: THREE.LinearFilter,
                         format: THREE.RGBFormat,
                         type: THREE.FloatType});
    mTexture2 = new THREE.WebGLRenderTarget(canvasWidth/2, canvasHeight/2,
                        {minFilter: THREE.LinearFilter,
                         magFilter: THREE.LinearFilter,
                         format: THREE.RGBFormat,
                         type: THREE.FloatType});
    mTexture1.wrapS = THREE.RepeatWrapping;
    mTexture1.wrapT = THREE.RepeatWrapping;
    mTexture2.wrapS = THREE.RepeatWrapping;
    mTexture2.wrapT = THREE.RepeatWrapping;
    
    mUniforms = {
        screenWidth: {type: "f", value: canvasWidth/2},
        screenHeight: {type: "f", value: canvasHeight/2},
        tSource: {type: "t", value: mTexture1},
        delta: {type: "f", value: 1.0},
        feed: {type: "f", value: feed},
        kill: {type: "f", value: kill},
        brush: {type: "v2", value: new THREE.Vector2(-10, -10)}
    };
    
    mGSMaterial = new THREE.ShaderMaterial({
            uniforms: mUniforms,
            vertexShader: document.getElementById('standardVertexShader').textContent,
            fragmentShader: document.getElementById('gsFragmentShader').textContent,
        });
    mScreenMaterial = new THREE.ShaderMaterial({
                uniforms: mUniforms,
                vertexShader: document.getElementById('standardVertexShader').textContent,
                fragmentShader: document.getElementById('screenFragmentShader').textContent,
            });
    
    var plane = new THREE.PlaneGeometry(canvasWidth, canvasHeight);
    mScreenQuad = new THREE.Mesh(plane, mScreenMaterial);
    mScene.add(mScreenQuad);
    
    render(0);
    mUniforms.brush.value = new THREE.Vector2(0.5, 0.5);
    requestAnimationFrame(render);
}

var render = function(time)
{
    mScreenQuad.material = mGSMaterial;
    mUniforms.delta.value = 0.8;
    mUniforms.feed.value = feed;
    mUniforms.kill.value = kill;
    
    for(var i=0; i<8; ++i)
    {
        if(!mToggled)
        {
            mUniforms.tSource.value = mTexture1;
            mRenderer.render(mScene, mCamera, mTexture2, true);
            mUniforms.tSource.value = mTexture2;
        }
        else
        {
            mUniforms.tSource.value = mTexture2;
            mRenderer.render(mScene, mCamera, mTexture1, true);
            mUniforms.tSource.value = mTexture1;
        }
        
        mToggled = !mToggled;
        mUniforms.brush.value = mMinusOnes;
    }
    
    mScreenQuad.material = mScreenMaterial;
    mRenderer.render(mScene, mCamera);
    
    requestAnimationFrame(render);
}

loadPreset = function(idx)
{
    feed = presets[idx].feed;
    kill = presets[idx].kill;
    worldToForm();
}

var onMouseMove = function(e)
{
    var ev = e ? e : window.event;
    mMouseX = Math.round(ev.clientX - simulation.offsetLeft);
    mMouseY = Math.round(ev.clientY - simulation.offsetTop);
    
    if(mMouseDown)
        mUniforms.brush.value = new THREE.Vector2(mMouseX/canvasWidth, 1-mMouseY/canvasHeight);
}

var onMouseDown = function(e)
{
    var ev = e ? e : window.event;
    mMouseDown = true;
    
    mUniforms.brush.value = new THREE.Vector2(mMouseX/canvasWidth, 1-mMouseY/canvasHeight);
}

var onMouseUp = function(e)
{
    mMouseDown = false;
}

clean = function()
{
    mUniforms.brush.value = new THREE.Vector2(-10, -10);
}

snapshot = function()
{
    var dataURL = canvas.toDataURL("image/png");
    window.open(dataURL, "name-"+Math.random());
}

var worldToForm = function()
{
    //document.ex.sldReplenishment.value = feed * 1000;
    $("#sld_replenishment").slider("value", feed);
    $("#sld_diminishment").slider("value", kill);
}

var init_controls = function()
{
	$("#sld_replenishment").slider({
		value: feed, min: 0, max:0.1, step:0.001,
		change: function(event, ui) {$("#replenishment").html(ui.value); feed = ui.value;},
		slide: function(event, ui) {$("#replenishment").html(ui.value); feed = ui.value;}
	});
	$("#sld_replenishment").slider("value", feed);
	$("#sld_diminishment").slider({
		value: kill, min: 0, max:0.073, step:0.001,
		change: function(event, ui) {$("#diminishment").html(ui.value); kill = ui.value;},
		slide: function(event, ui) {$("#diminishment").html(ui.value); kill = ui.value;}
	});
	$("#sld_diminishment").slider("value", kill);
}

})();
