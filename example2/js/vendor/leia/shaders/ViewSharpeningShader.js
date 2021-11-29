export var VIEWSHARPENING_SHADER = `
precision highp float;
precision highp int;

// our texture
uniform sampler2D u_image;

// resolution of image
uniform vec2 u_resolution;

/*uniform*/ vec4 sharpening_x = vec4(0.05, 0.15, 0.0, 0.0);
/*uniform*/ vec4 sharpening_y = vec4(0.032, 0.02, 0.0, 0.0);
/*uniform*/ float sharpening_center = 1.0;
/*uniform*/ int sharpening_x_size = 2;
/*uniform*/ int sharpening_y_size = 2;
/*uniform*/ float gamma  = 2.2;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

vec3 GammaToLinear(vec3 col)
{
   return pow(col, vec3(gamma,gamma,gamma));
}

vec3 texture_offset(vec2 uv, ivec2 offset)
{
   vec2 uv_offset = uv + (vec2(offset) / u_resolution);
   return texture2D(u_image, uv_offset).rgb;
}

vec3 LinearToGamma(vec3 col)
{
   float v = 1.0 / gamma;
   return pow(col, vec3(v,v,v));
}

void main()
{
   vec4 final_color = vec4(0, 1, 0, 1);
   vec2 flippedUV = vec2(v_texCoord.x, 1.0 - v_texCoord.y);

   final_color.rgb = sharpening_center * GammaToLinear(texture_offset(flippedUV, ivec2(0, 0)));
   float normalizer = 1.0;

   int xSharpeningSize = int(min(max(float(sharpening_x_size), 1.0), 4.0));
   int ySharpeningSize = int(min(max(float(sharpening_y_size), 1.0), 4.0));

   for (int j = 0; j < 4; ++j)
   {
      if(j < xSharpeningSize)
      {
        final_color.rgb -= sharpening_x[j] * GammaToLinear(texture_offset(flippedUV, ivec2(j + 1, 0)));
        final_color.rgb -= sharpening_x[j] * GammaToLinear(texture_offset(flippedUV, ivec2(-j - 1, 0)));
      }
   }

   for (int k = 0; k < 4; ++k)
   {
      if(k < ySharpeningSize)
      {
        final_color.rgb -= sharpening_y[k] * GammaToLinear(texture_offset(flippedUV, ivec2(0, k + 1)));
        final_color.rgb -= sharpening_y[k] * GammaToLinear(texture_offset(flippedUV, ivec2(0, -k - 1)));
      }
   }

   final_color.rgb = LinearToGamma(final_color.rgb);
   final_color.rgb = clamp(final_color.rgb, 0.0, 1.0);
   gl_FragColor = final_color;
}`;