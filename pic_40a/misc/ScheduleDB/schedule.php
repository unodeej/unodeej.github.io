#!/usr/local/bin/php
<!DOCTYPE html>
<html lang = "en">
<head>
	<title="Schedule">
</head>
<main>
	<?php
		try {
			$mydb = new SQLite3('schedule.db');
		}
		catch(Exception $ex) {
			echo $ex->getMessage();
		}
		
		$statement = 'CREATE TABLE IF NOT EXISTS classes(hour INTEGER, class TEXT, credits INTEGER);';
		$run = $mydb->query($statement);
		
		$statement = "INSERT INTO classes(hour, class, credits) VALUES (8, 'PIC 40A', 4);";
		$run = $mydb->query($statement);
			
		$hour = 14;
		$class = 'AN N EA 10W';
		$credits = 3;
		
		$statement = "INSERT INTO classes(hour, class, credits) VALUES ($hour, '$class', $credits);";
		$run = $mydb->query($statement);
		
		$hour = 10;
		$class = 'PSYCH 115';
		$credits = 5;
		
		$statement = "INSERT INTO classes(hour, class, credits) VALUES ($hour, '$class', $credits);";
		$run = $mydb->query($statement);
		
		
		
		$statement = 'SELECT hour, class, credits FROM classes ORDER BY hour ASC;';
		$run = $mydb->query($statement);
		
		if ($run) {
			while($row = $run->fetchArray()) {
				echo $row['hour'], '--', $row['class'], '--', $row['credits'], '<br/>';
			}
		}
	?>
</main>
</html>