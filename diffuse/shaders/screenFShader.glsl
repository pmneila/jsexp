varying vec2 vUv;
uniform sampler2D tSource;
uniform vec2 delta;
uniform vec4 colors[4];

void main()
{

    float value = texture2D(tSource, vUv).r;
    //int step = int(floor(value));
    //float a = fract(value);
    float t;
    vec3 pseudoColor;
	// 
    if(value <= colors[0].a){
        pseudoColor = colors[0].rgb;
    }
    else if (value > colors[3].a){
    	pseudoColor = colors[3].rgb;
    }
    else{
    	for (int i=1; i<4; i++){
			vec4 cleft = colors[i-1];
			vec4 cright = colors[i];

			if (value>cleft.a && value <=cright.a){
				t = (value - cleft.a)/(cright.a - cleft.a);
				pseudoColor = mix(cleft.rgb, cright.rgb, t);
				break;
			}
		}			
	}                                  

    gl_FragColor = vec4(pseudoColor.r, pseudoColor.g,pseudoColor.b, 1.0); 
}
