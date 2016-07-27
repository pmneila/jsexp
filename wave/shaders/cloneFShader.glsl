varying vec2 vUv;
uniform sampler2D tSource;

void main()
{

    float value = texture2D(tSource, vUv).r;

    gl_FragColor = vec4(value, 0.0, 0.0, 1.0); 
}
