// Variables
let promptForName = true;				// Whether the page will ask for a name.
let name;								// Inputted name.
let speed = 0;							// Selected box speed.
let color = "red";						// Selected box color.

let defaultCheckedSpeed = 0;			// Default speed chosen when page loads.
let defaultCheckedColor = "red";		// Default color chosen when page loads.
let direction = "right";				// Beginning direction for box to move.



/// READ COOKIE ///
//console.log("COOKIE " + document.cookie);

let cookieValues = document.cookie.split(";");
let cookieExists = cookieValues.length >= 3;		// Sometimes there are other cookies being saved, for some reason? Possibly due to one of the user's browser extensions. Anyway, if our cookies are being properly saved, there will be at least three cookies.

if (cookieExists) {
	// Iterate through cookies
	for (let c of cookieValues)
	{
		let name_value = c.split("=");			// Split this cookie into its name and value components

		// Trim to remove whitespace
		if (name_value[0].trim() === "name")
		{
			name = name_value[1];
			promptForName = false;				// If name exists, don't ask for one.
		}
		else if (name_value[0].trim() === "speed")
		{
			speed = Number(name_value[1].trim());
			defaultCheckedSpeed = Number(speed);
		}
		else if (name_value[0].trim() === "color")
		{
			color = name_value[1].trim();
			document.getElementById("Box").style.backgroundColor = color;	// Change the color of the box to match the cookie.
			defaultCheckedColor = color;
		}
	}
}
///



/// Set up radio buttons ///

/// SPEED BUTTONS
let speedResult = "";
// Loop 50 times, one for each button
for (let num=0; num<51; num++)
{
	let speedString = "<label for=\"button"+num+"\">"+"Speed "+num+"</label>\n<input type=\"radio\" id=\"button"+num+"\" value=\""+num+"\" name=\"speed\" "
	// If this is either the regular default speed (0), or the saved one from the cookie, mark it as "checked"
	if (defaultCheckedSpeed === num)
	{
		speedString += "checked";
	}
	speedString += "/>"
	// Every 10 buttons should start on a new line, to keep things organized.
	if (num % 10 === 0)
	{
		speedString += "<br>";
	}
	// New line so the HTML code looks nice.
	speedString += "\n";
	speedResult += speedString;
}
document.getElementById("SpeedResult").innerHTML = speedResult;


/// COLOR BUTTONS

let colorResult = "";

// Red radio button
colorResult = "<label for=\"redButton\">red</label>\n<input type=\"radio\" id=\"redButton\" value=\"red\" name=\"colors\" ";
// If the default color is red, or it has been saved from the cookie, mark it as "checked"
if (defaultCheckedColor === "red")
{
	colorResult += "checked";
}

// Yellow radio button
colorResult += "/>\n<label for=\"yellowButton\">yellow</label>\n<input type=\"radio\" id=\"yellowButton\" value=\"yellow\" name=\"colors\" ";
// If the default color is yellow, or it has been saved from the cookie, mark it as "checked"
if (defaultCheckedColor === "yellow")
{
	colorResult += "checked";
}

// Blue radio button
colorResult += "/>\n<label for=\"blueButton\">blue</label>\n<input type=\"radio\" id=\"blueButton\" value=\"blue\" name=\"colors\" ";
// If the default color is blue, or it has been saved from the cookie, mark it as "checked"
if (defaultCheckedColor === "blue")
{
	colorResult += "checked";
}
colorResult += "/>";

document.getElementById("ColorResult").innerHTML = colorResult;

///





if (promptForName)
{
	// Ask the user for name
	name = prompt("What is your name?");
}

// Start looking at the radio buttons every 1 sec (= 1000 ms) to detect any changes
setInterval(LookAtButtons, 1000);

/**
This function finds which radio button for speed is checked, and updates the speed value. The function then does the same for the color buttons.

It is called every 1 sec (1000 ms).
*/
function LookAtButtons() {
	// Get an array of the speed buttons
	let speedButtons = document.getElementsByName("speed");
	
	for (let i = 0; i < speedButtons.length; i++) {
		if (speedButtons[i].checked)
		{
			// Check if the checked value is different from the current value
			if (speedButtons[i].value !== speed)
			{
				speed = Number(speedButtons[i].value);
			}
			break;	// If we've found a checked button, break from the loop.
		}
	}
	// Get an array of the color buttons
	let colorButtons = document.getElementsByName("colors");
	
	for (let i = 0; i < colorButtons.length; i++) {
		if (colorButtons[i].checked)
		{
			// Check if the checked value is different from the current value
			if (colorButtons[i].value !== color)
			{
				color = colorButtons[i].value;
				document.getElementById("Box").style.backgroundColor = color;
			}
			break; // If we've found a checked button, break from the loop.
		}
	}
}

/**
This function increments the box position to the right or left, as appropriate, a distance proportional to the current checked speed value. It also updates the cookie with a fresh expire time.

It is called every 50 ms.
*/
function UpdateBox() {
	let currentPos = Number(document.getElementById("Box").style.left.slice(0,-2));	// Shave off the "px" from the string, to get the current x coordinate.
	let newPos;
	// If we're currently moving right
	if (direction === "right")
	{
		// Calculate the hypothetical new position
		newPos = currentPos + (speed / 2);
		// If this new position would move the box outside the window
		if (newPos + Number(document.getElementById("Box").offsetWidth) > window.innerWidth)
		{
			// Change direction to left...
			direction = "left";
			// ... and call this function again.
			UpdateBox();
			return;
		}
	}
	// If we're currently moving left
	else if (direction === "left")
	{
		// Calculate the hypothetical new position
		newPos = currentPos - (speed / 2);
		// If this new position would move the box outside the window
		if (newPos < 0)
		{
			// Change direction to right...
			direction = "right";
			/// ... and call this function again.
			UpdateBox();
			return;
		}
	}
	// Update the box position.
	document.getElementById("Box").style.left = newPos + "px";

	// Update a new cookie with a refreshed expiry time. This is here simply because this function reliably runs very frequently!
	MakeCookie();
}


/// AJAX CALL Read from data file ///
// A struct object to hold info from the AJAX call
let importantPeople = {
	event_id: null,
	file: "important_people.txt",	// This file should be in the same directory
	element_id: "ppl",
	people: []						// This array will store the names from the file
}

/**
This function performs an AJAX call, reading from the input file and updating the page display for an important person.


@param {Object} the "importantPeople" object, holding the input file and the array
*/
function read_text(data) {
	let xhttp = new XMLHttpRequest();
	
	xhttp.onreadystatechange = function() {		
		if (this.readyState === 4 && this.status === 200) {
			// Fill the array with text from the AJAX input
			data.people = this.responseText.split('\n');
			
			// If this is not an important person
			if (!importantPeople.people.includes(name))
			{
				// Display the "noGreeting" page only.
				document.getElementById("noGreeting").style.display = "block";
				document.getElementById("importantPeopleOnly").style.display = "none";
			}
			// If this is an important person
			else
			{
				// Display the important person page
				document.getElementById("noGreeting").style.display = "none";
				document.getElementById("importantPeopleOnly").style.display = "block";
				// Fill the box with the person's name, and start moving the box.
				document.getElementById("Box").innerHTML += name;
				setInterval(UpdateBox, 50);
			}
			
			// console.log(importantPeople.people[0]);
			// console.log(importantPeople.people[1]);
			// console.log(importantPeople.people[2]);
		}
	};
	
	xhttp.open("GET", data.file, true);
	xhttp.send();
}

// When the window loads, perform the AJAX call.
window.onload = function() {
	read_text(importantPeople);	
};
///




/// MAKE COOKIE ///
/**
This function makes a new cookie, storing the person's name, and chosen speed and color.
*/
function MakeCookie() {
	// Gather the values to be saved into the cookie.
	let cookie_name = "name=" + name + ";";
	let cookie_speed = "speed=" + speed + ";";
	let cookie_color = "color=" + color + ";";

	// Set the expiry time to be the current time, plus 10 seconds
	let expireTime = new Date();
	expireTime.setSeconds(expireTime.getSeconds() + 10);
	let cookie_expires = "expires=" + expireTime.toUTCString() + ";";

	// Set the cookie path to the current directory
	let cookie_path = "path=/;";

	// Add the three cookies.
	document.cookie = cookie_name + cookie_expires + cookie_path;
	document.cookie = cookie_speed + cookie_expires + cookie_path;
	document.cookie = cookie_color + cookie_expires + cookie_path;
}
/// END COOKIE ///