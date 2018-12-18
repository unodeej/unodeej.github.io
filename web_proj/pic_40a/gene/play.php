#!/usr/local/bin/php
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Gene Block Simulator</title>
	<link rel="stylesheet" type="text/css" href="univercivity.css">
    <script
      src="https://code.jquery.com/jquery-3.3.1.min.js"
      integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
      crossorigin="anonymous"></script>
	<script src="buildingManager.js" defer></script>
	<script src="utilities.js" defer></script>
	<script src="GUI.js" defer></script>
	<script src="inputManager.js" defer></script>
	<script src="game.js" defer></script>
</head>
<body>
	<div id="header-bar">
    </div>
	<div id="context-menu">
	</div>
	<div id="popup">
	</div>
	<div id="menu-buttons">
		<input type="button" value="New Construction Site" onclick="GUI_OpenPurchasePopup()">
	</div>
	<div id="purchase-items">
	</div>	
	<div id="buildings">
    </div>
    <div id="gene">
    </div>
</body>
</html>