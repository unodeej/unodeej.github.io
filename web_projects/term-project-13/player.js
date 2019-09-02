import { tiny, defs } from './common.js';

// Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Material, Shader, Texture, Scene } = tiny;

const phong = new defs.Phong_Shader(1);
let inactive_color = new Material(phong, {
	color: Color.of(.5, .5, .5, 1),
	ambient: .2,
});
let active_color = inactive_color.override({ color: Color.of(.5, 0, 0, 1), ambient: .5 });
let bright = new Material(phong, { color: Color.of(0, 1, 0, .5), ambient: 1 });

export class Body { // **Body** can store and update the properties of a 3D body that incrementally
    // moves from its previous place due to velocities.  It conforms to the
    // approach outlined in the "Fix Your Timestep!" blog post by Glenn Fiedler.
    constructor(shape, material, size) {
        Object.assign(this, { shape, material, size })
    }
    emplace(location_matrix, linear_velocity, angular_velocity, spin_axis = Vec.of(0, 0, 0).randomized(1).normalized()) { // emplace(): assign the body's initial values, or overwrite them.
        this.center = location_matrix.times(Vec.of(0, 0, 0, 1)).to3();
        this.rotation = Mat4.translation(this.center.times(-1)).times(location_matrix);
        this.previous = { center: this.center.copy(), rotation: this.rotation.copy() };
        // drawn_location gets replaced with an interpolated quantity:
        this.drawn_location = location_matrix;

        return Object.assign(this, { linear_velocity, angular_velocity, spin_axis })
    }
    advance(time_amount) { // advance(): Perform an integration (the simplistic Forward Euler method) to
        // advance all the linear and angular velocities one time-step forward.
        this.previous = { center: this.center.copy(), rotation: this.rotation.copy() };
        // Apply the velocities scaled proportionally to real time (time_amount):
        // Linear velocity first, then angular:
        this.center = this.center.plus(this.linear_velocity.times(time_amount));
        this.rotation.pre_multiply(Mat4.rotation(time_amount * this.angular_velocity, this.spin_axis));
    }
    blend_rotation(alpha) { // blend_rotation(): Just naively do a linear blend of the rotations, which looks
        // ok sometimes but otherwise produces shear matrices, a wrong result.

        // TODO:  Replace this function with proper quaternion blending, and perhaps 
        // store this.rotation in quaternion form instead for compactness.
        return this.rotation.map((x, i) => Vec.from(this.previous.rotation[i]).mix(x, alpha));
    }
    blend_state(alpha) { // blend_state(): Compute the final matrix we'll draw using the previous two physical
        // locations the object occupied.  We'll interpolate between these two states as 
        // described at the end of the "Fix Your Timestep!" blog post.
        this.drawn_location = Mat4.translation(this.previous.center.mix(this.center, alpha))
            .times(this.blend_rotation(alpha))
            .times(Mat4.scale(this.size));
    }
}

export class Player extends Body {
	constructor(shape, material, size) {
		super(shape, material, size);
		this.camera_mat = this.drawn_location;
		this.speed = 0.005;
		this.maxLinearVelocity = 1;

		this.HP = 3;
		this.isAlive = true;
		this.numKills = 0;
	}

	move(dir) {
		this.linear_velocity[0] = Math.min(this.maxLinearVelocity, Math.max(-1 * this.maxLinearVelocity, this.linear_velocity[0] + this.speed*dir[0]));
		this.linear_velocity[1] = Math.min(this.maxLinearVelocity, Math.max(-1 * this.maxLinearVelocity, this.linear_velocity[1] + this.speed*dir[1]));
		this.linear_velocity[2] = Math.min(this.maxLinearVelocity, Math.max(-1 * this.maxLinearVelocity, this.linear_velocity[2] + this.speed*dir[2]));
	}
    moveForward(factor=1) {
		let dir = Vec.of(-factor * this.camera_mat[2][0], -factor * this.camera_mat[2][1], -factor * this.camera_mat[2][2]);		
		this.move(dir);
    }
    moveBack(factor=1) {
		let dir = Vec.of(factor * this.camera_mat[2][0], factor * this.camera_mat[2][1], factor * this.camera_mat[2][2]);    	
		this.move(dir);
    }		
    moveLeft(factor=1) {
		let dir = Vec.of(-factor * this.camera_mat[0][0], -factor * this.camera_mat[0][1], -factor * this.camera_mat[0][2]);    	
		this.move(dir);
    }
    moveRight(factor=1) {
		let dir = Vec.of(factor * this.camera_mat[0][0], factor * this.camera_mat[0][1], factor * this.camera_mat[0][2]);    	
		this.move(dir);	
    }
    takeDamage(dmg) {
    	if (this.HP > 0)
    	{
    	  	this.HP = Math.max(0, this.HP - dmg);
    		if (this.HP == 0)
    		{
    			this.isAlive = false;
    		}
    	}
    }
}

export let player = new Player(new defs.Cube(), inactive_color, Vec.of(.1,.1,.1)).emplace(Mat4.translation(Vec.of(0, 0, 0)), Vec.of(0,0,0), 0);

export class Enemy extends Body { 
	constructor(shape, material, size, enemyID, bodyID ) {
		super(shape, material, size);

		this.speed = 0.005;
		this.maxLinearVelocity = 0.5;

		this.HP = 3;
		this.height = 1.5;			// Height above the ground
		this.damping = 0.98;		// Linear damping factor
		this.stopping_distance = 6;	// How close to the player until it stops
		this.notice_range = 20; // How close it has to be to notice the player
		this.repel_distance = 4;	// How close enemies can get to one another

		this.hurtColorTimer = 0;	// timer for hurt color to disappear


		this.fire_range = 10;		// How close to the player it has to be to start firing on it
		this.laserSpeed = 0.8;
		this.fireCooldown = 20 + Math.random()*30; 

		this.cooldownTimer = this.fireCooldown;
		this.laserVec;

	}

	move(dir) {
		this.linear_velocity[0] = Math.min(this.maxLinearVelocity, this.linear_velocity[0] + this.speed*dir[0]);
		this.linear_velocity[1] = Math.min(this.maxLinearVelocity, this.linear_velocity[1] + this.speed*dir[1]);
		this.linear_velocity[2] = Math.min(this.maxLinearVelocity, this.linear_velocity[2] + this.speed*dir[2]);
	}
    moveTowardsPlayer() {
		let dir = Vec.of( player.center[0], player.center[1], player.center[2] ).minus( Vec.of( this.center[0], this.center[1], this.center[2] ) );    	
		if ( (dir.norm() > this.stopping_distance) && (dir.norm() < this.notice_range) )
			this.move(dir);
		else
		{
			// If they're too close, move back slowly
			this.move(dir.times(-0.5));
		}
    }
    moveRepelledByNearby(other) {
    	// If two aliens get too close to each other, they should move away from one another
    	let dir = Vec.of( this.center[0], this.center[1], this.center[2] ).minus( Vec.of( other.center[0], other.center[1], other.center[2] ) );
    	if ( dir.norm() < this.repel_distance )
    	{
    		this.move( dir.times( 1/dir.norm() ) );
    	}
    }
    takeDamage(dmg) {
		this.HP = Math.max(0, this.HP - dmg);
		return this.HP;
    }

	attemptFire(dt) {
		if (this.cooldownTimer <= 0)
		{
			this.laserVec = Vec.of( player.center[0], player.center[1], player.center[2] ).minus( Vec.of( this.center[0], this.center[1], this.center[2] ) );
			if (this.laserVec.norm() < this.fire_range) {
				this.cooldownTimer = this.fireCooldown;
				
				return true;
			}
		}
		else
		{
			this.cooldownTimer -= dt;
		}
		return false;
	}

}