
uniform sampler2D tSource;
uniform vec2 delta;
uniform vec4 colors[3];

varying vec2 vUv;
varying vec4 view;
// varying vec3 Normal;


const vec3 diffuseColor = vec3(0.0, 0.0, 0.5);
const vec3 lightPos = vec3(1.0,1.0,1.0);
const vec3 specularColor = vec3(33.0/255.0, 148.0/255.0, 206.0/255.0)*0.5;
const float shininess=120.0;
const float screenGamma = 2.2;
// const vec3 ambientColor = vec3(0.0,0.0,0.1);

void main()
{
    vec3 ambientColor= vec3(0.0,0.0,0.0);
    vec3 vertPos = vec3(view.x, view.y, view.z);
    vec3 lightDir = normalize(lightPos - vertPos);
    lightDir = vec3(0.0,0.0,1.0);
    float u_ij = texture2D(tSource, vUv).r;
    float u_imj = texture2D(tSource, vUv+vec2(-1.0*delta.x,0.0)).r;
    float u_ipj = texture2D(tSource, vUv+vec2(delta.x,0.0)).r;
    float u_ijm = texture2D(tSource, vUv+vec2(0.0,-1.0*delta.y)).r;
    float u_ijp = texture2D(tSource, vUv+vec2(0.0,delta.y)).r;

    float dudx = (u_ipj-u_imj)/(2.0*delta.x);
    float dudy = (u_ijp-u_ijm)/(2.0*delta.y);

    
    vec3 Normal = normalize(vec3(-dudx,-dudy,1.0));

    //diffuse 
    float lambertian = max(dot(lightDir,Normal),0.0);
    float specular = 0.0;
    if (lambertian>0.0){
        vec3 viewDir = normalize(-vertPos);
        vec3 halfDir = normalize(viewDir+lightDir);
        float dotprod = max(dot(halfDir,Normal),0.0);
        specular = pow(dotprod, shininess);
    }

    vec3 pseudoColor =  ambientColor
                    +lambertian*diffuseColor
                    +specular*specularColor;
	// 
    pseudoColor = pow(pseudoColor, vec3(1.0/screenGamma));
    gl_FragColor = vec4(pseudoColor.r, pseudoColor.g,pseudoColor.b, 1.0); 
}
