#!/usr/local/bin/php
<!DOCTYPE html>
<html lang="en">
<head>
	<title>User Account Login System</title>
	<script
      src="https://code.jquery.com/jquery-3.3.1.min.js"
      integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
      crossorigin="anonymous">
	</script>
	<script src="userAccount.js" defer></script>
</head>
<body>
	<form method="post" action="<?php echo $_SERVER['PHP_SELF']; ?>" >
		<label for="email">Email:</label>
		<input type="text" name="email" pattern=".+@.+"></input><br>
		<label for="password">Password:</label>
		<input type="password" name="password" pattern="[A-Za-z0-9]{6,}"></input><br>
		<input type="submit" value = "Login" name = "login" id="loginButton" disabled="disabled"/>
		<input type="submit" value = "Register" name = "register" id="registerButton" disabled="disabled"/>
	</form>
	<?php
		/**
			This function attempts to register a new user, and will display error message if it fails.
		*/
		function registerUser() {			
			// Retrieve the email and password from the form.
			$email = $_POST['email'];
			$password = $_POST['password'];
			
			// Hash the password.
			$hashed_pass = hash('md2', $password);
			
			// Generate a random validation token and hash it.
			$rand_token = rand(100,50000);
			$hashed_token = hash('md2', $rand_token);
			
			// Try to create a new SQLite database.
			try {
			$mydb = new SQLite3('users.db');
			}
			catch(Exception $ex) {
				echo $ex->getMessage();
			}
			
			
			// ~~~ FIRST, CHECK THE UNVALIDATED USERS ~~~
			
			// Create a new table for the unvalidated users if it doesn't exist.
			$statement = 'CREATE TABLE IF NOT EXISTS unvalidated_users(email TEXT, hashed_pass TEXT, hashed_token TEXT);';
			$run = $mydb->query($statement);
			
			// Look through the table of unregistered users.
			$statement = 'SELECT email, hashed_pass, hashed_token FROM unvalidated_users;';
			$run = $mydb->query($statement);
			
			// By default, assume the user has not registered already.
			$isRegistered = false;
			if ($run) {
				while($row = $run->fetchArray()) {
					// If the email field matches the currently inputted info...
					if($row['email'] === $email)
					{
						// then this user has already registered!
						$isRegistered = true;
						break;
					}
				}
			}
			
			// ~~~ ~~~
			
			
			// ~~~ THEN, CHECK THE VALIDATED USERS ~~~
			
			// Create a new table for the validated users if it doesn't exist.
			$statement = 'CREATE TABLE IF NOT EXISTS validated_users(email TEXT, hashed_pass TEXT);';
			$run = $mydb->query($statement);
			
			// Look through the table of registered users.
			$statement = 'SELECT email, hashed_pass FROM validated_users;';
			$run = $mydb->query($statement);
			
			// By default, assume the user has not registered already.
			$isRegisteredValidated = false;
			if ($run) {
				while($row = $run->fetchArray()) {
					// If the email field matches the currently inputted info...
					if($row['email'] === $email)
					{
						// then this user has already registered!
						$isRegisteredValidated = true;
						break;
					}
				}
			}
			
			// If they have already registered, whether validated or not
			if ($isRegistered === true || $isRegisteredValidated === true)
			{
				echo 'Already registered. Please log in.';
			}
			else
			{
				// Insert this user into the unvalidated users table.
				$statement = "INSERT INTO unvalidated_users(email, hashed_pass, hashed_token) VALUES ('$email', '$hashed_pass', '$hashed_token');";
				$run = $mydb->query($statement);
				
				// Hash the email. 
				//$hashed_email = hash('md2', $email);
				
				// Set the validation URL.
				$validation_url = 'http://pic.ucla.edu/~unodeej/HW5/validate.php?email=' . $email . '&hash=' . $hashed_token;
				
				// Set the message and subject.
				$message = 'Validate by clicking here: ' . $validation_url;
				$subject = 'validation';
				
				// Display message.
				echo 'A validation email has been sent to: ' . $email . '. Please follow the link.';
				
				// Send email.
				mail($email, $subject, $message);
			}
		}
		
		/**
			This function attempts to log the user in, and will display error messages if it fails. Otherwise, it will redirect to the welcome page.
		*/
		function loginUser()
		{
			// Retrieve the email and password from the form.
			$email = $_POST['email'];
			$password = $_POST['password'];
			
			// Hash the password.
			$hashed_pass = hash('md2', $password);
			
			
			// Try to create a new SQLite database.
			try {
			$mydb = new SQLite3('users.db');
			}
			catch(Exception $ex) {
				echo $ex->getMessage();
			}
			
			// Create a new table for the validated users if it doesn't exist.
			$statement = 'CREATE TABLE IF NOT EXISTS validated_users(email TEXT, hashed_pass TEXT);';
			$run = $mydb->query($statement);
			
			// Look through the table of registered users.
			$statement = 'SELECT email, hashed_pass FROM validated_users;';
			$run = $mydb->query($statement);
			
			// By default, assume the user has not registered already, and has the wrong password.
			$isRegisteredValidated = false;
			$isCorrectPassword = false;
			if ($run) {
				while($row = $run->fetchArray()) {
					// If the email field matches the currently inputted info...
					if($row['email'] === $email)
					{
						// then this user has already registered!
						$isRegisteredValidated = true;
						if ($hashed_pass === $row['hashed_pass'])
						{
							$isCorrectPassword = true;
						}
						break;
					}
				}
			}
			
			// If they have already registered and validated
			if ($isRegisteredValidated === true)
			{
				// If the password is correct
				if ($isCorrectPassword === true)
				{
					// Redirect to the welcome page.
					echo '<script type="text/javascript">location.replace("welcome.php?email=' . $email . '");</script>';
				}
				else
				{
					echo 'Your password is invalid.';
				}
			}
			else
			{
				echo 'No such email address. Please register or validate.';
			}		
		}
		
		// Check if the Register button has been pressed.
		if(isset($_POST['register']))
		{
			registerUser();
		} 
		
		// Check if the Login button has been pressed.
		if(isset($_POST['login']))
		{
			loginUser();
		} 
	?>
</body>
</html>