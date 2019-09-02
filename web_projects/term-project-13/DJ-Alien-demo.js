// * DJ Uno - 5/31/2019 - Alien Demo

import {tiny, defs} from './common.js';

const { Vec, Mat, Mat4, Color, Light, Shape, Material, Shader, Texture, Scene } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere } = defs;

export class Alien{
  constructor()
    {
      this.position = Vec.of(0,0,0);
      this.HP = 3;
    }
}

class Alien_Shader extends Shader
{                                        
  update_GPU( context, gpu_addresses, program_state, model_transform, material )
      {        // update_GPU():  Define how to synchronize our JavaScript's variables to the GPU's:
        const [ P, C, M ] = [ program_state.projection_transform, program_state.camera_inverse, model_transform ],
                      PCM = P.times( C ).times( M );
        context.uniformMatrix4fv( gpu_addresses.projection_camera_model_transform, false, Mat.flatten_2D_to_1D( PCM.transposed() ) );
        context.uniform1f ( gpu_addresses.animation_time, program_state.animation_time / 1000 );
      }
  shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
              varying vec2 f_tex_coord;
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return this.shared_glsl_code() + `
        attribute vec3 position;                            // Position is expressed in object coordinates.
        attribute vec2 texture_coord;
        uniform mat4 projection_camera_model_transform;
        uniform float animation_time;

        void main()
        { float a = animation_time, x = position.x, y = position.y, z = position.z;
          gl_Position = projection_camera_model_transform * vec4( x + ( 0.1*( sin(a)*10000. - floor(sin(a)*10000.) ) ),
                                                                  y + ( 0.1*( sin(a)*10000. - floor(sin(a)*10000.) ) ),
                                                                  z + ( 0.1*( sin(a)*10000. - floor(sin(a)*10000.) ) )*z*abs(sin( sin(a)*10000. - floor(sin(a)*10000.) )),
                                                                  1.0 );
          f_tex_coord = texture_coord;                                       // Directly use original texture coords and interpolate between.
        }`;
    }
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    { return this.shared_glsl_code() + `
        uniform float animation_time;
        void main()
        { float a = animation_time, u = f_tex_coord.x, v = f_tex_coord.y;   
                                                                  // Use an arbitrary math function to color in all pixels as a complex                                                                  
          gl_FragColor = vec4(                                    // function of the UV texture coordintaes of the pixel and of time.  
            0.1 + 0.5*sin(a),
            1.0,
            0.1 + 0.5*sin(a),
            1);
        }`;
    }
}

class Phong_Shader extends Shader
{                                  // **Phong_Shader** is a subclass of Shader, which stores and maanges a GPU program.  
                                   // Graphic cards prior to year 2000 had shaders like this one hard-coded into them
                                   // instead of customizable shaders.  "Phong-Blinn" Shading here is a process of 
                                   // determining brightness of pixels via vector math.  It compares the normal vector
                                   // at that pixel with the vectors toward the camera and light sources.

  
  constructor( num_lights = 2 )
    { super(); 
      this.num_lights = num_lights;
    }

  shared_glsl_code()           // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return ` precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;
                              // Specifier "varying" means a variable's final value will be passed from the vertex shader
                              // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
                              // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
                                             // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace )
          {                                        // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++)
              {
                            // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                            // light will appear directional (uniform direction from all points), and we 
                            // simply obtain a vector towards the light by directly using the stored value.
                            // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                            // the point light's location from the current surface point.  In either case, 
                            // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );
                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                                                  // Compute the diffuse and specular components from the Phong
                                                  // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
              }
            return result;
          } ` ;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return this.shared_glsl_code() + `
        attribute vec3 position, normal;                            // Position is expressed in object coordinates.
        
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        void main()
          {                                                                   // The vertex's final resting place (in NDCS):
            gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                                                                              // The final normal vector in screen space.
            N = normalize( mat3( model_transform ) * normal / squared_scale);
            
            vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
          } ` ;
    }
  fragment_glsl_code()         // ********* FRAGMENT SHADER ********* 
    {                          // A fragment is a pixel that's overlapped by the current triangle.
                               // Fragments affect the final image or get discarded due to depth.                                 
      return this.shared_glsl_code() + `
        void main()
          {                                                           // Compute an initial (ambient) color:
            gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                                                                     // Compute the final color with contributions from lights:
            gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
          } ` ;
    }
  send_material( gl, gpu, material )
    {                                       // send_material(): Send the desired shape-wide material qualities to the
                                            // graphics card, where they will tweak the Phong lighting formula.                                      
      gl.uniform4fv( gpu.shape_color,    material.color       );
      gl.uniform1f ( gpu.ambient,        material.ambient     );
      gl.uniform1f ( gpu.diffusivity,    material.diffusivity );
      gl.uniform1f ( gpu.specularity,    material.specularity );
      gl.uniform1f ( gpu.smoothness,     material.smoothness  );
    }
  send_gpu_state( gl, gpu, gpu_state, model_transform )
    {                                       // send_gpu_state():  Send the state of our whole drawing context to the GPU.
      const O = Vec.of( 0,0,0,1 ), camera_center = gpu_state.camera_transform.times( O ).to3();
      gl.uniform3fv( gpu.camera_center, camera_center );
                                         // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
      const squared_scale = model_transform.reduce( 
                                         (acc,r) => { return acc.plus( Vec.from(r).mult_pairs(r) ) }, Vec.of( 0,0,0,0 ) ).to3();                                            
      gl.uniform3fv( gpu.squared_scale, squared_scale );     
                                                      // Send the current matrices to the shader.  Go ahead and pre-compute
                                                      // the products we'll need of the of the three special matrices and just
                                                      // cache and send those.  They will be the same throughout this draw
                                                      // call, and thus across each instance of the vertex shader.
                                                      // Transpose them since the GPU expects matrices as column-major arrays.
      const PCM = gpu_state.projection_transform.times( gpu_state.camera_inverse ).times( model_transform );
      gl.uniformMatrix4fv( gpu.                  model_transform, false, Mat.flatten_2D_to_1D( model_transform.transposed() ) );
      gl.uniformMatrix4fv( gpu.projection_camera_model_transform, false, Mat.flatten_2D_to_1D(             PCM.transposed() ) );

                                             // Omitting lights will show only the material color, scaled by the ambient term:
      if( !gpu_state.lights.length )
        return;

      const light_positions_flattened = [], light_colors_flattened = [];
      for( var i = 0; i < 4 * gpu_state.lights.length; i++ )
        { light_positions_flattened                  .push( gpu_state.lights[ Math.floor(i/4) ].position[i%4] );
          light_colors_flattened                     .push( gpu_state.lights[ Math.floor(i/4) ].color[i%4] );
        }      
      gl.uniform4fv( gpu.light_positions_or_vectors, light_positions_flattened );
      gl.uniform4fv( gpu.light_colors,               light_colors_flattened );
      gl.uniform1fv( gpu.light_attenuation_factors, gpu_state.lights.map( l => l.attenuation ) );
    }
  update_GPU( context, gpu_addresses, gpu_state, model_transform, material )
    {             // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader 
                  // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
                  // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or 
                  // program (which we call the "Program_State").  Send both a material and a program state to the shaders 
                  // within this function, one data field at a time, to fully initialize the shader for a draw.                  
      
                  // Fill in any missing fields in the Material object with custom defaults for this shader:
      const defaults = { color: Color.of( 0,0,0,1 ), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40 };
      material = Object.assign( {}, defaults, material );

      this.send_material ( context, gpu_addresses, material );
      this.send_gpu_state( context, gpu_addresses, gpu_state, model_transform );
    }
}

class Textured_Phong extends Phong_Shader
{                       // **Textured_Phong** is a Phong Shader extended to addditionally decal a
                        // texture image over the drawn shape, lined up according to the texture
                        // coordinates that are stored at each shape vertex.
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return this.shared_glsl_code() + `
        varying vec2 f_tex_coord;
        attribute vec3 position, normal;                            // Position is expressed in object coordinates.
        attribute vec2 texture_coord;
        
        uniform mat4 model_transform;
        uniform mat4 projection_camera_model_transform;
        void main()
          {                                                                   // The vertex's final resting place (in NDCS):
            gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                                                                              // The final normal vector in screen space.
            N = normalize( mat3( model_transform ) * normal / squared_scale);
            
            vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                                              // Turn the per-vertex texture coordinate into an interpolated variable.
            f_tex_coord = texture_coord;
          } ` ;
    }
  fragment_glsl_code()         // ********* FRAGMENT SHADER ********* 
    {                          // A fragment is a pixel that's overlapped by the current triangle.
                               // Fragments affect the final image or get discarded due to depth.                                
      return this.shared_glsl_code() + `
        varying vec2 f_tex_coord;
        uniform sampler2D texture;
        void main()
          {                                                          // Sample the texture image in the correct place:
            vec4 tex_color = texture2D( texture, f_tex_coord );
            if( tex_color.w < .01 ) discard;
                                                                     // Compute an initial (ambient) color:
            gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                     // Compute the final color with contributions from lights:
            gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
          } ` ;
    }
  update_GPU( context, gpu_addresses, gpu_state, model_transform, material )
    {             // update_GPU(): Add a little more to the base class's version of this method.                
      super.update_GPU( context, gpu_addresses, gpu_state, model_transform, material );
                                               
      if( material.texture && material.texture.ready )
      {                         // Select texture unit 0 for the fragment shader Sampler2D uniform called "texture":
        context.uniform1i( gpu_addresses.texture, 0);
                                  // For this draw, use the texture image from correct the GPU buffer:
        material.texture.activate( context );
      }
    }
}

class Moon_Shader extends Textured_Phong
{
    fragment_glsl_code()
    {                            // ********* FRAGMENT SHADER ********* 
      return this.shared_glsl_code() + `
        varying vec2 f_tex_coord;
        uniform sampler2D bump_texture;
        void main()
          {                                                          // Sample the texture image in the correct place:
            vec4 tex_color = texture2D( bump_texture, f_tex_coord );
            //vec3 TextureNormal_tangentspace = normalize(bump_texture( NormalTextureSampler, UV ).rgb*2.0 - 1.0);
            //if( tex_color.w < .01 ) discard;
                             // Slightly disturb normals based on sampling the same image that was used for texturing:
            vec3 bumped_N  = N + tex_color.rgb - .5*vec3(1,1,1);
                                                                     // Compute an initial (ambient) color:
            gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                     // Compute the final color with contributions from lights:
            //gl_FragColor.xyz += phong_model_lights( normalize( tex_color ), vertex_worldspace );
          } ` ;
    }
}


  // Scene which gets exported to main-scene.      
export class Alien_Demo extends Scene
{
  constructor()
    { super()

      this.shapes = { cube: new defs.Cube(), square: new defs.Square(), sphere: new defs.Subdivision_Sphere(6) };
      
      // Shader
      const alien_shader     = new Alien_Shader();
      const moon_shader       = new Moon_Shader();
      // Material 
      this.alien       = new Material( alien_shader, { color: Color.of( .5,.5,.5,1 ), ambient: 1, 
                                        diffusivity: 1, specularity: .5, smoothness: 10 });
      this.moon        = new Material( moon_shader, { color: Color.of( .5,.5,.5,1 ), ambient: 1,
                                        texture: new Texture( "assets/Ground_Dirt_005_COLOR.JPG" ),
                                        bump_texture: new Texture( "assets/Ground_Dirt_005_NORM.jpg" ),
                                        diffusivity: 1, specularity: .5, smoothness: 10 });
    }

    // Runs every frame
  display( context, program_state )
    { 

      // Some testing stuff (movement controls, camera, lights, etc.)
      if( !context.scratchpad.controls ) 
        {                       // Add a movement controls panel to the page:
          this.children.push( context.scratchpad.controls = new defs.Movement_Controls() ); 
          
          program_state.set_camera( Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          this.initial_camera_location = program_state.camera_inverse;
          program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 200 );
        }


      const t = program_state.animation_time/1000;
      program_state.lights = [ new Light( Vec.of( 10, 0, 0 ,1 ),   Color.of( 1,1,1,1 ),  10000000000 ),
                               new Light( Vec.of( 0, 10, 0, 1 ), Color.of( 1,.7,.7,1 ), 1000000000 ),
                               new Light( Vec.of( 0, 0, 10 ,1 ),   Color.of( 1,1,1,1 ),  10000000000 ),
                               new Light( Vec.of( -30,10,10,1 ), Color.of( 1,.2,.7,1 ), 1000000000 ) ];


      this.shapes.square.draw( context, program_state, Mat4.identity().times(Mat4.scale([4,4,4])), this.alien );

      

    }
}