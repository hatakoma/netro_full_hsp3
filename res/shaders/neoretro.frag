#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D u_diffuseTexture;
uniform float u_stepX;
uniform float u_stepY;
uniform float u_mintGain;
uniform float u_orangeGain;
uniform float u_spread;
uniform float u_halo;
uniform float u_enabled;
uniform float u_trailOnly;
uniform float u_redGain;
uniform float u_greenGain;
varying vec2 v_texCoord;
varying vec4 v_color;

// Chromaticity matching: brightness-independent, with dark/gray rejection.
vec3 emission(vec3 c) {
    float peak = max(c.r, max(c.g, c.b));
    float low = min(c.r, min(c.g, c.b));
    vec3 hue = c / max(peak, 0.001);
    vec3 mint = vec3(64.0, 255.0, 192.0) / 255.0;
    vec3 orange = vec3(255.0, 128.0, 40.0) / 255.0;
    float gate = smoothstep(0.08, 0.35, peak)
               * smoothstep(0.12, 0.35, (peak-low)/max(peak,0.001));
    float m = 1.0-smoothstep(0.12, 0.40, distance(hue, mint));
    float o = 1.0-smoothstep(0.12, 0.40, distance(hue, orange));
    return (mint*m*u_mintGain + orange*o*u_orangeGain)*peak*gate;
}

void main() {
    vec3 base = texture2D(u_diffuseTexture, v_texCoord).rgb;
    if (u_trailOnly > 0.5) {
        // Dominant-channel selection excludes mint, orange and neutral colors.
        float red = smoothstep(0.55,0.80,
            (base.r-max(base.g,base.b))/max(base.r,0.001));
        float green = smoothstep(0.55,0.80,
            (base.g-max(base.r,base.b))/max(base.g,0.001));
        float bright = smoothstep(0.08,0.3,max(base.r,base.g));
        vec3 light = vec3(1.0,0.025,0.01)*base.r*red*u_redGain
                   + vec3(0.025,1.0,0.06)*base.g*green*u_greenGain;
        gl_FragColor = vec4(light*bright,1.0)*v_color;
        return;
    }
    if (u_enabled < 0.5) {
        gl_FragColor = vec4(base, 1.0)*v_color;
        return;
    }
    vec2 stepUV = vec2(u_stepX, u_stepY);
    vec3 expanded = vec3(0.0);
    vec3 halo = vec3(0.0);
    // Fixed 5x5 kernel; runs at logical resolution, not display resolution.
    for (int y=-2; y<=2; y++) {
        for (int x=-2; x<=2; x++) {
            vec2 uv = v_texCoord + vec2(float(x),float(y))*stepUV;
            float inside = step(0.0,uv.x)*step(uv.x,1.0)
                         * step(0.0,uv.y)*step(uv.y,1.0);
            vec3 e = emission(texture2D(u_diffuseTexture,
                clamp(uv,stepUV*0.5,vec2(1.0)-stepUV*0.5)).rgb)*inside;
            float weight = (3.0-abs(float(x)))*(3.0-abs(float(y)));
            halo += e*weight/81.0;
            if (x>=-1 && x<=1 && y>=-1 && y<=1) expanded=max(expanded,e);
        }
    }
    vec3 glow = expanded*u_spread + halo*u_halo;
    gl_FragColor = vec4(clamp(base+glow,0.0,1.0),1.0)*v_color;
}
