var container;
var calc_camera	, view_camera, scene, renderer;	

var width, height, ratio=1;
var toggleBuffer = false;
var planeScreen, planewidth=2.0, planeheight=2.0;
var simWidth = 128*2, simHeight=128*2;

var mousex, mousey, mouseDown=false, rightClick=false;

var info
var time=0;
var speed = 10;

var mTextureBuffer1, mTextureBuffer2, mTextureBufferClone, initTextureBuffer;
var screenMaterial, modelMaterial, initialMaterial;
var imagen;

var track_controls;


var mMap, initCondition = 1;

var mouse;
var objects = [];
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
	// container.onmousedown = onMouseDown;
	// container.onmouseup = onMouseUp;
	// container.onmousemove = onMouseMove;
	// container.onmouseout = onMouseOut;
	// container.onkeypress = onKeyPress;
 //    container.addEventListener("touchstart", onTouchStart, false);
 //    container.addEventListener("touchmove", onTouchMove, false);
 //    container.addEventListener("touchend", onTouchEnd, false);	
	document.addEventListener( 'mousedown', onDocumentMouseDown, false ); 
	document.addEventListener( 'mouseup', onDocumentMouseUp, false ); 
	// container.oncontextmenu = function(){return false};

	  $(document).keyup(function(evt) {
	    if (evt.keyCode == 80)
	    	mUniforms.pause.value = 1 - mUniforms.pause.value;
	    else if (evt.keyCode == 83)
	    	snapshot();
	  });

	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();

	//renderer
	renderer = new THREE.WebGLRenderer({canvas:container, preserveDrawingBuffer: true});
	renderer.setClearColor( 0x555555 );
	renderer.setSize(width, height);

	// camera
	var camHeight = height;
	var camWidth = width;

	scene = new THREE.Scene();
	calc_camera = new THREE.OrthographicCamera( -1.0, 1.0, 1.0, -1.0, - 500, 1000 );
	view_camera = new THREE.OrthographicCamera( -1.0, 1.0, 1.0, -1.0, 0, 1000 );


	view_camera.position.x = 1.0;
	view_camera.position.y = 0.5;
	view_camera.position.z = 1.0;
	view_camera.lookAt(new THREE.Vector3(0,0,0));

	scene.add(calc_camera);
	scene.add(view_camera);

	track_controls = new THREE.OrbitControls( view_camera, renderer.domElement );
	track_controls.enableDamping = true;
	track_controls.dampingFactor = 0.25;


	// var axisHelper = new THREE.AxisHelper( 1 );
	// scene.add( axisHelper );

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
		boundaryCondition: {type: "i", value:1},
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
		vertexShader: $.ajax(deformVShader,{async:false}).responseText,
		fragmentShader: $.ajax(sFshader,{async:false}).responseText,
		side: THREE.DoubleSide
	});

	//create plane geometry
	var geometry = new THREE.PlaneGeometry(planewidth , planeheight, 128,128*ratio);
	planeScreen = new THREE.Mesh( geometry, screenMaterial );

	objects.push(planeScreen);
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

	resizeSimulation(simWidth,simHeight);

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
	renderer.render(scene, calc_camera, mTextureBuffer1, true);
	renderer.render(scene, calc_camera, mTextureBuffer2, true);
	mUniforms.tSource.value = mTextureBuffer1;
	planeScreen.material = screenMaterial;
	renderer.render(scene,calc_camera);

	//----proceed with the simulation---
	planeScreen.rotateX(-3.14/2);
	planeScreen.rotateZ(-3.14/2);
	calc_camera.rotateX(-3.14/2);
	calc_camera.rotateZ(-3.14/2);
	// calc_camera.rotateX(-3.14/2);
	renderSimulation();
}

function resizeSimulation(nx,ny){

	mUniforms.delta.value = new THREE.Vector2(planewidth/nx,planeheight/ny);
	
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

	if (mUniforms.mouseDown.value == 1){
		console.log('asdf');
	}
	planeScreen.material = modelMaterial;
	for (var i=0; i<Math.floor(speed); i++){
		if (!toggleBuffer){
			planeScreen.material = cloneMaterial;
			mUniforms.tSource.value = mTextureBuffer2;
			renderer.render(scene, calc_camera, mTextureBufferClone, true);
			mUniforms.tSourcePrev.value = mTextureBufferClone;

			//mUniforms.tSourcePrev.value = mTextureBuffer2.clone();
			planeScreen.material = modelMaterial;
			mUniforms.tSource.value = mTextureBuffer1;			
			renderer.render(scene, calc_camera, mTextureBuffer2, true);
			mUniforms.tSource.value = mTextureBuffer2;		
		}
		else{
			planeScreen.material = cloneMaterial;
			mUniforms.tSource.value = mTextureBuffer1;
			renderer.render(scene, calc_camera, mTextureBufferClone, true);
			mUniforms.tSourcePrev.value = mTextureBufferClone;

			// mUniforms.tSourcePrev.value = mTextureBuffer1.clone();
			planeScreen.material = modelMaterial;
			mUniforms.tSource.value = mTextureBuffer2;			
			renderer.render(scene, calc_camera, mTextureBuffer1, true);
			mUniforms.tSource.value = mTextureBuffer1;
		}

		toggleBuffer = !toggleBuffer;
		if (mUniforms.firstIteration.value==1){
			mUniforms.firstIteration.value = 0;
		}			
	}



	planeScreen.material = screenMaterial;
	track_controls.update();	
	renderer.render(scene,view_camera);		

	
	requestAnimationFrame(renderSimulation);

}

function setColorMap(cmap){
	var colors;
	colors = [new THREE.Vector4(0,90/255,185/255,-10.0),
			  new THREE.Vector4(0,190/255,1,0.0),
			  new THREE.Vector4(225/255,1,1,10.0)];

	mUniforms.colors.value = colors;
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
		var nx = Math.floor(planewidth/mUniforms.delta.value.x);
		var ny = Math.floor(planeheight/mUniforms.delta.value.y);
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


function onDocumentMouseDown( event ) {

	event.preventDefault();
	mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, view_camera );

	var intersects = raycaster.intersectObjects( objects );

	if ( intersects.length > 0 ) {
		
		var point = intersects[0].point;
		var u = (point.z+planewidth/2.0)/planewidth;
		var v = (point.x+planeheight/2.0)/planeheight;
		var UV = new THREE.Vector2(u,v);
		console.log(UV);
		mUniforms.mouse.value = UV;
		mUniforms.mouseDown.value= 1;
		// mouse: {type: "v2", value: new THREE.Vector2(0.5,0.5)},
		// mouseDown: {type: "i", value: 0},
	}

}

function onDocumentMouseUp(event){
	mUniforms.mouseDown.value = 0;
}