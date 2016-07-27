varying vec2 vUv;
uniform sampler2D tSource;
uniform vec2 delta;
uniform vec2 texel;
uniform vec2 mouse;
uniform int mouseDown;
uniform int boundaryCondition;
uniform float heatSourceSign;
uniform float heatIntensity;
uniform float brushWidth;
uniform int pause;
void main()
{
	//neighbors values
	float u_ij = texture2D(tSource, vUv).r;
	float u_imj = texture2D(tSource, vUv+vec2(-1.0*delta.x,0.0)).r;
	float u_ipj = texture2D(tSource, vUv+vec2(delta.x,0.0)).r;
	float u_ijm = texture2D(tSource, vUv+vec2(0.0,-1.0*delta.y)).r;
	float u_ijp = texture2D(tSource, vUv+vec2(0.0,delta.y)).r;
	float dt = 0.2*delta.x*delta.x;

	if (mouseDown==1){
		vec2 dist = (mouse-vUv)/texel;
		if (length(dist)<=brushWidth/2.0){
			u_ij += heatSourceSign*heatIntensity*dt;//*dt, but then it should also
			//have the diffusivity constant of the material in the equation.
			//anyway, everything is the same up to scaling by some space
			//and time constants, so it does not really matter.
		}
	}		
	if (pause == 0){
		//boundaries
		if (boundaryCondition == 0){
			if (vUv.x <=delta.x){
				gl_FragColor = vec4(0.0,0.0,0.0,1.0);
				return;
			}
			else if (vUv.x >=1.0-delta.x){
				gl_FragColor = vec4(0.0,0.0,0.0,1.0);
				return;
			}

			if (vUv.y <=delta.y){
				gl_FragColor = vec4(0.0,0.0,0.0,1.0);
				return;
			}
			else if (vUv.y>=1.0-delta.y) {
				gl_FragColor = vec4(0.0,0.0,0.0,1.0);
				return;
			}
		}
		else{
			if (vUv.x <=delta.x){
				gl_FragColor= vec4(u_ipj,0.0,0.0,1.0);
				return;
			}
			else if (vUv.x >=1.0-delta.x){
				gl_FragColor= vec4(u_imj,0.0,0.0,1.0);
				return;
			}

			if (vUv.y <=delta.y){
				gl_FragColor= vec4(u_ijp,0.0,0.0,1.0);
				return;
			}
			else if (vUv.y>=1.0-delta.y) {
				gl_FragColor= vec4(u_ijm,0.0,0.0,1.0);
				return;
			}	
		}
		//interior: u^{n+1}
		float u_np = u_ij;
		u_np += dt/(delta.x*delta.x)*(u_imj+u_ipj-2.0*u_ij);
		u_np += dt/(delta.x*delta.x)*(u_ijm+u_ijp-2.0*u_ij);

		gl_FragColor = vec4(u_np,0.0,0.0,1.0);
	}
	else{

		gl_FragColor = vec4(u_ij,0.0,0.0,1.0);
	}
}