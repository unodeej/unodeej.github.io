let isGeneVisible = false;		// Boolean whether Gene's hints are visible.

let OffsetX;					// X mouse pos offset when selecting a Building.
let OffsetY;					// Y mouse pos offset when selecting a Building.

let isGameOver = false;			// Boolean to mark when the game is over.

// Starting values.
let money = 100000;				// Funds to be used for purchasing/maintaining buildings.
let students = 0;				// Number of students, which generate income.
let happiness = 0;				// Happiness level, which must be > 0 to generate income.
let prestige = 0;				// Your "score", increased over time and with some buildings.

let IDCounter = 0;				// Keeps track of the unique ID's for buildings.

// Main Game Loop: //
//tempInitBuildings();
Update();
let gameLoop = setInterval("Update()", 1000);	// Run Update every 1000 seconds
$("body").css("background", "url(http://vectorpatterns.co.uk/wp-content/uploads/2011/09/gridpaperlightbluepattern.png)");
displayGene();
//

/**
	This function runs once per second, and updates the player's stats (money, happiness, etc.).
*/
function Update() {
	let deltaMoney = 0;
	// Decrease money by summing expenses from each building.
	for (let i=0; i<buildings.length; i++)
	{
		deltaMoney -= buildings[i].expense;
	}
	
	// Only if happiness is positive,
	if (happiness > 0)
	{	
		// Increase money by 100 per student.
		deltaMoney += students * 100;
	}
	// Update money value.
	money += deltaMoney;
	
	// Increase prestige by one each update.
	prestige += 1;
	
	// Decrease happiness slightly each update.
	happiness -= 0.02 * students;
	
	// To have a + or - sign for the income stat.
	let plusSign = "";
	if (deltaMoney > 0)
	{
		plusSign = "+";
	}
		
	// Update HTML.
	let headerStr = "Funds: $" + money + "  (" + plusSign + deltaMoney + ")<br>";
	headerStr += "Students: " + students + "<br>";
	headerStr += "Happiness: " + Math.round(happiness) + "<br><br>";
	$("#header-bar").html(headerStr);
	
	// If you've run out of money, game over!
	if (money < 0)
	{
		GameOver();
	}
}


/**
	This function ends the game, clearing the screen, and showing the game over screen.
*/
function GameOver() {
	isGameOver = true;
	
	// End the game loop.
	clearInterval(gameLoop);
	
	// Clear the HTML.
	$("body").empty();
	
	// Add the Game Over screen text.
	let appendStr = "GAME OVER<br>Your school had a prestige score of: " + prestige;
	appendStr += "<br><form method='post' action='highScores.html'>"
	appendStr += "<input type='hidden' name='score' id='scoreForm' value='3'>";
	appendStr += "<label for='playerName'>Enter your name:</label><input type='text' name='playerName' id='playerName'>";
	appendStr += "</form>";
	appendStr += "<br><a href='#' onclick='setHighscoreValue();'>View Leaderboard</a>";
	appendStr += "<br><br><a href='play.html'>Play again!</a><br>";
	$("body").append(appendStr);

}

// Prevents submission of the Game Over form with the enter button.
$(document).ready(function() {
  $(window).keydown(function(event){
    if(event.keyCode == 13) {
		event.preventDefault();
		return false;
    }
  });
});

/**
	This function sets the player's score, and submits the form, to bring up the highScores.php page.
*/
function setHighscoreValue(){
	// Get the hidden form element.
	let scoreForm = document.getElementById("scoreForm");
	
	// Set its value to the player's score.
	scoreForm.value = prestige;
	
	// Submit the form, redirecting to the highScores.php screen. The variable persists in the $_POST superglobal.
    scoreForm.form.submit();
}


/**
 * Called by the "Move" context button. Starts moving the selected building.
*/
function ContextMove() {
	moveMode();
	GUI_CloseContextMenu();
}

/**
 * Called by the "Destroy" context button. Destroys the selected building.
*/
function ContextDestroy() {
	// Ask buildingManager to remove the Building.
	DestroyBuilding(selectedBuilding);

	// De-select the currently selected building/menu item.
	selectedBuilding = null;
	selectedMenuItem = null;
	
	// Close the context menu.
	GUI_CloseContextMenu();
}

/**
 * Called by the "Cancel" context button. De-selects the current building/menu item.
*/
function ContextCancel() {
	// Deselect everything, close context menu.
	selectedBuilding = null;
	selectedMenuItem = null;
	GUI_CloseContextMenu();
}

/**
 * This function purchases a new building, based on the currently selected menu item.
*/
function purchaseBuilding() {
	GUI_CloseContextMenu();
	GUI_ClosePopup();
	
	// Default sprite image.
	let sprite = "img/not-found.jpg";
	let name = "";

	// Get the array of attributes for the selected menu item.
	let attr = selectedMenuItem.attributes;
	for (let i=0; i < attr.length; i++)
	{
		// Grab the sprite name from the 'src' attribute
		if (attr[i].name === "src")
		{
			sprite = attr[i].value;
		}
		// Grab the name from the id substring
		else if (attr[i].name === "id")
		{
			name = attr[i].value.substring(5);	// cuts out the first five characters; e.g., "menu_bplate" becomes "bplate"
		}
	}
	
	let newID = IDCounter++;							// Give it a unique ID, and increment the counter
	let c = new Coord(event.clientX, event.clientY);	// Create a new Coordinate, from the mouse position
	
	selectedBuilding = SpawnBuilding(newID, name, sprite, c);	// Spawn a new building
	
	moveMode();		// Move the building with the mouse.
}

/**
	This function allows the player to move the selected building with the mouse.
*/
function moveMode()
{
	selectMode = "move";
	
	// The Offset value is the distance from the image origin to the mouse pointer. This lets you move images without them jumping when you click them.
	OffsetX = event.clientX - Number($("#" + selectedBuilding.id).css("left").slice(0,-2));
	OffsetY = event.clientY - Number($("#" + selectedBuilding.id).css("top").slice(0,-2));
}

/**
	This function displays text from Gene, picked randomly from this list.
*/
function displayGene()
{
	let geneTips = [
		"Press F to place buildings!",
		"Click 'New Construction Site' to purchase <br> a new building!",
		"Click on a building to move or destroy it!",
		"You can make more money by attracting more <br> tuition-paying students!",
		"Dining Halls are expensive, but they raise <br> student happiness significantly!",
		"If happiness levels drop below zero, students <br> won't pay tuition!",
		"Bus Stops are a cheap way to raise happiness <br> levels!",
		"Dorm buildings increase your student capacity!",
		"Most buildings cost money, both to purchase and <br> maintain!",
		"Your school's prestige increases gradually over <br> time!",
		"You can boost your school's prestige by building <br> libraries!"
	];
	// Pick a random message.
	let message = geneTips[Math.floor(Math.random() * (geneTips.length))];
			
	// Clear the message area
	$("#gene").empty();
	
	// Append the elements to HTML.
	if (message !== "")
	{
		$("#gene").append("<div id='speechBubble'></div>");
		$("#speechBubble").append("<img src='img/speechbubble.png' height='280px' width='"+ (window.innerWidth - 300) +"px'>");
		$("#speechBubble").css("position", "fixed");
		$("#speechBubble").css("top", window.innerHeight - 280);
		$("#speechBubble").css("left", 10);

		$("#speechBubble").append("<div id='bubbleMsg'></div>");
		$("#bubbleMsg").css("zIndex", ++topZIndex);
		$("#bubbleMsg").append(message);
		$("#bubbleMsg").css("fontSize", "2.4em");
		$("#bubbleMsg").css("position", "fixed");
		$("#bubbleMsg").css("top", window.innerHeight - 230);
		$("#bubbleMsg").css("left", 200);

		$("#speechBubble").append("<div id='smallMsg'></div>");
		$("#smallMsg").css("zIndex", ++topZIndex);
		$("#smallMsg").append("(press H to hide)");
		$("#smallMsg").css("position", "fixed");
		$("#smallMsg").css("top", window.innerHeight - 100);
		$("#smallMsg").css("left", 200);

	}

	// Append Gene's picture.
	$("#gene").append("<img src='img/gene.png' height='300px'>");
	$("#gene").css("position", "fixed");
	$("#gene").css("top", window.innerHeight - 200);
	$("#gene").css("left", window.innerWidth - 300);
	isGeneVisible = true;

}

/**
 * This function hides the hint messages.
*/
function hideGene() {
	if (isGeneVisible)
	{
		$("#gene").empty();
		$("#gene").append("<img src='img/gene_serious.png' height='200px'>");
		$("#gene").css("position", "fixed");
		$("#gene").css("top", window.innerHeight - 200);
		$("#gene").css("left", window.innerWidth - 300 + 40);
		isGeneVisible = false;
	}
}

