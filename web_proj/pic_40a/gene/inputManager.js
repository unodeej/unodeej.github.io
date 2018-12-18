let selectedBuilding = null;	// The Building currently held by the mouse pointer.
let selectedMenuItem = null;	// The menu item on the purchase screen currently selected.
let selectMode = "none";		// The current mode of object selection. ("none", "move")

let mouseOverTarget = null;		// The current target under the mouse pointer.


// Event listener for when the mouse goes over an element
document.addEventListener("mouseover",
	function(event) {
		if (event.target.id !=="")
		{
			mouseOverTarget = event.target;
			
			//console.log(mouseOverTarget);
		}
	}
);

// Event listener for when mouse leaves an element.
document.addEventListener("mouseout",
	function(event) {
		mouseOverTarget = null;
	}
);

// This function runs any time any element is clicked.
$("*").click(function() {
	// If the game has ended, don't register mouse clicks anymore.
	if (isGameOver)
	{
		return;
	}
	
	if (mouseOverTarget !== null)
	{
		// Building click
		if (mouseOverTarget.classList.contains("building"))
		{
			// Grab from the array as the currently selected Building.
			for (c of buildings)
			{
				if (c.id === mouseOverTarget.id)
				{
					// Mark as the currently selected building
					selectedBuilding = c;
					break;
				}
			}
			
			// Add context menu elements
			GUI_OpenBuildingContext();
			
			// Move building to the top of any other Buildings.
			$("#" + selectedBuilding.id).css("zIndex", 0);
			$(".context").css("zIndex", 100);
			
			// Set the offset values to the mouse position.
			OffsetX = event.clientX - Number($("#" + selectedBuilding.id).css("left").slice(0,-2));
			OffsetY = event.clientY - Number($("#" + selectedBuilding.id).css("top").slice(0,-2));
			
			// This makes sure that the mouse click doesn't register for any elements underneath this building.
			event.stopPropagation();
		}
		
		// Menu click
		else if (mouseOverTarget.classList.contains("purchase"))
		{
			// Mark this menu item as the currently selected one.
			selectedMenuItem = mouseOverTarget;
			
			// Open context menu elements
			GUI_OpenPurchaseContext();
			
			// This makes sure that the mouse click doesn't register for any elements underneath this menu item
			event.stopPropagation();
		}
	}
});

// event listener for when the mouse moves.
$(this).mousemove(function (event) {
	// If we're currently in the "move" selectMode,
	if (selectedBuilding !== null && selectMode === "move")
	{
		// Update position of the selected building to follow the mouse.
		$("#" + selectedBuilding.id).css("position", "fixed");
		$("#" + selectedBuilding.id).css("left", event.clientX - OffsetX + "px");
		$("#" + selectedBuilding.id).css("top", event.clientY - OffsetY + "px");
	}
});

// Event listener for keypress.
document.addEventListener("keypress", 
	function(event) {
		// F key: place buildings
		if (event.key === "f" || event.key === "F")
		{
			let canPlaceHere = true;
			// Detect whether there is a collision where we want to place this building
			for (let i=0; i < buildings.length; i++)
			{
				// Don't collide with self
				if (buildings[i].id === selectedBuilding.id)
				{
					continue;
				}
				// Check for a collision
				else
				{
					if (is_colliding($("#" + buildings[i].id), $("#" + selectedBuilding.id)))
					{
						//console.log("No place! " + buildings[i].id);
						// Update the CSS for any buildings that collide.
						$("#" + buildings[i].id).css("border-style", "solid");
						$("#" + buildings[i].id).css("border-width", "5px");
						$("#" + buildings[i].id).css("border-color", "red");
						fadeBorder(buildings[i].id);
						canPlaceHere = false;
					}
				}
			}
			// If there's no collisions,
			if (canPlaceHere)
			{
				// De-select the building, and stop moving it.
				selectMode = "none";
				selectedBuilding = null;
			}		
		}
		
		// For debugging purposes.
		if (event.key === 'd' || event.key === 'D')
		{
			console.log(selectedBuilding);
		}
		
		// G key: opens Gene tips
		if (event.key === "g" || event.key === "G")
		{
			displayGene();
		}
		
		// H key: hides Gene tips.
		if (event.key === "h" || event.key === "H")
		{
			hideGene();
		}
	}
);