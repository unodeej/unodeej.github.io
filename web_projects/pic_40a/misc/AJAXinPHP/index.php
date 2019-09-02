#!/usr/local/bin/php
<!DOCTYPE html>
<html>
<head>
    <title>Ajax in PHP</title>
</head>
<body>
	<form method="post" action="<?php echo $_SERVER['PHP_SELF']; ?>" >
		Comment:
		<br>
		<textarea rows=20 cols=100>
		</textarea>
		<br>
		<input type="submit" name="submit"></input>
	</form>
	
	<?php
		// Try to create a new SQLite database.
		try {
		$mydb = new SQLite3('comments.db');
		}
		catch(Exception $ex) {
			echo $ex->getMessage();
		}

		// Create a new table for the unvalidated users if it doesn't exist.
		$statement = 'CREATE TABLE IF NOT EXISTS comments(comment TEXT);';
		$run = $mydb->query($statement);
		
		// Look through the table of unregistered users.
		$statement = 'SELECT comment FROM comments;';
		$run = $mydb->query($statement);

		if ($run) {
			while($row = $run->fetchArray()) {
				echo $row['comment'];
			}
		}
	?>
</body>
</html>