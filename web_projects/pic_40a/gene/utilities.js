/// Utility Functions ///

/**
 * Constructor function for Coord object.
 * x {Number}
 * y {Number}
*/
function Coord(x, y)
{
	this.x = x;
	this.y = y;
}

/**
 * Detects if two elements are colliding
 *
 * Credit goes to BC on Stack Overflow
 *
 * @link http://stackoverflow.com/questions/5419134/how-to-detect-if-two-divs-touch-with-jquery
 * @param $div1
 * @param $div2
 * @returns {boolean}
 */
let is_colliding = function( $div1, $div2 ) {
	// Div 1 data
	let d1_offset             = $div1.offset();
	let d1_height             = $div1.outerHeight( true );
	let d1_width              = $div1.outerWidth( true );
	let d1_distance_from_top  = d1_offset.top + d1_height;
	let d1_distance_from_left = d1_offset.left + d1_width;

	// Div 2 data
	let d2_offset             = $div2.offset();
	let d2_height             = $div2.outerHeight( true );
	let d2_width              = $div2.outerWidth( true );
	let d2_distance_from_top  = d2_offset.top + d2_height;
	let d2_distance_from_left = d2_offset.left + d2_width;

	let not_colliding = ( d1_distance_from_top < d2_offset.top || d1_offset.top > d2_distance_from_top || d1_distance_from_left < d2_offset.left || d1_offset.left > d2_distance_from_left );

	// Return whether it IS colliding
	return ! not_colliding;
};

/**
 * Causes an image to fade out.
 * imageID {string} 
*/
function fadeImage(imageID) {
	$("#" + imageID).fadeOut();
}

/**
 * Causes an image's border to fade from red (default) to transparent.
*/
function fadeBorder(imageID, r=255, g=0, b=0, alphaVal=1) {
	alphaVal -= 0.01;
	$("#" + imageID).css("border-color", "rgba(" + r + "," + g + "," + b + "," + alphaVal + ")");
	if (alphaVal > 0)
	{
		// Recursive call.
		setTimeout(fadeBorder, 10, imageID, r, g, b, alphaVal);
	}
}