var container;
var camera, scene, renderer;	

var width, height;
var toggleBuffer = false;
var planeScreen, planeheight, planewidth;

var mousex, mousey, mouseDown=false;

var info
var time=0;
var speed = 1;

function init(){
	// width = Math.min(
	// 	$("#container").parent().width(),
	// 	$("#container").parent().height());
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
	planeheight=height/8, planewidth = width/8;//planeheight*screenRatio;

	mUniforms = {
		delta: {type:  "v2", value: new THREE.Vector2(1/planewidth,1/planeheight)},
		tSource: {type: "t", value: undefined},
		colors: {type: "v4v", value: undefined},
		mouse: {type: "v2", value: new THREE.Vector2(0.5,0.5)},
		mouseDown: {type: "i", value: 0},
		boundaryCondition: {type: "i", value:0}
	};

	setColorMap('blueInk');

	initControls();
	// create buffers
	mTextureBuffer1 = new THREE.WebGLRenderTarget( planewidth, planeheight, 
		 					{minFilter: THREE.LinearFilter,
	                         magFilter: THREE.LinearFilter,
	                         format: THREE.RGBAFormat,
	                         type: THREE.FloatType});
	mTextureBuffer2 = new THREE.WebGLRenderTarget( planewidth, planeheight, 
		 					{minFilter: THREE.LinearFilter,
	                         magFilter: THREE.LinearFilter,
	                         format: THREE.RGBAFormat,
	                         type: THREE.FloatType});

	mTextureBuffer1.texture.wrapS  = THREE.RepeatWrapping;
	mTextureBuffer1.texture.wrapT  = THREE.RepeatWrapping;
	mTextureBuffer2.texture.wrapS  = THREE.RepeatWrapping;
	mTextureBuffer2.texture.wrapT  = THREE.RepeatWrapping;

	// create materials

	modelMaterial = new THREE.ShaderMaterial({
		uniforms: mUniforms,
		vertexShader: $.ajax('shaders/vshader.glsl',{async:false}).responseText,
		fragmentShader: $.ajax('shaders/modelFShader.glsl',{async:false}).responseText
	});

	screenMaterial = new THREE.ShaderMaterial({
		uniforms: mUniforms,
		vertexShader: $.ajax('shaders/vshader.glsl',{async:false}).responseText,
		fragmentShader: $.ajax('shaders/screenFShader.glsl',{async:false}).responseText
	});

	//create plane geometry
	var geometry = new THREE.PlaneGeometry(1.0 , 1.0);
	planeScreen = new THREE.Mesh( geometry, screenMaterial );
	scene.add( planeScreen );	

	//----run the simulation---
	var toggleBuffer = false;
	renderSimulation(0);
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

	//time=time+0.2*1/planewidth*1/planewidth*100;
	//para hablar de tiempo hay que configurar bien
	// la constante de difusividad del medio!!!
	// info.innerHTML = time.toFixed(6);
}

function setColorMap(cmap){
	var colors;
	if (cmap=='heat'){
		colors = [new THREE.Vector4(0, 0, 0, 0.0),
				new THREE.Vector4(1, 0, 0, 0.33),
				new THREE.Vector4(1, 1, 0, 0.66),	
				new THREE.Vector4(1, 1, 1, 0.99),
				new THREE.Vector4(1, 1, 1, 0.99)];
	}
	else if (cmap=='blueInk'){
		colors = [new THREE.Vector4(1.0,1.0,1.0,0.0),
				new THREE.Vector4(0.0,0.0,1.0,0.8),
				new THREE.Vector4(0.0,0.0,1.0,0.8),
				new THREE.Vector4(0.0,0.0,1.0,0.8),
				new THREE.Vector4(0.0,0.0,1.0,0.8)];
	}

	mUniforms.colors.value = colors;
}
function onMouseMove(e){
	var ev = e ? e : window.event;

	mousex = ev.pageX - container.offsetLeft;
	mousey = ev.pageY - container.offsetTop;

	if (mouseDown)
		mUniforms.mouse.value = new THREE.Vector2(mousex/width,1-mousey/height);
}
function onMouseDown(e){
	mouseDown = true;
	mUniforms.mouseDown.value = 1;
	mUniforms.mouse.value = new THREE.Vector2(mousex/width,1-mousey/height);
}

function onMouseUp(e){
	mouseDown = false;
	mUniforms.mouseDown.value = 0;
}


function diffuseControls(){
	this.scene = "Blue Ink";
	this.bc = "open";
	this.speed = 1;
}
function initControls() {
    var controls = new diffuseControls;
    var gui = new dat.GUI({
        autoPlace: true
    }); //

    sceneControl = gui.add(controls, "scene", ["blueInk", "heat"]).name("Scene");
    sceneControl.onChange(setColorMap);

    speedControl = gui.add(controls, "speed", 1, 10).name('Speed');
    speedControl.onChange(function(value){
    	speed = Math.floor(value);
    })


    // bcControl = gui.add(controls, "bc", ["fixed", "open"]).name("Boundaries");
    // bcControl.onChange(function(value){
    // 	if (value=="fixed"){
    // 		mUniforms.boundaryCondition = 0;
    // 	}
    // 	else if (value=="open"){
    // 		mUniforms.boundaryCondition = 1;
    // 	}
    // })
    // var customContainer = document.getElementById('controls');
    // customContainer.appendChild(gui.domElement);
}