let topZIndex = 0;				// Z-index of topmost building.


/**
 * This function opens the purchase menu.
 */
function GUI_OpenPurchasePopup() {
	// Display the purchase menu background image.
	$("#popup").css("zIndex", ++topZIndex);
	$("#popup").css("position", "fixed");
	$("#popup").append("<img src='https://www.publicdomainpictures.net/pictures/200000/nahled/plain-blue-background.jpg' width='" + (window.innerWidth - 300) + "' height ='" + (window.innerHeight - 100) + "px'>");
	
	// Display the purchase item images.
	$("#purchase-items").css("zIndex", ++topZIndex);
	$("#purchase-items").css("position", "fixed");
	$("#purchase-items").append("<h2>Construct Building</h2><br>");
	$("#purchase-items").append("Dining Hall<br>Cost: $5000&nbsp;&nbsp;&nbsp;&nbsp;Expense: $1000/sec&nbsp;&nbsp;&nbsp;&nbsp;Adds +40 happiness, +10 prestige<br>");
	$("#purchase-items").append("<img src='img/bplate.jpg' width= '150px' id='menu_bplate' class='purchase'> <br>");
	$("#purchase-items").append("Dorm<br>Cost: $300&nbsp;&nbsp;&nbsp;&nbsp;Expense: $700/sec&nbsp;&nbsp;&nbsp;&nbsp;Adds +20 students<br>");
	$("#purchase-items").append("<img src='img/sproul.jpg' width= '150px' id='menu_sproul' class='purchase'> <br>");
	$("#purchase-items").append("Library<br>Cost: $10000&nbsp;&nbsp;&nbsp;&nbsp;Expense: $100/sec&nbsp;&nbsp;&nbsp;&nbsp;Adds +100 prestige<br>");
	$("#purchase-items").append("<img src='img/powell.jpg' width= '150px' id='menu_powell' class='purchase'> <br>");
	$("#purchase-items").append("Bus Stop<br>Cost: $300&nbsp;&nbsp;&nbsp;&nbsp;Expense: $0/sec&nbsp;&nbsp;&nbsp;&nbsp;Adds +5 happiness<br>");
	$("#purchase-items").append("<img src='img/busStop.png' width= '150px' id='menu_busStop' class='purchase'> <br>");
	
	// Display the Close Window menu button.
	$("#menu-buttons").empty();
	$("#menu-buttons").append("<input type=\"button\" value=\"Close Window\" onclick=\"GUI_ClosePopup()\"><br>");
	$("#menu-buttons").css("position", "fixed");
	$("#menu-buttons").css("zIndex", ++topZIndex);
}

/**
 * This function closes the purchase menu.
 */
function GUI_ClosePopup() {
	$("#popup").empty();
	$("#purchase-items").empty();
	$("#menu-buttons").empty();
	
	// Replace the "New Construction Site" button.
	$("#menu-buttons").append("<input type=\"button\" value=\"New Construction Site\" onclick=\"GUI_OpenPurchasePopup()\">");
}

/**
 * This function opens the context menu for a building in the field.
 */
function GUI_OpenBuildingContext() {
	// Don't open a context menu if we're currently moving a building.
	if (selectMode === "move")
	{
		return;
	}
	$("#context-menu").css("position", "fixed");
	$("#context-menu").css("zIndex", ++topZIndex);
	$("#context-menu").append("<input type='button' value='move' onclick='ContextMove()' id='move_button' class='context'>");
	$("#context-menu").append("<input type='button' value='destroy' onclick='ContextDestroy()' id='destroy_button' class='context'>");
	$("#context-menu").append("<input type='button' value='cancel' onclick='ContextCancel()' id='cancel_button' class='context'>");
	
	// Adjust location of the buttons based on mouse position.
	$(".context").css("position", "fixed");
	$(".context").css("left", event.clientX - 20);
	$("#move_button").css("top", event.clientY - 12);
	$("#destroy_button").css("top", event.clientY + 12);
	$("#cancel_button").css("top", event.clientY + 36);
}

/**
 * This function opens the context menu on the purchase screen.
 */
function GUI_OpenPurchaseContext() {
	$("#context-menu").append("<input type='button' value='purchase' onclick='purchaseBuilding()' id='purchase_button' class='context'>");
	$("#context-menu").append("<input type='button' value='cancel' onclick='GUI_CloseContextMenu()' id='cancel_button' class='context'>");

	$("#context-menu").css("position", "fixed");
	$("#context-menu").css("zIndex", ++topZIndex);
	
	// Adjust the location of the buttons based on mouse position.
	$(".context").css("position", "fixed");
	$(".context").css("left", event.clientX);
	$("#purchase_button").css("top", event.clientY);
	$("#cancel_button").css("top", event.clientY + 24);
}

/**
 * This function removes any open context menu elements.
 */
function GUI_CloseContextMenu() {
	$("#context-menu > .context").remove();
}