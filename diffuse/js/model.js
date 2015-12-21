var container;
var camera, scene, renderer;	

var width, height;
var toggleBuffer = false;
var planeScreen;

var mousex, mousey, mouseDown=false, rightClick=false;

var info
var time=0;
var speed = 1;

var mTextureBuffer1, mTextureBuffer2;
var screenMaterial, modelMaterial;

//------------------------------------------------------
//it requires variables: vshader, mFshader and sFshader
//with url's of vertex/fragment shaders to work.
//------------------------------------------------------
function init(){
	width = Math.min(
		window.innerWidth,
		window.innerHeight)*0.95;
	height = width;
	
	// container
	simulationDiv = document.getElementById('simulation');
	container = document.getElementById( 'container' );
	container.width = width;
	container.height = height;

	info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.top = '10px';
	info.style.width = '100%';
	info.style.textAlign = 'center';
	simulationDiv.appendChild( info );	

	//event handlers
	container.onmousedown = onMouseDown;
	container.onmouseup = onMouseUp;
	container.onmousemove = onMouseMove;
	container.onmouseout = onMouseOut;
	container.oncontextmenu = function(){return false};
	// container.o


	//renderer
	renderer = new THREE.WebGLRenderer({canvas:container, preserveDrawingBuffer: true});
	renderer.setClearColor( 0xa0a0a0 );
	renderer.setSize(width, height);

	// camera
	var camHeight = height;
	var camWidth = width;

	camera = new THREE.OrthographicCamera( -0.5, 0.5, 0.5, -0.5, - 500, 1000 );
	scene = new THREE.Scene();

	// plane

	mUniforms = {
		delta: {type:  "v2", value: undefined},
		tSource: {type: "t", value: undefined},
		colors: {type: "v4v", value: undefined},
		mouse: {type: "v2", value: new THREE.Vector2(0.5,0.5)},
		mouseDown: {type: "i", value: 0},
		boundaryCondition: {type: "i", value:undefined},
		heatSourceSign: {type: "f", value:1},
		heatIntensity: {type: "f", value:0.4},
		brushWidth: {type: "f", value:0.1},
		pause: {type: 'i', value:0}
	};

	// create buffers
	resizeSimulation(128,128);

	// create material
	modelMaterial = new THREE.ShaderMaterial({
		uniforms: mUniforms,
		vertexShader: $.ajax(vshader, {async:false}).responseText,
		fragmentShader: $.ajax(mFshader,{async:false}).responseText
	});

	screenMaterial = new THREE.ShaderMaterial({
		uniforms: mUniforms,
		vertexShader: $.ajax(vshader,{async:false}).responseText,
		fragmentShader: $.ajax(sFshader,{async:false}).responseText
	});

	//create plane geometry
	var geometry = new THREE.PlaneGeometry(1.0 , 1.0);
	planeScreen = new THREE.Mesh( geometry, screenMaterial );
	scene.add( planeScreen );	


	//default colormap
	setColorMap('blueInk');

	//GUI controls
	initControls();

	//----run the simulation---
	renderSimulation();

}

function resizeSimulation(nx,ny){

	mUniforms.delta.value = new THREE.Vector2(1/nx,1/ny);
	
	// create buffers
	if (!mTextureBuffer1){

	mTextureBuffer1 = new THREE.WebGLRenderTarget( nx, ny, 
		 					{minFilter: THREE.LinearFilter,
	                         magFilter: THREE.LinearFilter,
	                         format: THREE.RGBAFormat,
	                         type: THREE.FloatType});
	mTextureBuffer2 = new THREE.WebGLRenderTarget( nx, ny, 
		 					{minFilter: THREE.LinearFilter,
	                         magFilter: THREE.LinearFilter,
	                         format: THREE.RGBAFormat,
	                         type: THREE.FloatType});

	mTextureBuffer1.texture.wrapS  = THREE.RepeatWrapping;
	mTextureBuffer1.texture.wrapT  = THREE.RepeatWrapping;
	mTextureBuffer2.texture.wrapS  = THREE.RepeatWrapping;
	mTextureBuffer2.texture.wrapT  = THREE.RepeatWrapping;
	}
	else{
		if (!toggleBuffer){
			mTextureBuffer1.setSize(nx,ny);
		}	
		else{
			mTextureBuffer2.setSize(nx,ny);	
		}
	
	}
}
function renderSimulation(){	

	planeScreen.material = modelMaterial;
	for (var i=0; i<Math.floor(speed); i++){
		if (toggleBuffer){
			mUniforms.tSource.value = mTextureBuffer1;		
			renderer.render(scene, camera, mTextureBuffer2, true);
			mUniforms.tSource.value = mTextureBuffer2;		
		}
		else{
			mUniforms.tSource.value = mTextureBuffer2;
			renderer.render(scene, camera, mTextureBuffer1, true);
			mUniforms.tSource.value = mTextureBuffer1;
		}

		toggleBuffer = !toggleBuffer;
	}
	planeScreen.material = screenMaterial;
	renderer.render(scene,camera);			
	requestAnimationFrame(renderSimulation);
}

function setColorMap(cmap){
	var colors;
	if (cmap=='heat'){
		colors = [new THREE.Vector4(1, 1, 1, -10),
				new THREE.Vector4(0, 1, 1, -6.6),
				new THREE.Vector4(0, 0, 1, -3.3),
				new THREE.Vector4(0, 0, 0, 0.0),
				new THREE.Vector4(1, 0, 0, 3.3),
				new THREE.Vector4(1, 1, 0, 6.6),	
				new THREE.Vector4(1, 1, 1, 9.9)];
	}	
	else if (cmap=='blueInk'){
		colors = [new THREE.Vector4(1, 1, 1, 0),
				new THREE.Vector4(0, 0, 1, 1.0),
				new THREE.Vector4(0, 0, 1, 10.0),
				new THREE.Vector4(0, 0, 1, 10.0),
				new THREE.Vector4(0, 0, 1, 10.0),
				new THREE.Vector4(0, 0, 1, 10.0),	
				new THREE.Vector4(0, 0, 1, 10.0),];
	}

	mUniforms.colors.value = colors;
}
function onMouseMove(e){
	var ev = e ? e : window.event;

	mousex = ev.pageX - simulation.offsetLeft;
	mousey = ev.pageY - simulation.offsetTop;

	if (mouseDown){
		mUniforms.mouse.value = new THREE.Vector2(mousex/width,1-mousey/height);
	}
}
function onMouseDown(e){
	mouseDown = true;
	mUniforms.mouseDown.value = 1;
	if (e.which == 3){
		mUniforms.heatSourceSign.value = -1;
	}
	else {
		mUniforms.heatSourceSign.value =  1;
	}
	mUniforms.mouse.value = new THREE.Vector2(mousex/width,1-mousey/height);
}

function onMouseUp(e){
	mouseDown = false;
	mUniforms.mouseDown.value = 0;
}

function onMouseOut(e){
	mouseDown = false;
	mUniforms.mouseDown.value = 0;
}

function diffuseControls(){
	this.scene = "Blue Ink";
	this.bc = "fixed";
	this.resolution = 1/mUniforms.delta.value.x;
	this.brushWidth = mUniforms.brushWidth.value;
	this.intensity = mUniforms.heatIntensity.value;
	this.pause = function(){
		 mUniforms.pause.value  = 1 - mUniforms.pause.value;
	}
	this.speed = 1;
	this.clearScreen = function(){
		var nx = Math.floor(1/mUniforms.delta.value.x);
		var ny = Math.floor(1/mUniforms.delta.value.y);
		mTextureBuffer1 = undefined;
		resizeSimulation(nx,ny);
	}
}
function initControls() {
    var controls = new diffuseControls;
    var gui = new dat.GUI({
        autoPlace: false
    }); 

    // Scene (colormap)

    sceneControl = gui.add(controls, "scene",
    	 ["blueInk", "heat"]).name("Scene");
    sceneControl.onChange(setColorMap);


    //folders
    var folderSimulation = gui.addFolder('Simulation');
    var folderExtSource = gui.addFolder('External Source');

    //boundary condition

    bcControl = folderSimulation.add(controls, "bc", ["fixed value", "closed"]).name("Boundaries");
    bcControl.onChange(function(value){
    	if (value=="fixed value"){
    		mUniforms.boundaryCondition.value = 0;
    	}
    	else if (value=="closed"){
    		mUniforms.boundaryCondition.value = 1;
    	}
    })

    //mesh resolution

	resolutionControl = folderSimulation.add(controls, "resolution", 16, 512).name('Resolution');
    resolutionControl.onChange(function(value){
    	resizeSimulation(value,value);
    	//resizeSimulation(value,value,1);
    });


    //speed

    speedControl = folderSimulation.add(controls, "speed", 1, 20).name('Speed');
    speedControl.onChange(function(value){
    	speed = Math.floor(value);
    });  

    //pause
    pauseControl = folderSimulation.add(controls, "pause").name('Pause');

    //clear screen control

 	clearControl = folderSimulation.add(controls, "clearScreen").name("Clear");

    //brush

    brushWidthControl = folderExtSource.add(controls, "brushWidth", 0.01, 1).name('Brush Width');
    brushWidthControl.onChange(function(value){
    	mUniforms.brushWidth.value = value;
    });

    //heat/concentration source intensity

    heatIntensityControl = folderExtSource.add(controls, "intensity", 0.01, 5).name('Intensity');
    heatIntensityControl.onChange(function(value){
    	mUniforms.heatIntensity.value = value;
    });


    // folders are open initially
    folderSimulation.open();
    folderExtSource.open();

    //own separate container

    var customContainer = document.getElementById('controls');
    customContainer.appendChild(gui.domElement);
}