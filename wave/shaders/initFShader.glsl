varying vec2 vUv;
uniform sampler2D tSource;
uniform sampler2D tSourcePrev;
uniform vec2 delta;
uniform vec4 colors[7];
void main()
{

	float x = (vUv.x-0.5)*2.0;
	float y = (vUv.y-0.5)*2.0;

    float value = 0.2*exp(-(x*x+y*y)/0.05);
    // value = 0.0;
    // if (length(vUv-vec2(0.5,0.5))<0.05 ){
    // 	value = 0.2;
    // }
    
    gl_FragColor = vec4(value, 0.0, 0.0, 1.0); 
}
