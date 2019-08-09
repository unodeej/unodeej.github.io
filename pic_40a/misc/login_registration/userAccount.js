/**
	This function executes when on keyup. It ensures that the login and register buttons are inactive if the fields are empty (this solves a bug in which users could submit the form without entering anything).
*/
(function() {
    $('form > input').keyup(function() {

        let empty = false;
        $('form > input').each(function() {
            if ($(this).val() == '') {
                empty = true;
            }
        });

        if (empty) {
            $('#registerButton').attr('disabled', 'disabled');
			$('#loginButton').attr('disabled', 'disabled');
        }
		else {
            $('#registerButton').removeAttr('disabled');
			$('#loginButton').removeAttr('disabled');
        }
    });
})()