let playingCards = [];		// Array of Card objects, holding the 52 playing cards.
let topZIndex = 0;			// Z-index of topmost card.
let totalCardCount = 52;	// Total cards in play.

let selectedCard = null;	// The card currently held by the mouse pointer.
let mouseOverCard = null;	// The card currently directly under the mouse

let OffsetX;				// X mouse pos offset when selecting a card.
let OffsetY;				// Y mouse pos offset when selecting a card.





// Game: //
Init();
//


/**
	Constructor function for Card class.
	id {String}
	value {Number}
	suit {String}
	playLocation {String}
*/
function Card(id, index, value, suit, playLocation) {
	this.id = id;						// "#card__" , where the ID number of the card is in the blank.
	this.index = index;
	this.value = value;					// 0-13 numerical value of card.
	this.suit = suit;					// String with the suit of the card
	this.isFaceUp = true;				// Whether this card is facing with number side visible.
	this.playLocation = playLocation;	// E.g., "deck", "discard", "field", etc.
	
	this.left = 0;					//x-coord
	this.top = 0;						//y-coord				
	
	let cardCode = "";			// A, 1-10, J, Q, K code of card
	switch(value)				// Assign card code.
	{
		case 1:
			cardCode = "A";
			break;
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
		case 7:
		case 8:
		case 9:
		case 10:
			cardCode = String(value);
			break;
		case 11:
			cardCode = "J";
			break;
		case 12:
			cardCode = "Q";
			break;
		case 13:
			cardCode = "K";
			break;
		default:
			console.log("CARD CODE ERROR: " + value);
			cardCode = "NULL";
	}
	this.code = cardCode;
}

/**
	Initialize the cards and playing field.
*/
function Init()
{
	// Populate playingCards array.
	let suit;
	for (let i=0; i<52; i++)
	{
		if (i===0)
		{
			suit = "heart";	
		}
		else if (i===13)
		{
			suit="diamond";
		}
		else if (i===26)
		{
			suit="spade";
		}
		else if (i===39)
		{
			suit="club";
		}
		//Card(id, value, suit, playLocation);
		playingCards.push(new Card("card" + String(i), i, (i % 13) + 1, suit, "field"));
	}		
	
	// Create the html elements for each card, and assign the image src, as well as the other html attributes.
	for (let i = 0; i <52; i++)
	{
		let appendString;
		if (playingCards[i].suit === "heart")
		{
			appendString = "<img src=\"hearts_" + playingCards[i].code + ".png\"";
		}
		else if (playingCards[i].suit === "diamond")
		{
			appendString = "<img src=\"diamonds_" + playingCards[i].code + ".png\"";
		}
		else if (playingCards[i].suit === "spade")
		{
			appendString = "<img src=\"spades_" + playingCards[i].code + ".png\"";
		}
		else if (playingCards[i].suit === "club")
		{
			appendString = "<img src=\"clubs_" + playingCards[i].code + ".png\"";
		}
		else
		{
			// Default card image.
			appendString = "<img src=\"https://images.fineartamerica.com/images/artworkimages/mediumlarge/1/poker-playing-card-3-heart-miroslav-nemecek.jpg\"";
		}

		appendString += "class=\"interactable\" width=\"100px\" id=\"card" + i+"\" style=\"left:" + playingCards[i].left + "px; top:" + playingCards[i].top + "px; position: fixed;\">";
		$("#playingCards").append(appendString);

		// var docRef = db.collection("cards").doc(playingCards[i].id);
		// docRef.get().then(function(doc) {
			// if (doc.exists) {
				// playingCards[i].left = doc.data().left;
				// playingCards[i].top = doc.data().top;
				// $("#" + playingCards[i].id).css("left", playingCards[i].left + "px");
				// $("#" + playingCards[i].id).css("top", playingCards[i].top + "px");
				// if (doc.data().isFaceUp === false)
				// {
					// playingCards[i].isFaceUp = false;
					// $("#" + playingCards[i].id).attr("src", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Card_back_06.svg/2000px-Card_back_06.svg.png");
				// }
			// } else {
				// // doc.data() will be undefined in this case
				// console.log("No such document!");
			// }
		// }).catch(function(error) {
			// console.log("Error getting document:", error);
		// });
	}

	db.collection("cards").get().then(function(querySnapshot) {
		querySnapshot.forEach(function(doc) {
			// console.log(doc.id, " ", doc.data());
			playingCards[doc.data().index].left = doc.data().left;
			playingCards[doc.data().index].top = doc.data().top;
			$("#" + playingCards[doc.data().index].id).css("left", playingCards[doc.data().index].left + "px");
			$("#" + playingCards[doc.data().index].id).css("top", playingCards[doc.data().index].top + "px");
			if (doc.data().isFaceUp === false)
			{
				playingCards[doc.data().index].isFaceUp = false;
				$("#" + playingCards[doc.data().index].id).attr("src", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Card_back_06.svg/2000px-Card_back_06.svg.png");
			}
		});
	});
	
	db.collection("cards").onSnapshot(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            console.log("YO" + doc.data().id);
        });
    });
}

$(".interactable").click(function() {
	if (selectedCard === null)
	{
		// Mark this as the currently selected card.
		for (c of playingCards)
		{
			if (c.id === $(this).attr("id"))		//$(this) is the interactable object we've clicked.
			{
				selectedCard = c;
				break;
			}
		}
		
		// Move it to the top of any other cards.
		$("#" + selectedCard.id).css("zIndex", topZIndex++);
		
		// Mark the card as moved to the field.
		if (c.playLocation === "deck")
		{
			c.playLocation === "field";
		}
		
		OffsetX = event.clientX - Number($("#" + selectedCard.id).css("left").slice(0,-2));
		OffsetY = event.clientY - Number($("#" + selectedCard.id).css("top").slice(0,-2));
	}
	else
	{
		PushToDatabase(selectedCard);
		selectedCard = null;
	}
});
document.addEventListener("keypress", 
	function(event) {
		if (event.key === "d" || event.key === "D")
		{
			if (selectedCard !== null)
			{
				FlipCard(selectedCard);
			}
		}
		
		if (event.key === "f" || event.key === "F") // for testing
		{
			if (selectedCard !== null)
			{
				PushToDatabase(selectedCard);
			}
		}
	}
);

document.addEventListener("wheel",
	function(event) {
		if (mouseOverCard !== null && mouseOverCard.playLocation === "deck")
		{
			if (event.deltaY !==0)
			{
				console.log(event.deltaY);
			}
		}
	}
);

document.addEventListener("mouseover",
	function(event) {
		if (event.target.id !=="")
		{
			let idNum = Number(event.target.id.substr(4));
			// console.log(playingCards[idNum]);
			mouseOverCard = playingCards[idNum];
		}
	}
);

document.addEventListener("mouseout",
	function(event) {
		if (event.relatedTarget !==null && event.relatedTarget.id !=="")
		{
			mouseOverCard = null;
		}
	}
);

$(this).mousemove(function (event) {
	if (selectedCard !== null)
	{
		$("#" + selectedCard.id).css("position", "fixed");
		$("#" + selectedCard.id).css("left", event.clientX - OffsetX + "px");
		$("#" + selectedCard.id).css("top", event.clientY - OffsetY + "px");
		selectedCard.left = event.clientX - OffsetX;
		selectedCard.top = event.clientY - OffsetY;
	}
});

function PushToDatabase(card) {
	db.collection('cards').doc(card.id).set({
		id: card.id,
		index: card.index,
		value: card.value,					// 0-13 numerical value of card.
		suit: card.suit,					// String with the suit of the card
		isFaceUp: card.isFaceUp,
		playLocation: card.playLocation,
		left: card.left,
		top: card.top
		
	})
	.then(function() {
    console.log("Document successfully written!");
	})
	.catch(function(error) {
		console.error("Error writing document: ", error);
	});
}

function ShuffleCards() {
	for (let i=0; i < totalCardCount; i++)
	{
		// Flip any face up cards.
		if (playingCards[i].isFaceUp)
		{
			FlipCard(playingCards[i]);
		}
		// Move cards to deck location.
		$("#" + playingCards[i].id).css("left", 10);
		$("#" + playingCards[i].id).css("top", 50);
		playingCards[i].left = 10;
		playingCards[i].top = 50;
		// Shuffle them in a random order.
		topZIndex = 100;
		$("#" + playingCards[i].id).css("zIndex", Math.floor(Math.random()*topZIndex));
		// Mark cards as being in the deck.
		playingCards[i].playLocation = "deck";
		
		PushToDatabase(playingCards[i]);
	}
	
}

function FlipCard(card) {
	if (card.isFaceUp === true)
	{
		$("#" + card.id).attr("src", "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Card_back_06.svg/2000px-Card_back_06.svg.png");
		card.isFaceUp = false;
		playingCards[card.index].isFaceUp = false;
	}
	else {
		$("#" + card.id).attr("src", card.suit + "s_" + card.code + ".png");
		card.isFaceUp = true;
		playingCards[card.index].isFaceUp = true;
	}
	PushToDatabase(card);
}



/// DEPRECATED ///

let faded = false;

//setInterval(fade, 1000);
function fade() {
	if (faded) {
		for (let i=1; i<7; i++)
		{
			$("#card" + i).fadeIn();
		}
		
		faded = false;
	}
	else
	{
		for (let i=1; i<7; i++)
		{
			$("#card" + i).fadeOut();
		}
		faded = true;
	}
}