import { tiny, defs } from './common.js';

// Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Material, Shader, Texture, Scene } = tiny;

import { Body, Enemy, player }
  from "./player.js"

import { ui_scene } from './DJ-UI.js';

var mouse = Vec.of(0, 0);
var winSize = Vec.of(0, 0);

const phong = new defs.Phong_Shader(1);
let laser_color = new Material(phong, {
	color: Color.of(.5, 0, 0, 1),
	ambient: 1,
});

// export let player = new Player(new defs.Cube(), undefined, Vec.of(.5,.5,.5));

function check_vec3_distance(a, b) {
	return Math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2 + (a[2] - b[2])**2);
}

export class Simulation extends Scene { // **Simulation** manages the stepping of simulation time.  Subclass it when making
    // a Scene that is a physics demo.  This technique is careful to totally decouple
    // the simulation from the frame rate (see below).
    constructor() {
        super();
        Object.assign(this, { time_accumulator: 0, time_scale: 1, t: 0, dt: 1 / 20, bodies: [], steps_taken: 0 });
    }
    simulate(frame_time) { // simulate(): Carefully advance time according to Glenn Fiedler's 
        // "Fix Your Timestep" blog post.
        // This line gives ourselves a way to trick the simulator into thinking
        // that the display framerate is running fast or slow:
        frame_time = this.time_scale * frame_time;

        // Avoid the spiral of death; limit the amount of time we will spend 
        // computing during this timestep if display lags:
        this.time_accumulator += Math.min(frame_time, 0.1);
        // Repeatedly step the simulation until we're caught up with this frame:
        while (Math.abs(this.time_accumulator) >= this.dt) { // Single step of the simulation for all bodies:
            this.update_state(this.dt);
            for (let b of this.bodies)
            {
				b.advance(this.dt);
			}
                
            // Following the advice of the article, de-couple 
            // our simulation time from our frame rate:
            this.t += Math.sign(frame_time) * this.dt;
            this.time_accumulator -= Math.sign(frame_time) * this.dt;
            this.steps_taken++;
        }
        // Store an interpolation factor for how close our frame fell in between
        // the two latest simulation time steps, so we can correctly blend the
        // two latest states and display the result.
        let alpha = this.time_accumulator / this.dt;
        for (let b of this.bodies)
        {
        	b.blend_state(alpha);
        }
    }
    make_control_panel() { // make_control_panel(): Create the buttons for interacting with simulation time.

        this.key_triggered_button("Speed up time", ["Shift", "T"], () => this.time_scale *= 5);
        this.key_triggered_button("Slow down time", ["t"], () => this.time_scale /= 5);
        this.new_line();
        this.live_string(box => { box.textContent = "Time scale: " + this.time_scale });
        this.new_line();
        this.live_string(box => { box.textContent = "Fixed simulation time step size: " + this.dt });
        this.new_line();
        this.live_string(box => { box.textContent = this.steps_taken + " timesteps were taken so far." });
    }
    display(context, program_state) { // display(): advance the time and state of our whole simulation.
        if (program_state.animate)
            this.simulate(program_state.animation_delta_time);
        // Draw each shape at its current location:
        for (let b of this.bodies) {
        		if (b === this.player) continue;
            b.shape.draw(context, program_state, b.drawn_location, b.material);
          }
    }
    update_state(dt) // update_state(): Your subclass of Simulation has to override this abstract function.
    { throw "Override this" }
}


export class Test_Data { // **Test_Data** pre-loads some Shapes and Textures that other Scenes can borrow.
    constructor() {
        this.textures = {
            rgb: new Texture("assets/rgb.jpg"),
            earth: new Texture("assets/earth.gif"),
            grid: new Texture("assets/grid.png"),
            stars: new Texture("assets/stars.png"),
            text: new Texture("assets/text.png"),
        }
        this.shapes = {
            // donut: new defs.Torus(15, 15, [
            //     [0, 2],
            //     [0, 1]
            // ]),
            // cone: new defs.Closed_Cone(4, 10, [
            //     [0, 2],
            //     [0, 1]
            // ]),
            // capped: new defs.Capped_Cylinder(4, 12, [
            //     [0, 2],
            //     [0, 1]
            // ]),
            ball: new defs.Subdivision_Sphere(3, [
                [0, 1],
                [0, 1]
            ]),
            cube: new defs.Cube(),
            // prism: new(defs.Capped_Cylinder.prototype.make_flat_shaded_version())(10, 10, [
            //     [0, 2],
            //     [0, 1]
            // ]),
            // gem: new(defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            // donut: new(defs.Torus.prototype.make_flat_shaded_version())(20, 20, [
            //     [0, 2],
            //     [0, 1]
            // ]),
        };
        this.decoratives = {
        	crystal: new defs.Shape_From_File('assets/models/crystal.obj'),
        	health: new defs.Shape_From_File('assets/models/health.obj'),
        	nuke: new defs.Shape_From_File('assets/models/nuke.obj')
        	// rock1: new defs.Shape_From_File('assets/models/rock1.obj'),
        	// rock2: new defs.Shape_From_File('assets/models/rock2.obj')
        }
    }
    random_shape(shape_list = this.shapes) { // random_shape():  Extract a random shape from this.shapes.
        const shape_names = Object.keys(shape_list);
        return shape_list[shape_names[~~(shape_names.length * Math.random())]]
    }
}

export class World extends Simulation { // **Collision_Demo** demonstration: Detect when some flying objects
    // collide with one another, coloring them red.
   constructor() {
		super();

		// Public vars
		this.maxSpawnTime = 100;	// Time between waves of enemy spawns
		this.maxEnemies = 10;	// Max enemies alive at one time (for lag)


		this.noiseFunction = defs.noise_function;

		this.test_controls = false;

		this.data = new Test_Data();
		this.shapes = Object.assign({}, this.data.shapes);
		this.sounds = {
			music: new Audio('assets/eeriemusic.wav'),
			enemyspawn: new Audio('assets/enemyspawn.wav'),
			gunshot: new Audio('assets/gunshot.wav'),
			healthup: new Audio('assets/healthup.wav'),
			nuke: new Audio('assets/nuke.wav'),
			healthloss: new Audio('assets/healthloss.wav'),
			enemydmg: new Audio('assets/enemydmg.wav')
		};
		// Make simpler dummy shapes for representing all other shapes during collisions:
		this.colliders = [
		  // { intersect_test: Body.intersect_sphere, points: new defs.Subdivision_Sphere(1), leeway: .5 },
		  // { intersect_test: Body.intersect_sphere, points: new defs.Subdivision_Sphere(2), leeway: .1 },
		  { points: this.shapes.ball, leeway: 0.5 }
		];
		this.collider_selection = 0;
		// Materials:
		const phong = new defs.Phong_Shader(1);
		this.inactive_color = new Material(phong, {color: Color.of(.5, .5, .5, 1),ambient: .2,texture: this.data.textures.rgb});
		this.active_color = this.inactive_color.override({ color: Color.of(.5, 0, 0, 1), ambient: .5 });
		this.bright = new Material(phong, { color: Color.of(0, 1, 0, .5), ambient: 1 });

		this.nuke_color = new Material(phong, {color: Color.of(0, 0, 1, 1),ambient: 1, texture: this.data.textures.rgb});
		this.crystal_color = new Material(phong, {color: Color.of(0, 0, 0, 1),ambient: 1, texture: this.data.textures.rgb, specularity: 1, diffusivity: 1});

		this.player = player;

		this.is_sprinting = false;
		this.forward = false;
		this.left = false;
		this.back = false;
		this.right = false;

		this.nuke_index = 0;
		this.activated_nuke = null;
		this.activated_nuke_finished = false;

		this.decoratives = [];
		this.nukes = [];
		this.bullets = [];
		this.enemies = [];
		this.lasers = [];

		this.spawn_enemy();
		this.spawn_enemy();
		this.spawn_enemy();

		this.spawnTimer = this.maxSpawnTime;

  
  	this.sounds.music.loop = true;
  	this.first_interaction = false;
  	this.music_is_playing = false;

  }
  make_control_panel() {
  	this.key_triggered_button("Sprint", ["Shift"], () => this.is_sprinting = true, undefined, () => this.is_sprinting = false);
		this.key_triggered_button("Forward", ["w"], () => this.forward = true, undefined, () => this.forward = false);
		this.key_triggered_button("Left", ["a"], () => this.left = true, undefined, () => this.left = false);
		this.key_triggered_button("Back", ["s"], () => this.back = true, undefined, () => this.back = false);    	
		this.key_triggered_button("Right", ["d"], () => this.right = true, undefined, () => this.right = false);
    this.new_line();
    this.key_triggered_button("Toggle Test Controls", ["c"], () => {this.test_controls = !this.test_controls});
    this.key_triggered_button("Lose Health", ["v"], () => {this.player.takeDamage(1); this.play_sound("healthloss", 0.2);});
    super.make_control_panel();
  }

	play_sound( name, volume = 1 )
    { if( 0 < this.sounds[ name ].currentTime && this.sounds[ name ].currentTime < .3 ) return;
      if (this.first_interaction)
      {
		  this.sounds[ name ].currentTime = 0;
		  this.sounds[ name ].volume = Math.min(Math.max(volume, 0), 1);;
		  this.sounds[ name ].play();
      }
    }

	spawn_enemy(center = Vec.of(0,0,0)) {
		let e = new Enemy(new defs.Shape_From_File('assets/models/ufo.obj'),
									 this.inactive_color,
									 Vec.of(0.5,0.5,0.5),
									 this.enemies.length,
									 this.bodies.length )
									 .emplace(Mat4.translation(center.randomized(30)), Vec.of(0,0,0), 0);
		this.enemies.push( e );
		this.play_sound("enemyspawn", 3);
	}

	generate_decoratives(num = 30) {
		while (this.decoratives.length < num) {
    	let location = this.player.center.randomized(60);
    	if (this.check_vec3_distance(location, player.center) < 30) continue;
    	location[1] = -this.noiseFunction.noise(location[0], location[2]) + .1;

    	let rand = Math.random();
    	if (rand < 0.1) {
    		location[1] += 1;
				let a = new Body(this.data.decoratives.nuke, this.nuke_color, Vec.of(.3,.3,.3)).emplace(Mat4.translation(location), Vec.of(0,0,0), 0.25);
    		this.nukes.push(a);
    		this.nuke_count += 1;
    	}
    	else if (rand < 0.2) {
    		location[1] += 1;
    		let h = new Body(this.data.decoratives.health, this.active_color, Vec.of(.2,.2,.2)).emplace(Mat4.translation(location), Vec.of(0,0,0), 0.75, Vec.of(0, 1, 0));
    		this.decoratives.push(h);
    	}
    	else {
    		location[1] -= 0.05;
    		let b = new Body(this.data.decoratives.crystal, this.crystal_color.override({ color: Color.of(Math.random(), Math.random(), Math.random(), 0.5)}), Vec.of(.2,.2,.2)).emplace(Mat4.translation(location), Vec.of(0,0,0), 0);
    		this.decoratives.push(b);
    	}
    }
	}

  update_state(dt) {
  	// Anchor player to terrain
		this.player.center[1] = -this.noiseFunction.noise(player.center[0], player.center[2]) + .1 + 1;
		// Player movement friction
    this.player.linear_velocity = player.linear_velocity.map((axis => axis*0.96));

    this.generate_decoratives();

    // Periodically spawn new enemies
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
    	this.spawnTimer = this.maxSpawnTime;
    	if (this.enemies.length < this.maxEnemies) {
    		this.spawn_enemy(player.center);
	    	this.spawn_enemy(player.center);
	    	this.spawn_enemy(player.center);
    	}
    }

    // Nuke activated
    if (this.activated_nuke !== null) {
    	this.activated_nuke.size = this.activated_nuke.size.map(x => x*(1+dt));
    	this.player.numKills += this.enemies.length;
    	this.enemies = [];
    	if (this.activated_nuke.size[1] >= 50) {
    		this.activated_nuke = null;
    		this.nukes.splice(this.nuke_index, 1);
    		this.nuke_index = 0;
    	}
    }
    for (let [n_index, n] of this.nukes.entries()) { 
  		if (this.check_body_collision(n, player, 0.5) && this.activated_nuke === null) {
  			this.activated_nuke = n;
  			this.nuke_index = n_index;
  			this.play_sound("nuke");
  		}
    }

    // Loop through decoratives and despawn too far
    for (let [d_index, d] of this.decoratives.entries()) {
    	if (d.shape === this.data.decoratives.health) {
    		if (this.check_body_collision(d, player, 0.5)) {
    			this.decoratives.splice(d_index, 1);
    			if (this.player.HP <3)
    			{
    				player.HP += 1;
    				this.play_sound("healthup");
    			}
    		}
    		// console.log(d.center[1] + this.noiseFunction.noise(location[0], location[2]) + 1.1)
    		// d.linear_velocity[1] = d.linear_velocity[1] + (d.center[1] -this.noiseFunction.noise(location[0], location[2]) + .1);  
    	}
  		if (this.check_vec3_distance(player.center, d.center) > 60) {
    		this.decoratives.splice(d_index, 1);
    	}
    }

    // Process bullet-enemy interactions
    for (let [e_index, e] of this.enemies.entries()) { 
    	e.center[1] = -this.noiseFunction.noise(e.center[0], e.center[2]) + e.height;
			e.linear_velocity = e.linear_velocity.map((axis => axis*e.damping))
			for (let [f_index, f] of this.enemies.entries()) { 
				if (f === e) continue;
				e.moveRepelledByNearby(f);
			}

	    // Undo red color after time
			if (e.material == this.active_color) {
				e.hurtColorTimer -= dt;

				if (e.hurtColorTimer <= 0) {
					e.material = this.inactive_color;
				}
			}

			// Attempt to fire lasers
			if (e.attemptFire(dt) == true) {
				let laser_transform_matrix = Mat4.translation(e.center);
				let l = new Body(this.shapes.cube, laser_color, Vec.of(.1,.1,.1)).emplace(laser_transform_matrix, Vec.of(0, 0, 0), 0);
				this.lasers.push(l);

				let dir = e.laserVec.normalized();
				l.linear_velocity[0] = dir[0]*e.laserSpeed;
				l.linear_velocity[1] = dir[1]*e.laserSpeed;
				l.linear_velocity[2] = dir[2]*e.laserSpeed;
			}


			for (let [bullet_index, bullet] of this.bullets.entries()) { 
			if (this.check_body_collision(bullet, e, 0.75)) {
				e.material = this.active_color; // Red on collision
				e.hurtColorTimer = 2;
				// !! Splicing will skip one bullet, but there's only one bullet at a time right now (WARNING)
				this.bullets.splice(bullet_index, 1);
				if ( e.takeDamage(1) <= 0 ) {
					// !! Splicing will skip one enemy, but for now only one bullet will collide with one enemy at time (WARNING)
					this.play_sound("enemydmg", 0.2);
					this.enemies.splice(e_index,1);
					this.player.numKills++;
				}
			}
		}	
		// Attempt to fire lasers
		if (e.attemptFire(dt) == true) {
			let laser_transform_matrix = Mat4.translation(e.center);
			let l = new Body(this.shapes.cube, this.active_color, Vec.of(.1,.1,.1)).emplace(laser_transform_matrix, Vec.of(0, 0, 0), 0);
			this.lasers.push(l);

			let dir = e.laserVec.normalized();
			l.linear_velocity[0] = dir[0]*e.laserSpeed;
			l.linear_velocity[1] = dir[1]*e.laserSpeed;
			l.linear_velocity[2] = dir[2]*e.laserSpeed;
		}
    }

    for (let [laser_index, laser] of this.lasers.entries()) {
    	if (this.check_body_collision(laser, player, 0.75)) {
    		player.takeDamage(1);
    		this.play_sound("healthloss", 0.2);
    		this.lasers.splice(laser_index, 1);
    	}
    	if (laser.center.minus(player.center).norm() > 10)
    		this.lasers.splice(laser_index, 1);
    }

    // Compose bodies list
    this.bodies = [player, ...this.decoratives, ...this.bullets, ...this.enemies, ...this.lasers, ...this.nukes];
  }

    check_vec3_distance(a, b) {
    	return Math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2 + (a[2] - b[2])**2);
    }
    check_body_collision(a, b, threshold) { 
    	if (a == b) return false;

			// Simple radial distance check
    	let dist = Math.sqrt((a.center[0] - b.center[0])**2 + (a.center[1] - b.center[1])**2 + (a.center[2] - b.center[2])**2)
    	return dist < threshold;
    }
  	
    mouseMove(e, canvas, program_state) {
    	mouse.x = e.clientX - winSize.x;
    	mouse.y = e.clientY - winSize.y;

    	this.clientX = e.clientX;
    	this.clientY = e.clientY;
    }
    addMouseControls(canvas, program_state) {
    	canvas.addEventListener("mousemove", (e) => this.mouseMove(e, canvas, program_state));
    }
    display(context, program_state) { // display(): Draw everything else in the scene besides the moving bodies.
        super.display(context, program_state);

        program_state.lights = [new Light(Vec.of(.7, 1.5, 2, 0), Color.of(1, 1, 1, 1), 100000)];

	  winSize.x = context.width;
	  winSize.y = context.height;

	  for (let e of this.enemies) {
	  	e.moveTowardsPlayer();
	  }          

	  if (this.first_interaction && !this.music_is_playing)  
	  {
	  	this.sounds.music.play();
	  	this.music_is_playing = true;
	  }

	  if (this.forward)
	  {
	  	this.first_interaction = true;
	  	if (this.is_sprinting) this.player.moveForward(3);
	  	else this.player.moveForward();
	  }
	  if (this.left)
	  {
	  	this.first_interaction = true;	  	
	  	if (this.is_sprinting) this.player.moveLeft(3);
	  	else this.player.moveLeft();
	  }
	  if (this.back)
	  {
	  	this.first_interaction = true;	  	
	  	if (this.is_sprinting) this.player.moveBack(3);
	  	else this.player.moveBack();
	  }
	  if (this.right)
	  {
	  	this.first_interaction = true;	  	
	  	if (this.is_sprinting) this.player.moveRight(3);
	  	else this.player.moveRight();
	  }

	  if (this.test_controls)
	  {
		if( !context.scratchpad.controls ) 
        {                       // Add a movement controls panel to the page:
          // this.children.push( context.scratchpad.controls = new defs.Movement_Controls() ); 
          
          program_state.set_camera( Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          this.initial_camera_location = program_state.camera_inverse;
          program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 200 );
        }
	  }
	  else
	  {
		  //Attach camera to player and rotate camera according to mouse movement
		  let p = this.player;
		  let camera_matrix = p.drawn_location;
		  camera_matrix = camera_matrix.times(Mat4.translation([0, 3.5, -0.5]));
		  camera_matrix = camera_matrix.times(Mat4.rotation((0.01*mouse.x), Vec.of(0, -1, 0)));
		  camera_matrix = camera_matrix.times(Mat4.rotation((0.005*mouse.y - 5), Vec.of(-1, 0, 0)));
		  camera_matrix = Mat4.inverse(camera_matrix);
		  program_state.set_camera(camera_matrix);
		  this.camera_location = program_state.camera_inverse;
		  program_state.projection_transform = Mat4.perspective( Math.PI/4, context.width/context.height, 1, 200 );
		  p.camera_mat = camera_matrix;

		  this.addMouseControls(context.canvas, program_state);    
	  }           

        // const { points, leeway } = this.colliders[this.collider_selection];
        // const size = new Vec(3).fill(1 + leeway);
        // for (let b of this.bodies) {
        // 		if (b === player) continue;
        //     points.draw(context, program_state, b.drawn_location.times(Mat4.scale(size)), this.bright, "LINE_STRIP");
        //   }

    }
    show_explanation(document_element) {
        document_element.innerHTML += `<p>This demo detects when some flying objects collide with one another, coloring them red when they do.  For a simpler demo that shows physics-based movement without objects that hit one another, see the demo called Inertia_Demo.
                                     </p><p>Detecting intersections between pairs of stretched out, rotated volumes can be difficult, but is made easier by being in the right coordinate space.  See <a href=\"https://piazza.com/class_profile/get_resource/j855t03rsfv1cn/jabhqq9h76f7hx\" target=\"blank\">this .pdf document</a> for an explanation of how it works in this demo.  The collision algorithm treats every shape like an ellipsoid roughly conforming to the drawn shape, and with the same transformation matrix applied.  Here these collision volumes are drawn in translucent purple alongside the real shape so that you can see them.
                                     </p><p>This particular collision method is extremely short to code, as you can observe in the method \"check_if_colliding\" in the class called Body below.  It has problems, though.  Making every collision body a stretched sphere is a hack and doesn't handle the nuances of the actual shape being drawn, such as a cube's corners that stick out.  Looping through a list of discrete sphere points to see if the volumes intersect is *really* a hack (there are perfectly good analytic expressions that can test if two ellipsoids intersect without discretizing them into points, although they involve solving a high order polynomial).   On the other hand, for non-convex shapes a real collision method cannot be exact either, and is usually going to have to loop through a list of discrete tetrahedrons defining the shape anyway.
                                     </p><p>This scene extends class Simulation, which carefully manages stepping simulation time for any scenes that subclass it.  It totally decouples the whole simulation from the frame rate, following the suggestions in the blog post <a href=\"https://gafferongames.com/post/fix_your_timestep/\" target=\"blank\">\"Fix Your Timestep\"</a> by Glenn Fielder.  Buttons allow you to speed up and slow down time to show that the simulation's answers do not change.</p>`;
    }
}

export let world = new World();