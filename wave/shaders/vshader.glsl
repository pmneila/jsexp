varying vec2 vUv;
varying vec3 view;
void main()
{	
	vUv = uv;
	//view = modelViewMatrix*vec4(position,1.0).xyz;
	gl_Position = projectionMatrix* modelViewMatrix*vec4(position,1.0);
}