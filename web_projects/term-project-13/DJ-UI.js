import {tiny, defs} from './common.js';
import {player} from './player.js';

const { Vec, Mat, Mat4, Color, Light, Shape, Material, Shader, Texture, Scene } = tiny;


  // Scene which gets exported to main-scene.      
export class UI extends Scene
{
  constructor()
    { super()

      this.shapes = { cube: new defs.Cube(), square: new defs.Square(), text: new Text_Line( 35 )  };


      
      // Shader
      const phong     = new defs.Phong_Shader();
      const texture = new defs.Textured_Phong( 1 );

      // Material 
      this.grey       = new Material( phong, { color: Color.of( .5,.5,.5,1 ), ambient: 1, 
                                        diffusivity: 1, specularity: .5, smoothness: 10 })


      // To show text you need a Material like this one:
      this.text_image = new Material( texture, { ambient: 1, diffusivity: 0, specularity: 0,
                                                 texture: new Texture( "assets/text.png" ) });
      this.HP_image3 =   new Material( texture, { ambient: 1, diffusivity: 0, specularity: 0,
                                                 texture: new Texture( "assets/health3.png" ) });
      this.HP_image2 =   new Material( texture, { ambient: 1, diffusivity: 0, specularity: 0,
                                                 texture: new Texture( "assets/health2.png" ) });
      this.HP_image1 =   new Material( texture, { ambient: 1, diffusivity: 0, specularity: 0,
                                                 texture: new Texture( "assets/health1.png" ) });
      this.HP_image0 =   new Material( texture, { ambient: 1, diffusivity: 0, specularity: 0,
                                                 texture: new Texture( "assets/health0.png" ) });
      this.game_over =   new Material( texture, { ambient: 1, diffusivity: 0, specularity: 0,
                                                 texture: new Texture( "assets/game_over.png" ) });
      this.time = 0.;
      this.score = 0.;
      this.scoreMultiplier = 10;
    }

    // Runs every frame
  display( context, program_state )
    { 
      let UI_transform = Mat4.identity().times(program_state.camera_transform).times(Mat4.translation([0,0,-1]));
      
      this.shapes.text.set_string( "Time: " + this.time.toFixed(2), context.context );
      this.shapes.text.draw( context, program_state, UI_transform
                                                      .times( Mat4.translation([ -0.68,0.35, 0 ]))
                                                      .times( Mat4.scale([ .02,.02,.02 ])),
                                                      this.text_image );
      this.time = this.time + program_state.animation_delta_time / 1000;

      this.score = this.scoreMultiplier * player.numKills;
      this.shapes.text.set_string( "Score: " + this.score.toFixed(0), context.context );
      this.shapes.text.draw( context, program_state, UI_transform
                                                      .times( Mat4.translation([ 0.4, 0.35, 0 ]))
                                                      .times( Mat4.scale([ .02,.02,.02 ])),
                                                      this.text_image );
      let HP_sprite;
      if (player.HP == 3)
            HP_sprite = this.HP_image3;
      else if (player.HP == 2)
            HP_sprite = this.HP_image2;
      else if (player.HP == 1)
            HP_sprite = this.HP_image1;
      else
            HP_sprite = this.HP_image0;
      
      this.shapes.square.draw( context, program_state, UI_transform
                                                      .times( Mat4.translation([ -.6, -.29, 0 ]))
                                                      .times( Mat4.scale([ .1,.1,.1 ])),
                                                      HP_sprite );
      if (player.HP === 0) {
        this.shapes.square.draw( context, program_state, UI_transform.times( Mat4.scale([ 1,1,1 ])).times( Mat4.translation([ 0, 0, 0 ])),
                                                      this.game_over );
      }
      

//       let strings = [ "HP", "More text", "1234567890", "This is a line.\n\n\n"+"This is another line.", 
//                       Text_Line.toString(), Text_Line.toString() ];
      
//                         // Sample the "strings" array and draw them onto a cube.
//       for( let i = 0; i < 3; i++ )                    
//         for( let j = 0; j < 2; j++ )
//         { 


//           const multi_line_string = strings[ 2*i + j ].split('\n');
//                         // Draw a Text_String for every line in our string, up to 30 lines:
//           for( let line of multi_line_string.slice( 0,30 ) )
//           {             // Assign the string to Text_String, and then draw it.
//             this.shapes.text.set_string( line, context.context );
//             this.shapes.text.draw( context, program_state, UI_transform
//                                                  .times( Mat4.scale([ .03,.03,.03 ])), this.text_image );
//                         // Move our basis down a line.
//             cube_side.post_multiply( Mat4.translation([ 0,-.06,0 ]) );
//           }
//         }

    }
}

class Text_Line extends Shape                
{                           // **Text_Line** embeds text in the 3D world, using a crude texture 
                            // method.  This Shape is made of a horizontal arrangement of quads.
                            // Each is textured over with images of ASCII characters, spelling 
                            // out a string.  Usage:  Instantiate the Shape with the desired
                            // character line width.  Then assign it a single-line string by calling
                            // set_string("your string") on it. Draw the shape on a material
                            // with full ambient weight, and text.png assigned as its texture 
                            // file.  For multi-line strings, repeat this process and draw with
                            // a different matrix.
  constructor( max_size )                           
    { super( "position", "normal", "texture_coord" );
      this.max_size = max_size;
      var object_transform = Mat4.identity();
      for( var i = 0; i < max_size; i++ )
      {                                       // Each quad is a separate Square instance:
        defs.Square.insert_transformed_copy_into( this, [], object_transform );
        object_transform.post_multiply( Mat4.translation([ 1.5,0,0 ]) );
      }
    }
  set_string( line, context )
    {           // set_string():  Call this to overwrite the texture coordinates buffer with new 
                // values per quad, which enclose each of the string's characters.
      this.arrays.texture_coord = [];
      for( var i = 0; i < this.max_size; i++ )
        {
          var row = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) / 16 ),
              col = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) % 16 );

          var skip = 3, size = 32, sizefloor = size - skip;
          var dim = size * 16,  
              left  = (col * size + skip) / dim,      top    = (row * size + skip) / dim,
              right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

          this.arrays.texture_coord.push( ...Vec.cast( [ left,  1-bottom], [ right, 1-bottom ],
                                                       [ left,  1-top   ], [ right, 1-top    ] ) );
        }
      if( !this.existing )
        { this.copy_onto_graphics_card( context );
          this.existing = true;
        }
      else
        this.copy_onto_graphics_card( context, ["texture_coord"], false );
    }
}

export let ui_scene = new UI();
