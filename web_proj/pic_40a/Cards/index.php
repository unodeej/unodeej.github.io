#!/usr/local/bin/php
<!DOCTYPE html>
<html>
<head>
	<title>Cards</title>
	<link rel="stylesheet" type="text/css" href="solitaire.css">
    <script
      src="https://code.jquery.com/jquery-3.3.1.min.js"
      integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
      crossorigin="anonymous"></script>
	<script src="solitaire.js" defer></script>
</head>
<body>
	<input type="button" value="Shuffle" onclick="ShuffleCards()">
	
	<?php
		echo "HELOO";
		// Try to create a new SQLite database.
		try {
		$mydb = new SQLite3('playingCards.db');
		}
		catch(Exception $ex) {
			echo $ex->getMessage();
		}
		
		
		// Create a new table if it doesn't exist.
		$statement = 'CREATE TABLE IF NOT EXISTS nerts(pileID INTEGER, suit TEXT, value INTEGER, posX REAL, posY REAL);';
		$run = $mydb->query($statement);	
		
		
		
		
		// Look through the table.
		$statement = 'SELECT pileID, suit, value, posX, posY FROM nerts;';
		$run = $mydb->query($statement);

		if ($run) {
			while($row = $run->fetchArray()) {
				echo "D";
				echo $row['pileID'];
			}
		}
	?>
	
	<div id="playingCards">
    </div>    
</body>
</html>