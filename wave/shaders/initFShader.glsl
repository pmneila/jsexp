varying vec2 vUv;
uniform sampler2D tSource;
uniform sampler2D tSourcePrev;
uniform vec2 delta;
uniform vec4 colors[7];
uniform vec2 texel;
void main()
{

	vec2 dist = (vUv-vec2(0.5,0.5));
	float l = length(dist);

    float value = 0.1*exp(-l*l/0.05/0.05);
    gl_FragColor = vec4(value, 0.0, 0.0, 1.0); 

}
