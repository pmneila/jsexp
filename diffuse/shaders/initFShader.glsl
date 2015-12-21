varying vec2 vUv;
uniform sampler2D tSource;
uniform vec2 delta;
uniform vec4 colors[7];
void main()
{

    float value = texture2D(tSource, vUv).r;

    gl_FragColor = vec4(value*colors[6].a, 0.0, 0.0, 1.0); 
}
