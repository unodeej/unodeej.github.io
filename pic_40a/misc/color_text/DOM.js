let numOfClicks = 0;

function ChangeText()
{
	let newMessage = document.getElementById("Input").value;
	
	document.getElementById("Message").innerHTML = newMessage;
	
	if (numOfClicks % 2 === 0)
		document.getElementById("Message").style.color = "red";
	else
		document.getElementById("Message").style.color = "blue";
	numOfClicks++;
	
	for (let i = 0; i < 3; i++)
	{
		console.log(numOfClicks);
	}
}