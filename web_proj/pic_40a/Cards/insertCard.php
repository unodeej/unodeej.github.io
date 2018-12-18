#!/usr/local/bin/php
<?php
	header('Content-Type: application/json');
	
	$aResult = array();

    if( !isset($_POST['insertCard']) ) { $aResult['error'] = 'No function name!'; }

    if( !isset($_POST['arguments']) ) { $aResult['error'] = 'No function arguments!'; }

    if( !isset($aResult['error']) ) {

        switch($_POST['insertCard']) {
            case 'insertCard':
               if( !is_array($_POST['arguments']) || (count($_POST['arguments']) < 5) ) {
                   $aResult['error'] = 'Error in arguments!';
               }
               else {
				   // Insert this card into the table.
					// $statement = "INSERT INTO nerts(pileID, suit, value, posX, posY) VALUES ($_POST['arguments'][0], '$_POST['arguments'][1]', $_POST['arguments'][2], $_POST['arguments'][3], $_POST['arguments'][4]);";
					// $run = $mydb->query($statement);
                   // $aResult['result'] = $_POST['arguments'][0];
				   
				   $aResult['result'] = "YEE";
               }
               break;

            default:
               $aResult['error'] = 'Not found function '.$_POST['insertCard'].'!';
               break;
        }

    }

    echo json_encode($aResult);
	function insertCard($pileID, $suit, $value, $posX, $posY) {
			
		}