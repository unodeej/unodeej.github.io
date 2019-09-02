let maxBullets = 10;			// Max number of bullets allowed on screen.
let bulletSpeed = 3;			// Pixels to move each update.
let bulletUpdateRate = 5;				// Bullet updates once per (bulletUpdateRate) milliseconds.
let maxAliens = 10;			// Max number of bullets allowed on screen.
let alienSpeed = 1;
let alienUpdateRate = 10;

let bulletArray = [];
let bulletID = -1;
let bullet_event_id;

let alienArray = [];
let alienID = 0;
let alien_event_id;

// Start
setInterval(InstantiateAlien, 2000, 20)

///

// Can this be a template or prototype or whatever?
// let boundingBox = {
	// "x",
	// "y",
	// "width",
	// "height",
	// "self" = this,
	// "intersects": function(other) {
		// let xMin = self.x;
		// let xMax = self.x + self.width;
	// }
// };


function bulletStartMove(idNum, xPos, yPos) {
	let bulletMove_function = function()
	{
		document.getElementById("bullet" + idNum).style.top = yPos + "px";
		yPos -= bulletSpeed;
		bullet_event_id = setTimeout(bulletMove_function, bulletUpdateRate, idNum, yPos);
		
		// Check collisions
		for (let a of alienArray) {
			let alienX = Number(document.getElementById(a).style.left.slice(0, -2));
			let alienY = Number(document.getElementById(a).style.top.slice (0, -2));
			let lowerXBound = alienX - 10;
			let upperXBound = alienX + 10;
			let lowerYBound = alienY - 10;
			let upperYBound = alienY + 10;
			if ( ((xPos > lowerXBound) && (xPos < upperXBound)) && ((yPos > lowerYBound) && (yPos < upperYBound)) 
				&& (document.getElementById(a).style.visibility !== "hidden") ) {
				document.getElementById(a).style.visibility = "hidden";
				clearInterval(bullet_event_id);			// Clear the update for this bullet
				destroyBullet(idNum);
				break;
			}
		}
		
		if (yPos < 50)
		{
			clearInterval(bullet_event_id);			// Clear the update for this bullet
			destroyBullet(idNum);
		}
	}
	bullet_event_id = setTimeout(bulletMove_function, bulletUpdateRate, idNum, yPos);
}

function alienStartMove(idNum, yPos) {
	console.log(idNum);
	let alienMove_function = function()
	{
		document.getElementById("alien" + idNum).style.top = yPos + "px";
		yPos += alienSpeed;
		alien_event_id = setTimeout(alienMove_function, alienUpdateRate, idNum, yPos);
		if (yPos > 615)
		{
			clearInterval(alien_event_id);			// Clear the update for this alien
			destroyAlien(idNum);
		}
	}
	alien_event_id = setTimeout(alienMove_function, alienUpdateRate, idNum, yPos);
}

function destroyAlien(idNum) {
	let parent = document.getElementById("alienList");
	let child = document.getElementById("alien" + idNum);
	parent.removeChild(child);
	for (let i = 0; i < alienArray.length; i++) {	//Update the array.
		if (alienArray[i] === "alien" + idNum) {
			alienArray.splice(i, 1);	
		}
	}
}

function destroyBullet(idNum) {
	let parent = document.getElementById("bulletList");
	let child = document.getElementById("bullet" + idNum);
	parent.removeChild(child);
	for (let i = 0; i < bulletArray.length; i++) {	//Update the array.
		if (bulletArray[i] === "bullet" + idNum) {
			bulletArray.splice(i, 1);	
		}
	}
}

let shipX = 10;

let player = {
	hp: 3,
	xPos: 50,
	yPos: 5,
	shoot: InstantiateBullet()
};

function InstantiateBullet(x,y) {
	if (bulletID === -1)
	{
		bulletID++;
		return;
	}
	if (bulletArray.length >= maxBullets)
	{
		return;
	}
	document.getElementById("bulletList").innerHTML += "<img id=\"bullet" + bulletID + "\" src=\"https://vignette.wikia.nocookie.net/animal-jam-clans-1/images/c/c2/Transparent-fire-gif-15.gif/revision/latest?cb=20171105211552\" width=50>";
	document.getElementById("bullet" + bulletID).style.position = "absolute";
	document.getElementById("bullet" + bulletID).style.top = y + "px";
	document.getElementById("bullet" + bulletID).style.left = x + "px";
	bulletStartMove(bulletID, x, y);
	bulletArray.push("bullet" + bulletID);
	bulletID++;
}


function InstantiateAlien(y) {
	let x = Math.random()*1000;
	if (alienArray.length >= maxAliens)
	{
		return;
	}
	document.getElementById("alienList").innerHTML += "<img id=\"alien" + alienID + "\" src=\"https://i.giphy.com/media/l378n0vg0LNXvSLHW/source.gif\" width=100>";
	document.getElementById("alien" + alienID).style.position = "absolute";
	document.getElementById("alien" + alienID).style.top = y + "px";
	document.getElementById("alien" + alienID).style.left = x + "px";
	alienStartMove(alienID, y);
	alienArray.push("alien" + alienID);
	alienID++;
}

document.addEventListener("keypress", 
	function(event) {
		if (event.key === "d" || event.key === "D")
		{
			shipX += 10;
			if (shipX >= 1000)
			{
				shipX = 1000;
			}
			document.getElementById("spaceship").style.left = shipX + "px";
		}
		else if (event.key === "a" || event.key === "A")
		{
			shipX -= 10;
			if (shipX <= 0)
			{
				shipX = 0;
			}
			document.getElementById("spaceship").style.left = shipX + "px";
		}
		if (event.keyCode === 32)
		{
			InstantiateBullet(shipX + 20, 600);
		}
	}
);