varying vec2 vUv;
varying vec4 view;
varying vec4 viewLightPos;
// varying vec3 Normal;

uniform sampler2D tSource;
uniform vec2 delta;
uniform vec3 lightPos;
void main()
{	
	vUv = uv;
    float u_ij = texture2D(tSource, vUv).r;
    // float u_imj = texture2D(tSource, vUv+vec2(-1.0*delta.x,0.0)).r;
    // float u_ipj = texture2D(tSource, vUv+vec2(delta.x,0.0)).r;
    // float u_ijm = texture2D(tSource, vUv+vec2(0.0,-1.0*delta.y)).r;
    // float u_ijp = texture2D(tSource, vUv+vec2(0.0,delta.y)).r;

    // float dudx = (u_ipj-u_imj)/(2.0*delta.x);
    // float dudy = (u_ijp-u_ijm)/(2.0*delta.y);

    
    // Normal = normalize(vec3(-dudx,-dudy,1.0));	

	float dz = u_ij;
	//view = modelViewMatrix*vec4(position,1.0).xyz;
	vec3 newPosition = position+vec3(0.0,0.0,dz);
	view = modelViewMatrix*vec4(newPosition,1.0);
    viewLightPos = modelViewMatrix*vec4(lightPos,1.0);
	gl_Position = projectionMatrix* modelViewMatrix*vec4(newPosition,1.0);
}