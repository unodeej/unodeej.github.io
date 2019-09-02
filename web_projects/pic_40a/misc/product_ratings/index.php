#!/usr/local/bin/php
<!DOCTYPE html>
<html lang = "en">
<head>
	<title="test3">
</head>
<main>
	<form method="post" action="<?php echo $_SERVER['PHP_SELF']; ?>">
		<fieldset>
			<label for="radio1">1</label>
			<input type="radio" name="ratings" value="1" id="radio1" checked></input><br>
			<label for="radio2">2</label>
			<input type="radio" name="ratings" value="2" id="radio2"></input><br>
			<label for="radio3">3</label>
			<input type="radio" name="ratings" value="3" id="radio3"></input><br>
		</fieldset>
		<label for="comment">Leave a comment:</label>
		<textarea id="comment" name="comment"></textarea><br>
		<input type="submit" value="submit" name="submit"></input>
	</form>
	<form method="post" action="show.php">
		<input type="submit" value="show" name="show"></input>
	</form>

	<p>
	<?php
		if(isset($_POST['submit'])) {
			$myfile = fopen("ratings.txt", "a") or die("error: file cannot be opened");
			fwrite($myfile, $_POST['ratings'] . "|" . $_POST['comment'] . "\n");
			echo "submit pressed" . $_POST['ratings'] .$_POST['comment'];
		}	
	?>
	</p>
</main>
</html>