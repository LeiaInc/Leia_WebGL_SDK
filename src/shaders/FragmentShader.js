export var FRAG_SHADER = `precision highp float;
precision highp int;

// our textures
uniform sampler2D _texture_0;
uniform sampler2D _texture_1;
uniform sampler2D _texture_2;
uniform sampler2D _texture_3;
uniform sampler2D _texture_4;
uniform sampler2D _texture_5;
uniform sampler2D _texture_6;
uniform sampler2D _texture_7;

// other inputs
uniform float _width;// = 2560.0;
uniform float _height;// = 1600.0;

uniform float _viewResX;// = 640.0;
uniform float _viewResY;// = 400.0;

uniform float _viewsX;//= 4.0;
uniform float _viewsY;// = 1.0;

uniform mat4 _interlace_matrix; /* = mat4(
                                              1,0,0,640,
                                              0,1,0,0,
                                              0,0,1,0,
                                              0,0,0,0);//mat4(1,0,0,0,0,1,0,0,0,0,1,0,640,0,0,0); */
uniform vec4 _interlace_vector;// = vec4(0,0,0,0);

varying vec2 v_texCoord;

// functions

highp mat4 transpose(in highp mat4 inMatrix) {
    highp vec4 i0 = inMatrix[0];
    highp vec4 i1 = inMatrix[1];
    highp vec4 i2 = inMatrix[2];
    highp vec4 i3 = inMatrix[3];

    highp mat4 outMatrix = mat4(
                 vec4(i0.x, i1.x, i2.x, i3.x),
                 vec4(i0.y, i1.y, i2.y, i3.y),
                 vec4(i0.z, i1.z, i2.z, i3.z),
                 vec4(i0.w, i1.w, i2.w, i3.w)
                 );

    return outMatrix;
}

vec4 sample_view(vec2 uv, int view)
 {	
  if (view == 0)
  {
    return texture2D(_texture_0, uv);
  }
  else if (view == 1)
  {
    return texture2D(_texture_1, uv);
  }
  else if (view == 2)
  {
    return texture2D(_texture_2, uv);
  }
  else if (view == 3)
  {
    return texture2D(_texture_3, uv);
  }

  return vec4(0,0,0,1);
}

mat4 interlace_map(mat4 normalized_pixel_matrix) {
   
  mat4 result = normalized_pixel_matrix * _interlace_matrix;
      
  for (int axis = 0; axis < 4; ++axis) {
    result[axis] += _interlace_vector[axis];
  }

  return result;
}

vec4 periodic_mod(vec4 a, vec4 b) {
  return a - b * floor(a / b);
}

float view_volume(vec4 normalized_view_pixel) {
  vec4 viewRes = vec4(_viewResX, _viewResY, 3.0, _viewsX * _viewsY);
  vec4 float_precision_offset = 0.5 - vec4(0.0, 0.0, 0.0, 1.0) * 1.0 / max(2.0, viewRes.w);
  ivec4 view_pixel = ivec4(periodic_mod(viewRes * normalized_view_pixel + float_precision_offset, viewRes));

  int channel = view_pixel.z;
  int view = view_pixel.w;

  vec4 sampleViewCol = sample_view(normalized_view_pixel.xy, view);

  if(channel == 0)
  {
    return sampleViewCol[0];
  }
  else if(channel == 1)
  {
    return sampleViewCol[1];
  }
  else if(channel == 2)
  {
    return sampleViewCol[2];
  }
  else if(channel == 3)
  {
    return sampleViewCol[3];
  }

  return 0.0;//sampleViewCol[0];
}

vec4 interlaced_sample(vec2 normalized_display_coord) 
{
  mat4 normalized_display_pixel_matrix = mat4(
    normalized_display_coord.xxxx,
    normalized_display_coord.yyyy,
    (vec4(0.0, 1.0, 2.0, 0.0) / 3.0),
    vec4(0.0, 0.0, 0.0, 0.0)
  );

  mat4 normalized_view_pixel_matrix = interlace_map(normalized_display_pixel_matrix);

  vec4 result = vec4(0, 0, 0, 1);
  for (int channel = 0; channel < 3; ++channel) {
    vec4 normalized_view_pixel = vec4(
      normalized_view_pixel_matrix[0][channel],
      normalized_view_pixel_matrix[1][channel],
      normalized_view_pixel_matrix[2][channel],
      normalized_view_pixel_matrix[3][channel]
    );
    result[channel] = view_volume(normalized_view_pixel);
  }

  int _viewXInt = int(_viewsX);
  result[3] = sample_view(normalized_display_coord, _viewXInt / 2)[3];

  return result;
}


void main()
{
  vec2 normalized_display_coord = v_texCoord;
  normalized_display_coord.y = 1.0 - normalized_display_coord.y;
  float pixel_origin = 0.5;
  normalized_display_coord -= pixel_origin / vec2(_width, _height);

  vec4 interlaced_fragment = interlaced_sample(normalized_display_coord);

  gl_FragColor = interlaced_fragment;
  
  
}`;