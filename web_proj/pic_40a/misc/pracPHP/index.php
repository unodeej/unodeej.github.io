#!/usr/local/bin/php
<!DOCTYPE html>
<html lang = "en">
<head>
	<title="Game">
	<link rel="stylesheet" type="text/css" href="Game.css" />
	<script src="Game.js" defer ></script>
	<script src="value_ref.js" defer ></script>
</head>
<main>
	<header>
		<?php
			echo '<p>Current PHP version ' . phpversion() . '</p>';
		?>
	</header>
	
	<body>
		<section class ="sidebar">
			<p id="username">
			unodeej
			</p>
			<p>
				Lvl 1
				<?php
					$i = rand(0,5);
					switch ($i)
					{
						case 0:
							echo "Code Monkey";
							break;
						case 1:
							echo "Quidditch Kid";
							break;
						case 2:
							echo "Pre-Med Zombie";
							break;
						case 3:
							echo "Band Geek";
							break;
						case 4:
							echo "Dumb Jock";
							break;
						case 5:
							echo "Frat Boi";
					}
				?>
			</p>
			<p>
				<img src="https://i.stack.imgur.com/l60Hf.png" width=200px>
			</p>
			<p>
				HP: 100/100
			</p>
			<p>
				MP: 20/20
			</p>
			<p id="quests">
				Current Quests:
			</p>
		</section>
		<section id="mainArea">
			<p>
				Fight!
			</p>
		</section>
	</body>
</main>
</html>