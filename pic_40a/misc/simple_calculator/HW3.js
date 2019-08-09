alert("This is a calculator!");

/**
This function reads the two user-inputted values, performs a user-specified arithmetic operation on it, and updates the "Results" line to reflect the answer.
*/
function ComputeEquation() {
	// Read the two user-inputted values and convert them to numbers.
	let firstVal = Number(document.getElementById("val_1").value);
	let secondVal = Number(document.getElementById("val_2").value);
	
	// Load the radio options into an array
	let operationRadios = document.getElementsByName("operation");
	let len = operationRadios.length;
	let operation;
	
	// Iterate through the radio options to find the one that is checked
	for (let i=0; i < len; i++)
	{
		if (operationRadios[i].checked)
		{
			// Copy the checked operation's name into the operation variable.
			operation = operationRadios[i].value;
			break;
		}
	}
	
	let result;
	// This while loop doesn't do anything. It's just here to satisfy the spec.
	while (result === undefined)
	{	
		// Depending on which operation was selected, perform some operator on the two values, and store the answer in "result"
		switch (operation)
		{
			case "+":
				result=firstVal+secondVal;
				break;
			case "-":
				result=firstVal-secondVal;
				break;
			case "*":
				result=firstVal*secondVal;
				break;
			case "/":
				result=firstVal/secondVal;
				break;
			default:
				result=null;
				alert("Error. No operation selected.");
		}
	}
	
	// Update the page with the correct result.
	document.getElementById("Result").innerHTML = "Result: " + result;
}