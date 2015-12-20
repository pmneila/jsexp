var container;
var camera, scene, renderer;	

var width, height;
var toggleBuffer = false;
var planeScreen, planeheight, planewidth;

var mousex, mousey, mouseDown=false, rightClick=false;

var info
var time=0;
var speed = 1;



//------------------------------------------------------
//it requires variables: vshader, mFshader and sFshader
//with url's of vertex/fragment shaders to work.
//------------------------------------------------------
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
	planeheight=height/8, planewidth = width/8;//planeheight*screenRatio;

	mUniforms = {
		delta: {type:  "v2", value: new THREE.Vector2(1/planewidth,1/planeheight)},
		tSource: {type: "t", value: undefined},
		colors: {type: "v4v", value: undefined},
		mouse: {type: "v2", value: new THREE.Vector2(0.5,0.5)},
		mouseDown: {type: "i", value: 0},
		boundaryCondition: {type: "i", value:undefined},
		heatSourceSign: {type: "f", value:1},
		brushWidth: {type: "f", value:5},
		pause: {type: 'i', value:0}
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
				new THREE.Vector4(0, 0, 0, 0.0),
				new THREE.Vector4(0, 0, 0, 0.0),
				new THREE.Vector4(0, 0, 0, 0.0),
				new THREE.Vector4(1, 0, 0, 0.33),
				new THREE.Vector4(1, 1, 0, 0.66),	
				new THREE.Vector4(1, 1, 1, 0.99)];
	}
	if (cmap=='cold-hot'){
		colors = [new THREE.Vector4(1, 1, 1, -0.99),
				new THREE.Vector4(0, 1, 1, -0.66),
				new THREE.Vector4(0, 0, 1, -0.33),
				new THREE.Vector4(0, 0, 0, 0.0),
				new THREE.Vector4(1, 0, 0, 0.33),
				new THREE.Vector4(1, 1, 0, 0.66),	
				new THREE.Vector4(1, 1, 1, 0.99)];
	}	
	else if (cmap=='blueInk'){
		colors = [new THREE.Vector4(1.0,1.0,1.0,0.0),
				new THREE.Vector4(0.0,0.0,1.0,0.8),
				new THREE.Vector4(0.0,0.0,1.0,0.8),
				new THREE.Vector4(0.0,0.0,1.0,0.8),
				new THREE.Vector4(0.0,0.0,1.0,0.8),
				new THREE.Vector4(0.0,0.0,1.0,0.8),
				new THREE.Vector4(0.0,0.0,1.0,0.8)];
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


function diffuseControls(){
	this.scene = "Blue Ink";
	this.bc = "fixed";
	this.speed = 1;
	this.brushWidth = 5;
	this.pause = function(){
		 mUniforms.pause.value  = 1 - mUniforms.pause.value;
	}
}
function initControls() {
    var controls = new diffuseControls;
    var gui = new dat.GUI({
        autoPlace: false
    }); 

    // Scene (colormap)
    sceneControl = gui.add(controls, "scene",
    	 ["blueInk", "cold-hot", "heat"]).name("Scene");
    sceneControl.onChange(setColorMap);


    //boundary condition
    bcControl = gui.add(controls, "bc", ["fixed value", "closed"]).name("Boundaries");
    bcControl.onChange(function(value){
    	if (value=="fixed value"){
    		mUniforms.boundaryCondition.value = 0;
    	}
    	else if (value=="closed"){
    		mUniforms.boundaryCondition.value = 1;
    	}
    })

    //brush
    brushWidthControl = gui.add(controls, "brushWidth", 1, 20).name('Brush Width');
    brushWidthControl.onChange(function(value){
    	mUniforms.brushWidth.value = Math.floor(value);
    });

    //speed
    speedControl = gui.add(controls, "speed", 1, 20).name('Speed');
    speedControl.onChange(function(value){
    	speed = Math.floor(value);
    });  

    //pause
    pauseControl = gui.add(controls, "pause").name('Pause');

    //own separate container
    var customContainer = document.getElementById('controls');
    customContainer.appendChild(gui.domElement);
}