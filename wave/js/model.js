//scene
var container;
var screenWidth, screenHeight, ratio=1;
var scene, calc_camera, view_camera, renderer, track_controls;	

//simulation object
var cube;
var planeScreen, planewidth=1.0, planeheight=1.0, objects=[];
var simNx = 128, simNy=128;

//simulation texture
var toggleBuffer = false;
var mTextureBuffer1, mTextureBuffer2, mTextureBufferClone, initTextureBuffer;
var screenMaterial, modelMaterial, initialMaterial;

//interactivity
var speed = 1;
var mouse, mouseDown=false, rightClick=false;


function init()	{
	screenWidth = window.innerWidth;
	screenHeight = window.innerHeight*0.99;

	simulationDiv = document.getElementById('simulation');
	container = document.getElementById( 'container' );
	container.width = screenWidth;
	container.height = screenHeight;

	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();

	//renderer
	renderer = new THREE.WebGLRenderer({canvas:container, preserveDrawingBuffer: true});
	renderer.setClearColor(0xcccccc);
	renderer.setSize(screenWidth, screenHeight);

	//scene
	scene = new THREE.Scene();
	// Create light
	var light = new THREE.PointLight(0xffffff, 1.0);
	// We want it to be very close to our character
	light.position.set(1.0,1.0,1.0);
	scene.add(light);
	// cameras
	calc_camera = new THREE.OrthographicCamera( planewidth/-2,
												planeheight/2,
												planeheight/2,
												planeheight/-2,
												- 500, 1000 );
	calc_camera.rotateX(-3.14/2);
	calc_camera.rotateZ(-3.14/2);
	scene.add(calc_camera);

	var L = 0.6;
	view_camera = new THREE.PerspectiveCamera(60, screenWidth/screenHeight, 0.01, 5000);
	view_camera.position.x = 0.5*1.5000;
	view_camera.position.y = 0.75*1.5;
	view_camera.position.z = 0.5*1.5;
	view_camera.lookAt(new THREE.Vector3(0,0,0));	
	scene.add(view_camera);

	track_controls = new THREE.TrackballControls(view_camera);
	track_controls.target.set(0,0,0);
	track_controls.zoomSpeed = 0.1;
	track_controls.rotateSpeed = 2.0;
	// ADD OBJECTS


	// mUniforms = THREE.UniformsUtils.merge([
	// 		mUniforms,THREE.UniformsLib['lights']]);

	createMaterials();

	createGeometries();


 	//event handlers
	document.addEventListener( 'mousedown', onDocumentMouseDown, false ); 
	document.addEventListener( 'mouseup', onDocumentMouseUp, false ); 
	$(document).keyup(function(evt) {
	if (evt.keyCode == 80)
		mUniforms.pause.value = 1 - mUniforms.pause.value;
	else if (evt.keyCode == 83)
		snapshot();
	});


	// var axisHelper = new THREE.AxisHelper( 1.5 );
	// scene.add( axisHelper );
	// Load the simulation
	runSimulation();
	// var loader = new THREE.ImageLoader();
	// loader.load(
	// 	// resource URL
	// 	"img/diffuse1.png",
	// 	// Function when resource is loaded
	// 	function ( image ) {			
	// 		runSimulation(image);
	// 	},
	// 	// Function called when download progresses
	// 	function ( xhr ) {
	// 		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	// 	},
	// 	// Function called when download errors
	// 	function ( xhr ) {
	// 		console.log( 'An error happened' );
	// 	}
	// );

}

function createMaterials(){
	mUniforms = {
		texel: {type: "v2", value: undefined},
		delta: {type:  "v2", value: undefined},
		tSource: {type: "t", value: undefined},
		tSourcePrev: {type: "t", value: undefined},
		firstIteration : {type: "i", value: 1},
		colors: {type: "v4v", value: undefined},
		mouse: {type: "v2", value: new THREE.Vector2(0.5,0.5)},
		mouseDown: {type: "i", value: 0},
		boundaryCondition: {type: "i", value:0},
		heatSourceSign: {type: "f", value:1},
		heatIntensity: {type: "f", value:600},
		brushWidth: {type: "f", value:0.1},
		pause: {type: 'i', value:1},
		lightPos: {type: "v3", value:new THREE.Vector3(1.0,1.0,1.0)}
	};
	
	// create shader materials
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
		side: THREE.DoubleSide,
		transparent:true,
		fog:true
	});

	screen2Material = new THREE.MeshPhongMaterial( { color: 0xdddddd, 
					specular: 0x009900, shininess: 30} );
}
function createGeometries(){
	//create plane geometry
	var geometry = new THREE.PlaneGeometry(planewidth , planeheight, 32*2,32*2);
	planeScreen = new THREE.Mesh( geometry, screenMaterial );
	planeScreen.rotateX(-3.14/2);
	planeScreen.rotateZ(-3.14/2);
	objects.push(planeScreen);
	scene.add( planeScreen );

	var box_geometry = new THREE.BoxGeometry( planewidth, planeheight, 0.1 );
	var boxWallsMaterial = new THREE.MeshPhongMaterial( 
			{color: 0x00a0a0, 
			specular: 0xffffff, 
			shininess: 30, 
			opacity:0.5,
			transparent:true} );
	var boxTopMaterial = new THREE.MeshBasicMaterial( {color:0x000000, visible:false} );
	var mats = [];
	mats.push(boxWallsMaterial);
	mats.push(boxWallsMaterial);
	mats.push(boxWallsMaterial);
	mats.push(boxWallsMaterial);
	mats.push(boxTopMaterial);
	mats.push(boxWallsMaterial);
    var faceMaterial = new THREE.MeshFaceMaterial(mats);

	var box_material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
	cube = new THREE.Mesh( box_geometry, faceMaterial );
	cube.rotateX(-3.14/2);
	cube.rotateZ(-3.14/2);
	cube.position.y = -0.05;
	scene.add( cube );
}
function runSimulation(){

	//create simulation buffers

	resizeSimulation(simNx,simNy);

	//add GUI controls

	initControls();

	//set initial condition

	// initTextureBuffer = new THREE.Texture(initial_condition);
	// initTextureBuffer.wrapS = THREE.ClampToEdgeWrapping; // are these necessary?
	// initTextureBuffer.wrapT = THREE.ClampToEdgeWrapping;
	// initTextureBuffer.repeat.x = initTextureBuffer.repeat.y = 512;
	// initTextureBuffer.needsUpdate = true; //this IS necessary


    // render init to buffers

	planeScreen.material = initialMaterial;
	mUniforms.tSource.value = initTextureBuffer;
	renderer.render(scene, calc_camera, mTextureBuffer1, true);
	renderer.render(scene, calc_camera, mTextureBuffer2, true);
	mUniforms.tSource.value = mTextureBuffer1;
	planeScreen.material = screenMaterial;
	renderer.render(scene,calc_camera);


	
	//finally render
	renderSimulation();
}

function renderSimulation(){	

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
			
		}

		toggleBuffer = !toggleBuffer;
		if (mUniforms.firstIteration.value==1){
			mUniforms.firstIteration.value = 0;
		}			
		
	}

	// mUniforms.mouseDown.value = 0;


	planeScreen.material = screenMaterial;
	track_controls.update();	
	renderer.render(scene,view_camera);	
	requestAnimationFrame(renderSimulation);

}

function resizeSimulation(nx,ny){

	mUniforms.delta.value = new THREE.Vector2(planewidth/nx,planeheight/ny);
	mUniforms.texel.value = new THREE.Vector2(1/nx,1/ny);
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
	this.brushWidth = mUniforms.brushWidth.value*100;
	this.height = mUniforms.heatIntensity.value;
	this.pause = function(){
		var pauseval = mUniforms.pause.value;
		 mUniforms.pause.value  = 1 - pauseval;
	}
	this.speed = speed;
	this.clearScreen = function(){
		var nx = Math.floor(planewidth/mUniforms.delta.value.x);
		var ny = Math.floor(planeheight/mUniforms.delta.value.y);
		mTextureBuffer1 = undefined;
		simNx = nx;
		simNy = ny;
		resizeSimulation(simNx, simNy);
	}

	this.snapshot = snapshot;

	this.lightpolar = Math.PI/4;
}
function initControls() {
    var controls = new diffuseControls;
    var gui = new dat.GUI({
        autoPlace: false
    }); 

    //folders
    var folderSimulation = gui.addFolder('Simulation');
    var folderExtSource = gui.addFolder('External Source');


    //speed

    speedControl = folderSimulation.add(controls, "speed", 1, 20).name('Speed').step(1);
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



    //brush

    brushWidthControl = folderExtSource.add(controls, "brushWidth", 1, 30).name('Brush Width');
    brushWidthControl.onChange(function(value){
    	mUniforms.brushWidth.value = value/100;
    });

    //heat/concentration source intensity

    heightControl = folderExtSource.add(controls, "height", 1, 5000).name('Height');
    heightControl.onChange(function(value){
    	mUniforms.heatIntensity.value = value;
    });


    lightAngleControl = folderExtSource.add(controls, "lightpolar", 0, Math.PI*2);
    lightAngleControl.onChange(function(value){
    	mUniforms.lightPos.value = new THREE.Vector3(Math.cos(value), Math.sin(value),1.0);
    })
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
		var u = (point.z+planewidth/2.0)/planewidth;//in [0,1]
		var v = (point.x+planeheight/2.0)/planeheight;//in [0,1]
		var UV = new THREE.Vector2(u,v);
		mUniforms.mouse.value = UV;
		mUniforms.mouseDown.value= 1;
	}

}

function onDocumentMouseUp(event){
	mUniforms.mouseDown.value = 0;
}