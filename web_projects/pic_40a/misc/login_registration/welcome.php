#!/usr/local/bin/php
<!DOCTYPE html>
<html lang="en">
<head>
	<title>User Account Login System</title>
</head>
<body>
	<?php	
		// Retrieve the email from the URL.
		$email = $_GET['email'];
		
		echo 'Welcome. Your email is ' . $email . '.<br><br>';
		
		echo 'Here is a list of all registered addresses: ';

		
		// Try to create a new SQLite database.
		try {
		$mydb = new SQLite3('users.db');
		}
		catch(Exception $ex) {
			echo $ex->getMessage();
		}

		// Create a new table for the validated, registered users if it doesn't exist.
		$statement = 'CREATE TABLE IF NOT EXISTS validated_users(email TEXT, hashed_pass TEXT);';
		$run = $mydb->query($statement);
		
		// Look through the table of registered users.
		$statement = 'SELECT email FROM validated_users;';
		$run = $mydb->query($statement);
		
		if ($run) {
			while($row = $run->fetchArray()) {
				// Print each email.
				echo $row['email'] . ' ';
			}
		}
		
		echo '<br><br>';
	?>
	<form style="display: inline" action="logout.php" method="get">
		<input type="submit" value="log out" name="logout"></input>
	</form>
</body>
</html>