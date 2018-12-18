#!/usr/local/bin/php
<!DOCTYPE html>
<html lang="en">
<head>
	<title>User Account Validation</title>
</head>
<body>
	<?php
	// Get the email address from the URL.
	$email = $_GET['email'];
	
	// Get the hashed token from the URL.
	$hashed_token = $_GET['hash'];
	
	// Try to create a new SQLite database.
	try {
	$mydb = new SQLite3('users.db');
	}
	catch(Exception $ex) {
		echo $ex->getMessage();
	}
			
			
	// Create a new table for the unvalidated users if it doesn't exist.
	$statement = 'CREATE TABLE IF NOT EXISTS unvalidated_users(email TEXT, hashed_pass TEXT, hashed_token TEXT);';
	$run = $mydb->query($statement);
	
	// Look through the table of unregistered users.
	$statement = 'SELECT email, hashed_pass, hashed_token FROM unvalidated_users;';
	$run = $mydb->query($statement);
	
	$isRegisteredUser = false;
	if ($run) {
		while($row = $run->fetchArray()) {
			// If the email field matches the currently inputted info...
			if($row['email'] === $email)
			{
				// If the token matches...
				if ($row['hashed_token'] === $hashed_token)
				{
					echo 'You are registered!<br>';
					$isRegisteredUser = true;
					$hashed_pass = $row['hashed_pass'];
					
					// Create a new table for the validated users if it doesn't exist.
					$statement = 'CREATE TABLE IF NOT EXISTS validated_users(email TEXT, hashed_pass TEXT);';
					$run = $mydb->query($statement);
					
					// Insert this user into the unvalidated users table.
					$statement = "INSERT INTO validated_users(email, hashed_pass) VALUES ('$email', '$hashed_pass');";
					$run = $mydb->query($statement);
					
					// Remove the old record
					$statement = "DELETE FROM unvalidated_users WHERE email= '$email'";
					$run = $mydb->query($statement);
				}
				else
				{
					echo 'Error: Bad validation token.<br>';
				}
				break;
			}
		}
		if ($isRegisteredUser === false)
		{
			echo 'Error: You have previously validated your registration!';
		}
	}
	?>
	
	
</body>
</html>