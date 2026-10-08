#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D u_diffuseTexture;
uniform float u_decay;
uniform float u_floor;
varying vec2 v_texCoord;
varying vec4 v_color;
void main() {
    vec3 history = texture2D(u_diffuseTexture,v_texCoord).rgb;
    // Subtraction prevents an 8-bit history buffer retaining faint pixels forever.
    gl_FragColor = vec4(max(history*u_decay-vec3(u_floor),vec3(0.0)),1.0)*v_color;
}
