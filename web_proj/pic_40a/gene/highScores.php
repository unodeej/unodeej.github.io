#!/usr/local/bin/php
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Gene Block Simulator</title>
	<link rel="stylesheet" type="text/css" href="univercivity.css">
</head>
<body>
	<div id="highScores-bg">
		<div id="highScores">
			<?php
				$playerName = $_POST['playerName'];
				$score = $_POST['score'];
				echo "Hi " . $playerName . ". Your Score: " . $score;
				
				// Try to create a new SQLite database.
				try {
				$mydb = new SQLite3('univercivity.db');
				}
				catch(Exception $ex) {
					echo $ex->getMessage();
				}
							
				// Create a new table if it doesn't exist.
				$statement = 'CREATE TABLE IF NOT EXISTS high_scores(playerName TEXT, score INTEGER);';
				$run = $mydb->query($statement);
				
				// Insert records.
				$statement = "INSERT INTO high_scores(playerName, score) VALUES ('$playerName', '$score');";
				$run = $mydb->query($statement);	
				
				
				// Look through the table.
				$statement = 'SELECT playerName, score FROM high_scores ORDER BY score DESC;';
				$run = $mydb->query($statement);
				
				echo "<br><br>";

				// Display the records in the HTML.
				$count = 1;
				if ($run) {
					while($row = $run->fetchArray()) {
						echo $count . ': ';
						echo $row['playerName'] . '&nbsp;&nbsp;&nbsp;&nbsp;' . $row['score'] . '<br>';
						$count++;
						
						// Display only up to the first 10 records.
						if ($count > 10)
						{
							break;
						}
					}
				}
				
				echo "<br><a href='play.php'>Play again!</a><br>";
			?>
		</div>
	</div>
</body>
</html>