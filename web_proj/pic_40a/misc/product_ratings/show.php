#!/usr/local/bin/php
<!DOCTYPE html>
<html lang = "en">
<head>
	<title="show">
</head>
<main>
	<?php

		$myfile = fopen("ratings.txt", "r") or die("error: file cannot be opened");
		$fileText = fread($myfile,filesize("ratings.txt"));
		$filePieces = explode("\n", $fileText);
		//for ($i=0; $i < $filePieces.length; $i++)
		//{
		//	echo $filePieces[i] . "<br>";
		//}
		echo $fileText;
		fclose($myfile);
	?>
	</p>
</main>
</html>