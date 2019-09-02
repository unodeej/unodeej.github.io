import {tiny} from './tiny-graphics.js';
                                                  // Pull these names into this module's scope for convenience:
const { Vec, Mat, Mat4, Color, Light, Shape, Material, Shader, Texture, Scene } = tiny;


import {widgets} from './tiny-graphics-widgets.js';
Object.assign( tiny, widgets );

const defs = {};

export { tiny, defs };

const Triangle = defs.Triangle =
class Triangle extends Shape
{                                 // **Triangle** The simplest possible 2D Shape – one triangle.  It stores 3 vertices, each
                                  // having their own 3D position, normal vector, and texture-space coordinate.
  constructor()
    {                             // Name the values we'll define per each vertex:
      super( "position", "normal", "texture_coord" );
                                  // First, specify the vertex positions -- the three point locations of an imaginary triangle:
      this.arrays.position      = [ Vec.of(0,0,0), Vec.of(1,0,0), Vec.of(0,1,0) ];
                                  // Next, supply vectors that point away from the triangle face.  They should match up with 
                                  // the points in the above list.  Normal vectors are needed so the graphics engine can
                                  // know if the shape is pointed at light or not, and color it accordingly.
      this.arrays.normal        = [ Vec.of(0,0,1), Vec.of(0,0,1), Vec.of(0,0,1) ];
                                  //  lastly, put each point somewhere in texture space too:
      this.arrays.texture_coord = [ Vec.of(0,0),   Vec.of(1,0),   Vec.of(0,1)   ]; 
                                  // Index into our vertices to connect them into a whole triangle:
      this.indices        = [ 0, 1, 2 ];
                       // A position, normal, and texture coord fully describes one "vertex".  What's the "i"th vertex?  Simply
                       // the combined data you get if you look up index "i" of those lists above -- a position, normal vector,
                       // and texture coordinate together.  Lastly we told it how to connect vertex entries into triangles.
                       // Every three indices in "this.indices" traces out one triangle.
    }
}


const Square = defs.Square =
class Square extends Shape
{                                 // **Square** demonstrates two triangles that share vertices.  On any planar surface, the 
                                  // interior edges don't make any important seams.  In these cases there's no reason not
                                  // to re-use data of the common vertices between triangles.  This makes all the vertex 
                                  // arrays (position, normals, etc) smaller and more cache friendly.
  constructor()
    { super( "position", "normal", "texture_coord" );
                                          // Specify the 4 square corner locations, and match those up with normal vectors:
      this.arrays.position      = Vec.cast( [-1,-1,0], [1,-1,0], [-1,1,0], [1,1,0] );
      this.arrays.normal        = Vec.cast( [0,0,1],   [0,0,1],  [0,0,1],  [0,0,1] );
                                                          // Arrange the vertices into a square shape in texture space too:
      this.arrays.texture_coord = Vec.cast( [0,0],     [1,0],    [0,1],    [1,1]   );
                                                     // Use two triangles this time, indexing into four distinct vertices:
      this.indices.push( 0, 1, 2,     1, 3, 2 );
    }
}


const Tetrahedron = defs.Tetrahedron =
class Tetrahedron extends Shape
{                                   // **Tetrahedron** demonstrates flat vs smooth shading (a boolean argument selects
                                    // which one).  It is also our first 3D, non-planar shape.  Four triangles share
                                    // corners with each other.  Unless we store duplicate points at each corner
                                    // (storing the same position at each, but different normal vectors), the lighting
                                    // will look "off".  To get crisp seams at the edges we need the repeats.
  constructor( using_flat_shading )
    { super( "position", "normal", "texture_coord" );
      var a = 1/Math.sqrt(3);
      if( !using_flat_shading )
      {                                         // Method 1:  A tetrahedron with shared vertices.  Compact, performs better,
                                                // but can't produce flat shading or discontinuous seams in textures.
          this.arrays.position      = Vec.cast( [ 0, 0, 0], [1,0,0], [0,1,0], [0,0,1] );          
          this.arrays.normal        = Vec.cast( [-a,-a,-a], [1,0,0], [0,1,0], [0,0,1] );          
          this.arrays.texture_coord = Vec.cast( [ 0, 0   ], [1,0  ], [0,1, ], [1,1  ] );
                                                // Notice the repeats in the index list.  Vertices are shared 
                                                // and appear in multiple triangles with this method.
          this.indices.push( 0, 1, 2,   0, 1, 3,   0, 2, 3,   1, 2, 3 );
      }
      else
      {                                           // Method 2:  A tetrahedron with four independent triangles.
        this.arrays.position = Vec.cast( [0,0,0], [1,0,0], [0,1,0],
                                         [0,0,0], [1,0,0], [0,0,1],
                                         [0,0,0], [0,1,0], [0,0,1],
                                         [0,0,1], [1,0,0], [0,1,0] );

                                          // The essence of flat shading:  This time, values of normal vectors can
                                          // be constant per whole triangle.  Repeat them for all three vertices.
        this.arrays.normal   = Vec.cast( [0,0,-1], [0,0,-1], [0,0,-1],
                                         [0,-1,0], [0,-1,0], [0,-1,0],
                                         [-1,0,0], [-1,0,0], [-1,0,0],
                                         [ a,a,a], [ a,a,a], [ a,a,a] );

                                          // Each face in Method 2 also gets its own set of texture coords (half the
                                          // image is mapped onto each face).  We couldn't do this with shared
                                          // vertices since this features abrupt transitions when approaching the
                                          // same point from different directions.
        this.arrays.texture_coord = Vec.cast( [0,0], [1,0], [1,1],
                                              [0,0], [1,0], [1,1],
                                              [0,0], [1,0], [1,1],
                                              [0,0], [1,0], [1,1] );
                                          // Notice all vertices are unique this time.
        this.indices.push( 0, 1, 2,    3, 4, 5,    6, 7, 8,    9, 10, 11 );
      }
    }
}

const Windmill = defs.Windmill =
class Windmill extends Shape
{                             // **Windmill**  As our shapes get more complicated, we begin using matrices and flow
                              // control (including loops) to generate non-trivial point clouds and connect them.
  constructor( num_blades )
    { super( "position", "normal", "texture_coord" );
                                                      // A for loop to automatically generate the triangles:
      for( let i = 0; i < num_blades; i++ )
        {                                      // Rotate around a few degrees in the XZ plane to place each new point:
          const spin = Mat4.rotation( i * 2*Math.PI/num_blades, Vec.of( 0,1,0 ) );
                                               // Apply that XZ rotation matrix to point (1,0,0) of the base triangle.
          const newPoint  = spin.times( Vec.of( 1,0,0,1 ) ).to3();
          const triangle = [ newPoint,                      // Store that XZ position as point 1.
                             newPoint.plus( [ 0,1,0 ] ),    // Store it again but with higher y coord as point 2.
                             Vec.of( 0,0,0 )    ];          // All triangles touch this location -- point 3.

          this.arrays.position.push( ...triangle );
                        // Rotate our base triangle's normal (0,0,1) to get the new one.  Careful!  Normal vectors are not
                        // points; their perpendicularity constraint gives them a mathematical quirk that when applying 
                        // matrices you have to apply the transposed inverse of that matrix instead.  But right now we've
                        // got a pure rotation matrix, where the inverse and transpose operations cancel out, so it's ok.
          var newNormal = spin.times( Vec.of( 0,0,1 ).to4(0) ).to3();
                                                                       // Propagate the same normal to all three vertices:
          this.arrays.normal.push( newNormal, newNormal, newNormal );
          this.arrays.texture_coord.push( ...Vec.cast( [ 0,0 ], [ 0,1 ], [ 1,0 ] ) );
                                                                // Procedurally connect the 3 new vertices into triangles:
          this.indices.push( 3*i, 3*i + 1, 3*i + 2 );
        }
    }
}


const Cube = defs.Cube =
class Cube extends Shape
{                         // **Cube** A closed 3D shape, and the first example of a compound shape (a Shape constructed
                          // out of other Shapes).  A cube inserts six Square strips into its own arrays, using six
                          // different matrices as offsets for each square.
  constructor()  
    { super( "position", "normal", "texture_coord" );
                          // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
      for( var i = 0; i < 3; i++ )
        for( var j = 0; j < 2; j++ )
        { var square_transform = Mat4.rotation( i == 0 ? Math.PI/2 : 0, Vec.of(1, 0, 0) )
                         .times( Mat4.rotation( Math.PI * j - ( i == 1 ? Math.PI/2 : 0 ), Vec.of( 0, 1, 0 ) ) )
                         .times( Mat4.translation([ 0, 0, 1 ]) );
                                  // Calling this function of a Square (or any Shape) copies it into the specified
                                  // Shape (this one) at the specified matrix offset (square_transform):
          Square.insert_transformed_copy_into( this, [], square_transform );
        }
    }
}


const Subdivision_Sphere = defs.Subdivision_Sphere =
class Subdivision_Sphere extends Shape   
{                       // **Subdivision_Sphere** defines a Sphere surface, with nice uniform triangles.  A subdivision surface
                        // (see Wikipedia article on those) is initially simple, then builds itself into a more and more 
                        // detailed shape of the same layout.  Each act of subdivision makes it a better approximation of 
                        // some desired mathematical surface by projecting each new point onto that surface's known 
                        // implicit equation.  For a sphere, we begin with a closed 3-simplex (a tetrahedron).  For each
                        // face, connect the midpoints of each edge together to make more faces.  Repeat recursively until 
                        // the desired level of detail is obtained.  Project all new vertices to unit vectors (onto the
                        // unit sphere) and group them into triangles by following the predictable pattern of the recursion.
  constructor( max_subdivisions )
    { super( "position", "normal", "texture_coord" );                          
                                                                        // Start from the following equilateral tetrahedron:
      const tetrahedron = [ [ 0, 0, -1 ], [ 0, .9428, .3333 ], [ -.8165, -.4714, .3333 ], [ .8165, -.4714, .3333 ] ];
      this.arrays.position = Vec.cast( ...tetrahedron );
                                                                        // Begin recursion:
      this.subdivide_triangle( 0, 1, 2, max_subdivisions);
      this.subdivide_triangle( 3, 2, 1, max_subdivisions);
      this.subdivide_triangle( 1, 0, 3, max_subdivisions);
      this.subdivide_triangle( 0, 2, 3, max_subdivisions);
      
                                     // With positions calculated, fill in normals and texture_coords of the finished Sphere:
      for( let p of this.arrays.position )
        {                                    // Each point has a normal vector that simply goes to the point from the origin:
          this.arrays.normal.push( p.copy() );

                                         // Textures are tricky.  A Subdivision sphere has no straight seams to which image 
                                         // edges in UV space can be mapped.  The only way to avoid artifacts is to smoothly
                                         // wrap & unwrap the image in reverse - displaying the texture twice on the sphere.                                                        
        //  this.arrays.texture_coord.push( Vec.of( Math.asin( p[0]/Math.PI ) + .5, Math.asin( p[1]/Math.PI ) + .5 ) );
          this.arrays.texture_coord.push(Vec.of(
                0.5 - Math.atan2(p[2], p[0]) / (2 * Math.PI),
                0.5 + Math.asin(p[1]) / Math.PI) );
        }

                                                         // Fix the UV seam by duplicating vertices with offset UV:
      const tex = this.arrays.texture_coord;
      for (let i = 0; i < this.indices.length; i += 3) {
          const a = this.indices[i], b = this.indices[i + 1], c = this.indices[i + 2];
          if ([[a, b], [a, c], [b, c]].some(x => (Math.abs(tex[x[0]][0] - tex[x[1]][0]) > 0.5))
              && [a, b, c].some(x => tex[x][0] < 0.5))
          {
              for (let q of [[a, i], [b, i + 1], [c, i + 2]]) {
                  if (tex[q[0]][0] < 0.5) {
                      this.indices[q[1]] = this.arrays.position.length;
                      this.arrays.position.push( this.arrays.position[q[0]].copy());
                      this.arrays.normal  .push( this.arrays.normal  [q[0]].copy());
                      tex.push(tex[q[0]].plus(Vec.of(1, 0)));
                  }
              }
          }
      }
    }
  subdivide_triangle( a, b, c, count )
    {                                           // subdivide_triangle(): Recurse through each level of detail 
                                                // by splitting triangle (a,b,c) into four smaller ones.
      if( count <= 0)
        {                                       // Base case of recursion - we've hit the finest level of detail we want.
          this.indices.push( a,b,c ); 
          return; 
        }
                                                // So we're not at the base case.  So, build 3 new vertices at midpoints,
                                                // and extrude them out to touch the unit sphere (length 1).
      var ab_vert = this.arrays.position[a].mix( this.arrays.position[b], 0.5).normalized(),     
          ac_vert = this.arrays.position[a].mix( this.arrays.position[c], 0.5).normalized(),
          bc_vert = this.arrays.position[b].mix( this.arrays.position[c], 0.5).normalized(); 
                                                // Here, push() returns the indices of the three new vertices (plus one).
      var ab = this.arrays.position.push( ab_vert ) - 1,
          ac = this.arrays.position.push( ac_vert ) - 1,  
          bc = this.arrays.position.push( bc_vert ) - 1;  
                               // Recurse on four smaller triangles, and we're done.  Skipping every fourth vertex index in 
                               // our list takes you down one level of detail, and so on, due to the way we're building it.
      this.subdivide_triangle( a, ab, ac,  count - 1 );
      this.subdivide_triangle( ab, b, bc,  count - 1 );
      this.subdivide_triangle( ac, bc, c,  count - 1 );
      this.subdivide_triangle( ab, bc, ac, count - 1 );
    }
}



const Grid_Patch = defs.Grid_Patch =
class Grid_Patch extends Shape       // A grid of rows and columns you can distort. A tesselation of triangles connects the
{                                           // points, generated with a certain predictable pattern of indices.  Two callbacks
                                            // allow you to dynamically define how to reach the next row or column.
  constructor( rows, columns, next_row_function, next_column_function, texture_coord_range = [ [ 0, rows ], [ 0, columns ] ]  )
    { super( "position", "normal", "texture_coord" );
      let points = [];
      for( let r = 0; r <= rows; r++ ) 
      { points.push( new Array( columns+1 ) );                                                    // Allocate a 2D array.
                                             // Use next_row_function to generate the start point of each row. Pass in the progress ratio,
        points[ r ][ 0 ] = next_row_function( r/rows, points[ r-1 ] && points[ r-1 ][ 0 ] );      // and the previous point if it existed.                                                                                                  
      }
      for(   let r = 0; r <= rows;    r++ )               // From those, use next_column function to generate the remaining points:
        for( let c = 0; c <= columns; c++ )
        { if( c > 0 ) points[r][ c ] = next_column_function( c/columns, points[r][ c-1 ], r/rows );
      
          this.arrays.position.push( points[r][ c ] );        
                                                                                      // Interpolate texture coords from a provided range.
          const a1 = c/columns, a2 = r/rows, x_range = texture_coord_range[0], y_range = texture_coord_range[1];
          this.arrays.texture_coord.push( Vec.of( ( a1 )*x_range[1] + ( 1-a1 )*x_range[0], ( a2 )*y_range[1] + ( 1-a2 )*y_range[0] ) );
        }
      for(   let r = 0; r <= rows;    r++ )            // Generate normals by averaging the cross products of all defined neighbor pairs.
        for( let c = 0; c <= columns; c++ )
        { let curr = points[r][c], neighbors = new Array(4), normal = Vec.of( 0,0,0 );          
          for( let [ i, dir ] of [ [ -1,0 ], [ 0,1 ], [ 1,0 ], [ 0,-1 ] ].entries() )         // Store each neighbor by rotational order.
            neighbors[i] = points[ r + dir[1] ] && points[ r + dir[1] ][ c + dir[0] ];        // Leave "undefined" in the array wherever
                                                                                              // we hit a boundary.
          for( let i = 0; i < 4; i++ )                                          // Take cross-products of pairs of neighbors, proceeding
            if( neighbors[i] && neighbors[ (i+1)%4 ] )                          // a consistent rotational direction through the pairs:
              normal = normal.plus( neighbors[i].minus( curr ).cross( neighbors[ (i+1)%4 ].minus( curr ) ) );          
          normal.normalize();                                                              // Normalize the sum to get the average vector.
                                                     // Store the normal if it's valid (not NaN or zero length), otherwise use a default:
          if( normal.every( x => x == x ) && normal.norm() > .01 )  this.arrays.normal.push( Vec.from( normal ) );    
          else                                                      this.arrays.normal.push( Vec.of( 0,0,1 )    );
        }   
        
      for( var h = 0; h < rows; h++ )             // Generate a sequence like this (if #columns is 10):  
        for( var i = 0; i < 2 * columns; i++ )    // "1 11 0  11 1 12  2 12 1  12 2 13  3 13 2  13 3 14  4 14 3..." 
          for( var j = 0; j < 3; j++ )
            this.indices.push( h * ( columns + 1 ) + columns * ( ( i + ( j % 2 ) ) % 2 ) + ( ~~( ( j % 3 ) / 2 ) ? 
                                   ( ~~( i / 2 ) + 2 * ( i % 2 ) )  :  ( ~~( i / 2 ) + 1 ) ) );
    }
  static sample_array( array, ratio )                 // Optional but sometimes useful as a next row or column operation. In a given array
    {                                                 // of points, intepolate the pair of points that our progress ratio falls between.  
      const frac = ratio * ( array.length - 1 ), alpha = frac - Math.floor( frac );
      return array[ Math.floor( frac ) ].mix( array[ Math.ceil( frac ) ], alpha );
    }
}


const Surface_Of_Revolution = defs.Surface_Of_Revolution =
class Surface_Of_Revolution extends Grid_Patch      
{                                                   // SURFACE OF REVOLUTION: Produce a curved "sheet" of triangles with rows and columns.
                                                    // Begin with an input array of points, defining a 1D path curving through 3D space -- 
                                                    // now let each such point be a row.  Sweep that whole curve around the Z axis in equal 
                                                    // steps, stopping and storing new points along the way; let each step be a column. Now
                                                    // we have a flexible "generalized cylinder" spanning an area until total_curvature_angle.
  constructor( rows, columns, points, texture_coord_range, total_curvature_angle = 2*Math.PI )
    { const row_operation =     i => Grid_Patch.sample_array( points, i ),
         column_operation = (j,p) => Mat4.rotation( total_curvature_angle/columns, Vec.of( 0,0,1 ) ).times(p.to4(1)).to3();
         
       super( rows, columns, row_operation, column_operation, texture_coord_range );
    }
}


const Regular_2D_Polygon = defs.Regular_2D_Polygon =
class Regular_2D_Polygon extends Surface_Of_Revolution     // Approximates a flat disk / circle
  { constructor( rows, columns )
      { super( rows, columns, Vec.cast( [0, 0, 0], [1, 0, 0] ) ); 
        this.arrays.normal = this.arrays.normal.map( x => Vec.of( 0,0,1 ) );
        this.arrays.texture_coord.forEach( (x, i, a) => a[i] = this.arrays.position[i].map( x => x/2 + .5 ).slice(0,2) ); } }

const Cylindrical_Tube = defs.Cylindrical_Tube =
class Cylindrical_Tube extends Surface_Of_Revolution    // An open tube shape with equally sized sections, pointing down Z locally.    
  { constructor( rows, columns, texture_range ) { super( rows, columns, Vec.cast( [1, 0, .5], [1, 0, -.5] ), texture_range ); } }

const Cone_Tip = defs.Cone_Tip =
class Cone_Tip extends Surface_Of_Revolution    // Note:  Touches the Z axis; squares degenerate into triangles as they sweep around.
  { constructor( rows, columns, texture_range ) { super( rows, columns, Vec.cast( [0, 0, 1],  [1, 0, -1]  ), texture_range ); } }

const Torus = defs.Torus =
class Torus extends Shape                                         // Build a donut shape.  An example of a surface of revolution.
  { constructor( rows, columns, texture_range )  
      { super( "position", "normal", "texture_coord" );
        const circle_points = Array( rows ).fill( Vec.of( 1/3,0,0 ) )
                                           .map( (p,i,a) => Mat4.translation([ -2/3,0,0 ])
                                                    .times( Mat4.rotation( i/(a.length-1) * 2*Math.PI, Vec.of( 0,-1,0 ) ) )
                                                    .times( Mat4.scale([ 1,1,3 ]) )
                                                    .times( p.to4(1) ).to3() );

        Surface_Of_Revolution.insert_transformed_copy_into( this, [ rows, columns, circle_points, texture_range ] );         
      } }

const Grid_Sphere = defs.Grid_Sphere =
class Grid_Sphere extends Shape                  // With lattitude / longitude divisions; this means singularities are at 
  { constructor( rows, columns, texture_range )         // the mesh's top and bottom.  Subdivision_Sphere is a better alternative.
      { super( "position", "normal", "texture_coord" );
        const semi_circle_points = Array( rows ).fill( Vec.of( 0,0,1 ) ).map( (x,i,a) =>
                                     Mat4.rotation( i/(a.length-1) * Math.PI, Vec.of( 0,1,0 ) ).times( x.to4(1) ).to3() );
        
        Surface_Of_Revolution.insert_transformed_copy_into( this, [ rows, columns, semi_circle_points, texture_range ] );
      } }

const Closed_Cone = defs.Closed_Cone =
class Closed_Cone extends Shape     // Combine a cone tip and a regular polygon to make a closed cone.
  { constructor( rows, columns, texture_range )
      { super( "position", "normal", "texture_coord" );
        Cone_Tip          .insert_transformed_copy_into( this, [ rows, columns, texture_range ]);    
        Regular_2D_Polygon.insert_transformed_copy_into( this, [ 1, columns ], Mat4.rotation( Math.PI, Vec.of(0, 1, 0) )
                                                                       .times( Mat4.translation([ 0, 0, 1 ]) ) ); } }

const Rounded_Closed_Cone = defs.Rounded_Closed_Cone =
class Rounded_Closed_Cone extends Surface_Of_Revolution   // An alternative without two separate sections
  { constructor( rows, columns, texture_range ) { super( rows, columns, Vec.cast( [0, 0, 1], [1, 0, -1], [0, 0, -1] ), texture_range ) ; } }

const Capped_Cylinder = defs.Capped_Cylinder =
class Capped_Cylinder extends Shape                // Combine a tube and two regular polygons to make a closed cylinder.
  { constructor( rows, columns, texture_range )           // Flat shade this to make a prism, where #columns = #sides.
      { super( "position", "normal", "texture_coord" );
        Cylindrical_Tube  .insert_transformed_copy_into( this, [ rows, columns, texture_range ] );
        Regular_2D_Polygon.insert_transformed_copy_into( this, [ 1, columns ],                                                  Mat4.translation([ 0, 0, .5 ]) );
        Regular_2D_Polygon.insert_transformed_copy_into( this, [ 1, columns ], Mat4.rotation( Math.PI, Vec.of(0, 1, 0) ).times( Mat4.translation([ 0, 0, .5 ]) ) ); } }

const Rounded_Capped_Cylinder = defs.Rounded_Capped_Cylinder =
class Rounded_Capped_Cylinder extends Surface_Of_Revolution   // An alternative without three separate sections
  { constructor ( rows, columns, texture_range ) { super( rows, columns, Vec.cast( [0, 0, .5], [1, 0, .5], [1, 0, -.5], [0, 0, -.5] ), texture_range ); } }
  
  
const Axis_Arrows = defs.Axis_Arrows =
class Axis_Arrows extends Shape                               // An axis set with arrows, made out of a lot of various primitives.
{ constructor()
    { super( "position", "normal", "texture_coord" );
      var stack = [];       
      Subdivision_Sphere.insert_transformed_copy_into( this, [ 3 ], Mat4.rotation( Math.PI/2, Vec.of( 0,1,0 ) ).times( Mat4.scale([ .25, .25, .25 ]) ) );
      this.drawOneAxis( Mat4.identity(),                                                            [[ .67, 1  ], [ 0,1 ]] );
      this.drawOneAxis( Mat4.rotation(-Math.PI/2, Vec.of(1,0,0)).times( Mat4.scale([  1, -1, 1 ])), [[ .34,.66 ], [ 0,1 ]] );
      this.drawOneAxis( Mat4.rotation( Math.PI/2, Vec.of(0,1,0)).times( Mat4.scale([ -1,  1, 1 ])), [[  0 ,.33 ], [ 0,1 ]] ); 
    }
  drawOneAxis( transform, tex )    // Use a different texture coordinate range for each of the three axes, so they show up differently.
    { Closed_Cone     .insert_transformed_copy_into( this, [ 4, 10, tex ], transform.times( Mat4.translation([   0,   0,  2 ]) ).times( Mat4.scale([ .25, .25, .25 ]) ) );
      Cube            .insert_transformed_copy_into( this, [ ],            transform.times( Mat4.translation([ .95, .95, .45]) ).times( Mat4.scale([ .05, .05, .45 ]) ) );
      Cube            .insert_transformed_copy_into( this, [ ],            transform.times( Mat4.translation([ .95,   0, .5 ]) ).times( Mat4.scale([ .05, .05, .4  ]) ) );
      Cube            .insert_transformed_copy_into( this, [ ],            transform.times( Mat4.translation([   0, .95, .5 ]) ).times( Mat4.scale([ .05, .05, .4  ]) ) );
      Cylindrical_Tube.insert_transformed_copy_into( this, [ 7, 7,  tex ], transform.times( Mat4.translation([   0,   0,  1 ]) ).times( Mat4.scale([  .1,  .1,  2  ]) ) );
    }
}


const Minimal_Shape = defs.Minimal_Shape =
class Minimal_Shape extends tiny.Vertex_Buffer
{                                     // **Minimal_Shape** an even more minimal triangle, with three
                                      // vertices each holding a 3D position and a color.
  constructor()
    { super( "position", "color" );
              // Describe the where the points of a triangle are in space, and also describe their colors:
      this.arrays.position = [ Vec.of(0,0,0), Vec.of(1,0,0), Vec.of(0,1,0) ];
      this.arrays.color    = [ Color.of(1,0,0,1), Color.of(0,1,0,1), Color.of(0,0,1,1) ];
    }
}


const Minimal_Webgl_Demo = defs.Minimal_Webgl_Demo =
class Minimal_Webgl_Demo extends Scene
{                                       // **Minimal_Webgl_Demo** is an extremely simple example of a Scene class.
  constructor( webgl_manager, control_panel )
    { super( webgl_manager, control_panel );
                                                // Send a Triangle's vertices to the GPU's buffers:
      this.shapes = { triangle : new Minimal_Shape() };
      this.shader = new Basic_Shader();
    }
  display( context, graphics_state )
    {                                           // Every frame, simply draw the Triangle at its default location.
      this.shapes.triangle.draw( context, graphics_state, Mat4.identity(), new Material( this.shader ) );
    }
 make_control_panel()
    { this.control_panel.innerHTML += "(This one has no controls)";
    }
}


const Basic_Shader = defs.Basic_Shader =
class Basic_Shader extends Shader
{                                  // **Basic_Shader** is nearly the simplest example of a subclass of Shader, which stores and
                                   // maanges a GPU program.  Basic_Shader is a trivial pass-through shader that applies a
                                   // shape's matrices and then simply samples literal colors stored at each vertex.
 update_GPU( context, gpu_addresses, graphics_state, model_transform, material )
      {       // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
        const [ P, C, M ] = [ graphics_state.projection_transform, graphics_state.camera_inverse, model_transform ],
                      PCM = P.times( C ).times( M );
        context.uniformMatrix4fv( gpu_addresses.projection_camera_model_transform, false, 
                                                                          Mat.flatten_2D_to_1D( PCM.transposed() ) );
      }
  shared_glsl_code()           // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    { return `precision mediump float;
              varying vec4 VERTEX_COLOR;
      `;
    }
  vertex_glsl_code()           // ********* VERTEX SHADER *********
    { return this.shared_glsl_code() + `
        attribute vec4 color;
        attribute vec3 position;                            // Position is expressed in object coordinates.
        uniform mat4 projection_camera_model_transform;

        void main()
        {                    // Compute the vertex's final resting place (in NDCS), and use the hard-coded color of the vertex:
          gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
          VERTEX_COLOR = color;
        }`;
    }
  fragment_glsl_code()         // ********* FRAGMENT SHADER *********
    { return this.shared_glsl_code() + `
        void main()
        {                                                     // The interpolation gets done directly on the per-vertex colors:
          gl_FragColor = VERTEX_COLOR;
        }`;
    }
}


const Funny_Shader = defs.Funny_Shader =
class Funny_Shader extends Shader
{                                        // **Funny_Shader**: A simple "procedural" texture shader, with 
                                         // texture coordinates but without an input image.
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

        void main()
        { gl_Position = projection_camera_model_transform * vec4( position, 1.0 );   // The vertex's final resting place (in NDCS).
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
            2.0 * u * sin(17.0 * u ) + 3.0 * v * sin(11.0 * v ) + 1.0 * sin(13.0 * a),
            3.0 * u * sin(18.0 * u ) + 4.0 * v * sin(12.0 * v ) + 2.0 * sin(14.0 * a),
            4.0 * u * sin(19.0 * u ) + 5.0 * v * sin(13.0 * v ) + 3.0 * sin(15.0 * a),
            5.0 * u * sin(20.0 * u ) + 6.0 * v * sin(14.0 * v ) + 4.0 * sin(16.0 * a));
        }`;
    }
}
const Phong_Shader = defs.Phong_Shader =
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


const Textured_Phong = defs.Textured_Phong =
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


const Fake_Bump_Map = defs.Fake_Bump_Map =
class Fake_Bump_Map extends Textured_Phong
{                                // **Fake_Bump_Map** Same as Phong_Shader, except adds a line of code to
                                 // compute a new normal vector, perturbed according to texture color.
  fragment_glsl_code()
    {                            // ********* FRAGMENT SHADER ********* 
      return this.shared_glsl_code() + `
        varying vec2 f_tex_coord;
        uniform sampler2D texture;

        void main()
          {                                                          // Sample the texture image in the correct place:
            vec4 tex_color = texture2D( texture, f_tex_coord );
            if( tex_color.w < .01 ) discard;
                             // Slightly disturb normals based on sampling the same image that was used for texturing:
            vec3 bumped_N  = N + tex_color.rgb - .5*vec3(1,1,1);
                                                                     // Compute an initial (ambient) color:
            gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                     // Compute the final color with contributions from lights:
            gl_FragColor.xyz += phong_model_lights( normalize( bumped_N ), vertex_worldspace );
          } ` ;
    }
}


const Movement_Controls = defs.Movement_Controls =
class Movement_Controls extends Scene
{                                       // **Movement_Controls** is a Scene that can be attached to a canvas, like any other
                                        // Scene, but it is a Secondary Scene Component -- meant to stack alongside other 
                                        // scenes.  Rather than drawing anything it embeds both first-person and third-
                                        // person style controls into the website.  These can be used to manually move your
                                        // camera or other objects smoothly through your scene using key, mouse, and HTML
                                        // button controls to help you explore what's in it.
  constructor()
    { super();
      const data_members = { roll: 0, look_around_locked: true, 
                             thrust: Vec.of( 0,0,0 ), pos: Vec.of( 0,0,0 ), z_axis: Vec.of( 0,0,0 ),
                             radians_per_frame: 1/200, meters_per_frame: 20, speed_multiplier: 1,
                             fire: false };
      Object.assign( this, data_members );

      this.mouse_enabled_canvases = new Set();
      this.will_take_over_graphics_state = true;
      this.floating_controls = false;
    }
  toggle_floating_controls() {this.floating_controls = !this.floating_controls;}
  set_recipient( matrix_closure, inverse_closure )
    {                               // set_recipient(): The camera matrix is not actually stored here inside Movement_Controls;
                                    // instead, track an external target matrix to modify.  Targets must be pointer references
                                    // made using closures.
      this.matrix  =  matrix_closure;
      this.inverse = inverse_closure;
    }
  reset( graphics_state )
    {                         // reset(): Initially, the default target is the camera matrix that Shaders use, stored in the
                              // encountered program_state object.  Targets must be pointer references made using closures.
      this.set_recipient( () => graphics_state.camera_transform, 
                          () => graphics_state.camera_inverse   );
    }
  add_mouse_controls( canvas )
    {                                       // add_mouse_controls():  Attach HTML mouse events to the drawing canvas.
                                            // First, measure mouse steering, for rotating the flyaround camera:
      this.mouse = { "from_center": Vec.of( 0,0 ) };
      const mouse_position = ( e, rect = canvas.getBoundingClientRect() ) => 
                                   Vec.of( e.clientX - (rect.left + rect.right)/2, e.clientY - (rect.bottom + rect.top)/2 );
                                // Set up mouse response.  The last one stops us from reacting if the mouse leaves the canvas:
      document.addEventListener( "mouseup",   e => { this.mouse.anchor = undefined; } );
      canvas  .addEventListener( "mousedown", e => { e.preventDefault(); this.mouse.anchor      = mouse_position(e); } );
      canvas  .addEventListener( "mousemove", e => { e.preventDefault(); this.mouse.from_center = mouse_position(e); } );
      canvas  .addEventListener( "mouseout",  e => { if( !this.mouse.anchor ) this.mouse.from_center.scale(0) } );
    }
  show_explanation( document_element ) { }
  make_control_panel()
    {                                 // make_control_panel(): Sets up a panel of interactive HTML elements, including
                                      // buttons with key bindings for affecting this scene, and live info readouts.
      this.control_panel.innerHTML += "Click and drag the scene to <br> spin your viewpoint around it.<br>";
      this.key_triggered_button( "Up",     [ " " ], () => this.thrust[1] = -1, undefined, () => this.thrust[1] = 0 );
      this.key_triggered_button( "Forward",[ "i" ], () => this.thrust[2] =  1, undefined, () => this.thrust[2] = 0 );
      this.new_line();
      this.key_triggered_button( "Left",   [ "j" ], () => this.thrust[0] =  1, undefined, () => this.thrust[0] = 0 );
      this.key_triggered_button( "Back",   [ "k" ], () => this.thrust[2] = -1, undefined, () => this.thrust[2] = 0 );
      this.key_triggered_button( "Right",  [ "l" ], () => this.thrust[0] = -1, undefined, () => this.thrust[0] = 0 );
      this.new_line();
      this.key_triggered_button( "Down",   [ "z" ], () => this.thrust[1] =  1, undefined, () => this.thrust[1] = 0 );

      const speed_controls = this.control_panel.appendChild( document.createElement( "span" ) );
      speed_controls.style.margin = "30px";
      this.key_triggered_button( "-",  [ "o" ], () => 
                                            this.speed_multiplier  /=  1.2, "green", undefined, undefined, speed_controls );
      this.live_string( box => { box.textContent = "Speed: " + this.speed_multiplier.toFixed(2) }, speed_controls );
      this.key_triggered_button( "+",  [ "p" ], () => 
                                            this.speed_multiplier  *=  1.2, "green", undefined, undefined, speed_controls );
      this.new_line();
      this.key_triggered_button( "Roll left",  [ "," ], () => this.roll =  1, undefined, () => this.roll = 0 );
      this.key_triggered_button( "Roll right", [ "." ], () => this.roll = -1, undefined, () => this.roll = 0 );
      this.new_line();
      this.key_triggered_button( "(Un)freeze mouse look around", [ "f" ], () => this.look_around_locked ^=  1, "green" );
      this.new_line();
      this.live_string( box => box.textContent = "Position: " + this.pos[0].toFixed(2) + ", " + this.pos[1].toFixed(2) 
                                                       + ", " + this.pos[2].toFixed(2) );
      this.new_line();
                                                  // The facing directions are surprisingly affected by the left hand rule:
      this.live_string( box => box.textContent = "Facing: " + ( ( this.z_axis[0] > 0 ? "West " : "East ")
                   + ( this.z_axis[1] > 0 ? "Down " : "Up " ) + ( this.z_axis[2] > 0 ? "North" : "South" ) ) );
      this.new_line();
      this.key_triggered_button( "Go to world origin", [ "r" ], () => { this. matrix().set_identity( 4,4 );
                                                                        this.inverse().set_identity( 4,4 ) }, "orange" );
      this.new_line();

      this.key_triggered_button( "Look at origin from front", [ "1" ], () =>
        { this.inverse().set( Mat4.look_at( Vec.of( 0,0,10 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          this. matrix().set( Mat4.inverse( this.inverse() ) );
        }, "black" );
      this.new_line();
      this.key_triggered_button( "from right", [ "2" ], () =>
        { this.inverse().set( Mat4.look_at( Vec.of( 10,0,0 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          this. matrix().set( Mat4.inverse( this.inverse() ) );
        }, "black" );
      this.key_triggered_button( "from rear", [ "3" ], () =>
        { this.inverse().set( Mat4.look_at( Vec.of( 0,0,-10 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          this. matrix().set( Mat4.inverse( this.inverse() ) );
        }, "black" );   
      this.key_triggered_button( "from left", [ "4" ], () =>
        { this.inverse().set( Mat4.look_at( Vec.of( -10,0,0 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) ) );
          this. matrix().set( Mat4.inverse( this.inverse() ) );
        }, "black" );
      this.new_line();
      this.key_triggered_button( "Attach to global camera", [ "Shift", "R" ],
                                                 () => { this.will_take_over_graphics_state = true }, "blue" );
      this.new_line();
    }
  first_person_flyaround( radians_per_frame, meters_per_frame, leeway = 70 )
    {                                                     // (Internal helper function)
                                                          // Compare mouse's location to all four corners of a dead box:
      const offsets_from_dead_box = { plus: [ this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway ],
                                     minus: [ this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway ] }; 
                                                          // Apply a camera rotation movement, but only when the mouse is
                                                          // past a minimum distance (leeway) from the canvas's center:
      if( !this.look_around_locked )
                                              // If steering, steer according to "mouse_from_center" vector, but don't
                                              // start increasing until outside a leeway window from the center.                                          
        for( let i = 0; i < 2; i++ )
        {                                     // The &&'s in the next line might zero the vectors out:
          let o = offsets_from_dead_box,
            velocity = ( ( o.minus[i] > 0 && o.minus[i] ) || ( o.plus[i] < 0 && o.plus[i] ) ) * radians_per_frame;
                                              // On X step, rotate around Y axis, and vice versa.
          this.matrix().post_multiply( Mat4.rotation( -velocity, Vec.of( i, 1-i, 0 ) ) );
          this.inverse().pre_multiply( Mat4.rotation( +velocity, Vec.of( i, 1-i, 0 ) ) );
        }
      this.matrix().post_multiply( Mat4.rotation( -.1 * this.roll, Vec.of( 0,0,1 ) ) );
      this.inverse().pre_multiply( Mat4.rotation( +.1 * this.roll, Vec.of( 0,0,1 ) ) );
                                    // Now apply translation movement of the camera, in the newest local coordinate frame.
      this.matrix().post_multiply( Mat4.translation( this.thrust.times( -meters_per_frame ) ) );
      this.inverse().pre_multiply( Mat4.translation( this.thrust.times( +meters_per_frame ) ) );
    }
  third_person_arcball( radians_per_frame )
    {                                           // (Internal helper function)
                                                // Spin the scene around a point on an axis determined by user mouse drag:
      const dragging_vector = this.mouse.from_center.minus( this.mouse.anchor );
      if( dragging_vector.norm() <= 0 )
        return;
      this.matrix().post_multiply( Mat4.translation([ 0,0, -25 ]) );
      this.inverse().pre_multiply( Mat4.translation([ 0,0, +25 ]) );

      const rotation = Mat4.rotation( radians_per_frame * dragging_vector.norm(), 
                                                  Vec.of( dragging_vector[1], dragging_vector[0], 0 ) );
      this.matrix().post_multiply( rotation );
      this.inverse().pre_multiply( rotation );

      this. matrix().post_multiply( Mat4.translation([ 0,0, +25 ]) );
      this.inverse().pre_multiply( Mat4.translation([ 0,0, -25 ]) );
    }
  display( context, graphics_state, dt = graphics_state.animation_delta_time / 1000 )
    {                                                            // The whole process of acting upon controls begins here.
      const m = this.speed_multiplier * this. meters_per_frame,
            r = this.speed_multiplier * this.radians_per_frame;

      if( this.will_take_over_graphics_state )
      { this.reset( graphics_state );
        this.will_take_over_graphics_state = false;
      }

      if( !this.mouse_enabled_canvases.has( context.canvas ) )
      { this.add_mouse_controls( context.canvas );
        this.mouse_enabled_canvases.add( context.canvas )
      }
                                     // Move in first-person.  Scale the normal camera aiming speed by dt for smoothness:
      this.first_person_flyaround( dt * r, dt * m );
                                     // Also apply third-person "arcball" camera mode if a mouse drag is occurring:
      if( this.mouse.anchor )
        this.third_person_arcball( dt * r );           
                                     // Log some values:
      this.pos    = this.inverse().times( Vec.of( 0,0,0,1 ) );
      this.z_axis = this.inverse().times( Vec.of( 0,0,1,0 ) );
    }
}



const Program_State_Viewer = defs.Program_State_Viewer =
class Program_State_Viewer extends Scene
{                                             // **Program_State_Viewer** just toggles, monitors, and reports some
                                              // global values via its control panel.
  make_control_panel()
    {                         // display() of this scene will replace the following object:
      this.program_state = {};
      this.key_triggered_button( "(Un)pause animation", ["Alt", "a"], () => this.program_state.animate ^= 1 );
      this.new_line();
      this.live_string( box => 
                { box.textContent = "Animation Time: " + ( this.program_state.animation_time/1000 ).toFixed(3) + "s" } );
      this.live_string( box => 
                { box.textContent = this.program_state.animate ? " " : " (paused)" } );
      this.new_line();
      
      const show_object = ( element, obj = this.program_state ) => 
      { 
       if( this.box ) this.box.textContent = "adsfadhf khfakdad fhadsf adf d hfa kdhfkdsa hfakds hfakd hf";
         else 
        this.box = element.appendChild(  document.createTextNode( "div did di fis dfids fids fids fisf dsf sdifds" ) );
       //   Object.assign( document.createTextNode( "div" ), { style: "overflow:auto; width: 200px" } ) );
        return;
                      // TODO: Diagnose why this.box disappears unless we re-create it every frame
                      // and stick all successive new ones onto element


        if( obj !== this.program_state )
          this.box.appendChild( Object.assign( 
               document.createElement( "div" ), { className:"link", innerText: "(back to program_state)",
                                                  onmousedown: () => this.current_object = this.program_state } ) )
        if( obj.to_string ) 
          return this.box.appendChild( Object.assign( document.createElement( "div" ), { innerText: obj.to_string() } ) );
        for( let [key,val] of Object.entries( obj ) )
        { if( typeof( val ) == "object" ) 
            this.box.appendChild( Object.assign( document.createElement( "a" ), { className:"link", innerText: key, 
                                                 onmousedown: () => this.current_object = val } ) )
          else
            this.box.appendChild( Object.assign( document.createElement( "span" ), 
                                                 { innerText: key + ": " + val.toString() } ) );
          this.box.appendChild( document.createElement( "br" ) );
        }
      }
      this.live_string( box => show_object( box, this.current_object ) );      
    }
  display( context, program_state )
    { this.program_state = program_state;
      
    }
}

class Noise_Function extends Scene
{
  constructor()
    {   super()
        this.noise_map_scale = 0.04;              // Scale of the noise map. Smaller values result in more spaced out hills
        this.noise_map_height = 2.5;               // Height of the noise map. Larger values result in taller hills.

        'use strict';

        var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        var F3 = 1.0 / 3.0;
        var G3 = 1.0 / 6.0;
        var F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
        var G4 = (5.0 - Math.sqrt(5.0)) / 20.0;

        function SimplexNoise(randomOrSeed)
        {   var random;
            if (typeof randomOrSeed == 'function') {
              random = randomOrSeed;
            }
            else if (randomOrSeed) {
              random = alea(randomOrSeed);
            } else {
              random = Math.random;
            }
            this.p = buildPermutationTable(random);
            this.perm = new Uint8Array(512);
            this.permMod12 = new Uint8Array(512);
            for (var i = 0; i < 512; i++) {
              this.perm[i] = this.p[i & 255];
              this.permMod12[i] = this.perm[i] % 12;
            }
        }

        /*
        The ALEA PRNG and masher code used by simplex-noise.js
        is based on code by Johannes Baagøe, modified by Jonas Wagner.
        See alea.md for the full license.
        */
        function alea()
           {
              var s0 = 0;
              var s1 = 0;
              var s2 = 0;
              var c = 1;

              var mash = masher();
              s0 = mash(' ');
              s1 = mash(' ');
              s2 = mash(' ');

              for (var i = 0; i < arguments.length; i++) {
                s0 -= mash(arguments[i]);
                if (s0 < 0) {
                  s0 += 1;
                }
                s1 -= mash(arguments[i]);
                if (s1 < 0) {
                  s1 += 1;
                }
                s2 -= mash(arguments[i]);
                if (s2 < 0) {
                  s2 += 1;
                }
              }
              mash = null;
              return function() {
                var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
                s0 = s1;
                s1 = s2;
                return s2 = t - (c = t | 0);
              };
           }

        function masher()
          {
              var n = 0xefc8249d;
              return function(data)
              {
                data = data.toString();
                for (var i = 0; i < data.length; i++) {
                    n += data.charCodeAt(i);
                    var h = 0.02519603282416938 * n;
                    n = h >>> 0;
                    h -= n;
                    h *= n;
                    n = h >>> 0;
                    h -= n;
                    n += h * 0x100000000; // 2^32
                }
                return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
              };
          }

        function buildPermutationTable(random)
          {   var i;
              var p = new Uint8Array(256);
              for (i = 0; i < 256; i++) {
                p[i] = i;
              }
              for (i = 0; i < 255; i++) {
                var r = i + ~~(random() * (256 - i));
                var aux = p[i];
                p[i] = p[r];
                p[r] = aux;
              }
              return p;
          }

        SimplexNoise._buildPermutationTable = buildPermutationTable;

        SimplexNoise.prototype = {
            grad3: new Float32Array([1, 1, 0,
              -1, 1, 0,
              1, -1, 0,

              -1, -1, 0,
              1, 0, 1,
              -1, 0, 1,

              1, 0, -1,
              -1, 0, -1,
              0, 1, 1,

              0, -1, 1,
              0, 1, -1,
              0, -1, -1]),
            grad4: new Float32Array([0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1,
              0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1,
              1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1, 0, -1, -1,
              -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1,
              1, 1, 0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1,
              -1, 1, 0, 1, -1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, -1,
              1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0,
              -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0]),
            noise2D: function(xin, yin) {
              var permMod12 = this.permMod12;
              var perm = this.perm;
              var grad3 = this.grad3;
              var n0 = 0; // Noise contributions from the three corners
              var n1 = 0;
              var n2 = 0;
              // Skew the input space to determine which simplex cell we're in
              var s = (xin + yin) * F2; // Hairy factor for 2D
              var i = Math.floor(xin + s);
              var j = Math.floor(yin + s);
              var t = (i + j) * G2;
              var X0 = i - t; // Unskew the cell origin back to (x,y) space
              var Y0 = j - t;
              var x0 = xin - X0; // The x,y distances from the cell origin
              var y0 = yin - Y0;
              // For the 2D case, the simplex shape is an equilateral triangle.
              // Determine which simplex we are in.
              var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
              if (x0 > y0) {
                i1 = 1;
                j1 = 0;
              } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
              else {
                i1 = 0;
                j1 = 1;
              } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
              // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
              // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
              // c = (3-sqrt(3))/6
              var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
              var y1 = y0 - j1 + G2;
              var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
              var y2 = y0 - 1.0 + 2.0 * G2;
              // Work out the hashed gradient indices of the three simplex corners
              var ii = i & 255;
              var jj = j & 255;
              // Calculate the contribution from the three corners
              var t0 = 0.5 - x0 * x0 - y0 * y0;
              if (t0 >= 0) {
                var gi0 = permMod12[ii + perm[jj]] * 3;
                t0 *= t0;
                n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
              }
              var t1 = 0.5 - x1 * x1 - y1 * y1;
              if (t1 >= 0) {
                var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
                t1 *= t1;
                n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
              }
              var t2 = 0.5 - x2 * x2 - y2 * y2;
              if (t2 >= 0) {
                var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
                t2 *= t2;
                n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
              }
              // Add contributions from each corner to get the final noise value.
              // The result is scaled to return values in the interval [-1,1].
              return (70.0 * (n0 + n1 + n2));
            }
          };
        
//          let now = new Date();
//          let seed = now.getMinutes() * now.getSeconds();
//          this.simplex = new SimplexNoise(seed);
          this.simplex = new SimplexNoise();
    }
  noise( x, y )
    {
        let map_scale = this.noise_map_scale;           // Scale of the map. Smaller values result in more spaced out hills
        let height = this.noise_map_height;             // Height of the map. Larger values result in taller hills.

        x = x*map_scale;
        y = y*map_scale;

        return this.simplex.noise2D(x, y)*height;
    }
 /*
  * A fast javascript implementation of simplex noise by Jonas Wagner
  Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
  Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
  With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
  Better rank ordering method by Stefan Gustavson in 2012.
  Copyright (c) 2018 Jonas Wagner
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  */       
}

const noise_function = defs.noise_function = new Noise_Function();

const Shape_From_File = defs.Shape_From_File =
class Shape_From_File extends Shape
{                                   // **Shape_From_File** is a versatile standalone Shape that imports
                                    // all its arrays' data from an .obj 3D model file.
  constructor( filename )
    { super( "position", "normal", "texture_coord" );
                                    // Begin downloading the mesh. Once that completes, return
                                    // control to our parse_into_mesh function.
      this.load_file( filename );
    }
  load_file( filename )
      {                             // Request the external file and wait for it to load.
                                    // Failure mode:  Loads an empty shape.
        return fetch( filename )
          .then( response =>
            { if ( response.ok )  return Promise.resolve( response.text() )
              else                return Promise.reject ( response.status )
            })
          .then( obj_file_contents => this.parse_into_mesh( obj_file_contents ) )
          .catch( error => { this.copy_onto_graphics_card( this.gl ); } )
      }
  parse_into_mesh( data )
    {                           // Adapted from the "webgl-obj-loader.js" library found online:
      var verts = [], vertNormals = [], textures = [], unpacked = {};   

      unpacked.verts = [];        unpacked.norms = [];    unpacked.textures = [];
      unpacked.hashindices = {};  unpacked.indices = [];  unpacked.index = 0;

      var lines = data.split('\n');

      var VERTEX_RE = /^v\s/;    var NORMAL_RE = /^vn\s/;    var TEXTURE_RE = /^vt\s/;
      var FACE_RE = /^f\s/;      var WHITESPACE_RE = /\s+/;

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        var elements = line.split(WHITESPACE_RE);
        elements.shift();

        if      (VERTEX_RE.test(line))   verts.push.apply(verts, elements);
        else if (NORMAL_RE.test(line))   vertNormals.push.apply(vertNormals, elements);
        else if (TEXTURE_RE.test(line))  textures.push.apply(textures, elements);
        else if (FACE_RE.test(line)) {
          var quad = false;
          for (var j = 0, eleLen = elements.length; j < eleLen; j++)
          {
              if(j === 3 && !quad) {  j = 2;  quad = true;  }
              if(elements[j] in unpacked.hashindices) 
                  unpacked.indices.push(unpacked.hashindices[elements[j]]);
              else
              {
                  var vertex = elements[ j ].split( '/' );

                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);   
                  unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);
                  
                  if (textures.length) 
                    {   unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 0]);
                        unpacked.textures.push(+textures[( (vertex[1] - 1)||vertex[0]) * 2 + 1]);  }
                  
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 0]);
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 1]);
                  unpacked.norms.push(+vertNormals[( (vertex[2] - 1)||vertex[0]) * 3 + 2]);
                  
                  unpacked.hashindices[elements[j]] = unpacked.index;
                  unpacked.indices.push(unpacked.index);
                  unpacked.index += 1;
              }
              if(j === 3 && quad)   unpacked.indices.push( unpacked.hashindices[elements[0]]);
          }
        }
      }
      {
      const { verts, norms, textures } = unpacked;
        for( var j = 0; j < verts.length/3; j++ )
        { 
          this.arrays.position     .push( Vec.of( verts[ 3*j ], verts[ 3*j + 1 ], verts[ 3*j + 2 ] ) );        
          this.arrays.normal       .push( Vec.of( norms[ 3*j ], norms[ 3*j + 1 ], norms[ 3*j + 2 ] ) );
          this.arrays.texture_coord.push( Vec.of( textures[ 2*j ], textures[ 2*j + 1 ]  ));
        }
        this.indices = unpacked.indices;
      }
      this.normalize_positions( false );
      this.ready = true;
    }
  draw( context, program_state, model_transform, material )
    {               // draw(): Same as always for shapes, but cancel all 
                    // attempts to draw the shape before it loads:
      if( this.ready )
        super.draw( context, program_state, model_transform, material );
    }
}