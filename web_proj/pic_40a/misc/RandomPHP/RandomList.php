#!/usr/local/bin/php
<html>
<head>
	<title>Random List</title>
</head>
<body>
	<?php
		$numArray = array();
		for ($i = 0; $i < 50; $i++)
		{
			array_push($numArray, mt_rand() / mt_getrandmax());
		}

		function cmp($a, $b)
		{
 		   if ($a == $b) {
 		       return 0;
 		   }
  		  return ($a < $b) ? -1 : 1;
		}

		usort($numArray, "cmp");

		for ($i = 0; $i < 50; $i++)
		{
			echo '<p>' . $numArray[$i] . '<p>';
		}
		
	?>
</body>
</html>