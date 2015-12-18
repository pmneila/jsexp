var container;
var camera, scene, renderer;	

var width, height;
var toggleBuffer = false;
var planeScreen;

function init(){
	// renderer
	var width = Math.min(window.innerWidth,2*window.innerHeight);
	var height = width/2;

	container = document.getElementById( 'container' );
	container.width = width;
	container.height = height;

	renderer = new THREE.WebGLRenderer({canvas:container, preserveDrawingBuffer: true});
	renderer.setClearColor( 0xa0a0a0 );
	renderer.setSize(width, height);

	// camera
	var camHeight = height;
	var camWidth = width;

	camera = new THREE.OrthographicCamera( -0.5, 0.5, 0.5, -0.5, - 500, 1000 );
	scene = new THREE.Scene();

	// plane
	var planeheight=height/8, planewidth = width/8;//planeheight*screenRatio;
	var colors = [new THREE.Vector4(0, 0, 0, 0.0),
				new THREE.Vector4(1, 0, 0, 0.33),
				new THREE.Vector4(1, 1, 0, 0.66),	
				new THREE.Vector4(1, 1, 1, 0.99)];


	mUniforms = {
		delta: {type:  "v2", value: new THREE.Vector2(1/planewidth,1/planeheight)},
		tSource: {type: "t", value: undefined},
		colors: {type: "v4v", value: colors},
	};

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

function renderSimulation(time){
	

	planeScreen.material = modelMaterial;
	for (var i=0; i<64; i++){
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