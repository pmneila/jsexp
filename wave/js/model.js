var container;
var camera, scene, renderer;	

var width, height, ratio=1;
var toggleBuffer = false;
var planeScreen;

var mousex, mousey, mouseDown=false, rightClick=false;

var info
var time=0;
var speed = 10;

var mTextureBuffer1, mTextureBuffer2, mTextureBufferClone, initTextureBuffer;
var screenMaterial, modelMaterial, initialMaterial;
var imagen;



var mMap, initCondition = 1;

//------------------------------------------------------
//it requires variables: vshader, mFshader and sFshader
//with url's of vertex/fragment shaders to work.
//------------------------------------------------------
function init(){
	console.log('asdf');
	width = Math.min(
		window.innerWidth,
		window.innerHeight)*0.95;
	height = width*ratio;
	
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
	container.onkeypress = onKeyPress;
    container.addEventListener("touchstart", onTouchStart, false);
    container.addEventListener("touchmove", onTouchMove, false);
    container.addEventListener("touchend", onTouchEnd, false);	
	container.oncontextmenu = function(){return false};

	  $(document).keyup(function(evt) {
	    if (evt.keyCode == 80)
	    	mUniforms.pause.value = 1 - mUniforms.pause.value;
	    else if (evt.keyCode == 83)
	    	snapshot();
	  });


	//renderer
	renderer = new THREE.WebGLRenderer({canvas:container, preserveDrawingBuffer: true});
	renderer.setClearColor( 0xa0a0a0 );
	renderer.setSize(width, height);

	// camera
	var camHeight = height;
	var camWidth = width;

	camera = new THREE.OrthographicCamera( -0.5, 0.5, 0.5, -0.5, - 500, 1000 );
	scene = new THREE.Scene();

	// uniforms
	mUniforms = {
		texel: {type: "v2", value: new THREE.Vector2(1/width,1/height)},
		delta: {type:  "v2", value: undefined},
		tSource: {type: "t", value: mMap},
		tSourcePrev: {type: "t", value: mMap},
		firstIteration : {type: "i", value: 1},
		colors: {type: "v4v", value: undefined},
		mouse: {type: "v2", value: new THREE.Vector2(0.5,0.5)},
		mouseDown: {type: "i", value: 0},
		boundaryCondition: {type: "i", value:0},
		heatSourceSign: {type: "f", value:1},
		heatIntensity: {type: "f", value:2000},
		brushWidth: {type: "f", value:110},
		pause: {type: 'i', value:1}
	};


	// create material
	initialMaterial = new THREE.ShaderMaterial({
		uniforms: mUniforms,
		vertexShader: $.ajax(vshader, {async:false}).responseText,
		fragmentShader: $.ajax(iFshader,{async:false}).responseText
	});

	modelMaterial = new THREE.ShaderMaterial({
		uniforms: mUniforms,
		vertexShader: $.ajax(vshader, {async:false}).responseText,
		fragmentShader: $.ajax(mFshader,{async:false}).responseText
	});

	cloneMaterial = new THREE.ShaderMaterial({
		uniforms: mUniforms,
		vertexShader: $.ajax(vshader, {async:false}).responseText,
		fragmentShader: $.ajax(cloneFshader,{async:false}).responseText
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
	setColorMap('heat');
 

	// Load the simulation
	var loader = new THREE.ImageLoader();
	loader.load(
		// resource URL
		"img/diffuse1.png",
		// Function when resource is loaded
		function ( image ) {			
			runSimulation(image);
		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},
		// Function called when download errors
		function ( xhr ) {
			console.log( 'An error happened' );
		}
	);

}

function runSimulation(initial_condition){

	//create simulation buffers

	resizeSimulation(128,128*ratio);

	//add GUI controls

	initControls();

	//set initial condition

	// initTextureBuffer = new THREE.Texture(initial_condition);
 //    initTextureBuffer.wrapS = THREE.ClampToEdgeWrapping; // are these necessary?
 //    initTextureBuffer.wrapT = THREE.ClampToEdgeWrapping;
 //    initTextureBuffer.repeat.x = initTextureBuffer.repeat.y = 512;
 //    initTextureBuffer.needsUpdate = true; //this IS necessary


    // do the THING

	planeScreen.material = initialMaterial;
	mUniforms.tSource.value = initTextureBuffer;
	renderer.render(scene, camera, mTextureBuffer1, true);
	renderer.render(scene, camera, mTextureBuffer2, true);
	mUniforms.tSource.value = mTextureBuffer1;
	planeScreen.material = screenMaterial;
	renderer.render(scene,camera);

	//----proceed with the simulation---
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

		mTextureBufferClone = new THREE.WebGLRenderTarget( nx, ny, 
			 					{minFilter: THREE.LinearFilter,
		                         magFilter: THREE.LinearFilter,
		                         format: THREE.RGBAFormat,
		                         type: THREE.FloatType});		

		mTextureBuffer1.texture.wrapS  = THREE.ClampToEdgeWrapping;
		mTextureBuffer1.texture.wrapT  = THREE.ClampToEdgeWrapping;
		mTextureBuffer2.texture.wrapS  = THREE.ClampToEdgeWrapping;
		mTextureBuffer2.texture.wrapT  = THREE.ClampToEdgeWrapping;
		mTextureBufferClone.texture.wrapT  = THREE.ClampToEdgeWrapping;
		mTextureBufferClone.texture.wrapT  = THREE.ClampToEdgeWrapping;
	}
	else{
		mTextureBufferClone.setSize(nx,ny);
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
		if (!toggleBuffer){
			planeScreen.material = cloneMaterial;
			mUniforms.tSource.value = mTextureBuffer2;
			renderer.render(scene, camera, mTextureBufferClone, true);
			mUniforms.tSourcePrev.value = mTextureBufferClone;

			//mUniforms.tSourcePrev.value = mTextureBuffer2.clone();
			planeScreen.material = modelMaterial;
			mUniforms.tSource.value = mTextureBuffer1;			
			renderer.render(scene, camera, mTextureBuffer2, true);
			mUniforms.tSource.value = mTextureBuffer2;		
		}
		else{
			planeScreen.material = cloneMaterial;
			mUniforms.tSource.value = mTextureBuffer1;
			renderer.render(scene, camera, mTextureBufferClone, true);
			mUniforms.tSourcePrev.value = mTextureBufferClone;

			// mUniforms.tSourcePrev.value = mTextureBuffer1.clone();
			planeScreen.material = modelMaterial;
			mUniforms.tSource.value = mTextureBuffer2;			
			renderer.render(scene, camera, mTextureBuffer1, true);
			mUniforms.tSource.value = mTextureBuffer1;
		}

		toggleBuffer = !toggleBuffer;
		if (mUniforms.firstIteration.value==1){
			mUniforms.firstIteration.value = 0;
		}			
	}


	planeScreen.material = screenMaterial;
	renderer.render(scene,camera);		

	requestAnimationFrame(renderSimulation);
}

function setColorMap(cmap){
	var colors;
	// if (cmap=='heat'){
	// 	colors = [new THREE.Vector4(1, 1, 1, -10),
	// 			new THREE.Vector4(0, 1, 1, -6.6),
	// 			new THREE.Vector4(0, 0, 1, -3.3),
	// 			new THREE.Vector4(0, 0, 0, 0.0),
	// 			new THREE.Vector4(1, 0, 0, 3.3),
	// 			new THREE.Vector4(1, 1, 0, 6.6),	
	// 			new THREE.Vector4(1, 1, 1, 9.9),
	// 			new THREE.Vector4(1, 1, 1, 9.9),
	// 			new THREE.Vector4(1, 1, 1, 9.9),
	// 			new THREE.Vector4(1, 1, 1, 9.9),
	// 			new THREE.Vector4(1, 1, 1, 9.9),
	// 			new THREE.Vector4(1, 1, 1, 9.9),
	// 			new THREE.Vector4(1, 1, 1, 9.9),
	// 			new THREE.Vector4(1, 1, 1, 9.9),
	// 			new THREE.Vector4(1, 1, 1, 9.9),
	// 			new THREE.Vector4(1, 1, 1, 9.9),];
	// }	
	colors = [new THREE.Vector4(0,90/255,185/255,-10.0),
			  new THREE.Vector4(0,190/255,1,0.0),
			  new THREE.Vector4(225/255,1,1,10.0)];
	// colors = [new THREE.Vector4(0,0,1,-10.0),
	// 		  new THREE.Vector4(0,1,1,-5.0),
	// 		  new THREE.Vector4(0,1,0,-0.0),
	// 		  new THREE.Vector4(1,1,0, 5.0),
	// 		  new THREE.Vector4(1,0,0, 10.0)];
	// else if (cmap=='blueInk'){
	// 	colors = [new THREE.Vector4(1, 1, 1, 0),
	// 			new THREE.Vector4(0, 0, 1, 5.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),	
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),
	// 			new THREE.Vector4(0, 0, 1, 10.0),];
	// }
	// else if (cmap=="sadf"){
	// 	var v = [0.06, 0.120, 0.130, 0.250, 0.260,
	//   			0.380, 0.390, 0.500, 0.510, 0.620, 
	//   			0.630, 0.740, 0.760, 0.870, 0.880, 
	//   			1.000];
	// 	var r = [4, 8, 24, 59, 39,
	// 			113, 0, 0, 137, 254,
	// 			131, 225, 159, 249, 255,
	// 			255];
	// 	var g = [29, 59, 77, 106, 32,
	// 			184, 106, 208, 130, 229,
	// 			80, 128, 19, 26, 255,
	// 			64];
	// 	var b = [59, 118, 157, 204, 228,
	// 			249, 17, 0, 0, 20,
	// 			0, 16, 0, 0, 255,
	// 			196];


	//   var colors = new Array(16);

	//   for (var i=0; i<16; i++){
	//   	colors[i] = new THREE.Vector4(
	//   		r[i]/255, g[i]/255, b[i]/255, (v[i]*2.0-1.0)*10);
	//   }
	// }
	// else if (cmap=="sadf2"){
	// 	var v = [0.06, 0.120, 0.130, 0.250, 0.260,
	//   			0.380, 0.390, 0.500, 0.510, 0.620, 
	//   			0.630, 0.740, 0.760, 0.870, 0.880, 
	//   			1.000];
	// 	var r = [4, 8, 24, 59, 39,
	// 			113, 0, 0, 137, 254,
	// 			131, 225, 159, 249, 255,
	// 			255];
	// 	var g = [29, 59, 77, 106, 32,
	// 			184, 106, 208, 130, 229,
	// 			80, 128, 19, 26, 255,
	// 			64];
	// 	var b = [59, 118, 157, 204, 228,
	// 			249, 17, 0, 0, 20,
	// 			0, 16, 0, 0, 255,
	// 			196];


	//   var colors = new Array(16);

	//   for (var i=0; i<16; i++){
	//   	if (i<7){
	//   	colors[i] = new THREE.Vector4(
	//   		r[i]/255, g[i]/255, b[i]/255, (v[i]*2.0-1.0)*10);
	//   	}
	//   	else{
	//   	colors[i] = new THREE.Vector4(
	//   		r[5]/255, g[5]/255, b[5]/255, (v[i]*2.0-1.0)*10);	
	//   	}
	//   }
	// }
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

function onTouchStart(e) {
    var ev = e ? e : window.event;
    e.preventDefault();
    mousex = ev.targetTouches[0].pageX - simulation.offsetLeft;
    mousey = ev.targetTouches[0].pageY - simulation.offsetTop;

	mouseDown = true;
	mUniforms.mouseDown.value = 1;
	mUniforms.mouse.value = new THREE.Vector2(mousex/width,1-mousey/height);
}

function onTouchMove(e) {
    var ev = e ? e : window.event;
    e.preventDefault();
    mousex = ev.targetTouches[0].pageX - simulation.offsetLeft;
    mousey = ev.targetTouches[0].pageY - simulation.offsetTop;

	if (mouseDown){
		mUniforms.mouse.value = new THREE.Vector2(mousex/width,1-mousey/height);
	}
}

function onTouchEnd(e) {
	mouseDown = false;
	mUniforms.mouseDown.value = 0;
}

function onKeyPress(e){
   if(e.keyCode == 8){
       console.log('backspace');
   }
   if(e.keyCode == 32){
       console.log('asdf');
   }	
}

function diffuseControls(){
	this.scene = "heat";
	this.bc = (mUniforms.boundaryCondition.value == 0) ? "fixed value" : "closed";
	this.resolution = 1/mUniforms.delta.value.x;
	this.brushWidth = mUniforms.brushWidth.value;
	this.intensity = mUniforms.heatIntensity.value;
	this.pause = function(){
		var pauseval = mUniforms.pause.value;
		 mUniforms.pause.value  = 1 - pauseval;
	}
	this.speed = speed;
	this.clearScreen = function(){
		var nx = Math.floor(1/mUniforms.delta.value.x);
		var ny = Math.floor(1/mUniforms.delta.value.y);
		mTextureBuffer1 = undefined;
		resizeSimulation(nx,ny);
	}

	this.snapshot = snapshot;
}
function initControls() {
    var controls = new diffuseControls;
    var gui = new dat.GUI({
        autoPlace: false
    }); 

    // Scene (colormap)

    sceneControl = gui.add(controls, "scene",
    	 ["blueInk", "heat","sadf","sadf2"]).name("Scene");
    sceneControl.onChange(setColorMap);


    //folders
    var folderSimulation = gui.addFolder('Simulation');
    var folderExtSource = gui.addFolder('External Source');


    //speed

    speedControl = folderSimulation.add(controls, "speed", 1, 20).name('Speed');
    speedControl.onChange(function(value){
    	speed = Math.floor(value);
    });  

    //pause
    pauseControl = folderSimulation.add(controls, "pause").name('Start/Pause');

    //clear screen control

 	clearControl = folderSimulation.add(controls, "clearScreen").name("Clear");

    //snapshot control

 	snapshotControl = folderSimulation.add(controls, "snapshot").name("Snapshot");

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
    	resizeSimulation(value,value*ratio);
    	//resizeSimulation(value,value,1);
    });


    //brush

    brushWidthControl = folderExtSource.add(controls, "brushWidth", 8, 512).name('Brush Width');
    brushWidthControl.onChange(function(value){
    	mUniforms.brushWidth.value = value;
    });

    //heat/concentration source intensity

    heatIntensityControl = folderExtSource.add(controls, "intensity", 1, 5000).name('Intensity');
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

function snapshot(){
	var dataURL = container.toDataURL("image/png");
	window.open(dataURL, "diffuse-"+Math.random());
}	

//defaults

//res 256
//speed 6.2
//brush width 0.23
//intensity 0.05