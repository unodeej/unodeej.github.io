// * DJ Uno - 5/25/2019 - Marching Cubes
// * Adapted from Three.js "tutorials by example" by Lee Stemkoski - July 2013 (three.js v59dev)

import {tiny, defs} from './common.js';
import {player} from './player.js';

const { Vec, Mat, Mat4, Color, Light, Shape, Material, Shader, Texture, Scene } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere, Noise_Function } = defs;

  // This custom triangle shape class creates triangles with three arbitrary vertices passed in.
const Custom_Triangle = defs.Custom_Triangle =
class Custom_Triangle extends Shape
{   constructor(v1, v2, v3)       // Takes three Vector3's as arguments (three vertices of triangle)
    {
      super( "position", "normal", "texture_coord" );

      this.arrays.position      = [ v1, v2, v3 ];
      
      // In order to compute normal vectors, we need two vectors in the triangle. NOTE: might not accurately select whether facing in or outward                           
      let in_triangle_vec1 = v1.minus(v2);
      let in_triangle_vec2 = v2.minus(v3);

      let computed_normal_vec = in_triangle_vec1.cross(in_triangle_vec2).normalized().times(-1);      // Just from testing, normals seem to look better this way!

      this.arrays.normal        = [ computed_normal_vec, computed_normal_vec, computed_normal_vec ];  // Every vertex has teh same normal, since triangle is a flat surface

      // Texture coords are computed as well. NOTE: Not totally sure if this is a valid method. Basically, it anchors the first uv at (0,0), 
      // then calculates the other two based on their relative locations to that point.
      let t_c1 = Vec.of(0,0);
      let temp = v2.minus(v1);
      let t_c2 = Vec.of( temp[0], temp[1] );
          temp = v3.minus(v1);
      let t_c3 = Vec.of( temp[0], temp[1] );
      this.arrays.texture_coord = [ t_c1, t_c2, t_c3 ]; 

      // Index into our vertices to connect them into a whole triangle:
      this.indices        = [ 0, 1, 2 ];
    }
}


  // This shape class consists of several triangles all put together.
  // It takes all its normals and texture coords from the source triangles used to build it.
const Terrain = defs.Terrain =
class Terrain extends Shape
{   constructor( triangleArray )
    {                             
      super( "position", "normal", "texture_coord" );
      
      // Populate the position array with positions from each triangle.
      this.arrays.position      = [ ];
      for (let i=0; i < triangleArray.length; i++)
      {
          this.arrays.position.push( triangleArray[i].arrays.position[0] );
          this.arrays.position.push( triangleArray[i].arrays.position[1] );
          this.arrays.position.push( triangleArray[i].arrays.position[2] );
      }
     
      // Populate normal array with normals from each triangle.
      this.arrays.normal        = [ ];
      for (let i=0; i < triangleArray.length; i++)
      {
          this.arrays.normal.push( triangleArray[i].arrays.normal[0] );
          this.arrays.normal.push( triangleArray[i].arrays.normal[1] );
          this.arrays.normal.push( triangleArray[i].arrays.normal[2] );
      }

      // Populate texture_coord array with texture_coords from each triangle.
      this.arrays.texture_coord = [ ];
      for (let i=0; i < triangleArray.length; i++)
      {
          this.arrays.texture_coord.push( Vec.of( triangleArray[i].arrays.position[0][0], triangleArray[i].arrays.position[0][2]) );
          this.arrays.texture_coord.push( Vec.of( triangleArray[i].arrays.position[1][0], triangleArray[i].arrays.position[1][2]) );
          this.arrays.texture_coord.push( Vec.of( triangleArray[i].arrays.position[2][0], triangleArray[i].arrays.position[2][2]) );
      }     

      // Populate indices array with increasing numbers for each triangle.
      this.indices        = [ ];
      let count = 0;
      for (let i=0; i < triangleArray.length; i++)
      {
          this.indices.push(count);
          count++;
          this.indices.push(count);
          count++;
          this.indices.push(count);
          count++;
      }
    }
}



  // Scene which gets exported to main-scene.      
export class Marching_Cubes extends Scene
{
  constructor()
    { super()

      this.shapes = { cube: new defs.Cube(),
                     'ball_4' : new Subdivision_Sphere( 4 ) 
                     };


      this.noiseFunction = defs.noise_function;
      
      // Shader
      const texture_shader_2  = new defs.Fake_Bump_Map (2);
      const phong     = new defs.Phong_Shader();
      // Material 
      this.grey       = new Material( texture_shader_2,    
                                    { texture: new Texture( "assets/new_moon.png" ),
                                      ambient: .5, diffusivity: .9, specularity: .2, color: Color.of( .4,.4,.4,1 ) } )
      this.terrainChunks = [];

      // PUBLIC VARIABLES
      this.chunkSize = 30;                      // Size of each chunk. Bigger chunk sizes mean you can see farther and need fewer loads, but each load is more intensive.
      this.terrainDetail = 50;                  // Number of cubes on each side of the grid. >~ 100 seems to crash on my computer.
      this.doInterpolateVertices = false;       // Whether to interpolate between vertices for more detailed, but less flat, geometry

      // Position members; grabbed from "player" each frame
      this.player_pos_x;
      this.player_pos_z;
    }

    // Runs every frame
  display( context, program_state )
    { 
      // Some testing stuff (movement controls, camera, lights, etc.)
//       if( !context.scratchpad.controls ) 
//         {                       // Add a movement controls panel to the page:
//           this.children.push( context.scratchpad.controls = new defs.Movement_Controls() ); 
          
//           program_state.set_camera( Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
//           this.initial_camera_location = program_state.camera_inverse;
//           program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 200 );
//         }

      const t = program_state.animation_time/1000;
      program_state.lights = [ new Light( Vec.of( 10, 0, 0 ,1 ),   Color.of( 1,1,1,1 ),  10000000000 ),
                               new Light( Vec.of( 0, 10, 0, 1 ), Color.of( 1,.7,.7,1 ), 1000000000 ),
                               new Light( Vec.of( 0, 0, 10 ,1 ),   Color.of( 1,1,1,1 ),  10000000000 ),
                               new Light( Vec.of( -30,10,10,1 ), Color.of( 1,.2,.7,1 ), 1000000000 ) ];

      // Get player position for chunk generation
      this.player_pos_x = player.center[0];
      this.player_pos_z = player.center[2];

      this.load_chunks( context, program_state );

      let moon = Mat4.identity();
      moon = moon.times( Mat4.translation([  20,10,0 ])  );
      this.shapes.ball_4.draw( context, program_state, moon, this.grey);
    }
      
  // This function loads and draws the four chunks surrounding this player's current position quadrant.
  load_chunks( context, program_state )
    {
      // Draw chunks
      let x_quadrant = Math.ceil( Math.abs(this.player_pos_x) / (this.chunkSize / 2) ) / 2.0;
      let z_quadrant = Math.ceil( Math.abs(this.player_pos_z) / (this.chunkSize / 2) ) / 2.0;

      if (this.player_pos_x < 0)
            x_quadrant = -x_quadrant;
      if (this.player_pos_z < 0)
            z_quadrant = -z_quadrant;

      let current_x_chunk = Math.floor( x_quadrant );
      let current_z_chunk = Math.floor( z_quadrant );

      //console.log("(" + current_x_chunk + ", " + current_z_chunk + ")");
      //console.log("(" + x_quadrant + ", " + z_quadrant + ")");
      //console.log("POS(" + this.player_pos_x + ", " + this.player_pos_z + ")");

      // Draw chunk in our current position
      if ( this.terrainChunks[current_x_chunk] == undefined )
      {
            this.terrainChunks[current_x_chunk] = [];
      }
      if ( this.terrainChunks[current_x_chunk][current_z_chunk] == undefined )
      {
            this.build_terrain(current_x_chunk,current_z_chunk, this.chunkSize);    
      }

      // Draw the terrain shape.
      let model_transform = Mat4.identity();     
      this.terrainChunks[current_x_chunk][current_z_chunk].draw( context, program_state, model_transform, this.grey );

      // ~~~

      // current chunk + x dir
      let nextXChunkOffset;
      if ( Math.abs(x_quadrant) > Math.abs(current_x_chunk) )
            nextXChunkOffset = 1;
      else
            nextXChunkOffset = -1;

      if (current_x_chunk < 0)
            nextXChunkOffset = -nextXChunkOffset;

      if ( this.terrainChunks[current_x_chunk + nextXChunkOffset] == undefined )
      {
            this.terrainChunks[current_x_chunk + nextXChunkOffset] = [];
      }
      if ( this.terrainChunks[current_x_chunk + nextXChunkOffset][current_z_chunk] == undefined )
      {
            this.build_terrain(current_x_chunk + nextXChunkOffset,current_z_chunk, this.chunkSize);    
      }
      // Draw the terrain shape.
      this.terrainChunks[current_x_chunk + nextXChunkOffset][current_z_chunk].draw( context, program_state, model_transform, this.grey );

      // ~~~

      // current chunk + z dir
      let nextZChunkOffset;
      if ( Math.abs(z_quadrant) > Math.abs(current_z_chunk) )
            nextZChunkOffset = 1;
      else
            nextZChunkOffset = -1;

      if (current_z_chunk < 0)
            nextZChunkOffset = -nextZChunkOffset;

      if ( this.terrainChunks[current_x_chunk][current_z_chunk + nextZChunkOffset] == undefined )
      {
            this.build_terrain(current_x_chunk,current_z_chunk + nextZChunkOffset, this.chunkSize);    
      }
      // Draw the terrain shape.
      this.terrainChunks[current_x_chunk][current_z_chunk + nextZChunkOffset].draw( context, program_state, model_transform, this.grey );

      // ~~~

      // current chunk + x dir + z dir
      if ( this.terrainChunks[current_x_chunk + nextXChunkOffset][current_z_chunk + nextZChunkOffset] == undefined )
      {
            this.build_terrain(current_x_chunk + nextXChunkOffset,current_z_chunk + nextZChunkOffset, this.chunkSize);    
      }
      // Draw the terrain shape.
      this.terrainChunks[current_x_chunk + nextXChunkOffset][current_z_chunk + nextZChunkOffset].draw( context, program_state, model_transform, this.grey );
    }

  
    // This function builds a terrain shape and saves it to this.terrainShape.
  build_terrain(chunk_x, chunk_z, chunkSize)
    {
        // Number of cubes along a side
        var size = this.terrainDetail;

        // Whether to interpolate between vertices for more detailed, but less flat, geometry
        var doInterpolateVertices = this.doInterpolateVertices;



        // Marching cubes lookup tables
        // These tables are straight from Paul Bourke's page:
        // http://local.wasp.uwa.edu.au/~pbourke/geometry/polygonise/
        // who in turn got them from Cory Gene Bloyd.
        let edgeTable = new Int32Array([
      0x0  , 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
      0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
      0x190, 0x99 , 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
      0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
      0x230, 0x339, 0x33 , 0x13a, 0x636, 0x73f, 0x435, 0x53c,
      0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
      0x3a0, 0x2a9, 0x1a3, 0xaa , 0x7a6, 0x6af, 0x5a5, 0x4ac,
      0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
      0x460, 0x569, 0x663, 0x76a, 0x66 , 0x16f, 0x265, 0x36c,
      0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
      0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff , 0x3f5, 0x2fc,
      0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
      0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55 , 0x15c,
      0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
      0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc ,
      0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
      0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
      0xcc , 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
      0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
      0x15c, 0x55 , 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
      0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
      0x2fc, 0x3f5, 0xff , 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
      0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
      0x36c, 0x265, 0x16f, 0x66 , 0x76a, 0x663, 0x569, 0x460,
      0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
      0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa , 0x1a3, 0x2a9, 0x3a0,
      0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
      0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33 , 0x339, 0x230,
      0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
      0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99 , 0x190,
      0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
      0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0]);
        let triTable = new Int32Array([
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1,
      3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1,
      3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1,
      3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1,
      9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1,
      1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1,
      9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
      2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1,
      8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1,
      9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
      4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1,
      3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1,
      1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1,
      4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1,
      4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1,
      9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1,
      1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
      5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1,
      2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1,
      9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
      0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
      2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1,
      10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1,
      4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1,
      5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1,
      5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1,
      9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1,
      0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1,
      1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1,
      10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1,
      8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1,
      2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1,
      7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1,
      9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1,
      2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1,
      11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1,
      9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1,
      5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1,
      11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1,
      11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
      1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1,
      9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1,
      5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1,
      2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
      0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
      5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1,
      6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1,
      0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1,
      3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1,
      6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1,
      5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1,
      1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
      10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1,
      6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1,
      1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1,
      8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1,
      7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1,
      3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
      5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1,
      0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1,
      9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1,
      8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1,
      5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1,
      0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1,
      6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1,
      10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1,
      10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1,
      8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1,
      1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1,
      3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1,
      0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1,
      10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1,
      0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1,
      3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1,
      6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1,
      9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1,
      8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1,
      3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1,
      6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1,
      0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1,
      10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1,
      10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1,
      1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1,
      2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1,
      7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1,
      7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1,
      2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1,
      1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1,
      11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1,
      8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1,
      0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1,
      7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
      10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
      2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
      6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1,
      7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1,
      2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1,
      1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1,
      10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1,
      10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1,
      0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1,
      7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1,
      6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1,
      8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1,
      9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1,
      6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1,
      1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1,
      4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1,
      10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1,
      8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1,
      0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1,
      1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1,
      8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1,
      10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1,
      4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1,
      10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
      5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
      11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1,
      9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
      6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1,
      7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1,
      3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1,
      7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1,
      9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1,
      3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1,
      6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1,
      9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1,
      1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1,
      4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1,
      7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1,
      6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1,
      3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1,
      0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1,
      6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1,
      1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1,
      0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1,
      11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1,
      6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1,
      5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1,
      9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1,
      1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1,
      1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1,
      10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1,
      0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1,
      5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1,
      10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1,
      11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1,
      0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1,
      9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1,
      7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1,
      2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1,
      8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1,
      9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1,
      9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1,
      1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1,
      9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1,
      9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1,
      5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1,
      0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1,
      10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1,
      2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1,
      0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1,
      0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1,
      9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1,
      5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1,
      3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1,
      5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1,
      8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1,
      0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1,
      9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1,
      0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1,
      1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1,
      3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1,
      4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1,
      9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1,
      11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1,
      11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1,
      2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1,
      9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1,
      3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1,
      1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1,
      4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1,
      4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1,
      0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1,
      3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1,
      3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1,
      0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1,
      9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1,
      1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]);

        // Arrays to hold 3D points and values from noise function
        var points = [];
        var values = [];       

        // Min and max values of 3D points
        var axisMin = -chunkSize/2;
        var axisMax =  chunkSize/2;
        var axisRange = axisMax - axisMin;



        // Generate a list of 3D points and values at those points
        for (var k = 0; k < size; k++)
        for (var j = 0; j < size; j++)
        for (var i = 0; i < size; i++)
        {
            // Push a grid of (x, y, z) points into points array
            var x = chunk_x*axisRange + axisMin + axisRange * i / (size - 1);
            var y = axisMin + axisRange * j / (size - 1);
            var z = chunk_z*axisRange + axisMin + axisRange * k / (size - 1);
            points.push( Vec.of(x,y,z) );

            // f(x, y, z) Noise Function
            //var value = x*x + y*y + z*z - 100;                           // Sphere
            //var value = Math.sin(x*x) + Math.sin(y*y) + Math.sin(z*z);   // Fractal Cube
            //var value = y + 1;                                           // Plane
            //var value = y + Math.sin(x) + Math.sin(z);                   // Hilly plain
            //var value = y + this.noise(x, z);                                 // Noise equation
            var value = y + this.noiseFunction.noise(x, z);                                 // Noise equation


            values.push( value );
        }


        // ~~ Marching Cubes Algorithm ~~

        var size2 = size * size;

        // Vertices may occur along edges of cube, when the values at the edge's endpoints
        //   straddle the isolevel value.
        // Actual position along edge weighted according to function values (TODO; lerp is not implemented)
        var vlist = new Array(12);

        // Holds triangles which will be passed to Terrain constructor
        let myTriangleArray = [ ];

        for (var z = 0; z < size - 1; z++)
        for (var y = 0; y < size - 1; y++)
        for (var x = 0; x < size - 1; x++)
        {
            // index of base point, and also adjacent points on cube
            var p    = x + size * y + size2 * z,
                px   = p   + 1,
                py   = p   + size,
                pxy  = py  + 1,
                pz   = p   + size2,
                pxz  = px  + size2,
                pyz  = py  + size2,
                pxyz = pxy + size2;

            // store scalar values corresponding to vertices. values[] holds the stored values from the noise equation.
            var value0 = values[ p    ],
                value1 = values[ px   ],
                value2 = values[ py   ],
                value3 = values[ pxy  ],
                value4 = values[ pz   ],
                value5 = values[ pxz  ],
                value6 = values[ pyz  ],
                value7 = values[ pxyz ];

            // place a "1" in bit positions corresponding to vertices whose
            //   isovalue is less than given constant.

            var isolevel = 0;

            var cubeindex = 0;
            if ( value0 < isolevel ) cubeindex |= 1;
            if ( value1 < isolevel ) cubeindex |= 2;
            if ( value2 < isolevel ) cubeindex |= 8;
            if ( value3 < isolevel ) cubeindex |= 4;
            if ( value4 < isolevel ) cubeindex |= 16;
            if ( value5 < isolevel ) cubeindex |= 32;
            if ( value6 < isolevel ) cubeindex |= 128;
            if ( value7 < isolevel ) cubeindex |= 64;

            // bits = 12 bit number, indicates which edges are crossed by the isosurface
            let bits = edgeTable[ cubeindex ];

            // if none are crossed, proceed to next iteration
            if ( bits === 0 ) continue;

            // check which edges are crossed, and estimate the point location
            //    using a weighted average of scalar values at edge endpoints.
            // store the vertex in an array for use later.
            var mu = 0.5; 

            // bottom of the cube
            if ( bits & 1 )
            {	
                if (doInterpolateVertices)	{
                  mu = ( isolevel - value0 ) / ( value1 - value0 );
                }
                if (mu >= 0) {
                      let temp = points[px].times(1 - mu);
                      vlist[0] = points[p].times(mu).plus(temp);
                }
            }
            if ( bits & 2 )
            {
                if (doInterpolateVertices)
                  mu = ( isolevel - value1 ) / ( value3 - value1 );
                if (mu >= 0) {
                      let temp = points[pxy].times(1 - mu);
                      vlist[1] = points[px].times(mu).plus(temp);
                }
            }
            if ( bits & 4 )
            {
                if (doInterpolateVertices)
                  mu = ( isolevel - value2 ) / ( value3 - value2 );
                if (mu >= 0) {
                      let temp = points[pxy].times(1 - mu);
                      vlist[2] = points[py].times(mu).plus(temp);
                }
            }
            if ( bits & 8 )
            {
                if (doInterpolateVertices)
                  mu = ( isolevel - value0 ) / ( value2 - value0 );
                if (mu >= 0) {
                      let temp = points[py].times(1 - mu);
                      vlist[3] = points[p].times(mu).plus(temp);
                }
            }
            // top of the cube
            if ( bits & 16 )
            {
                if (doInterpolateVertices)
                  mu = ( isolevel - value4 ) / ( value5 - value4 );
                if (mu >= 0) {
                      let temp = points[pxz].times(1 - mu);
                      vlist[4] = points[pz].times(mu).plus(temp);
                }
            }
            if ( bits & 32 )
            {
                if (doInterpolateVertices)
                  mu = ( isolevel - value5 ) / ( value7 - value5 );
                if (mu >= 0) {
                      let temp = points[pxyz].times(1 - mu);
                      vlist[5] = points[pxz].times(mu).plus(temp);
                }
            }
            if ( bits & 64 )
            {
                if (doInterpolateVertices)
                  mu = ( isolevel - value6 ) / ( value7 - value6 );
                if (mu >= 0) {
                      let temp = points[pxyz].times(1 - mu);
                      vlist[6] = points[pyz].times(mu).plus(temp);
                }
            }
            if ( bits & 128 )
            {
                if (doInterpolateVertices)
                  mu = ( isolevel - value4 ) / ( value6 - value4 );
                if (mu >= 0) {
                      let temp = points[pyz].times(1 - mu);
                      vlist[7] = points[pz].times(mu).plus(temp);
                }
            }
            // vertical lines of the cube
            if ( bits & 256 )
            {
                if (doInterpolateVertices)
                  mu = ( isolevel - value0 ) / ( value4 - value0 );
                let temp = points[pz].times(1 - mu);
                vlist[8] = points[p].times(mu).plus(temp);
            }
            if ( bits & 512 )
            {
                if (doInterpolateVertices)
                  mu = ( isolevel - value1 ) / ( value5 - value1 );
                let temp = points[pxz].times(1 - mu);
                vlist[9] = points[px].times(mu).plus(temp);
            }
            if ( bits & 1024 )
            {
                if (doInterpolateVertices)
                  mu = ( isolevel - value3 ) / ( value7 - value3 );
                let temp = points[pxyz].times(1 - mu);
                vlist[10] = points[pxy].times(mu).plus(temp);
            }
            if ( bits & 2048 )
            {
                if (doInterpolateVertices)
                  mu = ( isolevel - value2 ) / ( value6 - value2 );
                let temp = points[pyz].times(1 - mu);
                vlist[11] = points[py].times(mu).plus(temp);
            }

            // construct triangles -- get correct vertices from triTable.
            var i = 0;
            cubeindex <<= 4;  // multiply by 16... 
            // "Re-purpose cubeindex into an offset into triTable." 
            //  since each row really isn't a row.

            // the while loop should run at most 5 times,
            //   since the 16th entry in each row is a -1.
            while ( triTable[ cubeindex + i ] != -1 )
            {
                // Find the correct vertex indices from triTable, defined above
                var index1 = triTable[ cubeindex + i ];
                var index2 = triTable[ cubeindex + i + 1 ];
                var index3 = triTable[ cubeindex + i + 2 ];

                // Push the three vertices into an array
                let threeVertices = [ ];
                threeVertices.push( vlist[index1] );
                threeVertices.push( vlist[index2] );
                threeVertices.push( vlist[index3] );

                // Then create a new triangle shape from the vertices and push the triangle into myTriangleArray
                myTriangleArray.push(new defs.Custom_Triangle( threeVertices[0], threeVertices[1], threeVertices[2] ));

                i += 3;
            }
        }

        // Build a new Terrain shape from myTriangleArray
        this.terrainChunks[chunk_x][chunk_z] = new defs.Terrain( myTriangleArray );
    }
}