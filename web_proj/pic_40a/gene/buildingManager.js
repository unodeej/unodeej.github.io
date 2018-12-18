let buildings = [];				// Array of Building objects currently on the field.

/**
	Constructor function for Building class.
	id {String}
	value {Number}
	name {String}
	playLocation {String}
*/
function Building(id, name, sprite, cost, expense) {
	this.id = id;						// "building__" , where the ID number of the Building is in the blank.
	this.name = name;
	this.sprite = sprite;				// Path of the sprite image
	this.cost = cost;					// How much it costs to maintain
	this.expense = expense;				// How much it costs to main
}

/**
	This function temporarily sets up a bunch of random buildings. For testing purposes.
*/
function tempInitBuildings() {
	// Populate buildings array.
	let spriteName, name;
	for (let i=0; i<52; i++)
	{
		if (i===0)
		{
			name="bplate";
			spriteName = "img/bplate.jpg";	
		}
		else if (i===13)
		{
			name="sproul";
			spriteName="img/sproul.jpg";
		}
		else if (i===26)
		{
			name="powell";
			spriteName="img/powell.jpg";
		}
		else if (i===39)
		{
			name="busStop";
			spriteName="img/busStop.png";
		}
		//Constructor looks like: Building(id, name, sprite, cost, expense);
		SpawnBuilding(Number(i), name, spriteName, new Coord(Math.random()*1000, Math.random()*1000));
	}
}


/**
	This function spawns a new Building, both in the array and by adding the HTML.
	idNumber {Number}
	sprite {String}
	coord {Object} - Coordinate object to spawn at
	@returns {Object} - the newly spawned Building
*/
function SpawnBuilding(idNumber, name, sprite, coord) {
	let cost, expense;
	switch (name)
	{
		case "bplate":
			cost=5000;
			expense=1000;
			happiness += 40;
			prestige += 10;
			break;
		case "busStop":
			cost=300;
			expense=0;
			happiness += 10;
			break;
		case "powell":
			cost=10000;
			expense=300;
			prestige += 100;
			break;
		case "sproul":
			cost=3000;
			expense=700;
			students += 20;
			break;
		default:
			console.log("ERROR in SpawnBuilding(); name " + name + " not found");
			cost=0;
			expense=0;
	}
	// Call the constructor for Building.
	let b = new Building("building" + idNumber, name, sprite, cost, expense);
	
	// Push to the array.
	buildings.push(b);
	
	// Add the building to the HTML.
	let appendString = "<img src='" + b.sprite + "'";
	appendString += "class='building'";
	appendString += "width='100px'";
	appendString +=	"id='" + b.id + "'";
	appendString += "style='"
		appendString += "left:" + coord.x + "px;";
		appendString += "top:" + coord.y + "px;";
		appendString += "position: fixed;"
	appendString += "'>";
	
	$("#buildings").append(appendString);
	
	return b;
}

/**
	This function destroys a building, removing it from the array and the HTML.
	b {Object} - the building to destroy
*/
function DestroyBuilding(b) {
	// Iterate through the buildings array.
	for (let i=0; i < buildings.length; i++)
	{
		// If the unique ID's match,
		if (buildings[i].id === b.id)
		{
			// Remove from array.
			buildings.splice(i, 1);
			break;
		}
	}
	// Remove Building from the HTML
	$('#' + b.id).remove();
}