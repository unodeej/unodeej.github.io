// * DJ Uno - 5/29/2019 - Gun Demo

import {tiny, defs} from './common.js';
import {Body} from './player.js';
import {world, Simulation, World} from './world.js';

const { Vec, Mat, Mat4, Color, Light, Shape, Material, Shader, Texture, Scene } = tiny;
const { Triangle, Square, Tetrahedron, Windmill, Cube, Subdivision_Sphere } = defs;

  // Scene which gets exported to main-scene.      
export class Gun_Demo extends Scene
{
  constructor()
    { super()

      this.shapes = { cube: new defs.Cube(), sphere: new defs.Subdivision_Sphere(3) };
      
      // Shader
      const phong     = new defs.Phong_Shader();
      const funny     = new defs.Funny_Shader();
      // Material 
      this.bullet       = new Material( funny, { color: Color.of( .5,.5,.5,1 ), ambient: 1, 
                                        diffusivity: 1, specularity: .5, smoothness: 10 })

      this.fireCooldown = 0;            // Timer variable that counts down between frames
      this.bullet_transform;            // Location of the bullet (currently only allows for one bullet on screen at a time)
      this.bullet_is_spawned = false;   // Whether there is a bullet on screen or not

      this.bulletBody;
    }
  make_control_panel() {
      // world.super.make_control_panel();
      this.key_triggered_button("Sprint", [" "], () => world.is_sprinting = true, undefined, () => world.is_sprinting = false);
    		this.key_triggered_button("Forward", ["w"], () => world.forward = true, undefined, () => world.forward = false);
    		this.key_triggered_button("Left", ["a"], () => world.left = true, undefined, () => world.left = false);
    		this.key_triggered_button("Back", ["s"], () => world.back = true, undefined, () => world.back = false);    	
    		this.key_triggered_button("Right", ["d"], () => world.right = true, undefined, () => world.right = false);
    		this.key_triggered_button("Fire",  ["e"], () => this.fire = true,    undefined, () => this.fire = false  );
        this.new_line();
        this.key_triggered_button("Lose Health", ["v"], () => world.player.takeDamage(1));        
        this.key_triggered_button("Toggle Test Controls", ["c"], () => {world.test_controls = !world.test_controls});
        
    }

    // Runs every frame
  display( context, program_state )
    { 
      world.display( context, program_state );
      //world.make_control_panel();
      // Public vars
      let bullet_speed = 2;     // Travel speed of bullet
      let fire_cooldown = 0.5;      // Time allowed between shots
      
      let bullet_transform_matrix = Mat4.identity().times(program_state.camera_transform).times(Mat4.translation([1.5,-1,-5]));


      // Some testing stuff (movement controls, camera, lights, etc.)
      if( !context.scratchpad.controls ) 
        {                       // Add a movement controls panel to the page:
          // this.children.push( context.scratchpad.controls = new defs.Movement_Controls() ); 
          
          //program_state.set_camera( Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          //this.initial_camera_location = program_state.camera_inverse;
          //program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 200 );
        }

      let isFireKeyDown = this.fire;

      if ( this.fireCooldown == 0 )
      {
            if ( isFireKeyDown == true )
            {
                 this.bullet_is_spawned = true;
                 this.bullet_transform = bullet_transform_matrix;
                 this.fireCooldown = fire_cooldown; 

                 this.bulletBody = new Body(this.shapes.sphere, world.inactive_color, Vec.of(.5,.5,.5)).emplace(bullet_transform_matrix, Vec.of(0, 0, 0), 0);
                 world.bullets.push(this.bulletBody);
                 world.play_sound("gunshot", 1);
            }
      }
      else
      {
           this.fireCooldown -= program_state.animation_delta_time / 1000;
           if (this.fireCooldown <= 0)
           {
                 this.bullet_is_spawned = false;
                 this.fireCooldown = 0;
                 world.bullets.pop();
           }
      }

      if (this.bullet_is_spawned == true)
      {
            this.shapes.sphere.draw( context, program_state, this.bullet_transform, this.bullet );
            this.bullet_transform = this.bullet_transform.times(Mat4.translation([0,0,-bullet_speed]));
            this.bulletBody.emplace(this.bullet_transform, Vec.of(0, 0, 0), 0);
      }



    }
}